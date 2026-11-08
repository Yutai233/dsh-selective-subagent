// Runtime-only admission queue. Chosen routes are committed by the adapter's public Agent.model API.
export class SelectionError extends Error {
  constructor(code, message) { super(message); this.name = 'SelectionError'; this.code = code; }
}
export function abortError() { const error = new Error('Model selection was cancelled.'); error.name = 'AbortError'; return error; }
const copyRoute = route => route ? { provider: route.provider, model: route.model } : null;
export class SelectionQueue {
  constructor({ timeoutMs = 60000, askOncePerParent = false, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout, maxFinished = 200 } = {}) {
    this.timeoutMs = timeoutMs; this.askOncePerParent = askOncePerParent;
    this.now = now; this.setTimer = setTimer; this.clearTimer = clearTimer; this.maxFinished = maxFinished;
    this.tasks = new Map(); this.waiters = new Set(); this.reused = new Map(); this.revision = 0; this.disposed = false;
  }
  changed() { this.revision++; for (const notify of [...this.waiters]) notify(); }
  publicTask(task) {
    return { id: task.id, rootSessionId: task.rootSessionId, parentSessionId: task.parentSessionId,
      title: task.title, description: task.description || '', status: task.status, pending: task.status === 'pending',
      deadline: task.status === 'pending' ? task.deadline : null, route: copyRoute(task.route),
      effectiveModelLabel: task.effectiveModelLabel || null, choiceReason: task.choiceReason || null,
      baseRoute: copyRoute(task.baseRoute), effectiveRoute: copyRoute(task.effectiveRoute), createdAt: task.createdAt };
  }
  snapshot(rootSessionId, models = []) {
    return { version: 1, revision: this.revision, serverNow: this.now(), timeoutMs: this.timeoutMs,
      models: models.map(model => ({ ...model })), tasks: [...this.tasks.values()].filter(task => task.rootSessionId === rootSessionId).map(task => this.publicTask(task)) };
  }
  remember(input) {
    if (this.tasks.has(input.id)) return this.tasks.get(input.id);
    const task = { ...input, status: input.status || 'running', route: null, effectiveRoute: copyRoute(input.effectiveRoute || input.baseRoute), createdAt: this.now(), choiceReason: input.choiceReason || null };
    this.tasks.set(input.id, task); this.trim(); this.changed(); return task;
  }
  trim() {
    const finished = [...this.tasks.values()].filter(task => task.status === 'done' || task.status === 'cancelled');
    for (const task of finished.slice(0, Math.max(0, finished.length - this.maxFinished))) this.tasks.delete(task.id);
  }
  admit(input, applySelection, signal) {
    if (this.disposed) return Promise.resolve(null);
    if (signal?.aborted) return Promise.reject(abortError());
    const existing = this.tasks.get(input.id);
    if (existing?.status === 'pending') return existing.promise;
    if (existing) return Promise.resolve(existing.route);
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    // Attach a handler immediately: a cancelled startup can settle before its caller awaits it.
    promise.catch(() => {});
    const task = { ...input, status: 'pending', route: null, effectiveRoute: copyRoute(input.baseRoute), choiceReason: null,
      createdAt: this.now(), deadline: this.now() + this.timeoutMs, applySelection, resolve, reject, promise, signal, timer: null };
    task.abort = () => this.cancel(input.id);
    signal?.addEventListener('abort', task.abort, { once: true });
    this.tasks.set(task.id, task);
    const reused = this.reused.get(task.parentSessionId);
    if (reused) {
      try { this.finish(task, reused, 'reuse'); } catch (error) { this.cancel(task.id, error); }
    } else { this.arm(task); this.changed(); }
    return promise;
  }
  arm(task) {
    this.clearTimer(task.timer);
    task.timer = this.setTimer(() => {
      if (task.status !== 'pending') return;
      if (this.now() < task.deadline) { this.arm(task); return; }
      this.finish(task, null, 'timeout');
    }, Math.max(0, task.deadline - this.now()));
    task.timer?.unref?.();
  }
  detach(task) { this.clearTimer(task.timer); task.timer = null; task.signal?.removeEventListener('abort', task.abort); }
  finish(task, route, reason) {
    if (task.status !== 'pending') return false;
    if (task.signal?.aborted) { this.cancel(task.id); return false; }
    // The adapter must commit model/selection before releasing agent/created.
    if (route) task.applySelection(copyRoute(route));
    this.detach(task);
    task.route = copyRoute(route); task.choiceReason = reason; task.status = 'running';
    if (route) { task.effectiveRoute = copyRoute(route); task.effectiveModelLabel = route.model; }
    task.resolve(copyRoute(route));
    task.resolve = null; task.reject = null; task.applySelection = null; task.promise = null; task.signal = null;
    this.changed(); return true;
  }
  choose({ rootSessionId, taskId, route, reuse = this.askOncePerParent }) {
    const task = this.tasks.get(taskId);
    if (!task || task.rootSessionId !== rootSessionId) throw new SelectionError('task-not-found', 'This task is no longer available.');
    if (task.status !== 'pending') throw new SelectionError('task-settled', 'This task has already continued.');
    if (this.now() >= task.deadline) { this.finish(task, null, 'timeout'); throw new SelectionError('task-expired', 'The idle deadline has elapsed; DSH default routing was retained.'); }
    if (!this.finish(task, route, route ? 'selected' : 'default')) throw new SelectionError('task-cancelled', 'This task was cancelled.');
    // Only an explicit concrete route may establish reuse. Defaults never pin a parent route.
    if (route && reuse) {
      this.reused.set(task.parentSessionId, copyRoute(route));
      for (const pending of this.tasks.values()) if (pending.status === 'pending' && pending.parentSessionId === task.parentSessionId) {
        try { this.finish(pending, route, 'reuse'); } catch (error) { this.cancel(pending.id, error); }
      }
    }
  }
  activity(rootSessionId) {
    const now = this.now();
    for (const task of this.tasks.values()) if (task.rootSessionId === rootSessionId && task.status === 'pending') {
      if (now >= task.deadline) this.finish(task, null, 'timeout');
      else { task.deadline = now + this.timeoutMs; this.arm(task); }
    }
    this.changed();
  }
  update(id, patch) {
    const task = this.tasks.get(id); if (!task) return;
    let changed = false;
    for (const [key, value] of Object.entries(patch)) if (JSON.stringify(task[key]) !== JSON.stringify(value)) { task[key] = value; changed = true; }
    if (changed) this.changed();
  }
  cancel(id, error = abortError()) {
    const task = this.tasks.get(id); if (!task) return;
    if (task.status === 'pending') { this.detach(task); task.reject(error); task.resolve = null; task.reject = null; task.applySelection = null; task.promise = null; task.signal = null; }
    task.status = 'cancelled'; this.trim(); this.changed();
  }
  end(id, status = 'done') {
    const task = this.tasks.get(id); if (!task || task.status === 'cancelled') return;
    if (task.status === 'pending') { this.cancel(id); return; }
    task.status = status; this.trim(); this.changed();
  }
  forgetParent(id) { this.reused.delete(id); }
  wait(afterRevision, waitMs, signal) {
    if (this.disposed || afterRevision !== this.revision || !waitMs) return Promise.resolve();
    if (signal?.aborted) return Promise.reject(abortError());
    return new Promise((resolve, reject) => {
      let timer;
      const cleanup = () => { this.waiters.delete(done); this.clearTimer(timer); signal?.removeEventListener('abort', aborted); };
      const done = () => { cleanup(); resolve(); };
      const aborted = () => { cleanup(); reject(abortError()); };
      this.waiters.add(done); signal?.addEventListener('abort', aborted, { once: true });
      timer = this.setTimer(done, waitMs); timer?.unref?.();
      if (afterRevision !== this.revision) done();
    });
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const task of this.tasks.values()) if (task.status === 'pending') this.finish(task, null, 'default');
    this.reused.clear(); this.changed(); this.tasks.clear();
  }
}
