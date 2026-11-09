import { randomUUID } from 'node:crypto';
import { SelectionQueue, SelectionError, abortError } from './engine.js';

export const name = 'selective-subagent-models';
export const inject = ['agents', 'llm', 'connection'];
export const Config = {
  '~standard': { version: 1, vendor: 'selective-subagent', validate(input) {
    const value = { enabled: true, idleMs: 60000, askOncePerParent: false, ...(input || {}) };
    const issues = [];
    if (typeof value.enabled !== 'boolean') issues.push({ message: 'enabled must be boolean', path: ['enabled'] });
    if (!Number.isSafeInteger(value.idleMs) || value.idleMs < 1000 || value.idleMs > 3600000) issues.push({ message: 'idleMs must be an integer from 1000 to 3600000', path: ['idleMs'] });
    if (typeof value.askOncePerParent !== 'boolean') issues.push({ message: 'askOncePerParent must be boolean', path: ['askOncePerParent'] });
    return issues.length ? { issues } : { value: { enabled: value.enabled, idleMs: value.idleMs, askOncePerParent: value.askOncePerParent } };
  } }
};
const ENDPOINTS = new Set(['selective-subagent/state', 'selective-subagent/activity', 'selective-subagent/choose']);
const routeOf = value => value && typeof value.provider === 'string' && typeof value.model === 'string' ? { provider: value.provider, model: value.model } : null;
function text(value, max = 2000) { return typeof value === 'string' ? value.slice(0, max) : ''; }
export function rootOf(agent, agents) {
  let current = agent; const seen = new Set();
  while (current?.session?.header?.origin === 'subagent' && current.session.header.parentSession && !seen.has(current.id)) {
    seen.add(current.id); const parent = agents.get(current.session.header.parentSession);
    if (!parent) return current.session.header.parentSession;
    current = parent;
  }
  return current?.id || agent.id;
}
// Read the immutable descriptor once at attachment; updates below use only the committed event's payload.
export function metadataOf(agent, agents) {
  const events = agent.session.ownEvents();
  const descriptor = events.find(event => event.type === 'subagent/descriptor')?.data;
  const hasOwnRequest = events.some(event => event.type === 'request/header');
  const current = routeOf(agent.model?.current()) || routeOf(agent.session.requestHeader()?.config) || routeOf(agent.options);
  return { id: agent.id, rootSessionId: rootOf(agent, agents), parentSessionId: agent.session.header.parentSession,
    title: text(descriptor?.label, 300) || '子任务 ' + String(agent.id).slice(0, 8),
    description: '', baseRoute: current, effectiveRoute: current, effectiveModelLabel: current?.model || null, hasOwnRequest };
}
function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function assertKeys(value, keys) {
  if (!object(value) || Object.keys(value).some(key => !keys.includes(key))) throw new SelectionError('bad-request', 'Unexpected request fields.');
}
function identifier(value) { return typeof value === 'string' && value.length > 0 && value.length <= 300; }
export function validatePayload(endpoint, payload) {
  const value = object(payload) && Object.keys(payload).length === 1 && object(payload.args) ? payload.args : payload;
  const keys = endpoint.endsWith('/state') ? ['rootSessionId', 'afterRevision', 'waitMs'] : endpoint.endsWith('/activity') ? ['rootSessionId'] : ['rootSessionId', 'taskId', 'route', 'reuse'];
  assertKeys(value, keys);
  if (!identifier(value.rootSessionId)) throw new SelectionError('bad-request', 'A rootSessionId is required.');
  if (endpoint.endsWith('/state')) {
    if (value.afterRevision !== undefined && (!Number.isSafeInteger(value.afterRevision) || value.afterRevision < 0)) throw new SelectionError('bad-request', 'afterRevision must be a nonnegative integer.');
    if (value.waitMs !== undefined && (!Number.isSafeInteger(value.waitMs) || value.waitMs < 0 || value.waitMs > 25000)) throw new SelectionError('bad-request', 'waitMs must be between 0 and 25000.');
  } else if (endpoint.endsWith('/choose')) {
    if (!identifier(value.taskId)) throw new SelectionError('bad-request', 'A taskId is required.');
    if (value.route !== null) {
      assertKeys(value.route, ['provider', 'model']);
      if (!identifier(value.route.provider) || !identifier(value.route.model)) throw new SelectionError('bad-request', 'Choose an advertised provider/model route, or null for DSH defaults.');
    }
    if (value.reuse !== undefined && typeof value.reuse !== 'boolean') throw new SelectionError('bad-request', 'reuse must be boolean.');
  }
  return value;
}
export function isUserPeer(peer) { return peer?.principal?.kind === 'owner' && peer.interactions === 'answer' && !peer.signal?.aborted; }

