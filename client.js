window.__ModuleLoader__.load({
 id:'dsh-selective-subagent',
 factory(require){
 const CSS_TEXT=".ssu-root { --ssu-bg: var(--dsw-alias-bg-layer-1); --ssu-text: var(--dsw-alias-label-primary); --ssu-muted: var(--dsw-alias-label-secondary); --ssu-line: var(--dsw-alias-border-l1); --ssu-blue: var(--dsw-alias-state-business-primary); color:var(--ssu-text); font-family:\"Microsoft YaHei\",\"微软雅黑\",sans-serif; font-size:var(--dsh-content-font-size-secondary,13px); line-height:1.6; }\n.ssu-root * { box-sizing:border-box; }\n.ssu-root button,.ssu-root input { font:inherit; color:inherit; }\n.ssu-root button { cursor:pointer; }\n.ssu-root button:disabled { cursor:default; opacity:.45; }\n.ssu-root button:focus-visible,.ssu-root input:focus-visible { outline:2px solid var(--ssu-blue); outline-offset:2px; }\n.ssu-overlay { position:fixed; inset:0; z-index:1200; display:flex; align-items:center; justify-content:center; padding:20px; pointer-events:auto; background:color-mix(in srgb,var(--dsw-alias-bg-base) 72%,transparent); }\n.ssu-dialog { width:560px; max-width:100%; max-height:calc(100dvh - 40px); display:flex; flex-direction:column; border:1px solid var(--dsw-alias-border-l2); border-radius:10px; background:var(--ssu-bg); }\n.ssu-header { display:flex; align-items:center; justify-content:space-between; padding:17px 20px 14px; gap:10px; flex-shrink:0; }\n.ssu-header h2 { font-size:16px; font-weight:500; margin:0; }\n.ssu-header-tools { display:flex; align-items:center; gap:9px; }\n.ssu-close { border:0; border-radius:4px; background:transparent; width:25px; height:27px; padding:0; color:var(--ssu-muted)!important; font-size:22px!important; line-height:1; }\n.ssu-close:hover { background:var(--dsw-alias-bg-layer-2); }\n.ssu-body { padding:0 20px 17px; overflow-y:auto; min-height:0; }\n.ssu-task-row { display:flex; align-items:flex-start; gap:10px; margin-bottom:7px; }\n.ssu-counter { flex-shrink:0; font-size:12px; line-height:38px; color:var(--ssu-muted); white-space:nowrap; font-variant-numeric:tabular-nums; }\n.ssu-picker { position:relative; flex:1; min-width:0; }\n.ssu-trigger { display:flex; justify-content:space-between; align-items:center; gap:9px; width:100%; min-height:38px; border:1px solid var(--ssu-line); border-radius:6px; padding:8px 11px; background:var(--dsw-alias-bg-layer-1); text-align:left; }\n.ssu-trigger-label { display:flex; align-items:center; flex-wrap:wrap; gap:6px; min-width:0; overflow-wrap:anywhere; }\n.ssu-chevron { width:7px; height:7px; border-right:1px solid var(--ssu-muted); border-bottom:1px solid var(--ssu-muted); transform:translateY(-2px) rotate(45deg); flex-shrink:0; transition:transform 160ms ease; }\n.ssu-trigger[aria-expanded=true] .ssu-chevron { transform:translateY(2px) rotate(225deg); }\n.ssu-menu { position:absolute; top:calc(100% + 5px); left:0; right:0; z-index:30; padding:4px; border:1px solid var(--dsw-alias-border-l2); border-radius:6px; background:var(--ssu-bg); max-height:min(270px,38dvh); overflow-y:auto; overscroll-behavior:contain; animation:ssu-menu-in 130ms ease-out; }\n.ssu-menu-option { width:100%; display:flex; align-items:flex-start; gap:9px; border:0; border-radius:5px; padding:10px; background:transparent; text-align:left; animation:ssu-row-in 170ms ease-out both; animation-delay:calc(var(--ssu-order)*40ms); }\n.ssu-menu-option:hover,.ssu-menu-option:focus-visible { background:var(--dsw-alias-bg-layer-2); }\n.ssu-menu-option[aria-selected=true] { background:color-mix(in srgb,var(--ssu-blue) 10%,var(--ssu-bg)); }\n.ssu-menu-option:focus-visible { outline-offset:-2px; }\n.ssu-option-content { min-width:0; flex:1; }\n.ssu-option-title { display:flex; align-items:center; flex-wrap:wrap; gap:6px; overflow-wrap:anywhere; }\n.ssu-small,.ssu-description { color:var(--ssu-muted); font-size:12px; }\n.ssu-description { margin:0 0 16px 40px; line-height:1.8; overflow-wrap:anywhere; }\n.ssu-small { display:block; font-size:11px; margin-top:3px; overflow-wrap:anywhere; }\n.ssu-badge { display:inline-block; max-width:100%; vertical-align:middle; font-size:11px; line-height:1.6; font-weight:400; padding:1px 6px; border:1px solid color-mix(in srgb,var(--ssu-blue) 35%,transparent); border-radius:5px; background:color-mix(in srgb,var(--ssu-blue) 10%,var(--ssu-bg)); color:var(--ssu-blue); overflow-wrap:anywhere; }\n.ssu-theme-picker { position:relative; flex:none; }\n.ssu-theme-trigger { border:0; min-height:28px; background:transparent; color:var(--ssu-muted)!important; font-size:12px!important; padding:4px; white-space:nowrap; }\n.ssu-theme-menu { left:auto; min-width:150px; }\n.ssu-search { width:100%; border:1px solid var(--ssu-line); border-radius:6px; padding:7px 10px; background:transparent; min-height:34px; margin-bottom:10px; }\n.ssu-search::placeholder { color:var(--ssu-muted); }\n.ssu-models { max-height:min(280px,36dvh); min-height:70px; overflow-y:auto; overscroll-behavior:contain; scrollbar-gutter:stable; scrollbar-width:thin; scrollbar-color:var(--dsw-alias-border-l2) transparent; }\n.ssu-models::-webkit-scrollbar,.ssu-menu::-webkit-scrollbar { width:5px; }\n.ssu-models::-webkit-scrollbar-thumb,.ssu-menu::-webkit-scrollbar-thumb { border-radius:4px; background:var(--dsw-alias-border-l2); }\n.ssu-model { position:relative; isolation:isolate; display:flex; align-items:center; gap:11px; border-radius:6px; padding:10px; min-height:58px; cursor:pointer; }\n.ssu-model + .ssu-model { margin-top:2px; }\n.ssu-model::before { content:\"\"; position:absolute; inset:0; z-index:-1; border-radius:6px; border:1px solid color-mix(in srgb,var(--ssu-blue) 40%,transparent); background:color-mix(in srgb,var(--ssu-blue) 10%,var(--ssu-bg)); opacity:0; transition:opacity 180ms ease; pointer-events:none; }\n.ssu-model[data-selected=true]::before { opacity:1; }\n.ssu-model:hover { background:var(--dsw-alias-bg-layer-1); }\n.ssu-model input,.ssu-reuse input { accent-color:var(--ssu-blue); width:14px; height:14px; flex-shrink:0; margin:0; }\n.ssu-model-name { display:block; font-size:13px; }\n.ssu-model-route { display:block; font-size:11px; color:var(--ssu-muted); overflow-wrap:anywhere; line-height:1.7; }\n.ssu-model-info { flex:1; min-width:0; }\n.ssu-reuse { display:flex; gap:8px; align-items:flex-start; color:var(--ssu-muted); margin-top:14px; font-size:12px; cursor:pointer; }\n.ssu-reuse input { margin-top:3px; }\n.ssu-footer { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:13px 20px; border-top:1px solid var(--ssu-line); flex-shrink:0; }\n.ssu-timer { font-size:12px; color:var(--ssu-muted); font-variant-numeric:tabular-nums; }\n.ssu-timer small { display:block; font-size:11px; }\n.ssu-actions { display:flex; align-items:center; gap:7px; }\n.ssu-btn { border:1px solid var(--ssu-line); border-radius:6px; min-height:34px; background:var(--ssu-bg); padding:6px 12px; white-space:nowrap; font-size:13px; }\n.ssu-btn:hover:not(:disabled) { background:var(--dsw-alias-bg-layer-2); }\n.ssu-btn-primary { color:var(--ssu-bg)!important; background:var(--ssu-text); border-color:var(--ssu-text); }\n.ssu-btn-primary:hover:not(:disabled) { background:var(--ssu-text); opacity:.85; }\n.ssu-empty { padding:24px 10px; text-align:center; color:var(--ssu-muted); }\n.ssu-error { color:var(--dsw-alias-state-error-primary); font-size:12px; margin:8px 0 0; overflow-wrap:anywhere; }\n.ssu-dock { display:inline-flex; align-items:center; flex:0 0 auto; align-self:center; min-width:0; max-width:100%; margin:0; padding:0; font-family:var(--dsw-font-family,\"Microsoft YaHei\",\"微软雅黑\",sans-serif); font-size:12px; line-height:20px; color:var(--ssu-muted); }\n.ssu-taskbar-trigger { display:inline-flex; align-items:center; justify-content:center; gap:6px; max-width:100%; border:0; border-radius:6px; margin:0; padding:2px 4px; background:transparent; color:var(--ssu-muted)!important; font:inherit!important; white-space:nowrap; }\n.ssu-taskbar-trigger:hover,.ssu-taskbar-trigger[aria-expanded=true] { background:var(--dsw-alias-bg-layer-2); color:var(--ssu-text)!important; }\n.ssu-taskbar-trigger .ssu-chevron { width:6px; height:6px; margin-left:2px; }\n.ssu-taskbar-trigger[aria-expanded=true] .ssu-chevron { transform:translateY(2px) rotate(225deg); }\n.ssu-taskbar-count { font-variant-numeric:tabular-nums; }\n.ssu-history-layer { position:fixed; inset:0; z-index:1190; pointer-events:auto; background:transparent; }\n.ssu-history-panel { position:fixed; display:flex; flex-direction:column; pointer-events:auto; border:1px solid var(--dsw-alias-border-l2); border-radius:10px; background:var(--ssu-bg); color:var(--ssu-text); overflow:hidden; box-shadow:0 6px 24px color-mix(in srgb,var(--dsw-alias-bg-base) 25%,transparent); animation:ssu-menu-in 130ms ease-out; }\n.ssu-history-header { display:flex; align-items:center; justify-content:space-between; flex-shrink:0; gap:12px; padding:12px 14px 8px; }\n.ssu-history-header h3 { margin:0; font-size:13px; font-weight:500; line-height:22px; }\n.ssu-history-header .ssu-close { width:22px; height:24px; font-size:20px!important; }\n.ssu-history-list { min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:0 8px 8px; scrollbar-width:thin; scrollbar-color:var(--dsw-alias-border-l2) transparent; }\n.ssu-history-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 7px; border-radius:6px; font-size:13px; line-height:1.6; animation:ssu-row-in 170ms ease-out both; animation-delay:calc(var(--ssu-order)*40ms); }\n.ssu-history-row+.ssu-history-row { border-top:1px solid var(--ssu-line); }\n.ssu-history-task { display:flex; flex:1; align-items:center; flex-wrap:wrap; gap:5px 7px; min-width:0; }\n.ssu-history-name { min-width:0; overflow-wrap:anywhere; color:var(--ssu-text); font-weight:400; }\n.ssu-history-status { flex-shrink:0; color:var(--ssu-muted); font-size:11px; white-space:nowrap; }\n.ssu-history-panel>.ssu-error { margin:0; padding:0 14px 12px; }\n.ssu-link { border:0; background:transparent; padding:2px; color:var(--ssu-blue)!important; font-size:12px!important; white-space:nowrap; }\n.ssu-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }\n@keyframes ssu-menu-in { from { opacity:0; transform:translateY(-3px); } to { opacity:1; transform:translateY(0); } }\n@keyframes ssu-row-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }\n@media(prefers-reduced-motion:reduce) { .ssu-menu,.ssu-menu-option,.ssu-history-panel,.ssu-history-row { animation:none; } .ssu-chevron,.ssu-model::before { transition:none; } }\n@media(max-width:600px) { .ssu-overlay { padding:12px; } .ssu-dialog { max-height:calc(100dvh - 24px); } .ssu-header { padding:15px 16px 13px; } .ssu-header h2 { font-size:15px; } .ssu-header-tools { gap:5px; } .ssu-theme-trigger { font-size:11px!important; } .ssu-body { padding:0 16px 16px; } .ssu-footer { padding:12px 16px; flex-wrap:wrap; } .ssu-actions { margin-left:auto; } .ssu-timer { font-size:11px; } .ssu-btn { font-size:12px; padding:6px 10px; } }\n";
const React = require('react');
const h = React.createElement;
const {useState,useEffect,useRef,useSyncExternalStore} = React;
const NS = 'selective-subagent-ui';
const labels = {
 zh: {title:'子代理模型选择',taskbar:'子代理模型',historyClose:'关闭任务浮层',historyEmpty:'暂无子代理任务',historyHint:'点击查看子任务与模型',search:'搜索模型或提供商',defaultName:'使用 DSH 默认策略',defaultDescription:'不覆盖 DSH 原有的子代理模型路由',reuse:'同一父会话后续子代理复用此选择',confirm:'确认',confirmReuse:'确认并复用',useDefault:'使用默认',after:'秒后按 DSH 默认策略继续',idle:'有操作时重新计时',close:'暂时收起（倒计时继续）',empty:'没有匹配的可用模型',waiting:'等待选择',running:'运行中',done:'已完成',cancelled:'已取消',choose:'选择',system:'跟随系统',light:'浅色',dark:'深色',theme:'切换 DSH 主题',noOverride:'不覆盖路由',defaultBadge:'DSH 默认策略',task:'任务',error:'模型选择失败',connection:'暂时无法连接模型选择服务',modelsError:'模型目录暂不可用，可使用 DSH 默认策略',readOnly:'当前连接不能代替用户选择模型'},
 en: {title:'Subagent model selection',taskbar:'Subagent models',historyClose:'Close task popover',historyEmpty:'No subagent tasks yet',historyHint:'View subagent tasks and models',search:'Search models or providers',defaultName:'Use the DSH default policy',defaultDescription:'Keep the existing DSH subagent model route',reuse:'Reuse this choice for later subagents of the same parent',confirm:'Confirm',confirmReuse:'Confirm and reuse',useDefault:'Use default',after:'s until the DSH default policy',idle:'Activity restarts the countdown',close:'Dismiss temporarily (countdown continues)',empty:'No matching available models',waiting:'Awaiting selection',running:'Running',done:'Completed',cancelled:'Cancelled',choose:'Choose',system:'System',light:'Light',dark:'Dark',theme:'Change the DSH theme',noOverride:'Keep route',defaultBadge:'DSH default policy',task:'Task',error:'Model selection failed',connection:'Cannot connect to the model selection service',modelsError:'Model directory is unavailable; the DSH default policy is still available',readOnly:'This connection cannot answer model questions for the user'}
};
const routeKey = route => route ? JSON.stringify([route.provider,route.model]) : 'default';
const modelLabel = task => task.effectiveModelLabel || (task.route && task.route.model) || null;
function makeStore(connection) {
 const listeners = new Set();
 let current = {rootSessionId:null,revision:0,serverNow:Date.now(),receivedAt:Date.now(),timeoutMs:60000,models:[],tasks:[],error:null,hidden:false,requestedTaskId:null,historyAnchor:null};
 let controller = null;
 let generation = 0;
 let disposed = false;
 let retryTimer = null;
 const lifetime = new AbortController();
 const publish = next => { current=next; for(const fn of listeners) fn(); };
 async function call(name,payload,signal=lifetime.signal) {
  const result = await connection.rpc.call('/api','selective-subagent/'+name,payload,signal);
  if(!result || !result.ok) throw new Error(result?.error?.message || result?.error?.code || 'RPC failed');
  return result.value;
 }
 function apply(snapshot,root) {
  if(disposed || root!==current.rootSessionId || !snapshot || !Array.isArray(snapshot.tasks)) return;
  const reset=!!(snapshot.instanceId && current.instanceId && snapshot.instanceId!==current.instanceId);
  if(!reset && Number.isSafeInteger(snapshot.revision) && snapshot.revision<current.revision)return;
  if(snapshot.serverNow && snapshot.serverNow<current.serverNow)return;
  const oldIds=new Set(reset?[]:current.tasks.filter(task=>task.pending).map(task=>task.id));
  const fresh=snapshot.tasks.some(task=>task.pending&&!oldIds.has(task.id));
  publish({...current,...snapshot,rootSessionId:root,receivedAt:Date.now(),error:null,hidden:reset||fresh?false:current.hidden,requestedTaskId:reset?null:current.requestedTaskId,historyAnchor:reset||fresh?null:current.historyAnchor});
 }
 async function watch(root,serial) {
  let failures=0;
  while(!disposed && serial===generation && !controller.signal.aborted) {
   const signal=controller.signal;
   try {
    const data=await call('state',{rootSessionId:root,afterRevision:current.revision,waitMs:25000},signal);
    if(serial!==generation) return;
    apply(data,root); failures=0;
   } catch(error) {
    if(signal.aborted || disposed || serial!==generation) return;
    publish({...current,error:String(error.message||error)});
    failures++;
    await new Promise(resolve=>{
     const finish=()=>{clearTimeout(retryTimer);signal.removeEventListener('abort',finish);resolve();};
     retryTimer=setTimeout(finish,Math.min(1000*2**Math.min(failures,3),8000));
     signal.addEventListener('abort',finish,{once:true});
    });
   }
  }
 }
 return {
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  getSnapshot(){return current;},
  connect(root){
   if(disposed || (current.rootSessionId===root && controller && !controller.signal.aborted)) return ()=>{};
   generation++;controller?.abort();clearTimeout(retryTimer);controller=new AbortController();
   publish({rootSessionId:root,revision:0,serverNow:0,receivedAt:Date.now(),timeoutMs:60000,models:[],tasks:[],error:null,hidden:false,requestedTaskId:null,historyAnchor:null});
   const serial=generation;void watch(root,serial);
   return()=>{if(generation===serial){controller.abort();generation++;}};
  },
  async choose(task,route,reuse){
   const root=current.rootSessionId;
   const response=await call('choose',{rootSessionId:root,taskId:task.id,route,reuse:!!reuse});
   apply(response,root);
  },
  async activity(){
   if(!current.rootSessionId || !current.tasks.some(task=>task.pending)) return;
   const root=current.rootSessionId;
   const response=await call('activity',{rootSessionId:root});apply(response,root);
  },
  dismiss(){publish({...current,hidden:true});},
  show(id){publish({...current,hidden:false,requestedTaskId:id||null,historyAnchor:null});},
  toggleHistory(anchor){publish({...current,historyAnchor:current.historyAnchor?null:{left:anchor.left,right:anchor.right,top:anchor.top,bottom:anchor.bottom}});},
  closeHistory(){if(current.historyAnchor)publish({...current,historyAnchor:null});},
  dispose(){disposed=true;generation++;controller?.abort();lifetime.abort();clearTimeout(retryTimer);listeners.clear();}
 };
}
return {
 inject:['slots','connection','locale','theme'],
 apply(ctx) {
  const connection=ctx.get('connection');
  const slots=ctx.get('slots');
  const locale=ctx.get('locale');
  const theme=ctx.get('theme');
  if(!connection?.rpc || !slots || !locale || !theme) throw new Error('Subagent model selection requires Connection, Slots, Locale and Theme');
  ctx.effect(()=>locale.register(NS,'en',labels.en));
  ctx.effect(()=>locale.register(NS,'zh',labels.zh));
  const translate=locale.bind(NS);
  const store=makeStore(connection);
  ctx.effect(()=>()=>store.dispose());
  function useLocale() {
   useSyncExternalStore(fn=>locale.subscribe(fn),()=>locale.getSnapshot());
   return translate;
  }
  function Badge({task}) {
   const t=useLocale();
   if(task.pending && !task.choiceReason)return null;
   const value=modelLabel(task) || (task.choiceReason && task.choiceReason!=='selected' ? t('defaultBadge') : null);
   return value ? h('span',{className:'ssu-badge',title:task.route?task.route.provider+' / '+task.route.model:value},value) : null;
  }
  function Dropdown({id,label,options,value,onChange,open,setOpen,themeMenu=false}) {
   const refs=useRef([]);
   const trigger=useRef(null);
   const menu=useRef(null);
   const index=Math.max(0,options.findIndex(option=>option.id===value));
   const expanded=open===id;
   useEffect(()=>{if(expanded) refs.current[index]?.focus({preventScroll:true});},[expanded]);
   function close(focus=true){setOpen(null);if(focus) trigger.current?.focus({preventScroll:true});}
   function handleKey(event) {
    const list=refs.current.filter(node=>node&&!node.disabled);const at=list.indexOf(document.activeElement);let next=at;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
    if(event.key==='Tab'){close();return;}
    if(event.key==='ArrowDown')next=(at+1)%list.length;
    else if(event.key==='ArrowUp')next=(at-1+list.length)%list.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=list.length-1;
    else return;
    event.preventDefault();event.stopPropagation();list[next]?.focus({preventScroll:true});list[next]?.scrollIntoView({block:'nearest'});
   }
   return h('div',{className:'ssu-picker'+(themeMenu?' ssu-theme-picker':'')},
    h('button',{ref:trigger,type:'button',className:'ssu-trigger'+(themeMenu?' ssu-theme-trigger':''),'aria-haspopup':'listbox','aria-expanded':expanded,'aria-controls':id+'-menu',onClick:()=>setOpen(expanded?null:id),onKeyDown:event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setOpen(id);}}},
     h('span',{className:'ssu-trigger-label'},label),h('span',{className:'ssu-chevron','aria-hidden':true})),
    expanded?h('div',{id:id+'-menu',ref:menu,className:'ssu-menu'+(themeMenu?' ssu-theme-menu':''),role:'listbox','aria-label':typeof label==='string'?label:id,onKeyDown:handleKey},options.map((option,i)=>h('button',{ref:element=>refs.current[i]=element,key:option.id,type:'button',role:'option','aria-selected':option.id===value,tabIndex:-1,disabled:!!option.disabled,className:'ssu-menu-option',style:{'--ssu-order':Math.min(i,8)},onClick:()=>{onChange(option.id);close();}},h('div',{className:'ssu-option-content'},h('div',{className:'ssu-option-title'},option.label,option.task?h(Badge,{task:option.task}):null),option.description?h('small',{className:'ssu-small'},option.description):null)))):null);
  }
  function ModelDialog() {
   const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot);
   const t=useLocale();
   const [activeId,setActiveId]=useState(null);
   const [selected,setSelected]=useState({});
   const [query,setQuery]=useState('');
   const [reuse,setReuse]=useState(false);
   const [menu,setMenu]=useState(null);
   const [error,setError]=useState('');
   const [busy,setBusy]=useState(false);
   const [now,setNow]=useState(Date.now());
   const [themeSnapshot,setThemeSnapshot]=useState(()=>theme.getTheme());
   const dialog=useRef(null);
   const menuRef=useRef(null);
   menuRef.current=menu;
   const closeButton=useRef(null);
   const lastTouch=useRef(0);
   const touchTimer=useRef(null);
   const suppressClick=useRef(false);
   const pending=snapshot.tasks.filter(task=>task.pending);
   const target=snapshot.tasks.find(task=>task.id===snapshot.requestedTaskId);
   const active=snapshot.tasks.find(task=>task.id===activeId && task.pending) || (target?.pending?target:null) || pending[0] || null;
   const visible=!!active && !snapshot.hidden;
   const route=active && Object.hasOwn(selected,active.id) ? selected[active.id] : undefined;
   const serverNow=snapshot.serverNow+(now-snapshot.receivedAt);
   const seconds=active?.deadline ? Math.max(0,Math.ceil((active.deadline-serverNow)/1000)):Math.ceil(snapshot.timeoutMs/1000);
   const requestId=active?.id;
   useEffect(()=>ctx.on('theme/change',setThemeSnapshot),[]);
   useEffect(()=>{if(snapshot.requestedTaskId)setActiveId(snapshot.requestedTaskId);},[snapshot.requestedTaskId]);
   useEffect(()=>{setQuery('');setMenu(null);setError('');},[requestId]);
   useEffect(()=>{
    const keep=new Set(snapshot.tasks.map(task=>task.id));
    setSelected(previous=>{const next={};for(const [key,value]of Object.entries(previous))if(keep.has(key))next[key]=value;return next;});
   },[snapshot.rootSessionId]);
   useEffect(()=>{
    if(!visible)return;
    const previous=document.activeElement;
    closeButton.current?.focus({preventScroll:true});
    const timer=setInterval(()=>setNow(Date.now()),250);
    function trap(event){
     if(!dialog.current)return;
     if(event.key==='Escape'){
      event.preventDefault();event.stopPropagation();
      if(menuRef.current)setMenu(null);else store.dismiss();return;
     }
     if(event.key!=='Tab')return;
     const focusables=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(node=>node.tabIndex>=0&&node.getClientRects().length>0);
     if(!focusables.length)return;
     const first=focusables[0],last=focusables[focusables.length-1];
     if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
     else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    document.addEventListener('keydown',trap);
    return()=>{clearInterval(timer);document.removeEventListener('keydown',trap);clearTimeout(touchTimer.current);if(previous?.isConnected)previous.focus({preventScroll:true});};
   },[visible]);
   useEffect(()=>()=>clearTimeout(touchTimer.current),[]);
   function activity(event){
    if(!visible)return;
    if(event.type==='pointerdown')suppressClick.current=false;
    const wallTime=snapshot.serverNow+(Date.now()-snapshot.receivedAt);
    if(active?.deadline && wallTime>=active.deadline){
     if(event.type==='pointerdown')suppressClick.current=true;
     event.preventDefault();event.stopPropagation();return;
    }
    if(Date.now()-lastTouch.current<800){
     if(!touchTimer.current)touchTimer.current=setTimeout(()=>{touchTimer.current=null;lastTouch.current=Date.now();void store.activity().catch(reason=>setError(reason.message));},800);
     return;
    }
    lastTouch.current=Date.now();void store.activity().catch(reason=>setError(reason.message));
   }
   async function choose(choice){
    if(busy||!active||seconds===0)return;
    const task=active;setBusy(true);setError('');
    try{await store.choose(task,choice,reuse);setSelected(previous=>{const next={...previous};delete next[task.id];return next;});}
    catch(reason){setError(reason.message||t('error'));}
    finally{setBusy(false);}
   }
   if(!visible)return null;
   const options=snapshot.tasks.map(task=>({id:task.id,label:task.title,description:task.description||(task.pending?'':t(task.status==='done'?'done':task.status==='cancelled'?'cancelled':'running')),task,disabled:!task.pending}));
   const choices=[{id:'default',label:t('defaultName'),description:t('defaultDescription'),route:null},...snapshot.models.map(model=>({id:routeKey(model),label:model.label||model.model,description:(model.providerLabel||model.provider)+' / '+model.model,route:{provider:model.provider,model:model.model}}))];
   const filtered=choices.filter(model=>(model.label+' '+model.description).toLowerCase().includes(query.trim().toLowerCase()));
   const activePosition=snapshot.tasks.findIndex(task=>task.id===active.id)+1;
   const themeOptions=['system','light','dark'].map(id=>({id,label:t(id)}));
   return h('div',{className:'ssu-root ssu-overlay',onPointerMove:activity,onPointerDown:activity,onKeyDownCapture:activity,onInputCapture:activity,onWheelCapture:activity,onClickCapture:event=>{if(suppressClick.current&&event.detail!==0){suppressClick.current=false;event.preventDefault();event.stopPropagation();}},onPointerDownCapture:event=>{if(!event.target.closest('.ssu-picker'))setMenu(null);}},
    h('style',null,CSS_TEXT),
    h('section',{className:'ssu-dialog',ref:dialog,role:'dialog','aria-modal':true,'aria-labelledby':'ssu-title','aria-describedby':'ssu-idle-note'},
     h('header',{className:'ssu-header'},h('h2',{id:'ssu-title'},t('title')),h('div',{className:'ssu-header-tools'},h(Dropdown,{id:'ssu-theme',label:t(themeSnapshot.preference),value:themeSnapshot.preference,options:themeOptions,open:menu,setOpen:setMenu,themeMenu:true,onChange:id=>{theme.setTheme(id);}}),h('button',{type:'button',ref:closeButton,className:'ssu-close','aria-label':t('close'),title:t('close'),onClick:()=>store.dismiss()},'×'))),
     h('div',{className:'ssu-body'},
      h('div',{className:'ssu-task-row'},h('span',{className:'ssu-counter'},activePosition+' / '+snapshot.tasks.length),h(Dropdown,{id:'ssu-task',label:h(React.Fragment,null,active.title,h(Badge,{task:active})),value:active.id,options,open:menu,setOpen:setMenu,onChange:id=>{const task=snapshot.tasks.find(item=>item.id===id);if(task?.pending)setActiveId(id);}})),
      h('p',{className:'ssu-description'},active.description),
      h('input',{className:'ssu-search',type:'search',placeholder:t('search'),'aria-label':t('search'),value:query,onChange:event=>setQuery(event.target.value)}),
      h('div',{className:'ssu-models',role:'radiogroup','aria-label':t('title')},filtered.length?filtered.map(model=>h('label',{className:'ssu-model',key:model.id,'data-selected':route!==undefined&&routeKey(route)===model.id},h('input',{type:'radio',name:'ssu-model',value:model.id,checked:route!==undefined&&routeKey(route)===model.id,onChange:()=>setSelected(previous=>({...previous,[active.id]:model.route}))}),h('span',{className:'ssu-model-info'},h('span',{className:'ssu-model-name'},model.label),h('span',{className:'ssu-model-route'},model.description)))):h('div',{className:'ssu-empty'},t('empty'))),
      h('label',{className:'ssu-reuse'},h('input',{type:'checkbox',checked:reuse,onChange:event=>setReuse(event.target.checked)}),h('span',null,t('reuse'))),
      error||snapshot.error?h('p',{className:'ssu-error',role:'alert'},error||snapshot.error):null,
      h('p',{className:'ssu-sr',role:'status','aria-live':'polite'},active.title+' — '+t('waiting'))),
     h('footer',{className:'ssu-footer'},h('div',{className:'ssu-timer',role:'timer','aria-live':'off'},seconds+' '+t('after'),h('small',{id:'ssu-idle-note'},t('idle'))),h('div',{className:'ssu-actions'},h('button',{type:'button',className:'ssu-btn',disabled:busy||seconds===0,onClick:()=>choose(null)},t('useDefault')),h('button',{type:'button',className:'ssu-btn ssu-btn-primary',disabled:busy||route===undefined||seconds===0,onClick:()=>choose(route)},reuse&&route?t('confirmReuse'):t('confirm'))))));
  }
  function TaskHistory() {
   const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot);
   const t=useLocale();
   const panel=useRef(null);
   const closeButton=useRef(null);
   const anchor=snapshot.historyAnchor;
   const modelDialogVisible=snapshot.tasks.some(task=>task.pending)&&!snapshot.hidden;
   const visible=!!anchor&&!modelDialogVisible;
   useEffect(()=>{
    if(!visible)return;
    const previous=document.activeElement;
    closeButton.current?.focus({preventScroll:true});
    function close(){store.closeHistory();}
    function key(event){if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}}
    function focus(event){if(panel.current&&!panel.current.contains(event.target))close();}
    function scroll(event){if(panel.current&&!panel.current.contains(event.target))close();}
    document.addEventListener('keydown',key);
    document.addEventListener('focusin',focus);
    document.addEventListener('scroll',scroll,true);
    window.addEventListener('resize',close);
    return()=>{
     document.removeEventListener('keydown',key);
     document.removeEventListener('focusin',focus);
     document.removeEventListener('scroll',scroll,true);
     window.removeEventListener('resize',close);
     if(previous?.isConnected && (!document.activeElement || document.activeElement===document.body || panel.current?.contains(document.activeElement)))previous.focus({preventScroll:true});
    };
   },[visible]);
   if(!visible)return null;
   const width=Math.min(440,window.innerWidth-24);
   const left=Math.max(12,Math.min(anchor.right-width,window.innerWidth-width-12));
   const roomAbove=Math.max(0,anchor.top-20);
   const roomBelow=Math.max(0,window.innerHeight-anchor.bottom-20);
   const above=roomAbove>=Math.min(300,roomBelow);
   const position={left,width,maxHeight:Math.max(100,Math.min(400,above?roomAbove:roomBelow)),...(above?{bottom:window.innerHeight-anchor.top+8}:{top:anchor.bottom+8})};
   return h('div',{className:'ssu-root ssu-history-layer',onPointerDown:event=>{if(event.target===event.currentTarget)store.closeHistory();}},
    h('style',null,CSS_TEXT),
    h('section',{className:'ssu-history-panel',ref:panel,style:position,role:'dialog','aria-modal':false,'aria-labelledby':'ssu-history-title',id:'ssu-task-history'},
     h('header',{className:'ssu-history-header'},h('h3',{id:'ssu-history-title'},t('taskbar')+' · '+snapshot.tasks.length),h('button',{type:'button',className:'ssu-close',ref:closeButton,'aria-label':t('historyClose'),onClick:()=>store.closeHistory()},'×')),
     h('div',{className:'ssu-history-list'},snapshot.tasks.length?snapshot.tasks.map((task,index)=>h('div',{key:task.id,className:'ssu-history-row',style:{'--ssu-order':Math.min(index,8)}},
      h('div',{className:'ssu-history-task'},h('span',{className:'ssu-history-name'},task.title),h(Badge,{task})),
      task.pending?h('button',{type:'button',className:'ssu-link',onClick:()=>store.show(task.id)},t('choose')):h('span',{className:'ssu-history-status'},t(task.status==='done'?'done':task.status==='cancelled'?'cancelled':'running')))):h('div',{className:'ssu-empty'},t('historyEmpty'))),
     snapshot.error?h('p',{className:'ssu-error',role:'status'},t('connection')+' · '+snapshot.error):null));
  }
  function TaskBar(props) {
   const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot);
   const t=useLocale();
   useEffect(()=>store.connect(props.sessionId),[props.sessionId]);
   const tasks=snapshot.rootSessionId===props.sessionId?snapshot.tasks:[];
   if(!tasks.length&&!snapshot.error)return null;
   return h('div',{className:'ssu-root ssu-dock'},h('style',null,CSS_TEXT),
    h('button',{type:'button',className:'ssu-taskbar-trigger','aria-haspopup':'dialog','aria-expanded':!!snapshot.historyAnchor,'aria-controls':'ssu-task-history',title:t('historyHint'),onClick:event=>store.toggleHistory(event.currentTarget.getBoundingClientRect())},
     h('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.5,'aria-hidden':true},h('path',{d:'M5 6h14M5 12h14M5 18h9'})),
     h('span',null,t('taskbar')),h('span',{className:'ssu-taskbar-count'},tasks.length),h('span',{className:'ssu-chevron','aria-hidden':true})),
    snapshot.error?h('span',{className:'ssu-sr',role:'status'},t('connection')+' · '+snapshot.error):null);
  }
  slots.inject('shell.overlay',()=>slots.register({name:'shell.overlay',id:'selective-subagent-model-dialog',order:30},ModelDialog));
  slots.inject('shell.overlay',()=>slots.register({name:'shell.overlay',id:'selective-subagent-task-history',order:29},TaskHistory));
  slots.inject('conversation.composer.dock',()=>slots.register({name:'conversation.composer.dock',id:'selective-subagent-model-tasks',order:2},TaskBar));
 }
};

 }
});
