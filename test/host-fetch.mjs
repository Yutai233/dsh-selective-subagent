import test from 'node:test';
import assert from 'node:assert/strict';
import { createFetchHandler, apply } from '../host/index.js';
const peer={principal:{kind:'owner'},interactions:'answer',signal:new AbortController().signal};
const endpoint='selective-subagent/state';
function request(message={type:'client-request',rpcId:'test-rpc',method:endpoint,payload:{rootSessionId:'root'}}){return new Request('http://localhost/api/'+endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(message)});}
test('Exact Fetch route preserves generic RPC envelope and authorized peer',async()=>{
 let calls=0;
 const handler=createFetchHandler({admit:()=>({peer})},{rpc:async(e,p,s,who)=>{calls++;assert.equal(e,endpoint);assert.equal(who,peer);assert.equal(p.rootSessionId,'root');assert.ok(s instanceof AbortSignal);return{ok:true,value:{tasks:[]}};}},endpoint);
 const response=await handler(request());assert.equal(response.status,200);assert.deepEqual(await response.json(),{type:'server-response',rpcId:'test-rpc',result:{ok:true,value:{tasks:[]}}});assert.equal(calls,1);
});
test('Exact route refuses unauthenticated, non-answer, and mismatched envelopes',async()=>{
 const host={rpc:async()=>assert.fail('Denied request reached business logic')};
 assert.equal((await createFetchHandler({admit:()=>({rejection:401})},host,endpoint)(request())).status,401);
 assert.equal((await createFetchHandler({admit:()=>({peer:{...peer,interactions:'none'}})},host,endpoint)(request())).status,403);
 const handler=createFetchHandler({admit:()=>({peer})},host,endpoint);
 assert.equal((await handler(request({type:'client-request',rpcId:'id',method:'selective-subagent/choose',payload:{}}))).status,400);
 assert.equal((await handler(request({type:'client-request',rpcId:'id',method:endpoint,payload:{},extra:true}))).status,400);
 assert.equal((await handler(new Request('http://localhost',{method:'POST',body:'{}'}))).status,415);
});
test('Activation registers three exact routes and never claims the shared interceptor',async()=>{
 const paths=[];const disposers=[];let removed=0;
 const services={agents:{list:()=>[]},llm:{},connection:{fetch:{register(route){paths.push(route.path);return async()=>{removed++;};}},rpc:{intercept(){assert.fail('must not claim /api interceptor');},handle(){assert.fail('must not register a new RPC channel');}}}};
 const ctx={get:name=>services[name],on(){},effect(effect){const dispose=effect();if(dispose)disposers.push(dispose);}};
 apply(ctx,{enabled:true});
 assert.deepEqual(paths,['/api/selective-subagent/state','/api/selective-subagent/activity','/api/selective-subagent/choose']);
 await Promise.all(disposers.map(dispose=>dispose()));assert.equal(removed,3);
});