export function createHostController(ctx, config = {}) {
  const instanceId = randomUUID();
  const queue = new SelectionQueue({ timeoutMs: config.idleMs || 60000, askOncePerParent: config.askOncePerParent === true });
  const llm = ctx.get('llm'), agents = ctx.get('agents');
  let catalogPromise = null, models = [], active = true;
  const labelFor = route => models.find(model => model.provider === route?.provider && model.model === route?.model)?.label || route?.model || null;
  async function catalog() {
    if (!catalogPromise) catalogPromise = (async () => {
      const providers = llm.listProviders();
      const rows = await Promise.all(providers.map(async provider => {
        try {
          return (await llm.listModels(provider.id)).filter(model => identifier(model.id)).map(model => ({
            provider: provider.id, model: model.id, label: text(model.name, 300) || model.id,
            providerLabel: text(provider.name, 300) || provider.id, description: text(model.description)
          }));
        } catch (error) { ctx.logger?.warn?.('Subagent model catalog unavailable for ' + provider.id + ': ' + String(error?.message || error)); return []; }
      }));
      models = rows.flat().filter((row, index, all) => all.findIndex(other => other.provider === row.provider && other.model === row.model) === index);
      return models;
    })().catch(error => { catalogPromise = null; throw error; });
    return catalogPromise;
  }
  function invalidateCatalog() { catalogPromise = null; queue.changed(); }
  async function snapshot(rootSessionId) {
    await catalog();
    const result = { ...queue.snapshot(rootSessionId, models), instanceId };
    result.tasks = result.tasks.map(task => ({ ...task, effectiveModelLabel: labelFor(task.effectiveRoute) || task.effectiveModelLabel }));
    return result;
  }
  async function created({ agent, source, signal }) {
    if (!active || agent.session.header.origin !== 'subagent' || !agent.session.header.parentSession) return;
    const metadata = metadataOf(agent, agents);
    if (source !== 'startup' || metadata.hasOwnRequest) { queue.remember(metadata); return; }
    await queue.admit(metadata, route => {
      if (signal?.aborted) throw abortError();
      // Public selection commits model/selection before any step preparation. Omitted effort uses the new adapter's defaults.
      agent.model.select({ provider: route.provider, model: route.model });
    }, signal);
  }
  function observeEvent(session, event) {
    const task = queue.tasks.get(session.id); if (!task) return;
    if (event.type === 'request/header') {
      const route = routeOf(event.data.header?.config); if (route) queue.update(session.id, { effectiveRoute: route, effectiveModelLabel: labelFor(route) });
    } else if (event.type === 'model/selection') {
      const route = routeOf(event.data); if (route) queue.update(session.id, { effectiveRoute: route, effectiveModelLabel: labelFor(route) });
    } else if (event.type === 'subagent/descriptor') queue.update(session.id, { title: text(event.data.label, 300) || task.title });
  }
  async function rpc(endpoint, payload, signal, peer) {
    try {
      if (!isUserPeer(peer)) throw new SelectionError('user-only', 'Only the authenticated user may choose or renew a model selection.');
      if (!active) throw new SelectionError('unavailable', 'The model-selection plugin has unloaded.');
      const request = validatePayload(endpoint, payload);
      const root = agents.get(request.rootSessionId);
      if (!root || rootOf(root, agents) !== request.rootSessionId) throw new SelectionError('session-unavailable', 'The requested root session is not live.');
      if (signal?.aborted) throw abortError();
      if (endpoint.endsWith('/state')) {
        await queue.wait(request.afterRevision, request.waitMs || 0, signal);
      } else if (endpoint.endsWith('/activity')) queue.activity(request.rootSessionId);
      else {
        if (request.route) {
          const options = await catalog();
          if (!options.some(model => model.provider === request.route.provider && model.model === request.route.model)) throw new SelectionError('model-unavailable', 'This model is no longer in the configured model catalog.');
        }
        if (signal?.aborted) throw abortError();
        queue.choose(request);
      }
      if (!active) throw new SelectionError('unavailable', 'The model-selection plugin has unloaded.');
      if (signal?.aborted) throw abortError();
      return { ok: true, value: await snapshot(request.rootSessionId) };
    } catch (error) {
      return { ok: false, error: { code: 'selective-subagent/' + (error.code || (error.name === 'AbortError' ? 'cancelled' : 'failed')),
        message: String(error.message || error), details: {} } };
    }
  }
  function dispose() { active = false; queue.dispose(); catalogPromise = null; models = []; }
  return { queue, catalog, snapshot, created, observeEvent, invalidateCatalog, rpc, dispose };
}

