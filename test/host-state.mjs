import test from 'node:test';
import assert from 'node:assert/strict';
import { SelectionQueue } from '../host/engine.js';
import { Config, createHostController, validatePayload, isUserPeer } from '../host/index.js';
function clock() {
 let time = 100000, next = 0; const timers = new Map();
 return { now: () => time, setTimer: (fn, delay) => { const id = ++next; timers.set(id, { fn, at: time + delay }); return id; }, clearTimer: id => timers.delete(id),
  advance(ms) { time += ms; let due; while ((due = [...timers].find(([, timer]) => timer.at <= time))) { timers.delete(due[0]); due[1].fn(); } }, get size() { return timers.size; } };
}
const item = (id = 'a', parentSessionId = 'root') => ({ id, parentSessionId, rootSessionId: 'root', title: id, description: '', baseRoute: { provider: 'original', model: 'original-model' } });
const route = { provider: 'configured', model: 'model-2' };
const user = { principal: { kind: 'owner' }, interactions: 'answer', signal: new AbortController().signal };
function setup() { const time = clock(); const queue = new SelectionQueue({ now: time.now, setTimer: time.setTimer, clearTimer: time.clearTimer }); return { time, queue }; }

test('configuration defaults are explicit and validate idle timeout', () => {
 assert.deepEqual(Config['~standard'].validate(undefined).value, { enabled: true, idleMs: 60000, askOncePerParent: false });
 assert.ok(Config['~standard'].validate({ idleMs: -1 }).issues);
});
test('admission blocks caller until human concrete selection is committed', async () => {
 const { queue } = setup(); let calls = 0, continued = false;
 const admission = queue.admit(item(), value => { calls++; assert.deepEqual(value, route); }).then(() => { continued = true; });
 await Promise.resolve(); assert.equal(calls, 0); assert.equal(continued, false);
 queue.choose({ rootSessionId: 'root', taskId: 'a', route }); await admission;
 assert.equal(calls, 1); assert.equal(continued, true); assert.equal(queue.snapshot('root').tasks[0].choiceReason, 'selected');
 queue.dispose();
});
test('exactly 60 seconds idle preserves DSH base route without setter', async () => {
 const { queue, time } = setup(); let setterCalls = 0;
 const admission = queue.admit(item(), () => setterCalls++);
 time.advance(59999); assert.equal(queue.tasks.get('a').status, 'pending');
 time.advance(1); assert.equal(await admission, null); assert.equal(setterCalls, 0);
 assert.equal(queue.snapshot('root').tasks[0].choiceReason, 'timeout'); queue.dispose();
});
test('activity renews every concurrent pending task in the root', async () => {
 const { queue, time } = setup(); const waits = [queue.admit(item('a'), () => {}), queue.admit(item('b'), () => {})];
 time.advance(59000); queue.activity('root'); time.advance(59000);
 assert.ok([...queue.tasks.values()].every(task => task.status === 'pending'));
 time.advance(1000); await Promise.all(waits); assert.ok([...queue.tasks.values()].every(task => task.choiceReason === 'timeout')); queue.dispose();
});
test('default choice never overrides or establishes reuse', async () => {
 const { queue } = setup(); let calls = 0;
 const a = queue.admit(item(), () => calls++); queue.choose({ rootSessionId: 'root', taskId: 'a', route: null, reuse: true }); await a;
 const b = queue.admit(item('b'), () => calls++);
 assert.equal(queue.tasks.get('b').status, 'pending'); assert.equal(calls, 0); queue.dispose(); await b;
});
test('concrete reuse applies to pending and future siblings only', async () => {
 const { queue } = setup(); const seen = [];
 const a = queue.admit(item(), r => seen.push(['a', r])); const b = queue.admit(item('b'), r => seen.push(['b', r]));
 const other = queue.admit(item('c', 'other'), () => assert.fail('other parent must not reuse'));
 queue.choose({ rootSessionId: 'root', taskId: 'a', route, reuse: true }); await Promise.all([a, b]);
 const future = queue.admit(item('d'), r => seen.push(['d', r])); await future;
 assert.equal(seen.length, 3); assert.equal(queue.tasks.get('b').choiceReason, 'reuse'); assert.equal(queue.tasks.get('c').status, 'pending');
 queue.dispose(); await other;
});
test('abort cancels pending startup and removes timer and listener', async () => {
 const { queue, time } = setup(); const controller = new AbortController();
 const admission = queue.admit(item(), () => assert.fail('setter must not run'), controller.signal); controller.abort();
 await assert.rejects(admission, { name: 'AbortError' }); assert.equal(time.size, 0); assert.equal(queue.tasks.get('a').status, 'cancelled'); queue.dispose();
});
test('agent disposal cannot turn an already-cancelled task into done', async () => {
 const { queue } = setup(); const controller = new AbortController();
 const admission = queue.admit(item(), () => assert.fail(), controller.signal); controller.abort();
 await assert.rejects(admission, { name: 'AbortError' }); queue.end('a');
 assert.equal(queue.tasks.get('a').status, 'cancelled'); queue.dispose();
});
test('unload releases all pending callers with unchanged default route', async () => {
 const { queue, time } = setup(); const waits = [queue.admit(item(), () => assert.fail()), queue.admit(item('b'), () => assert.fail())];
 queue.dispose(); assert.deepEqual(await Promise.all(waits), [null, null]); assert.equal(time.size, 0); assert.equal(queue.tasks.size, 0);
});
test('expired user choice cannot override a timed-out task', async () => {
 const { queue, time } = setup(); const admission = queue.admit(item(), () => assert.fail()); time.advance(60000);
 assert.throws(() => queue.choose({ rootSessionId: 'root', taskId: 'a', route }), /already continued/); await admission; queue.dispose();
});
test('model-select append failure leaves admission pending and reports failure', async () => {
 const { queue } = setup(); const admission = queue.admit(item(), () => { throw new Error('append failed'); });
 assert.throws(() => queue.choose({ rootSessionId: 'root', taskId: 'a', route }), /append failed/); assert.equal(queue.tasks.get('a').status, 'pending'); queue.dispose(); await admission;
});
test('longpoll wakes on state change and abort releases waiter', async () => {
 const { queue } = setup(); let woke = false; const waiting = queue.wait(queue.revision, 25000).then(() => woke = true);
 await Promise.resolve(); assert.equal(woke, false); queue.changed(); await waiting; assert.equal(woke, true);
 const ctrl = new AbortController(); const cancelled = queue.wait(queue.revision, 25000, ctrl.signal); ctrl.abort();
 await assert.rejects(cancelled, { name: 'AbortError' }); assert.equal(queue.waiters.size, 0); queue.dispose();
});
test('wire validation rejects extra fields, malformed routes and agent-like peers', () => {
 assert.throws(() => validatePayload('selective-subagent/choose', { rootSessionId: 'root', taskId: 'a', route, admin: true }));
 assert.throws(() => validatePayload('selective-subagent/choose', { rootSessionId: 'root', taskId: 'a', route: { provider: 'x' } }));
 assert.throws(() => validatePayload('selective-subagent/state', { rootSessionId: 'root', waitMs: 25001 }));
 assert.equal(isUserPeer(user), true); assert.equal(isUserPeer({ ...user, interactions: 'none' }), false);
 assert.equal(isUserPeer({ ...user, principal: { kind: 'agent' } }), false);
});
function environment() {
 const listeners = new Map(); const roster = new Map(); let selections = 0;
 const root = { id: 'root', session: { header: {}, requestHeader: () => null } }; roster.set(root.id, root);
 const child = { id: 'a', options: { provider: 'original', model: 'original-model', reasoningEffort: 'old' },
  session: { id: 'a', header: { origin: 'subagent', parentSession: 'root' }, ownEvents: () => [{ type: 'subagent/descriptor', data: { version: 3, label: 'Implement parser', provider: 'spawn' } }], requestHeader: () => null },
  model: { current: () => child.options, select(value) { selections++; assert.equal(value.reasoningEffort, undefined); child.selection = value; } } };
 roster.set(child.id, child);
 const services = { agents: { get: id => roster.get(id), list: () => [...roster.values()] }, llm: { listProviders: () => [{ id: 'configured', name: 'Configured provider' }], listModels: async () => [{ id: 'model-2', name: 'Configured Model' }] } };
 const ctx = { get: name => services[name], logger: { warn() {} } };
 return { ctx, child, root, roster, get selections() { return selections; } };
}
test('host uses real catalog API shapes and gates new agent creation before model.select', async () => {
 const env = environment(), host = createHostController(env.ctx); let continued = false;
 const startup = host.created({ agent: env.child, source: 'startup' }).then(() => continued = true);
 await Promise.resolve(); assert.equal(continued, false); assert.equal(env.selections, 0);
 const state = await host.rpc('selective-subagent/state', { rootSessionId: 'root' }, new AbortController().signal, user);
 assert.equal(state.ok, true); assert.equal(state.value.models[0].label, 'Configured Model'); assert.equal(state.value.tasks[0].title, 'Implement parser');
 const answer = await host.rpc('selective-subagent/choose', { rootSessionId: 'root', taskId: 'a', route }, new AbortController().signal, user);
 assert.equal(answer.ok, true); await startup; assert.deepEqual(env.child.selection, route); assert.equal(env.selections, 1); host.dispose();
});
test('host default route remains untouched and unknown models cannot override it', async () => {
 const env = environment(), host = createHostController(env.ctx); const startup = host.created({ agent: env.child, source: 'startup' });
 const bad = await host.rpc('selective-subagent/choose', { rootSessionId: 'root', taskId: 'a', route: { provider: 'missing', model: 'fake' } }, new AbortController().signal, user);
 assert.equal(bad.ok, false); assert.equal(env.selections, 0);
 const answer = await host.rpc('selective-subagent/choose', { rootSessionId: 'root', taskId: 'a', route: null }, new AbortController().signal, user);
 assert.equal(answer.ok, true); await startup; assert.equal(env.selections, 0); assert.deepEqual(answer.value.tasks[0].effectiveRoute, { provider: 'original', model: 'original-model' }); host.dispose();
});
test('host refuses user answers from non-answer peers and cross-root task ids', async () => {
 const env = environment(), host = createHostController(env.ctx); const startup = host.created({ agent: env.child, source: 'startup' });
 const denied = await host.rpc('selective-subagent/choose', { rootSessionId: 'root', taskId: 'a', route }, new AbortController().signal, { ...user, interactions: 'none' });
 assert.equal(denied.ok, false); assert.match(denied.error.code, /user-only/);
 const stale = await host.rpc('selective-subagent/choose', { rootSessionId: 'not-root', taskId: 'a', route }, new AbortController().signal, user);
 assert.equal(stale.ok, false); assert.equal(env.selections, 0); host.dispose(); await startup;
});
test('snapshots carry a stable per-controller generation id', async () => {
 const env = environment(), first = createHostController(env.ctx), second = createHostController(env.ctx);
 const a = await first.snapshot('root'), b = await first.snapshot('root'), c = await second.snapshot('root');
 assert.match(a.instanceId, /^[a-f0-9-]{36}$/); assert.equal(a.instanceId, b.instanceId); assert.notEqual(a.instanceId, c.instanceId);
 first.dispose(); second.dispose();
});
test('resume/bootstrap never prompts already-running agents', async () => {
 const env = environment(), host = createHostController(env.ctx);
 await host.created({ agent: env.child, source: 'resume' }); assert.equal(host.queue.tasks.get('a').status, 'running'); assert.equal(env.selections, 0); host.dispose();
});
test('a new fork with an inherited request header still waits before its first own request', async () => {
 const env = environment(), host = createHostController(env.ctx);
 env.child.session.requestHeader = () => ({ config: { provider: 'inherited', model: 'inherited-model' } });
 const startup = host.created({ agent: env.child, source: 'startup' });
 assert.equal(host.queue.tasks.get('a').status, 'pending');
 host.dispose(); await startup;
});
test('observed request header updates badge with actual model after default selection', async () => {
 const env = environment(), host = createHostController(env.ctx); const startup = host.created({ agent: env.child, source: 'startup' });
 const controller = new AbortController(); await host.rpc('selective-subagent/choose', { rootSessionId: 'root', taskId: 'a', route: null }, controller.signal, user); await startup;
 host.observeEvent(env.child.session, { type: 'request/header', data: { header: { config: route } } });
 assert.equal((await host.snapshot('root')).tasks[0].effectiveModelLabel, 'Configured Model'); host.dispose();
});
