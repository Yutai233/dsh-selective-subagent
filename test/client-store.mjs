import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const base=new URL('../',import.meta.url);
const source=await readFile(new URL('client-source.js',base),'utf8');
const css=await readFile(new URL('ui.css',base),'utf8');
const factory=source.slice(source.indexOf('function makeStore('),source.indexOf('\nreturn {\n inject:'));
const makeStore=new Function(factory+'\nreturn makeStore;')();
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function snapshot(root,revision=1,tasks=[]){return {version:1,revision,serverNow:Date.now(),timeoutMs:60000,models:[],tasks:tasks.map(task=>({rootSessionId:root,...task}))};}
function waitForAbort(signal){return new Promise((resolve,reject)=>{if(signal.aborted){reject(new Error('aborted'));return;}signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});});}
test('Generated loader is syntactically valid and imports only React',async()=>{
 const artifact=await readFile(new URL('client.js',base),'utf8');
 new Script(artifact,{filename:'client.js'});
 assert.deepEqual([...artifact.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(match=>match[1]),['react']);
 assert.ok(artifact.includes("id:'dsh-selective-subagent'"));
});
test('Styles use DSH tokens, rounded blue badges and opacity transitions',()=>{
 assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(css));
 assert.ok(css.includes('--dsw-alias-state-business-primary'));
 assert.ok(css.includes('--ssu-bg: var(--dsw-alias-bg-layer-1)'));
 assert.ok(!css.includes('--ssu-bg: var(--dsw-alias-bg-overlay)'));
 assert.ok(!css.includes('--ssu-blue: var(--dsw-alias-brand-primary)'));
 assert.ok(css.includes('.ssu-badge'));
 assert.ok(css.includes('transition:opacity 180ms ease'));
 assert.ok(css.includes('animation-delay:calc(var(--ssu-order)*40ms)'));
 assert.ok(css.includes('prefers-reduced-motion'));
 assert.ok(css.includes('overflow-y:auto'));
});
test('Manifest exports and display resources exist',async()=>{
 const manifest=JSON.parse(await readFile(new URL('package.json',base),'utf8'));
 assert.equal(manifest.name,'dsh-selective-subagent');
 assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-connection'));
 for(const relative of ['client.js','index.js','cordis.patch.yml','locale/en.json','locale/zh.json','icon.svg'])assert.ok((await stat(new URL(relative,base))).isFile());
 for(const language of ['en','zh']){const data=JSON.parse(await readFile(new URL('locale/'+language+'.json',base),'utf8'));assert.ok(data.meta.title&&data.meta.description);}
 const icon=await readFile(new URL('icon.svg',base),'utf8');assert.ok(icon.includes('http://www.w3.org/2000/svg'));assert.ok(!/<script|<foreignObject|https?:\/\/(?!www.w3.org\/2000\/svg)/i.test(icon));
});
test('Store subscribes through root-scoped long polling, then aborts on disposal',async t=>{
 const calls=[];let first=true;let waitingSignal;
 const connection={rpc:{async call(channel,endpoint,payload,signal){calls.push({channel,endpoint,payload});if(first){first=false;return {ok:true,value:snapshot(payload.rootSessionId,3,[{id:'child-1',pending:true,deadline:Date.now()+60000}])};}waitingSignal=signal;return waitForAbort(signal);}}};
 const store=makeStore(connection);t.after(()=>store.dispose());
 let updates=0;store.subscribe(()=>updates++);
 store.connect('root-1');await flush();
 assert.equal(store.getSnapshot().tasks[0].id,'child-1');assert.equal(calls[1].payload.afterRevision,3);assert.equal(calls[1].payload.waitMs,25000);assert.equal(calls[0].channel,'/api');assert.equal(calls[0].endpoint,'selective-subagent/state');assert.ok(updates>=2);
 store.dispose();assert.equal(waitingSignal.aborted,true);
});
test('Choose sends concrete route or null without inventing a default model',async t=>{
 const calls=[];let first=true;
 const connection={rpc:{async call(channel,endpoint,payload,signal){calls.push({endpoint,payload});if(endpoint.endsWith('/state')){if(first){first=false;return {ok:true,value:snapshot(payload.rootSessionId)};}return waitForAbort(signal);}return {ok:true,value:snapshot(payload.rootSessionId,2)};}}};
 const store=makeStore(connection);t.after(()=>store.dispose());store.connect('root-1');await flush();
 await store.choose({id:'child-1'},null,false);
 await store.choose({id:'child-2'},{provider:'provider-a',model:'model-b'},true);
 const writes=calls.filter(call=>call.endpoint.endsWith('/choose'));
 assert.deepEqual(writes[0].payload,{rootSessionId:'root-1',taskId:'child-1',route:null,reuse:false});
 assert.deepEqual(writes[1].payload,{rootSessionId:'root-1',taskId:'child-2',route:{provider:'provider-a',model:'model-b'},reuse:true});
});
test('Activity extends the root rather than one selected pending task',async t=>{
 const calls=[];let first=true;
 const connection={rpc:{async call(channel,endpoint,payload,signal){calls.push({endpoint,payload});if(endpoint.endsWith('/state')){if(first){first=false;return {ok:true,value:snapshot('root-1',1,[{id:'one',pending:true},{id:'two',pending:true}])};}return waitForAbort(signal);}return {ok:true,value:snapshot('root-1',2,[{id:'one',pending:true},{id:'two',pending:true}])};}}};
 const store=makeStore(connection);t.after(()=>store.dispose());store.connect('root-1');await flush();await store.activity();
 assert.deepEqual(calls.find(call=>call.endpoint.endsWith('/activity')).payload,{rootSessionId:'root-1'});
});
test('Late replies from a previously selected root cannot replace the active root',async t=>{
 let oldResolve;
 const connection={rpc:{async call(channel,endpoint,payload,signal){if(payload.rootSessionId==='old')return new Promise(resolve=>oldResolve=resolve);if(payload.afterRevision===0)return {ok:true,value:snapshot('new',9,[{id:'new-task',pending:true}])};return waitForAbort(signal);}}};
 const store=makeStore(connection);t.after(()=>store.dispose());store.connect('old');store.connect('new');await flush();oldResolve({ok:true,value:snapshot('old',99,[{id:'old-task',pending:true}])});await flush();
 assert.equal(store.getSnapshot().rootSessionId,'new');assert.equal(store.getSnapshot().tasks[0].id,'new-task');
});
test('Same-millisecond stale activity cannot overwrite a confirmed choice',async t=>{
 const stamp=Date.now()+1000;let first=true,resolveChoice,resolveActivity;
 const state=(revision,pending)=>({...snapshot('root-1',revision,[{id:'child',pending}]),instanceId:'one',serverNow:stamp});
 const connection={rpc:{async call(channel,endpoint,payload,signal){if(endpoint.endsWith('/state')){if(first){first=false;return{ok:true,value:state(10,true)};}return waitForAbort(signal);}if(endpoint.endsWith('/choose'))return new Promise(resolve=>resolveChoice=resolve);return new Promise(resolve=>resolveActivity=resolve);}}};
 const store=makeStore(connection);t.after(()=>store.dispose());store.connect('root-1');await flush();
 const choice=store.choose({id:'child'},null,false);const activity=store.activity();
 resolveChoice({ok:true,value:state(11,false)});await choice;
 resolveActivity({ok:true,value:state(10,true)});await activity;
 assert.equal(store.getSnapshot().revision,11);assert.equal(store.getSnapshot().tasks[0].pending,false);
});
test('A new Host instance may restart its revision counter',async t=>{
 const stamp=Date.now()+1000;let first=true;
 const connection={rpc:{async call(channel,endpoint,payload,signal){if(endpoint.endsWith('/state')){if(first){first=false;return{ok:true,value:{...snapshot('root-1',80),instanceId:'old',serverNow:stamp}};}return waitForAbort(signal);}return{ok:true,value:{...snapshot('root-1',1,[{id:'new',pending:true}]),instanceId:'new',serverNow:stamp+1}};}}};
 const store=makeStore(connection);t.after(()=>store.dispose());store.connect('root-1');await flush();
 await store.choose({id:'unused'},null,false);assert.equal(store.getSnapshot().instanceId,'new');assert.equal(store.getSnapshot().revision,1);
});
test('Task history is a shell overlay, never an inline details expansion',()=>{
 assert.ok(!source.includes("h('details'"));
 assert.ok(source.includes("id:'selective-subagent-task-history'"));
 assert.ok(source.includes("className:'ssu-root ssu-history-layer'"));
 assert.ok(css.includes('.ssu-history-layer { position:fixed;'));
 assert.ok(css.includes('.ssu-history-panel { position:fixed;'));
 assert.ok(css.includes('.ssu-history-row {'));
 assert.ok(css.includes('animation:ssu-row-in 170ms ease-out both'));
 assert.ok(css.includes('.ssu-history-panel,.ssu-history-row { animation:none; }'));
});
test('Task popover toggles without an RPC or a pending-model confirmation',()=>{
 const store=makeStore({rpc:{call(){assert.fail('view state must not call the Host');}}});
 const anchor={left:10,right:100,top:400,bottom:420};
 store.toggleHistory(anchor);
 assert.deepEqual(store.getSnapshot().historyAnchor,anchor);
 assert.equal(store.getSnapshot().requestedTaskId,null);
 store.closeHistory();assert.equal(store.getSnapshot().historyAnchor,null);
 store.toggleHistory(anchor);store.toggleHistory(anchor);assert.equal(store.getSnapshot().historyAnchor,null);
 store.dispose();
});
test('Opening model selection closes task history',()=>{
 const store=makeStore({rpc:{call(){assert.fail();}}});
 store.toggleHistory({left:0,right:100,top:100,bottom:120});store.show('task');
 assert.equal(store.getSnapshot().historyAnchor,null);assert.equal(store.getSnapshot().requestedTaskId,'task');assert.equal(store.getSnapshot().hidden,false);
 store.dispose();
});
test('Switching sessions clears the task popover anchor',async t=>{
 const connection={rpc:{call(channel,endpoint,payload,signal){return waitForAbort(signal);}}};
 const store=makeStore(connection);t.after(()=>store.dispose());
 store.toggleHistory({left:0,right:100,top:100,bottom:120});
 store.connect('next-root');assert.equal(store.getSnapshot().historyAnchor,null);
});
test('Structured RPC errors are reported and cannot become successful choices',async t=>{
 let first=true;
 const connection={rpc:{async call(channel,endpoint,payload,signal){if(endpoint.endsWith('/state')){if(first){first=false;return {ok:true,value:snapshot('root-1')};}return waitForAbort(signal);}return {ok:false,error:{code:'EXPIRED',message:'Selection expired'}};}}};
 const store=makeStore(connection);t.after(()=>store.dispose());store.connect('root-1');await flush();await assert.rejects(store.choose({id:'child'},null,false),/Selection expired/);
});