export function createFetchHandler(connection, host, endpoint) {
  return async request => {
    const admission = connection.admit(request);
    if ('rejection' in admission) return new Response('unauthorized', { status: admission.rejection });
    if (!isUserPeer(admission.peer)) return new Response('forbidden', { status: 403 });
    if (request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') return new Response('Expected application/json.', { status: 415 });
    let message;
    try { message = await request.json(); } catch { return new Response('Invalid JSON.', { status: 400 }); }
    if (!object(message) || Object.keys(message).some(key => !['type', 'rpcId', 'method', 'payload'].includes(key)) || message.type !== 'client-request' || !identifier(message.rpcId) || message.method !== endpoint || !Object.hasOwn(message, 'payload')) return new Response('Invalid RPC envelope.', { status: 400 });
    const result = await host.rpc(endpoint, message.payload, request.signal, admission.peer);
    return Response.json({ type: 'server-response', rpcId: message.rpcId, result });
  };
}

export function apply(ctx, config = {}) {
  if (config.enabled === false) return;
  const host = createHostController(ctx, config);
  // The owner context owns all listeners and RPC registrations. No agent-callable Tool is registered.
  ctx.on('agent/created', host.created, { global: true });
  ctx.on('session/event', host.observeEvent, { global: true });
  ctx.on('agent/disposed', ({ agent }) => {
    host.queue.end(agent.id); host.queue.forgetParent(agent.id);
    for (const task of host.queue.tasks.values()) if (task.parentSessionId === agent.id && task.status === 'pending') host.queue.cancel(task.id);
  }, { global: true });
  ctx.on('subagent/end', info => host.queue.end(info.id, info.stopReason === 'aborted' ? 'cancelled' : 'done'), { global: true });
  ctx.on('llm/adapters-updated', host.invalidateCatalog);
  ctx.on('llm/models-updated', host.invalidateCatalog);
  for (const agent of ctx.get('agents').list()) if (agent.session.header.origin === 'subagent') host.queue.remember(metadataOf(agent, ctx.get('agents')));
  const connection = ctx.get('connection');
  const removers = [...ENDPOINTS].map(endpoint => connection.fetch.register({
    path: '/api/' + endpoint, methods: ['POST'], requestBody: 'buffered',
    fetch: createFetchHandler(connection, host, endpoint),
  }));
  ctx.effect(() => () => { host.dispose(); return Promise.all(removers.map(remove => remove())); });
}
