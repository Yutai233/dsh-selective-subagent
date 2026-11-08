const React = require('react');
const h = React.createElement;
const {useState,useEffect,useRef,useSyncExternalStore} = React;
const NS = 'selective-subagent-ui';
const labels = {
 zh: {title:'子代理模型选择',taskbar:'子代理模型',search:'搜索模型或提供商',defaultName:'使用 DSH 默认策略',defaultDescription:'不覆盖 DSH 原有的子代理模型路由',reuse:'同一父会话后续子代理复用此选择',confirm:'确认',confirmReuse:'确认并复用',useDefault:'使用默认',after:'秒后按 DSH 默认策略继续',idle:'有操作时重新计时',close:'暂时收起（倒计时继续）',empty:'没有匹配的可用模型',waiting:'等待选择',running:'运行中',done:'已完成',cancelled:'已取消',choose:'选择',system:'跟随系统',light:'浅色',dark:'深色',theme:'切换 DSH 主题',noOverride:'不覆盖路由',defaultBadge:'DSH 默认策略',task:'任务',error:'模型选择失败',connection:'暂时无法连接模型选择服务',modelsError:'模型目录暂不可用，可使用 DSH 默认策略',readOnly:'当前连接不能代替用户选择模型'},
 en: {title:'Subagent model selection',taskbar:'Subagent models',search:'Search models or providers',defaultName:'Use the DSH default policy',defaultDescription:'Keep the existing DSH subagent model route',reuse:'Reuse this choice for later subagents of the same parent',confirm:'Confirm',confirmReuse:'Confirm and reuse',useDefault:'Use default',after:'s until the DSH default policy',idle:'Activity restarts the countdown',close:'Dismiss temporarily (countdown continues)',empty:'No matching available models',waiting:'Awaiting selection',running:'Running',done:'Completed',cancelled:'Cancelled',choose:'Choose',system:'System',light:'Light',dark:'Dark',theme:'Change the DSH theme',noOverride:'Keep route',defaultBadge:'DSH default policy',task:'Task',error:'Model selection failed',connection:'Cannot connect to the model selection service',modelsError:'Model directory is unavailable; the DSH default policy is still available',readOnly:'This connection cannot answer model questions for the user'}
};
const routeKey = route => route ? JSON.stringify([route.provider,route.model]) : 'default';
const modelLabel = task => task.effectiveModelLabel || (task.route && task.route.model) || null;
function makeStore(connection) {
 const listeners = new Set();
 let current = {rootSessionId:null,revision:0,serverNow:Date.now(),receivedAt:Date.now(),timeoutMs:60000,models:[],tasks:[],error:null,hidden:false,requestedTaskId:null};
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
  publish({...current,...snapshot,rootSessionId:root,receivedAt:Date.now(),error:null,hidden:reset||fresh?false:current.hidden,requestedTaskId:reset?null:current.requestedTaskId});
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
   publish({rootSessionId:root,revision:0,serverNow:0,receivedAt:Date.now(),timeoutMs:60000,models:[],tasks:[],error:null,hidden:false,requestedTaskId:null});
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
  show(id){publish({...current,hidden:false,requestedTaskId:id||null});},
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
  function TaskBar(props) {
   const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot);
   const t=useLocale();
   useEffect(()=>store.connect(props.sessionId),[props.sessionId]);
   const tasks=snapshot.rootSessionId===props.sessionId?snapshot.tasks:[];
   if(!tasks.length&&!snapshot.error)return null;
   return h('div',{className:'ssu-root ssu-taskbar'},h('style',null,CSS_TEXT),h('details',{open:true},h('summary',null,t('taskbar')+' · '+tasks.length),tasks.map(task=>h('div',{key:task.id,className:'ssu-taskbar-row'},h('span',{className:'ssu-taskbar-title'},task.title,h(Badge,{task})),task.pending?h('button',{type:'button',className:'ssu-link',onClick:()=>store.show(task.id)},t('choose')):h('span',{className:'ssu-small'},t(task.status==='done'?'done':task.status==='cancelled'?'cancelled':'running'))))),snapshot.error?h('p',{className:'ssu-error',role:'status'},t('connection')+' · '+snapshot.error):null);
  }
  slots.inject('shell.overlay',()=>slots.register({name:'shell.overlay',id:'selective-subagent-model-dialog',order:30},ModelDialog));
  slots.inject('conversation.composer.dock',()=>slots.register({name:'conversation.composer.dock',id:'selective-subagent-model-tasks',order:2},TaskBar));
 }
};
