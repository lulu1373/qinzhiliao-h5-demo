(function(){
'use strict';

const ASSETS={logo:'./assets/logo.png',mascot:'./assets/mascot.png',mascotLogin:'./assets/v3/mascot-login.webp',mascotHome:'./assets/v3/mascot-home.webp',mascotAvatar:'./assets/v3/mascot-avatar.webp',loginTitle:'./assets/v3/login-title.png',sceneLogin:'./assets/v3/scene-login.svg',sceneHome:'./assets/v3/scene-home.svg',avatarMom:'./assets/v3/avatar-mom.svg',avatarNeutral:'./assets/v3/avatar-neutral.svg',paperNoise:'./assets/v3/paper-noise.svg',brandLeaf:'./assets/v3/brand-leaf.svg'};
const STORAGE_KEY='qzl-h5-app-demo-v3-state';
const DEBUG_KEY='qzl-h5-debug';

// V4.5 mobile runtime: real phones should not render the fake prototype status bar.
const RUNTIME_MOBILE=Boolean((navigator.userAgentData&&navigator.userAgentData.mobile)||/Android|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
const RUNTIME_STANDALONE=Boolean(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true);
document.documentElement.classList.toggle('mobile-runtime',RUNTIME_MOBILE);
document.documentElement.classList.toggle('standalone-runtime',RUNTIME_STANDALONE);

// Installable single-file friendly manifest. In the standalone build ASSETS.logo is embedded as a data URI.
try{
  const manifest={name:'亲智聊',short_name:'亲智聊',start_url:location.pathname+location.search+'#/home',display:'standalone',background_color:'#F8F4EC',theme_color:'#F8F4EC',icons:[{src:ASSETS.logo,sizes:'256x256',type:'image/png',purpose:'any maskable'}]};
  const manifestUrl=URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'}));
  const manifestLink=document.createElement('link');manifestLink.rel='manifest';manifestLink.href=manifestUrl;document.head.appendChild(manifestLink);
  const touchIcon=document.createElement('link');touchIcon.rel='apple-touch-icon';touchIcon.href=ASSETS.logo;document.head.appendChild(touchIcon);
}catch(_e){}

const svg={
  menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  gift:'<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M12 9H7.8a2.8 2.8 0 1 1 2.6-3.8L12 9Zm0 0h4.2a2.8 2.8 0 1 0-2.6-3.8L12 9Z"/></svg>',
  volume:'<svg viewBox="0 0 24 24"><path d="M5 10v4h3l4 4V6L8 10H5Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  mute:'<svg viewBox="0 0 24 24"><path d="M5 10v4h3l4 4V6L8 10H5Z"/><path d="m16 10 5 5m0-5-5 5"/></svg>',
  more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  mic:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  send:'<svg viewBox="0 0 24 24"><path d="m4 12 16-8-5 16-3-6-8-2Z"/><path d="m12 14 8-10"/></svg>',
  camera:'<svg viewBox="0 0 24 24"><path d="M4 8h4l1.5-2h5L16 8h4v11H4Z"/><circle cx="12" cy="13" r="3"/></svg>',
  headphones:'<svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v6H5a1 1 0 0 1-1-1v-5Zm16 0h-3v6h2a1 1 0 0 0 1-1v-5Z"/></svg>',
  search:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
  bell:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  close:'<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  image:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>',
  share:'<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>',
  sparkle:'<svg viewBox="0 0 24 24"><path d="m12 3 1.35 4.15L17.5 8.5l-4.15 1.35L12 14l-1.35-4.15L6.5 8.5l4.15-1.35L12 3Z"/><path d="m18.5 14 .72 2.28 2.28.72-2.28.72-.72 2.28-.72-2.28-2.28-.72 2.28-.72.72-2.28Z"/></svg>',
  sprout:'<svg viewBox="0 0 24 24"><path d="M12 21v-9"/><path d="M12 14C7.8 14 5 11.7 5 8c4.2 0 7 2.3 7 6Z"/><path d="M12 11c0-4.1 2.7-7 7-7 0 4.1-2.7 7-7 7Z"/></svg>',
  facePositive:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M8.5 14c1.9 2.1 5.1 2.1 7 0"/></svg>',
  faceNeutral:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M9 15h6"/></svg>',
  faceNegative:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M8.5 16c1.9-2.1 5.1-2.1 7 0"/></svg>',
  pending:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16h.01"/></svg>',
  conflict:'<svg viewBox="0 0 24 24"><path d="M4 5h11a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9l-4 3v-3H4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"/><path d="m8 8 2 2-2 2 4-2"/><path d="M17 15h2a3 3 0 0 1 3 3v1l-3-2"/></svg>',
  repeat:'<svg viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8.2A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 3.8"/></svg>',
  emotion:'<svg viewBox="0 0 24 24"><path d="M7 18c-2.5 0-4-1.7-4-4 0-2 1.1-3.4 2.8-3.9C6.1 6.6 8.4 4 12 4c3.4 0 5.8 2.1 6.4 5 1.6.4 2.6 1.8 2.6 3.5 0 2.1-1.5 3.5-3.8 3.5H7Z"/><path d="M8 20c1-1 2-1 3 0s2 1 3 0 2-1 3 0"/></svg>',
  family:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M13 20a4.5 4.5 0 0 1 9 0"/></svg>',
  assessment:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 9h8M8 13h5M8 17h7"/></svg>',
  guide:'<svg viewBox="0 0 24 24"><path d="M3 5.5A3.5 3.5 0 0 1 6.5 2H11v18H6.5A3.5 3.5 0 0 0 3 23V5.5Z"/><path d="M21 5.5A3.5 3.5 0 0 0 17.5 2H13v18h4.5A3.5 3.5 0 0 1 21 23V5.5Z"/></svg>',
  homework:'<svg viewBox="0 0 24 24"><path d="M4 4h10a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3V4Z"/><path d="M8 8h5M8 12h4M16.5 4.5l3 3M14 11l1-4 4-4 2 2-4 4-3 2Z"/></svg>',
  phoneRule:'<svg viewBox="0 0 24 24"><rect x="5" y="2" width="10" height="20" rx="2"/><path d="M9 18h2"/><circle cx="17.5" cy="13.5" r="4.5"/><path d="M17.5 11v2.8l1.8 1"/></svg>',
  communication:'<svg viewBox="0 0 24 24"><path d="M4 4h10a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H8l-4 3v-3a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"/><path d="M15 16h3l3 2v-5a2 2 0 0 0-2-2"/></svg>',
  growth:'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V6M16 20v-9M22 20V3"/><path d="m4 8 6-4 6 5 6-7"/></svg>',
  relation:'<svg viewBox="0 0 24 24"><circle cx="7" cy="8" r="3"/><circle cx="17" cy="16" r="3"/><path d="M9.5 9.5 14.5 14.5M14 6h4v4M10 18H6v-4"/></svg>',
  brain:'<svg viewBox="0 0 24 24"><path d="M9 4a3 3 0 0 0-5 2.2A3.5 3.5 0 0 0 3 13a3.5 3.5 0 0 0 4 5.5A3 3 0 0 0 12 20V5a3 3 0 0 0-3-1Z"/><path d="M15 4a3 3 0 0 1 5 2.2A3.5 3.5 0 0 1 21 13a3.5 3.5 0 0 1-4 5.5A3 3 0 0 1 12 20V5a3 3 0 0 1 3-1ZM7 9h2M15 9h2M7 15h2M15 15h2"/></svg>',
  target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m15 9 6-6M17 3h4v4"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.2 8 11 4.6-1.8 8-6 8-11V5l-8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
  file:'<svg viewBox="0 0 24 24"><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></svg>',
  settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3V10h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  help:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.2 2.4c-.9.35-.9 1.1-.9 1.8M12 17h.01"/></svg>',
  info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>',
  notification:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>',
  child:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0M8 5c1-2 3-3 5-2"/></svg>',
  profile:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M17 4.5 20 2l2 2-2.5 3L17 7Z"/></svg>',
  attachment:'<svg viewBox="0 0 24 24"><path d="m20.5 11.5-8.1 8.1a5 5 0 0 1-7.1-7.1l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 1 1-2.8-2.8l8.2-8.2"/></svg>'
};

function iconSurface(icon,tone='sage',extra=''){
  return `<span class="icon-surface tone-${tone} ${extra}">${icon}</span>`;
}
function guideIcon(category){
  return ({'作业学习':svg.homework,'手机规则':svg.phoneRule,'顶嘴冲突':svg.conflict,'情绪发火':svg.emotion,'沟通疏离':svg.communication,'自驱力':svg.sprout})[category]||svg.guide;
}
function guideTone(category){
  return ({'作业学习':'sage','手机规则':'blue','顶嘴冲突':'peach','情绪发火':'lilac','沟通疏离':'sand','自驱力':'green'})[category]||'sage';
}
function profileGlyph(kind='parent'){
  return `<span class="profile-glyph ${kind}">${kind==='child'?svg.child:svg.user}</span>`;
}

function userAvatarMarkup(cls=''){
  const src=state.user.avatarImage||ASSETS.avatarNeutral;
  return `<img class="${esc(cls)}" src="${esc(src)}" alt="${esc(state.user.name||'用户头像')}">`;
}
const FAMILY_ROLE_OPTIONS=[
  {value:'母亲',label:'妈妈'},
  {value:'父亲',label:'爸爸'},
  {value:'祖父',label:'爷爷'},
  {value:'祖母',label:'奶奶'},
  {value:'外祖父',label:'外公'},
  {value:'外祖母',label:'外婆'},
  {value:'其他监护人',label:'其他监护人'}
];
function isFamilyRole(role){return FAMILY_ROLE_OPTIONS.some(item=>item.value===role);}
function roleLabel(role){
  const matched=FAMILY_ROLE_OPTIONS.find(item=>item.value===role);
  if(matched)return matched.label;
  if(role==='祖母/外祖母'||role==='祖父/外祖父'||role==='祖辈（女性）'||role==='祖辈（男性）')return '请重新选择';
  return role||'请选择';
}
function familyRoleSelectOptions(selectedRole){
  const valid=isFamilyRole(selectedRole);
  return `${valid?'':'<option value="" disabled selected>请选择家庭身份</option>'}${FAMILY_ROLE_OPTIONS.map(item=>`<option value="${esc(item.value)}" ${selectedRole===item.value?'selected':''}>${esc(item.label)}</option>`).join('')}`;
}
function growthStatusMeta(action){
  if(!action||action.status==='pending'||action.result==='•')return {key:'pending',icon:svg.pending,label:'待尝试'};
  if(action.result==='🙂')return {key:'better',icon:svg.facePositive,label:'顺一点'};
  if(action.result==='😐')return {key:'same',icon:svg.faceNeutral,label:'没变化'};
  if(action.result==='🙁')return {key:'worse',icon:svg.faceNegative,label:'更糟了'};
  return {key:'done',icon:svg.check,label:action.resultText||'已完成'};
}
function formatActionDate(date){
  const parts=String(date||'').split('-');
  return parts.length===3?`${Number(parts[1])}月${Number(parts[2])}日`:date;
}

const CHAT_HISTORY_TITLES=['写作业又吵起来了','孩子一直玩手机','试过少催一次，想聊聊结果','早上起床总是拖拖拉拉','孩子越来越不愿意和我说话','手机规则总是谈不拢','我刚刚又发火了'];
const CHAT_HISTORY_SUMMARIES=[
  '最后聊到：先减少一次连续催促',
  '你们正在讨论手机规则',
  '这次感觉没有明显变化',
  '早晨节奏可以先从一个小步骤开始',
  '最近在尝试降低追问压力',
  '上次聊到：把争夺控制权变成约定',
  '最后聊到：先修复关系，再谈规则'
];
function getGrowthStats(){
  const feedbackCount=state.actions.filter(a=>a.status==='done'&&a.result&&a.result!=='•').length;
  const recordDays=new Set(state.actions.map(a=>a.date).filter(Boolean)).size;
  const conversationCount=CHAT_HISTORY_TITLES.length+(state.chat.active?1:0);
  return {conversationCount,actionCount:state.actions.length,feedbackCount,recordDays};
}

const DEFAULT_ACTIONS=[
  {id:'a17',date:'2026-08-17',title:'睡前先听孩子说完，再回应',source:'孩子最近不愿意和我说话',result:'🙂',resultText:'比之前顺一点',status:'done'},
  {id:'a23',date:'2026-08-23',title:'手机问题先不急着讲道理',source:'孩子一直玩手机',result:'😐',resultText:'好像没什么变化',status:'done'},
  {id:'a26',date:'2026-08-26',title:'写作业时先减少一次催促',source:'写作业又吵起来了',result:'•',resultText:'待尝试',status:'pending'}
];

// V3.4: notifications are reminders pointing to the existing resource,
// not additional tasks. Badge counts are derived from these read states.
const NOTIFICATIONS=[
  {id:'action-reminder',kind:'action',resourceId:'a26',icon:'sprout',title:'有一个小行动等你回来看看',body:'你准备尝试“写作业时少提醒一次”。后来怎么样了？',time:'今天 09:20'},
  {id:'weekly-ready',kind:'weekly',icon:'growth',title:'本周成长总结已经生成',body:'本周的行动与反馈已经整理好，可以回顾这段时间的变化。',time:'昨天 20:10'},
  {id:'assessment-resume',kind:'assessment',resourceId:'self-drive',icon:'assessment',title:'测评可以继续完成',body:'上次进行的自驱力观察还未完成，可以继续作答。',time:'8 月 30 日'}
];

const DEFAULT_STATE={
  consent:false,
  loggedIn:false,
  sound:true,
  quickConsent:false,
  codeExpireAt:0,
  user:{name:'阳光妈妈',role:'母亲',phone:'13800000000',avatar:'',avatarImage:''},
  family:{children:[{id:'child1',name:'小明',age:10,gender:'男孩',grade:'小学四年级'}],others:[]},
  membership:{active:false,plan:null,expireAt:null,orders:[]},
  chat:{active:false,scenario:null,node:'idle',messages:[],typing:false,reviewResult:null,freeTurns:0},
  actions:DEFAULT_ACTIONS,
  growth:{selectedDate:'2026-08-26',month:'2026-08',actionFilter:'all'},
  archive:{tab:'parent',memories:[
    {id:'m1',title:'高频场景',content:'写作业是最近最容易发生冲突的场景。',enabled:true},
    {id:'m2',title:'有效方法',content:'先连接再谈事情、把命令改成提问，对你们更有帮助。',enabled:true},
    {id:'m3',title:'关系触发点',content:'被连续催促时，孩子更容易用拒绝和顶嘴表达不满。',enabled:true}
  ]},
  assessments:{tab:'recommended',currentId:null,questionIndex:0,answers:{},reportReady:false,progressById:{}},
  guides:{query:'',favorites:[]},
  feedback:{type:'',text:'',contact:'',image:true},
  tasks:{tab:'pending'},
  messages:{readIds:['assessment-resume']},
  debug:false
};

function cloneDefault(){return JSON.parse(JSON.stringify(DEFAULT_STATE));}
function safeGet(key){try{return localStorage.getItem(key);}catch(_){return null;}}
function safeSet(key,value){try{localStorage.setItem(key,value);}catch(_){}}
function safeRemove(key){try{localStorage.removeItem(key);}catch(_){}}
function loadState(){
  try{
    const raw=safeGet(STORAGE_KEY);
    if(!raw)return cloneDefault();
    const saved=JSON.parse(raw);
    const base=cloneDefault();
    const merged=deepMerge(base,saved);
    if(['祖母/外祖母','祖父/外祖父','祖辈（女性）','祖辈（男性）'].includes(merged.user?.role)) merged.user.role='';
    return merged;
  }catch(_){return cloneDefault();}
}
function deepMerge(target,source){
  if(!source||typeof source!=='object')return target;
  Object.keys(source).forEach(k=>{
    if(source[k]&&typeof source[k]==='object'&&!Array.isArray(source[k])&&target[k]&&typeof target[k]==='object'&&!Array.isArray(target[k])) target[k]=deepMerge(target[k],source[k]);
    else target[k]=source[k];
  });
  return target;
}
function saveState(){safeSet(STORAGE_KEY,JSON.stringify(state));}
function esc(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));}
function uid(prefix='id'){return prefix+'_'+Math.random().toString(36).slice(2,9);}
function formatPhone(v){const s=String(v||'');return s.length===11?s.slice(0,3)+'****'+s.slice(-4):s;}
function todayTime(){return new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});}
function routeBase(route){return route.split('?')[0];}
function routeParts(route){return routeBase(route).split('/').filter(Boolean);}
function getQuery(route){const q=route.split('?')[1]||'';return Object.fromEntries(new URLSearchParams(q));}
function routeDepth(route){
  const base=routeBase(route);
  if(base==='home'||base==='login'||base==='login/success')return 0;
  return Math.max(1,routeParts(base).length-1);
}

let state=loadState();
let currentRoute='';
let chatFollowLatest=true;
let chatComposing=false;
let pendingConversationStart=false;
let previousDepth=0;
let routeStack=[];
let internalHashChange=false;
let countdownTimer=null;
let articleScrollHandler=null;
let pendingLoginTarget=null;
let toastTimer=null;
let aiTimer=null;
let drawer={progress:0,open:false,dragging:false,tracking:false,startX:0,startY:0,startProgress:0,pendingProgress:0,startOpen:false,lastX:0,lastT:0,velocity:0,direction:null,raf:0};
let drawerCloseTimer=null;
// V3.9: persistent Home + persistent Drawer + secondary PageStack.
// Home and Drawer stay mounted while secondary pages cover them, so the chat
// viewport, draft and drawer scroll never need to be reconstructed on Back.
const drawerView={scrollTop:0,selectedHistory:null};
let drawerHadMotion=false;
let drawerSuppressClickUntil=0;
let drawerPointerId=null;
let secondaryUnderlay='home'; // 'home' | 'drawer'
let navigationMode='normal'; // normal | back | explicit-home
let stackExitTimer=null;
let drawerOpenScrollSnapshot=null;

function rememberDrawerScroll(){
  const scroller=document.getElementById('drawerScroll');
  if(scroller)drawerView.scrollTop=scroller.scrollTop;
}
function blurChatInputPreserveScroll(forcedTop=null){
  const area=document.getElementById('aiScroll');const input=document.getElementById('chatInput');
  if(!area||!input)return;
  const top=forcedTop===null?area.scrollTop:forcedTop;
  if(document.activeElement===input)input.blur();
  const started=performance.now();
  const hold=()=>{
    if(!area.isConnected)return;
    setScrollTopImmediate(area,top);
    if(performance.now()-started<420)requestAnimationFrame(hold);
  };
  requestAnimationFrame(hold);
}
function captureHomeView(){
  // Persistent Home no longer needs to be restored; this remains a no-op
  // compatibility hook for older call sites.
}
function setScrollTopImmediate(area,top){
  if(!area)return;
  const previous=area.style.scrollBehavior;
  area.style.scrollBehavior='auto';
  area.scrollTop=Math.max(0,Number(top)||0);
  requestAnimationFrame(()=>{area.style.scrollBehavior=previous;});
}
function navigateFromDrawer(route){
  rememberDrawerScroll();
  secondaryUnderlay='drawer';
  navigate(route,{preserveDrawer:true});
}
const root=document.getElementById('app');
root.innerHTML=`
<div class="app-frame" id="appFrame">
  <aside class="drawer" id="drawer" data-state="closed" aria-hidden="true" inert></aside>
  <div class="drawer-scrim" id="drawerScrim"></div>
  <div class="main-viewport" id="mainViewport">
    <div class="statusbar"><span>9:41</span><span class="status-icons">▮▮▮　Wi-Fi　▰</span></div>
    <main class="screen-host" id="screenHost"></main>
  </div>
  <div class="page-stack" id="pageStack" aria-live="polite"></div>
  <div class="edge-handle" id="edgeHandle"></div>
  <div id="overlayRoot"></div>
  <div class="toast" id="toast"></div>
  <button class="debug-fab" id="debugFab">DEV</button>
</div>`;

const frame=document.getElementById('appFrame');
const screenHost=document.getElementById('screenHost');
const mainViewport=document.getElementById('mainViewport');
const pageStack=document.getElementById('pageStack');
const drawerEl=document.getElementById('drawer');
const drawerScrim=document.getElementById('drawerScrim');
const overlayRoot=document.getElementById('overlayRoot');
const toastEl=document.getElementById('toast');
const edgeHandle=document.getElementById('edgeHandle');

function toast(message){
  clearTimeout(toastTimer);
  toastEl.textContent=message;
  toastEl.classList.add('show');
  toastTimer=setTimeout(()=>toastEl.classList.remove('show'),1300);
}
function showNetwork(message='当前网络不可用，请稍后重试'){
  let bar=document.querySelector('.network-bar');
  if(bar)bar.remove();
  bar=document.createElement('div');bar.className='network-bar';bar.textContent=message;frame.appendChild(bar);
  setTimeout(()=>bar.remove(),2200);
}
function clearTimers(){if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null;}if(aiTimer){clearTimeout(aiTimer);aiTimer=null;}}

const PUBLIC_ROUTES=['login','login/phone','login/code','login/quick','login/wechat','login/success','agreement/service','agreement/privacy','feedback'];
function normalizeRoute(){
  let route=location.hash.replace(/^#\/?/,'');
  if(!route)route=state.loggedIn?'home':'login';
  if(!state.loggedIn&&!PUBLIC_ROUTES.some(r=>routeBase(route)===r))route='login';
  if(state.loggedIn&&routeBase(route).startsWith('login')&&routeBase(route)!=='login/success')route='home';
  return route;
}
function isSecondaryRoute(route){
  const base=routeBase(route);
  return !!state.loggedIn && base!=='home' && !base.startsWith('login');
}
function navigate(route,{replace=false,clearStack=false,preserveDrawer=false}={}){
  closeOverlay();
  if(clearStack){routeStack=[];drawerView.scrollTop=0;drawerView.selectedHistory=null;secondaryUnderlay='home';}
  if(routeBase(currentRoute)==='home'&&isSecondaryRoute(route)){
    secondaryUnderlay=(preserveDrawer&&drawer.open)?'drawer':'home';
    if(!preserveDrawer&&drawer.open)closeDrawer(true);
  }else if(routeBase(route)==='home'&&isSecondaryRoute(currentRoute)){
    if(navigationMode!=='back'){
      navigationMode='explicit-home';
      if(drawer.open)closeDrawer(true);
      secondaryUnderlay='home';
    }
  }
  const hash='#/'+route;
  if(!replace&&currentRoute&&currentRoute!==route){
    routeStack.push(currentRoute);
    if(routeStack.length>60)routeStack=routeStack.slice(-60);
  }
  if(replace){
    if(currentRoute!==route&&routeStack.length&&routeStack[routeStack.length-1]===route)routeStack.pop();
    history.replaceState({qzl:true,route},'',hash);
    renderRoute(route);
  }else if(location.hash!==hash){
    internalHashChange=true;
    location.hash=hash;
  }else renderRoute(route);
}
function goBack(fallback='home',forceFallback=false){
  if(overlayRoot.innerHTML){closeOverlay();return;}
  // When no secondary page covers the drawer, Back closes the drawer itself.
  if(drawer.open&&!pageStack.innerHTML){closeDrawer();return;}
  let target=fallback||'home';
  if(forceFallback){
    const idx=routeStack.lastIndexOf(target);
    routeStack=idx>=0?routeStack.slice(0,idx):[];
  }else if(routeStack.length) target=routeStack.pop();
  navigationMode='back';
  navigate(target,{replace:true,preserveDrawer:secondaryUnderlay==='drawer'});
}
window.addEventListener('hashchange',()=>{
  const next=normalizeRoute();
  if(internalHashChange){
    internalHashChange=false;
  }else if(currentRoute&&next!==currentRoute){
    if(routeStack.length&&routeStack[routeStack.length-1]===next){routeStack.pop();navigationMode='back';}
    else{
      routeStack.push(currentRoute);
      if(routeStack.length>60)routeStack=routeStack.slice(-60);
      navigationMode='normal';
    }
  }
  renderRoute(next);
});

function bindRenderedRoute(route,host){
  bindScreen(route);
  // Keep the page stack keyboard-safe: opening a secondary page should not
  // resurrect the chat keyboard when it is later removed.
  if(host===pageStack){
    const active=document.activeElement;
    if(active&&active.id==='chatInput')active.blur();
  }
}
function renderRoute(route){
  clearTimers();
  const base=routeBase(route);
  const sameRoute=route===currentRoute;
  const depth=routeDepth(route);
  const direction=depth<previousDepth?'back':'forward';
  previousDepth=depth;
  const wasSecondary=isSecondaryRoute(currentRoute);
  const secondary=isSecondaryRoute(route);

  // Logged-in secondary pages live above a persistent Home/Drawer underlay.
  if(secondary){
    const homeMounted=screenHost.querySelector('section.screen[data-route="home"]');
    if(!homeMounted){
      screenHost.innerHTML=`<section class="screen" data-route="home">${renderHome()}</section>`;
      bindScreen('home');
      renderDrawer();
    }
    currentRoute=route;
    const html=renderScreen(route);
    const cls=sameRoute?'stack-screen':'stack-screen stack-enter';
    pageStack.innerHTML=`<section class="${cls}" data-route="${esc(route)}"><div class="stack-statusbar"><span>9:41</span><span class="status-icons">▮▮▮　Wi-Fi　▰</span></div><div class="stack-content">${html}</div></section>`;
    bindRenderedRoute(route,pageStack);
    if(!drawerEl.innerHTML)renderDrawer();
    syncDrawerAvailability();
    saveState();
    navigationMode='normal';
    return;
  }

  // Back to Home: reveal the exact Home/Drawer nodes that were already there.
  if(base==='home'&&pageStack.innerHTML&&navigationMode==='back'){
    currentRoute='home';
    // Update account/task badges under the covering page while preserving the
    // drawer's scroll position and open state.
    const savedDrawerTop=drawerView.scrollTop;
    renderDrawer();
    const scroller=document.getElementById('drawerScroll');if(scroller)scroller.scrollTop=savedDrawerTop;
    const top=pageStack.firstElementChild;
    if(top){top.classList.add('stack-leave');clearTimeout(stackExitTimer);stackExitTimer=setTimeout(()=>{pageStack.innerHTML='';syncDrawerAvailability();},230);}
    else pageStack.innerHTML='';
    syncDrawerAvailability();
    saveState();
    navigationMode='normal';
    return;
  }

  // Explicit actions that return to Home (report -> chat, archive -> chat, etc.)
  // refresh the conversation once, then clear the secondary layer.
  if(base==='home'&&pageStack.innerHTML){
    pageStack.innerHTML='';
    currentRoute='home';
    screenHost.innerHTML=`<section class="screen" data-route="home">${renderHome()}</section>`;
    renderDrawer();bindScreen('home');syncDrawerAvailability();saveState();navigationMode='normal';
    return;
  }

  // Public/login pages or first Home mount use the primary host.
  currentRoute=route;
  pageStack.innerHTML='';
  const html=renderScreen(route);
  const animationClass=sameRoute?'':`page-enter-${direction}`;
  screenHost.innerHTML=`<section class="screen ${animationClass}" data-route="${esc(route)}">${html}</section>`;
  const renderedScreen=screenHost.firstElementChild;
  if(renderedScreen&&animationClass){
    const clearPageMotion=()=>{renderedScreen.classList.remove('page-enter-forward','page-enter-back');renderedScreen.style.transform='none';renderedScreen.style.left='0';renderedScreen.style.right='0';renderedScreen.style.width='100%';};
    renderedScreen.addEventListener('animationend',clearPageMotion,{once:true});setTimeout(clearPageMotion,360);
  }
  renderDrawer();bindScreen(route);syncDrawerAvailability();saveState();navigationMode='normal';
}

function titleBar(title,{right='',back='home',forceBack=false}={}){
  return `<div class="page-titlebar"><button class="back-btn" data-action="back" data-fallback="${esc(back)}" data-force-back="${forceBack?'1':'0'}" aria-label="返回">${svg.back}</button><b>${esc(title)}</b>${right?`<button class="right-action" data-action="${esc(right.action)}">${esc(right.label)}</button>`:''}</div>`;
}
function listRow(icon,title,sub,action,extra=''){
  return `<button class="list-row" data-action="${esc(action)}" ${extra}><span class="list-row-icon">${icon}</span><span class="list-row-main"><b>${esc(title)}</b>${sub?`<span>${esc(sub)}</span>`:''}</span><span class="chevron">›</span></button>`;
}

function renderScreen(route){
  const base=routeBase(route);
  if(base==='login')return renderLogin();
  if(base==='login/phone')return renderPhoneLogin();
  if(base==='login/code')return renderCodeLogin();
  if(base==='login/quick')return renderQuickLogin();
  if(base==='login/wechat')return renderWechatLogin();
  if(base==='login/success')return renderLoginSuccess();
  if(base==='agreement/service')return renderAgreement('service');
  if(base==='agreement/privacy')return renderAgreement('privacy');
  if(base==='feedback')return renderFeedback();
  if(base==='home')return renderHome();
  if(base==='growth')return renderGrowth();
  if(base==='growth/weekly')return renderWeeklySummary();
  if(base==='growth/actions')return renderActionHistory();
  if(base.startsWith('growth/action/'))return renderActionDetail(routeParts(route)[2]);
  if(base==='archive')return renderArchive();
  if(base==='archive/memories')return renderMemories();
  if(base==='archive/members')return renderMembers();
  if(base.startsWith('archive/basic/'))return renderArchiveBasic(routeParts(route)[2]);
  if(base==='assessments')return renderAssessments();
  if(base.startsWith('assessments/detail/'))return renderAssessmentDetail(routeParts(route)[2]);
  if(base.startsWith('assessments/questions/'))return renderAssessmentQuestions(routeParts(route)[2]);
  if(base.startsWith('assessments/generating/'))return renderAssessmentGenerating(routeParts(route)[2]);
  if(base.startsWith('assessments/report/'))return renderAssessmentReport(routeParts(route)[2]);
  if(base==='guides')return renderGuides();
  if(base.startsWith('guides/category/'))return renderGuideCategory(decodeURIComponent(routeParts(route)[2]||''));
  if(base.startsWith('guides/detail/'))return renderGuideDetail(routeParts(route)[2]);
  if(base==='membership')return renderMembership();
  if(base==='membership/plans')return renderMembershipPlans();
  if(base==='membership/orders')return renderOrders();
  if(base==='task-center')return renderTaskCenter();
  if(base==='messages')return renderMessages();
  if(base==='profile')return renderProfile();
  if(base==='settings')return renderSettings();
  if(base==='settings/account')return renderAccountSettings();
  if(base==='settings/notifications')return renderNotificationSettings();
  if(base==='settings/privacy')return renderPrivacyCenter();
  if(base==='settings/help')return renderHelpCenter();
  if(base==='settings/about')return renderAbout();
  if(base==='demo-tools')return renderDemoTools();
  return renderNotFound();
}

function renderLogin(){
  return `<div class="auth-screen v3-login-screen">
    <div class="v3-login-brand">
      <div class="v3-brand-lockup"><img src="${ASSETS.brandLeaf}" alt=""><span><b>亲智聊</b><small>懂孩子，也懂你</small></span></div>
      <button class="support-btn" data-action="feedback" aria-label="意见反馈">${svg.headphones}</button>
    </div>
    <div class="v3-login-story">
      <img class="v3-login-title-art" src="${ASSETS.loginTitle}" alt="每一段关系都值得被看见">
      <p>和小亲聊聊，<br>一起找到更轻松的相处方式</p>
      <div class="v3-login-scene">
        <img class="v3-login-scene-bg" src="${ASSETS.sceneLogin}" alt="">
        <img class="v3-login-mascot" src="${ASSETS.mascotLogin}" alt="小亲">
        <button class="v3-value-pill p1" type="button">陪你找到下一步</button>
        <button class="v3-value-pill p2" type="button">先理解，再行动</button>
        <button class="v3-value-pill p3" type="button">一起看见小变化</button>
      </div>
    </div>
    <div class="auth-actions v3-login-actions">
      <button class="primary-btn full-btn" data-action="begin-login" data-target="login/phone">手机号登录</button>
      <button class="secondary-btn full-btn" data-action="begin-login" data-target="login/wechat">微信登录</button>
      <label class="agreement-row"><input class="check-box" type="checkbox" id="loginConsent" ${state.consent?'checked':''}><span>阅读并同意 <a href="#/agreement/service">《服务协议》</a> <a href="#/agreement/privacy">《隐私政策》</a></span></label>
      <button class="ghost-btn full-btn" data-action="begin-login" data-target="login/quick">本机号码一键登录</button>
    </div>
  </div>`;
}

function renderPhoneLogin(){
  return `<div class="auth-sheet-screen">
    <div class="auth-visual"><div class="brand-mini"><img src="${ASSETS.logo}" alt=""><span>亲智聊</span></div><img src="${ASSETS.mascot}" alt=""></div>
    <div class="auth-panel">
      <button class="close-x" data-action="back" data-fallback="login">×</button>
      <h1>手机号登录</h1><p>输入手机号继续</p>
      <div class="field"><span class="prefix">+86</span><input id="phoneInput" inputmode="numeric" maxlength="11" value="${esc(state.user.phone||'')}" placeholder="请输入手机号"></div>
      <button class="primary-btn full-btn" data-action="send-code">下一步</button>
      <div class="subtle" style="text-align:center;margin-top:15px">未注册手机号验证后将自动创建账号</div>
    </div>
  </div>`;
}

function renderCodeLogin(){
  const phone=formatPhone(state.user.phone);
  return `<div class="auth-center">
    <div style="height:48px"><button class="back-btn" data-action="back" data-fallback="login/phone">${svg.back}</button></div>
    <div class="auth-center-main">
      <img class="round-logo" src="${ASSETS.logo}" alt="">
      <h1>请输入验证码</h1><p>验证码已发送至 ${esc(phone)}</p>
      <div class="code-row" id="codeRow">${Array.from({length:6},(_,i)=>`<input class="code-box" data-code-index="${i}" inputmode="numeric" maxlength="1">`).join('')}</div>
      <button class="resend-btn" id="resendBtn" data-action="resend-code" disabled>58s 后重新获取</button>
      <div class="subtle" style="margin-top:8px">Demo 中输入任意 6 位数字即可登录</div>
    </div>
  </div>`;
}

function renderQuickLogin(){
  return `<div class="auth-center">
    <div style="height:48px"><button class="back-btn" data-action="back" data-fallback="login">${svg.back}</button></div>
    <div class="auth-center-main">
      <img class="round-logo" src="${ASSETS.logo}" alt="">
      <h1>本机号码一键登录</h1><p>由运营商提供号码认证</p>
      <div class="mask-phone">138 ···· 0000</div>
      <button class="primary-btn full-btn" data-action="quick-login">本机号码一键登录</button>
      <button class="ghost-btn full-btn" data-action="route" data-route="login/phone">其他手机号登录</button>
    </div>
    <label class="agreement-row"><input class="check-box" id="quickConsent" type="checkbox" ${state.quickConsent?'checked':''}><span>登录即代表同意《服务协议》《隐私政策》</span></label>
  </div>`;
}

function renderWechatLogin(){
  return `<div class="auth-center">
    <div style="height:48px"><button class="back-btn" data-action="back" data-fallback="login">${svg.back}</button></div>
    <div class="auth-center-main">
      <div class="provider-mark">微</div>
      <h1>使用微信账号登录亲智聊</h1><p>仅用于完成账号登录和基础资料授权</p>
      <div class="permission-card"><b>授权信息</b><div class="subtle" style="margin-top:7px">头像、昵称、账号标识</div></div>
      <button class="primary-btn full-btn" data-action="finish-login">同意并登录</button>
      <button class="ghost-btn full-btn" data-action="back" data-fallback="login">取消</button>
    </div>
  </div>`;
}

function renderLoginSuccess(){
  return `<div class="success-screen"><div><div class="success-icon">✓</div><h1>登录成功</h1><div class="subtle">正在进入亲智聊</div><div class="spinner"></div></div></div>`;
}

function renderAgreement(type){
  const privacy=type==='privacy';
  return `<div class="doc-page">${titleBar(privacy?'隐私政策':'服务协议',{back:state.loggedIn?'settings/about':'login'})}<div class="doc-body">
    <h1>亲智聊${privacy?'隐私政策':'服务协议'}</h1>
    <p>这是用于 H5 Demo 的说明文本。正式产品上线前应替换为经过法务审核的正式协议。</p>
    <h3>1. 服务说明</h3><p>亲智聊提供家庭关系理解、行动建议、成长记录、测评和家庭档案等辅助功能。</p>
    <h3>2. 账号与安全</h3><p>请妥善保护账号信息。涉及家庭成员的信息，应由用户自主决定是否提供和保留。</p>
    <h3>3. 数据与隐私</h3><p>你可以查看、修改或删除 AI 记忆及成长记录，并控制这些信息是否用于后续对话。</p>
    <h3>4. 专业边界</h3><p>亲智聊不替代医疗、心理治疗或紧急服务。如存在安全风险，应优先联系当地专业机构。</p>
  </div></div>`;
}

const ASSESSMENTS=[
  {id:'task-start',title:'孩子任务启动观察',minutes:5,tag:'作业与自驱力',desc:'观察孩子面对任务时怎样开始，以及什么支持方式更适合。',status:'recommended'},
  {id:'communication',title:'亲子沟通状态',minutes:8,tag:'沟通与连接',desc:'看看最近的沟通是卡在时机、方式，还是双方的压力。',status:'recommended'},
  {id:'self-drive',title:'自驱力观察',minutes:10,tag:'自驱力',desc:'了解孩子当前更依赖外部催促，还是逐渐形成自己的节奏。',status:'progress',progress:42},
  {id:'emotion-cycle',title:'冲突循环观察',minutes:7,tag:'情绪与冲突',desc:'识别家庭中容易反复发生的互动循环。',status:'completed',date:'2026-08-18'}
];
const QUESTIONS=[
  {title:'当孩子面对一项不喜欢的任务时，通常更接近哪种情况？',options:['很快开始','提醒一次后开始','需要反复提醒','经常回避或发脾气','我不确定']},
  {title:'第一次提醒时，孩子通常在做什么？',options:['正在专注做自己的事','刚刚结束休息','看起来不知道从哪里开始','已经拖了一段时间','情况不固定']},
  {title:'你提醒孩子时，最担心的是什么？',options:['时间越来越晚','孩子养成拖拉习惯','自己的话没有作用','任务最后还是由我承担','我也不太确定']},
  {title:'连续提醒之后，孩子最常见的反应是？',options:['开始行动','沉默或不回应','顶嘴或拒绝','情绪变差','转移到别的事情']},
  {title:'哪些做法曾经让事情稍微顺一点？',options:['先说明第一步','让孩子自己选择顺序','先休息再开始','减少连续催促','暂时没有发现']}
];
const GUIDES=[
  {id:'g1',category:'作业学习',title:'孩子一被催就抗拒，可能发生了什么？',minutes:5,desc:'从任务压力、自主感和催促循环理解孩子的反应。'},
  {id:'g2',category:'情绪发火',title:'已经吵起来了，怎样先把关系修回来？',minutes:4,desc:'冲突之后不急着讲道理，先修复安全感和连接。'},
  {id:'g3',category:'手机规则',title:'手机规则总是谈不拢，先别急着收走',minutes:6,desc:'把控制权争夺变成可以执行的家庭约定。'},
  {id:'g4',category:'沟通疏离',title:'孩子越来越少说话，什么时候靠近更合适？',minutes:5,desc:'识别低压力靠近的时机，减少追问造成的压力。'},
  {id:'g5',category:'自驱力',title:'从“我催你做”到“你自己开始”',minutes:7,desc:'一步步减少外部驱动，给孩子练习自主启动的空间。'},
  {id:'g6',category:'顶嘴冲突',title:'孩子说话很冲，是没礼貌还是在保护自己？',minutes:6,desc:'区分边界问题与被评价后的防御反应。'}
];

function renderFeedback(){
  const types=['功能异常：功能故障或不可用','产品建议：用得不顺，我有建议','安全问题：密码、隐私、欺诈等','内容问题：解读或建议不合适','其他问题'];
  return `<div class="secondary-page feedback-page">
    ${titleBar('意见反馈',{back:state.loggedIn?'home':'login'})}
    <div class="subtle" style="padding:18px 16px 10px;background:#f7f7f7">（必选）请选择你想反馈的问题点</div>
    <div class="feedback-list">${types.map(t=>`<button class="feedback-item ${state.feedback.type===t?'selected':''}" data-action="feedback-type" data-value="${esc(t)}"><span class="radio"></span><span>${esc(t)}</span></button>`).join('')}</div>
    <div class="feedback-block"><div class="feedback-label">请补充详细问题和意见</div><div class="feedback-textarea"><textarea id="feedbackText" maxlength="240" placeholder="请输入不少于 10 个字的描述">${esc(state.feedback.text)}</textarea></div><div class="counter"><span id="feedbackCount">${state.feedback.text.length}</span>/240</div></div>
    <div class="feedback-block"><div class="feedback-label">请提供相关问题的截图或照片　<span style="font-weight:500;color:#aaa">${state.feedback.image?'1':'0'}/4</span></div><div class="upload-row">${state.feedback.image?`<div class="upload-tile"><img src="${ASSETS.logo}" alt="示例截图"><button data-action="feedback-remove-image">×</button></div>`:''}<button class="upload-tile upload-add" data-action="open-file"><span>＋</span>相机/相册</button></div></div>
    <div class="feedback-block"><div class="feedback-label">电话与邮箱</div><div class="feedback-contact"><input id="feedbackContact" placeholder="选填，便于我们与你联系" value="${esc(state.feedback.contact)}"></div></div>
    <div class="feedback-submit"><button class="primary-btn full-btn" data-action="feedback-submit" ${state.feedback.type&&state.feedback.text.trim().length>=10?'':'disabled'}>提交</button></div>
  </div>`;
}

function topBar(){
  return `<div class="topbar v3-home-topbar v36-stable-topbar">
    <button class="menu-btn" data-action="drawer-open" aria-label="打开我的侧栏">${svg.menu}</button>
    <div class="v3-top-brand"><img src="${ASSETS.brandLeaf}" alt=""><span><b>亲智聊</b><small>${state.chat.active?'小亲正在陪你聊':'懂孩子，也懂你'}</small></span></div>
    <button class="round-btn" data-action="sound-toggle" aria-label="声音">${state.sound?svg.volume:svg.mute}</button>
    <button class="round-btn" data-action="more-sheet" aria-label="更多">${svg.more}</button>
  </div>`;
}

function renderHome(){
  const chat=state.chat;
  return `<div class="ai-shell v36-continuous-shell ${chat.active?'v36-conversation-active':''}">
    ${topBar()}
    <div class="ai-content" id="aiScroll">
      ${renderHomeIdle()}
      <section class="v36-conversation ${chat.active?'active':''}" id="conversationSection" aria-live="polite">${chat.active?renderChat():''}</section>
    </div>
    ${renderComposer()}
    <button class="back-to-latest" id="backLatest" data-action="scroll-latest" hidden>有新回复 ↓</button>
  </div>`;
}

function renderHomeIdle(){
  const pending=state.actions.find(a=>a.status==='pending');
  return `<div class="v3-home-idle">
    <section class="v3-home-stage">
      <img class="v3-home-stage-bg" src="${ASSETS.sceneHome}" alt="">
      <div class="v3-home-copy"><h1>Hi, 我是小亲</h1><p>今天有什么想和我聊聊的吗？</p></div>
      <img class="v3-home-mascot" src="${ASSETS.mascotHome}" alt="小亲">
      <div class="v3-home-prompts">
        <button class="v3-home-chip c1" data-action="start-scenario" data-scenario="homework"><span>${svg.conflict}</span>刚刚发生什么了</button>
        <button class="v3-home-chip c2" data-action="start-scenario" data-scenario="emotion"><span>${svg.emotion}</span>我有点情绪卡住了</button>
        <button class="v3-home-chip c3" data-action="start-scenario" data-scenario="repeat"><span>${svg.repeat}</span>这个问题总是重复</button>
        <button class="v3-home-chip c4" data-action="route" data-route="growth"><span>${svg.growth}</span>看看最近的变化</button>
      </div>
    </section>

    <div class="section v3-home-content">
      <div class="section-title"><span>我的成长总结</span><button data-action="route" data-route="growth">查看全部 ＞</button></div>
      <button class="card growth-summary v3-growth-summary" data-action="route" data-route="growth">
        <span class="v3-growth-deco">${svg.sprout}</span>
        <div class="growth-row"><div class="growth-icon">${svg.growth}</div><div class="growth-main"><span class="card-kicker">本周成长</span><b>${pending?'有 1 个小行动等你回来看看':'本周和小亲聊了 3 件事'}</b><span>${pending?'上次你准备尝试“少提醒一次”':'你已经开始慢慢从着急处理走向先理解'}</span></div><span class="chevron">${svg.back}</span></div>
        <div class="growth-stats"><div class="growth-stat"><small>尝试行动</small><strong>${state.actions.length+1}<em>次</em></strong></div><div class="growth-stat"><small>连续记录</small><strong>5<em>天</em></strong></div></div>
      </button>
    </div>

    <div class="section v3-question-section">
      <div class="section-title"><span>最近你可能想聊</span></div>
      <div class="v3-question-list">
        <button data-action="start-scenario" data-scenario="homework"><span class="v3-question-icon">${svg.conflict}</span><span><b>刚刚和孩子发生冲突了</b><small>我不知道接下来怎么办</small></span><i>${svg.back}</i></button>
        <button data-action="start-scenario" data-scenario="repeat"><span class="v3-question-icon blue">${svg.repeat}</span><span><b>这个问题总是反复发生</b><small>说了很多次还是没变化</small></span><i>${svg.back}</i></button>
        <button data-action="start-scenario" data-scenario="emotion"><span class="v3-question-icon peach">${svg.emotion}</span><span><b>我现在有点情绪卡住了</b><small>想先和你说一说</small></span><i>${svg.back}</i></button>
      </div>
      <div class="home-or">或者，直接告诉小亲</div>
    </div>
  </div>`;
}

function renderComposer(){
  return `<div class="composer"><div class="composer-row">
    <button class="composer-btn" data-action="voice-start" aria-label="语音输入">${svg.mic}</button>
    <div class="composer-input"><textarea id="chatInput" rows="1" placeholder="${state.chat.active?'继续和小亲说…':'和小亲说说…'}"></textarea></div>
    <button class="composer-btn" data-action="attachment-sheet" aria-label="添加附件">${svg.plus}</button>
    <button class="composer-btn" id="chatSendBtn" data-action="chat-send" aria-label="发送">${svg.send}</button>
  </div></div>`;
}

function renderConversationItem(m,index,total){
  if(m.kind==='stage-summary'){
    const label=m.stage==='restore'?'还原事件已确认':'关系理解已补充';
    return `<div class="v36-history-artifact stage-summary"><span>${svg.check}</span><div><b>${label}</b><p>${m.html}</p></div></div>`;
  }
  if(m.kind==='interpret-confirmed'){
    return `<div class="interpretation-card final-card v36-persisted-card confirmed">${interpretationHeader('confirm',true)}<div class="final-understanding"><div class="final-title"><span>${svg.sparkle}</span><b>我们一起形成的理解</b></div><div class="insight-section event-tone"><small>表面上看到的</small><p>这是一次“写作业拖延”，孩子看起来不愿意配合。</p></div><div class="insight-section child-tone"><small>孩子那边可能发生的</small><p>面对觉得困难、又不断被催促的任务时，他选择了回避和抵抗。</p></div><div class="insight-section parent-tone"><small>你这边可能发生的</small><p>你不断提醒，是因为担心他完不成，也担心自己没有尽到责任。</p></div><div class="relationship-loop"><span>你越着急</span><i>→</i><span>他越抗拒</span><i>→</i><span>你越失控</span></div><div class="insight-conclusion">这次更值得先改变的，可能不是“怎么让他立刻听话”，而是让双方先退出催促与回避的循环。</div></div><div class="v36-confirmed-state">${svg.check}<span>你确认：这个理解比较贴近</span></div></div>`;
  }
  if(m.kind==='action-saved'){
    return `<div class="action-card v36-persisted-card saved">${renderSavedActionBody(!!m.alt)}<div class="v36-confirmed-state">${svg.check}<span>已加入成长总结</span></div></div>`;
  }
  return `<div class="message-line ${m.role}">${m.role==='ai'?`<span class="ai-avatar"><img src="${ASSETS.mascotAvatar}" alt="小亲"></span>`:''}<div class="message-stack"><div class="chat-message ${m.role}">${m.html}${m.time?`<small>${m.time}</small>`:''}</div>${m.role==='ai'&&index===total-1?`<div class="message-tools"><button aria-label="复制" data-action="message-copy">${svg.file}</button><button aria-label="有帮助" data-action="message-helpful">${svg.heart}</button><button aria-label="重新生成" data-action="message-regenerate">${svg.repeat}</button></div>`:''}</div></div>`;
}
function renderChat(){
  const c=state.chat;
  const rows=c.messages.map((m,index)=>renderConversationItem(m,index,c.messages.length)).join('');
  const typing=c.typing?`<div class="message-line ai v36-typing-row"><span class="ai-avatar"><img src="${ASSETS.mascotAvatar}" alt="小亲"></span><div class="chat-message ai"><span class="typing"><i></i><i></i><i></i></span><span class="v36-typing-label">小亲正在想</span></div></div>`:'';
  return `<div class="chat-area v36-chat-area"><div class="v36-conversation-divider"><span>今天</span></div>
    <div id="chatMessages">${rows}${typing}${renderChatNode(c.node)}</div>
    <div class="boundary-note">小亲会基于你当前提供的信息形成理解，你可以随时补充或纠正。</div>
  </div>`;
}

function interpretationHeader(stage,confirmed=false){
  const progress=confirmed?1:({restore:.33,relation:.66,confirm:.88}[stage]||.33);
  return `<div class="interpret-head"><span class="interpret-mark">${svg.relation}</span><span><b>一起看懂这件事</b><small>${confirmed?'正面解读 · 已确认':'正面解读 · 进行中'}</small></span></div><div class="progress-rail"><i style="transform:scaleX(${progress})"></i></div><div class="progress-labels"><span class="${stage==='restore'?'current':''}">还原事件</span><span class="${stage==='relation'?'current':''}">理解关系</span><span class="${stage==='confirm'||confirmed?'current':''}">确认理解</span></div>`;
}

function renderChatNode(node){
  if(node==='context1')return `<div class="chip-row">${['在玩自己的东西','刚准备休息','已经磨蹭一会儿了','我也说不清'].map(v=>`<button class="choice-chip" data-action="chat-choice" data-value="${v}">${v}</button>`).join('')}</div>`;
  if(node==='context2')return `<div class="chip-row">${['怕时间越来越晚','怕他养成拖拉习惯','觉得自己的话没作用','其他，我自己说'].map(v=>`<button class="choice-chip" data-action="chat-choice" data-value="${v}">${v}</button>`).join('')}</div>`;
  if(node==='invite')return `<div class="invite-card insight-invite"><span class="card-symbol">${svg.relation}</span><h3>我大概听懂刚才发生的事情了。</h3><p>如果你愿意，我想和你一起从孩子、你自己以及你们的互动关系三个角度，重新看看这件事。</p><div class="inline-actions"><button class="inline-main" data-action="interpret-start">一起看看</button><button class="inline-alt" data-action="interpret-later">我还想先说一会儿</button></div></div>`;
  if(node==='restore')return `<div class="interpretation-card">${interpretationHeader('restore')}<div class="understanding-box"><b>我先确认一下：</b><br><br>当时你提醒孩子开始写作业，孩子没有回应；你连续提醒后，他开始顶嘴，你也因此发了火。<br><br>我理解得贴近吗？</div><div class="inline-actions"><button class="inline-main" data-action="restore-ok">比较贴近</button><button class="inline-alt" data-action="restore-wrong">有些地方不对</button><button class="inline-alt" data-action="restore-add">我想补充一点</button></div></div>`;
  if(node==='relation')return `<div class="interpretation-card">${interpretationHeader('relation')}<div class="understanding-box">小亲目前的理解：<br><br>你希望孩子尽快开始写作业，但催促之后，孩子反而更加抗拒。这让你觉得自己的话完全没有作用。<br><br><b>我还想确认一个地方：</b><br>当时孩子不愿意开始，更接近下面哪种情况？</div><div class="chip-row">${['觉得作业太难','还想继续休息','一被催就很抗拒','我也不太确定','其他，我想自己说'].map(v=>`<button class="choice-chip" data-action="relation-choice" data-value="${v}">${v}</button>`).join('')}</div></div>`;
  if(node==='confirm')return `<div class="interpretation-card final-card">${interpretationHeader('confirm')}<div class="final-understanding"><div class="final-title"><span>${svg.sparkle}</span><b>我们一起形成的理解</b></div><div class="insight-section event-tone"><small>表面上看到的</small><p>这是一次“写作业拖延”，孩子看起来不愿意配合。</p></div><div class="insight-section child-tone"><small>孩子那边可能发生的</small><p>面对觉得困难、又不断被催促的任务时，他选择了回避和抵抗。</p></div><div class="insight-section parent-tone"><small>你这边可能发生的</small><p>你不断提醒，是因为担心他完不成，也担心自己没有尽到责任。</p></div><div class="relationship-loop"><span>你越着急</span><i>→</i><span>他越抗拒</span><i>→</i><span>你越失控</span></div><div class="insight-conclusion">这次更值得先改变的，可能不是“怎么让他立刻听话”，而是让双方先退出催促与回避的循环。</div></div><div class="inline-actions final-actions"><button class="inline-main" data-action="confirm-ok">这个理解比较贴近</button><button class="inline-alt" data-action="confirm-fix">有些地方不太贴近</button></div></div>`;
  if(node==='revise')return `<div class="chip-row">${['对孩子的理解','对我的理解','对我们互动过程的理解','其他，我自己说'].map(v=>`<button class="choice-chip" data-action="revise-choice" data-value="${v}">${v}</button>`).join('')}</div>`;
  if(node==='action-invite')return `<div class="invite-card action-invite"><span class="card-symbol">${svg.sprout}</span><h3>基于我们刚才形成的理解，</h3><p>要不要一起找一个今天就能尝试的小行动？</p><div class="inline-actions"><button class="inline-main" data-action="action-show">看看小行动</button><button class="inline-alt" data-action="action-stop">先停在这里</button></div></div>`;
  if(node==='action-card')return renderActionCard(false);
  if(node==='action-alt')return renderActionCard(true);
  if(node==='action-hard')return `<div class="invite-card"><h3>没关系。</h3><p>做不到本身也是重要信息。今天可以先不行动，只把我们刚刚看懂的部分留下来。</p><div class="inline-actions"><button class="inline-main" data-action="action-save-understanding">先记住这次理解</button><button class="inline-alt" data-action="action-talk-hard">我还想聊聊为什么做不到</button></div></div>`;
  return '';
}

function renderSavedActionBody(alternative){
  const title=alternative?'今晚只练习“少提醒一次”':'今晚孩子迟迟不开始写作业时，先不要连续催促，给他 5 分钟缓冲。';
  return `<div class="action-head"><span class="action-mark">${svg.sprout}</span><span><small>今天只做一件事</small><h3>今天可以试试</h3></span></div><p class="action-summary">${title}</p><div class="phrase-box"><span class="quote-label">你可以这样说</span><blockquote>“是还没准备好开始，还是有哪一部分觉得很难？”</blockquote><div class="phrase-fallback"><b>如果孩子暂时不回应</b><br>“等你想说的时候，我在。”</div></div><div class="action-reason"><span>${svg.relation}</span><p><b>为什么是这个行动</b><br>先减少压力，才更容易知道孩子真正卡在哪里。</p></div>`;
}
function renderActionCard(alternative){
  return `<div class="action-card">${renderSavedActionBody(alternative)}<div class="inline-actions action-buttons"><button class="inline-main" data-action="action-try" data-alt="${alternative?'1':'0'}">我试试</button><button class="inline-alt" data-action="action-change">换一个</button><button class="inline-alt" data-action="action-cant">我现在可能做不到</button></div></div>`;
}

function renderGrowth(){
  const selected=state.actions.find(a=>a.date===state.growth.selectedDate)||state.actions.find(a=>a.status==='pending')||state.actions[0];
  const stats=getGrowthStats();
  const recent=state.actions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).filter(a=>!selected||a.id!==selected.id).slice(0,3);
  return `<div class="secondary-page growth-page">
    ${titleBar('成长总结',{back:'home',right:{label:'周总结',action:'growth-weekly'}})}
    <div class="page-body">
      <div class="hero-card growth-hero-card"><span class="hero-eyebrow">成长摘要</span><h1>这段时间的你</h1><div class="metric-grid"><div class="metric"><small>聊过</small><strong>${stats.conversationCount} 件事</strong></div><div class="metric"><small>尝试行动</small><strong>${stats.actionCount} 次</strong></div><div class="metric"><small>已反馈</small><strong>${stats.feedbackCount} 次</strong></div><div class="metric"><small>记录天数</small><strong>${stats.recordDays} 天</strong></div></div><p>小亲想说：你已经开始慢慢从“着急处理”走向“先理解，再行动”。</p></div>
      <div class="panel"><div class="calendar-top"><b>${esc(state.growth.month.replace('-',' 年 '))} 月</b><div class="month-switch"><button data-action="month-prev">‹</button><button data-action="month-next">›</button></div></div>${renderCalendar()}<div class="legend">${[['pending','待尝试'],['better','顺一点'],['same','没变化'],['worse','更糟了']].map(([key,label])=>{const fake={status:key==='pending'?'pending':'done',result:key==='better'?'🙂':key==='same'?'😐':key==='worse'?'🙁':'•'};const meta=growthStatusMeta(fake);return `<span class="legend-item status-${meta.key}"><i class="growth-status-icon">${meta.icon}</i>${label}</span>`;}).join('')}</div></div>
      <div class="panel"><div class="section-title" style="margin-top:0"><span>${selected&&selected.date===state.growth.selectedDate?'当天行动':'最近一次行动'}</span></div>${selected?`<div class="latest-action"><div class="latest-action-title"><span>${svg.sprout}</span><b>${esc(selected.title)}</b></div><p>来源事件：${esc(selected.source)}</p><div class="inline-actions">${selected.status==='pending'?`<button class="inline-main" data-action="action-feedback" data-id="${selected.id}">试过了</button><button class="inline-alt" data-action="not-tried">还没试</button>`:`<button class="inline-main" data-action="route" data-route="growth/action/${selected.id}">查看详情</button><button class="inline-alt" data-action="review-action" data-id="${selected.id}">去聊聊</button>`}</div></div>`:`<div class="empty-card"><img src="${ASSETS.mascot}" alt=""><h3>这一天还没有行动</h3><p>行动会从和小亲的真实对话中产生。</p></div>`}</div>
      <div class="panel growth-record-panel"><div class="section-title" style="margin-top:0"><span>最近行动</span></div><div class="growth-record-list">${recent.map(a=>renderGrowthRecordRow(a)).join('')||'<div class="empty-card"><h3>还没有其他行动</h3><p>完成更多小行动后会显示在这里。</p></div>'}</div>${state.actions.length?`<button class="growth-record-more" data-action="route" data-route="growth/actions">查看全部行动记录</button>`:''}</div>
    </div>
  </div>`;
}
function renderGrowthRecordRow(a){
  const meta=growthStatusMeta(a);
  return `<button class="action-record status-${meta.key}" data-action="route" data-route="growth/action/${a.id}"><span class="growth-record-state">${meta.icon}</span><span class="action-record-main"><b>${esc(a.title)}</b><span>${esc(formatActionDate(a.date))} · 来源：${esc(a.source)}</span></span><span class="growth-record-result status-${meta.key}">${esc(meta.label)}</span></button>`;
}
function renderActionHistory(){
  const filter=state.growth.actionFilter||'all';
  const actions=state.actions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).filter(a=>filter==='all'||(filter==='pending'?a.status==='pending':a.status==='done'));
  return `<div class="secondary-page growth-page action-history-page">${titleBar('行动记录',{back:'growth'})}<div class="page-body"><div class="segmented"><button class="segment-btn ${filter==='all'?'active':''}" data-action="growth-filter" data-value="all">全部</button><button class="segment-btn ${filter==='pending'?'active':''}" data-action="growth-filter" data-value="pending">待尝试</button><button class="segment-btn ${filter==='done'?'active':''}" data-action="growth-filter" data-value="done">已反馈</button></div><div class="panel growth-record-panel"><div class="growth-record-list">${actions.map(renderGrowthRecordRow).join('')||'<div class="empty-card"><h3>这里还没有记录</h3><p>新的行动会自动出现在这里。</p></div>'}</div></div></div></div>`;
}
function renderCalendar(){
  const year=Number(state.growth.month.split('-')[0]);
  const month=Number(state.growth.month.split('-')[1]);
  const days=new Date(year,month,0).getDate();
  const first=(new Date(year,month-1,1).getDay()+6)%7;
  const cells=[];
  for(let i=0;i<first;i++)cells.push('<span></span>');
  for(let d=1;d<=days;d++){
    const date=`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const a=state.actions.find(x=>x.date===date);const meta=a?growthStatusMeta(a):null;
    cells.push(`<button class="day ${a?'marked status-'+meta.key:''} ${state.growth.selectedDate===date?'selected':''}" data-action="select-date" data-date="${date}">${d}${a?`<span class="day-status">${meta.icon}</span>`:''}</button>`);
  }
  return `<div class="calendar-grid">${['一','二','三','四','五','六','日'].map(w=>`<span class="week">${w}</span>`).join('')}${cells.join('')}</div>`;
}

function renderWeeklySummary(){
  return `<div class="secondary-page growth-page growth-weekly-page">${titleBar('本周总结',{back:'growth'})}<div class="page-body"><div class="hero-card"><h1>8 月 24 日—8 月 30 日</h1><p>这一周，你们围绕写作业和手机规则聊了 3 次，也尝试了 2 个小行动。</p></div><div class="panel"><div class="panel-title">小亲看见的变化</div><div class="weekly-summary"><h3>你开始少一点马上纠正，多一点先听发生了什么。</h3><p>在两次作业沟通中，你都尝试把“快点开始”换成了一个问题。孩子并不是每次都会马上回应，但冲突升级的速度变慢了。</p></div></div><div class="panel"><div class="panel-title">下周最值得继续的方向</div><div class="ability-row"><b>继续练习：只提醒一次</b><p>提醒之后留出 5 分钟，不立即追加第二遍。</p></div><div class="ability-row"><b>观察而不是评判</b><p>记录孩子更容易开始任务的具体条件。</p></div><button class="primary-btn full-btn" data-action="weekly-to-chat" style="margin-top:14px">和小亲聊聊本周变化</button></div></div></div>`;
}

function renderActionDetail(id){
  const a=state.actions.find(x=>x.id===id)||state.actions[0];
  return `<div class="secondary-page growth-page action-detail-page">${titleBar('行动详情',{back:'growth'})}<div class="page-body"><div class="hero-card"><h1>${esc(a.title)}</h1><p>来源事件：${esc(a.source)}</p></div><div class="panel"><div class="panel-title">这次行动</div><div class="ability-row"><b>为什么这样做</b><p>先降低互动压力，才更容易看见孩子真正卡在哪里。</p></div><div class="ability-row"><b>可以怎么说</b><p>“你是还没准备好，还是不知道先从哪里开始？”</p></div><div class="ability-row"><b>反馈结果</b><p>${esc(a.resultText||'还没有反馈')}</p></div></div><div class="panel">${a.status==='pending'?`<button class="primary-btn full-btn" data-action="action-feedback" data-id="${a.id}">试过了，记录反馈</button><button class="secondary-btn full-btn" data-action="not-tried" style="margin-top:10px">还没试</button>`:`<button class="primary-btn full-btn" data-action="review-action" data-id="${a.id}">和小亲具体聊聊</button>`}</div></div></div>`;
}

function renderArchive(){
  const tab=state.archive.tab;
  return `<div class="secondary-page archive-page">${titleBar('家庭档案',{back:'home',right:{label:'成员',action:'archive-members'}})}<div class="page-body"><div class="segmented"><button class="segment-btn ${tab==='parent'?'active':''}" data-action="archive-tab" data-value="parent">家长</button><button class="segment-btn ${tab==='child'?'active':''}" data-action="archive-tab" data-value="child">孩子</button><button class="segment-btn ${tab==='memory'?'active':''}" data-action="archive-tab" data-value="memory">小亲记忆</button></div>${tab==='parent'?renderParentArchive():tab==='child'?renderChildArchive():renderMemorySummary()}</div></div>`;
}

function renderParentArchive(){
  return `<div><div class="panel"><div class="member-card"><div class="member-avatar">${profileGlyph('parent')}</div><div class="member-main"><b>${esc(state.user.name)}</b><span>与孩子的关系：${esc(roleLabel(state.user.role))}</span></div><button class="edit-pill" data-action="edit-parent">编辑</button></div><div class="subtle" style="margin-top:10px">档案根据你提供及确认的信息整理。</div></div><div class="panel"><div class="archive-title">能力档案</div><div class="ability-row"><b>情绪觉察</b><p>开始能更早发现自己从担心进入着急的时刻。</p></div><div class="ability-row"><b>倾听与回应</b><p>愿意先听孩子把话说完，再讨论怎么处理问题。</p></div><div class="ability-row"><b>关系修复</b><p>冲突后愿意回来看发生了什么，而不是只停留在自责。</p></div></div><div class="panel"><div class="archive-title">教养方式与观念</div><div class="ability-row"><b>教养类型</b><p>目前更关注规则能否被执行，也在练习给孩子更多自主空间。</p></div><div class="ability-row"><b>成长观</b><p>希望孩子逐渐学会为自己的事情负责。</p></div><div class="ability-row"><b>儿童观</b><p>开始更多区分“孩子不愿意”和“孩子暂时做不到”。</p></div><div class="ability-row"><b>教育观</b><p>希望学习和关系都重要，而不是只追求当下完成任务。</p></div><button class="primary-btn full-btn" data-action="archive-correct" data-member="parent" style="margin-top:14px">补充 / 修正档案</button></div></div>`;
}

function renderChildArchive(){
  const child=state.family?.children?.[0]||{name:'小明',age:10,gender:'男孩',grade:'小学四年级'};
  return `<div><div class="panel"><div class="member-card"><div class="member-avatar">${profileGlyph('child')}</div><div class="member-main"><b>${esc(child.name)}</b><span>${esc(child.age)} 岁 · ${esc(child.gender)} · ${esc(child.grade||'')}</span></div><button class="edit-pill" data-action="edit-child">编辑</button></div><div class="subtle" style="margin-top:10px">档案根据你提供及确认的信息整理。</div></div><div class="panel"><div class="archive-title">基础档案</div><div class="archive-four"><button data-action="archive-basic" data-category="生理基础">生理基础</button><button data-action="archive-basic" data-category="健康状况">健康状况</button><button data-action="archive-basic" data-category="气质与印记">气质与印记</button><button data-action="archive-basic" data-category="家庭背景">家庭背景</button></div></div><div class="panel"><div class="archive-title">能力档案</div><div class="ability-row"><b>任务启动</b><p>面对不喜欢或觉得困难的任务时，启动会比较慢。</p></div><div class="ability-row"><b>自主表达</b><p>被连续催促时容易用拒绝或顶嘴表达不满。</p></div><div class="ability-row"><b>情绪恢复</b><p>冲突之后通常需要一段安静时间，才愿意重新沟通。</p></div><button class="primary-btn full-btn" data-action="archive-correct" data-member="child" style="margin-top:14px">补充 / 修正档案</button></div></div>`;
}

function renderMemorySummary(){
  return `<div><div class="panel"><div class="panel-title">小亲记住了什么</div><div class="subtle">这些信息用于让后续对话更贴近你们家。每一条都由你控制。</div>${state.archive.memories.map(m=>`<div class="memory-item"><span class="memory-main"><b>${esc(m.title)}</b><p>${esc(m.content)}</p></span><button class="switch ${m.enabled?'on':''}" data-action="memory-toggle" data-id="${m.id}" aria-label="切换记忆"><i></i></button></div>`).join('')}</div><div class="panel"><button class="secondary-btn full-btn" data-action="route" data-route="archive/memories">管理全部记忆</button></div></div>`;
}

function renderMemories(){
  return `<div class="secondary-page archive-page memory-page">${titleBar('小亲的记忆',{back:'archive'})}<div class="page-body"><div class="panel"><div class="panel-title">关系记忆</div>${state.archive.memories.map(m=>`<div class="memory-item"><span class="memory-main"><b>${esc(m.title)}</b><p>${esc(m.content)}</p></span><button class="switch ${m.enabled?'on':''}" data-action="memory-toggle" data-id="${m.id}"><i></i></button></div>`).join('')}</div><div class="panel"><div class="subtle">关闭某条记忆后，小亲不会在后续回答中使用它。删除记忆不会删除原始聊天记录。</div><button class="danger-btn full-btn" data-action="memory-clear" style="margin-top:12px">清除全部 AI 记忆</button></div></div></div>`;
}

function renderMembers(){
  const childRows=(state.family?.children||[]).map((child,i)=>listRow(svg.child,child.name,`孩子${child.age?` · ${child.age} 岁`:''}`,i===0?'edit-child':'member-demo-info',`data-child-id="${esc(child.id)}"`)).join('');
  const otherRows=(state.family?.others||[]).map(item=>listRow(svg.user,item.name,item.relation,'member-demo-info',`data-child-id="${esc(item.id)}"`)).join('');
  return `<div class="secondary-page archive-page members-page">${titleBar('家庭成员',{back:'archive',right:{label:'添加',action:'member-add'}})}<div class="page-body"><div class="panel">${listRow(svg.user,state.user.name,'家长 · '+roleLabel(state.user.role),'edit-parent')}${childRows}${otherRows}</div><div class="empty-card card"><img src="${ASSETS.mascot}" alt=""><h3>可以继续添加家庭成员</h3><p>每位成员都有独立档案，信息不会混在一起。</p><button class="secondary-btn" data-action="member-add">添加成员</button></div></div></div>`;
}

function renderArchiveBasic(category){
  const decoded=decodeURIComponent(category||'基础档案');
  return `<div class="secondary-page archive-page archive-basic-page">${titleBar(decoded,{back:'archive'})}<div class="page-body"><div class="panel"><div class="panel-title">小明 · ${esc(decoded)}</div>${decoded==='健康状况'?`<div class="ability-row"><b>近期状态</b><p>暂未补充。未知信息不会被理解为“没有相关情况”。</p></div>`:`<div class="ability-row"><b>已确认信息</b><p>当前没有足够信息形成结论。</p></div>`}<button class="primary-btn full-btn" data-action="archive-correct" data-member="child" style="margin-top:14px">补充 / 修正</button></div></div></div>`;
}

function renderAssessments(){
  const tab=state.assessments.tab;
  const items=ASSESSMENTS.map(getAssessmentView).filter(a=>a.status===(tab==='recommended'?'recommended':tab==='progress'?'progress':'completed'));
  return `<div class="secondary-page assessment-page">${titleBar('我的测评',{back:'home'})}<div class="page-body"><div class="segmented"><button class="segment-btn ${tab==='recommended'?'active':''}" data-action="assessment-tab" data-value="recommended">为你推荐</button><button class="segment-btn ${tab==='progress'?'active':''}" data-action="assessment-tab" data-value="progress">进行中</button><button class="segment-btn ${tab==='completed'?'active':''}" data-action="assessment-tab" data-value="completed">已完成</button></div>${items.length?items.map(a=>renderAssessmentCard(a)).join(''):`<div class="empty-card card"><img src="${ASSETS.mascot}" alt=""><h3>这里还没有内容</h3><p>完成一次测评后，结果会保存在这里。</p></div>`}</div></div>`;
}

function renderAssessmentCard(a){
  return `<div class="card assessment-card" style="margin-bottom:11px"><div class="assessment-top"><span class="assessment-icon">${svg.assessment}</span><span class="assessment-main"><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p><span class="tag-row"><span class="tag">${esc(a.tag)}</span><span class="tag">约 ${a.minutes} 分钟</span></span>${a.progress?`<span class="progress-bar"><i style="width:${a.progress}%"></i></span>`:''}</span></div><div class="assessment-footer"><span>${a.status==='completed'?'已完成 '+a.date:(a.status==='progress'?'已完成 '+a.progress+'%':'小亲根据近期对话推荐')}</span><button class="small-cta" data-action="route" data-route="${a.status==='completed'?`assessments/report/${a.id}`:`assessments/detail/${a.id}`}">${a.status==='progress'?'继续':'查看详情'}</button></div></div>`;
}

function renderAssessmentDetail(id){
  const a=getAssessmentView(ASSESSMENTS.find(x=>x.id===id)||ASSESSMENTS[0]);
  return `<div class="secondary-page assessment-page">${titleBar(a.title,{back:'assessments'})}<div class="page-body"><div class="hero-card"><h1>这个测评能帮你了解什么？</h1><p>它不会判断孩子“好或不好”，而是帮助你观察面对任务时怎样开始、什么情况下容易回避，以及哪些支持方式更适合。</p></div><div class="panel"><div class="ability-row"><b>适用对象</b><p>6—15 岁孩子的家长</p></div><div class="ability-row"><b>预计时间</b><p>约 ${a.minutes} 分钟</p></div><div class="ability-row"><b>报告包含</b><p>任务理解、启动能力、压力反应、自主感和父母支持方式。</p></div><div class="ability-row"><b>隐私说明</b><p>答案仅用于生成本次结果；你可以决定是否保存到家庭档案。</p></div></div><div class="panel"><div class="member-card"><div class="member-avatar">${profileGlyph('child')}</div><div class="member-main"><b>本次测评对象</b><span>小明 · 10 岁</span></div><button class="edit-pill" data-action="member-select">更换</button></div></div><button class="primary-btn full-btn" data-action="assessment-start" data-id="${a.id}">${a.status==='progress'?'继续测评':'开始测评'}</button></div></div>`;
}

function renderAssessmentQuestions(id){
  const idx=Math.min(state.assessments.questionIndex,QUESTIONS.length-1);
  const q=QUESTIONS[idx];
  const selected=state.assessments.answers[idx];
  return `<div class="question-wrap"><div class="question-progress"><i style="width:${((idx+1)/QUESTIONS.length)*100}%"></i></div><div class="page-titlebar"><button class="back-btn" data-action="assessment-exit">${svg.back}</button><b>孩子任务启动观察</b></div><div class="question-body"><div class="question-count">问题 ${idx+1} / ${QUESTIONS.length}</div><h1>${esc(q.title)}</h1>${q.options.map(o=>`<button class="question-option ${selected===o?'selected':''}" data-action="assessment-answer" data-value="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="question-nav"><button class="secondary-btn" data-action="assessment-prev" ${idx===0?'disabled':''}>上一题</button><button class="primary-btn" data-action="assessment-next" data-id="${id}" ${selected?'':'disabled'}>${idx===QUESTIONS.length-1?'提交':'下一题'}</button></div></div>`;
}

function renderAssessmentGenerating(id){
  return `<div class="success-screen"><div><div class="spinner" style="width:42px;height:42px"></div><h1>正在整理测评结果</h1><div class="subtle">小亲正在把你的回答整理成更容易理解的报告</div><div class="card" style="margin-top:22px;padding:15px;width:280px;text-align:left"><div class="skeleton" style="height:14px;width:65%;margin-bottom:12px"></div><div class="skeleton" style="height:10px;margin-bottom:8px"></div><div class="skeleton" style="height:10px;width:82%"></div></div></div></div>`;
}

function renderAssessmentReport(id){
  const locked=!state.membership.active;
  return `<div class="secondary-page assessment-page assessment-report-page">${titleBar('测评报告',{back:'assessments',forceBack:true})}<div class="page-body"><div class="hero-card report-hero-card"><div class="report-overview"><div class="report-kicker"><span>${svg.assessment}</span>任务启动观察</div><h1>孩子任务启动观察报告</h1><p>孩子在明确知道第一步时，启动会更容易；当任务看起来太大，或被连续催促时，回避和抵抗会明显增加。</p></div><div class="report-score" style="position:relative"><span><b>72</b><small>观察指数</small></span></div></div><div class="panel report-dimensions"><div class="panel-title">核心维度</div>${[['任务理解',78],['启动能力',62],['压力反应',74],['自主感',69],['父母支持方式',76]].map(([n,v])=>`<div class="dimension-row"><div class="dimension-head"><span>${n}</span><span>${v}</span></div><div class="dimension-bar"><i style="width:${v}%"></i></div></div>`).join('')}</div><div class="panel personalized-insight"><div class="panel-title"><span class="panel-title-icon">${svg.sparkle}</span>小亲的个性化解读</div><p class="subtle">你们最近的真实事件与本次结果有一个共同线索：连续催促会让任务压力和被控制感同时上升。更有效的方向可能是先帮孩子看清第一步，再让他自己选择开始顺序。</p>${locked?`<div class="latest-action" style="margin-top:12px"><b>完整报告会员可见</b><p>解锁所有维度详情、历史变化对比和长期个性化解读。</p><button class="inline-main" data-action="route" data-route="membership">查看会员权益</button></div>`:''}</div><div class="panel"><button class="primary-btn full-btn" data-action="report-chat">和小亲聊聊这个结果</button><button class="secondary-btn full-btn" data-action="report-action" style="margin-top:10px">生成一个小行动</button><button class="ghost-btn full-btn" data-action="report-save">保存到家庭档案</button></div></div></div>`;
}

function renderGuides(){
  const filtered=state.guides.query?GUIDES.filter(g=>(g.title+g.category+g.desc).includes(state.guides.query)):GUIDES;
  return `<div class="secondary-page guide-page">${titleBar('关系指南',{back:'home'})}<div class="page-body"><div class="guide-intro"><span class="guide-intro-icon">${svg.guide}</span><div><h2>把复杂问题，讲成今天能用的话</h2><p>从你们正在经历的场景开始，找到更贴近的理解与行动。</p></div></div><div class="search-box guide-search">${svg.search}<input id="guideSearch" value="${esc(state.guides.query)}" placeholder="搜索问题或关键词"></div><div class="panel guide-category-panel"><div class="panel-title">按问题查看</div><div class="category-grid">${['作业学习','手机规则','顶嘴冲突','情绪发火','沟通疏离','自驱力'].map(n=>`<button class="category-btn tone-${guideTone(n)}" data-action="guide-category" data-category="${n}"><span class="category-icon">${guideIcon(n)}</span><b>${n}</b></button>`).join('')}</div></div><div class="section-title guide-recommend-title"><span>${state.guides.query?'搜索结果':'小亲为你推荐'}</span><small>${filtered.length} 篇</small></div>${filtered.length?filtered.map(renderGuideCard).join(''):`<div class="empty-card card"><img src="${ASSETS.mascot}" alt=""><h3>没有找到相关内容</h3><p>换一个关键词，或者直接问小亲。</p><button class="secondary-btn" data-action="guide-chat">问小亲</button></div>`}</div></div>`;
}

function renderGuideCard(g){
  return `<button class="card guide-card tone-${guideTone(g.category)}" data-action="route" data-route="guides/detail/${g.id}" style="display:block;width:100%;text-align:left;margin-bottom:12px"><div class="guide-cover"><span class="guide-cover-glow"></span><span class="guide-cover-icon">${guideIcon(g.category)}</span><span class="guide-cover-label">${esc(g.category)}</span><img src="${ASSETS.mascot}" alt="小亲"></div><div class="guide-content"><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p><div class="guide-meta"><span>小亲精选</span><span>${g.minutes} 分钟阅读 <i>${svg.back}</i></span></div></div></button>`;
}

function renderGuideCategory(category){
  const items=GUIDES.filter(g=>g.category===category);
  return `<div class="secondary-page guide-page guide-category-page">${titleBar(category,{back:'guides'})}<div class="page-body">${items.length?items.map(renderGuideCard).join(''):`<div class="empty-card card"><img src="${ASSETS.mascot}" alt=""><h3>内容正在整理</h3><p>可以先直接和小亲聊这个问题。</p><button class="secondary-btn" data-action="guide-chat">问小亲</button></div>`}</div></div>`;
}

function renderGuideDetail(id){
  const g=GUIDES.find(x=>x.id===id)||GUIDES[0];
  const fav=state.guides.favorites.includes(g.id);
  return `<div class="screen article"><div class="secondary-page guide-detail-page" id="articleScroll">${titleBar('关系指南',{back:'guides'})}<div class="article-progress"><i id="articleProgress"></i></div><article class="article-body"><h1>${esc(g.title)}</h1><div class="article-meta">${esc(g.category)} · 预计阅读 ${g.minutes} 分钟</div><p>你看到的可能是：孩子拖拉、不合作，甚至一开口就表现出不耐烦。</p><h2>先别急着把它理解成“不听话”</h2><p>一次抗拒背后可能同时有几个因素：不知道从哪里开始、觉得任务太难、正在做的事情被打断，或者已经对“被催”形成了防御。</p><div class="article-quote">真正值得观察的，不只是孩子有没有马上行动，而是第一次提醒以后，双方的压力是怎样一步步升高的。</div><h2>今天可以观察什么？</h2><p>第一次提醒时，孩子当时正在做什么？他是没有听见、不知道如何开始，还是一被提醒就进入了抵抗？</p><h2>一个更小的尝试</h2><p>把“快点去写作业”换成：“你准备先从哪一项开始？需要我帮你看一下第一步吗？”</p><p>这个动作不是为了马上让孩子变得配合，而是为了减少压力，让你们有机会看清楚他究竟卡在哪里。</p></article></div><div class="article-actions"><button class="icon-btn" data-action="guide-favorite" data-id="${g.id}" aria-label="收藏" style="border:1px solid var(--line)">${fav?svg.check:svg.heart}</button><button class="secondary-btn" data-action="guide-chat" data-title="${esc(g.title)}">问小亲</button><button class="primary-btn" data-action="guide-action" data-title="${esc(g.title)}">变成行动</button></div></div>`;
}

function renderMembership(){
  const active=state.membership.active;
  return `<div class="secondary-page membership-page">${titleBar('会员中心',{back:'home',right:{label:'订单',action:'member-orders'}})}<div class="page-body"><div class="member-banner membership-identity-card ${active?'is-active':'is-free'}"><div class="membership-identity-copy"><span class="membership-eyebrow">${active?'MEMBER':'MEMBERSHIP'}</span><h2>${active?'亲智聊会员':'普通用户'}</h2><p>${active?'有效期至 2027 年 9 月 3 日':'开通后获得完整测评报告、长期成长总结和扩展家庭档案。'}</p></div><button class="primary-btn membership-cta" data-action="route" data-route="membership/plans">${active?'续费会员':'立即开通'}</button></div><div class="section-title"><span>会员专属权益</span></div><div class="benefit-grid"><div class="benefit-card"><span>${svg.relation}</span><b>深度关系理解</b><p>更完整的关系分析与修正过程</p></div><div class="benefit-card"><span>${svg.assessment}</span><b>完整测评报告</b><p>查看全部维度与历史变化</p></div><div class="benefit-card"><span>${svg.guide}</span><b>指南会员内容</b><p>系统专题与进阶内容</p></div><div class="benefit-card"><span>${svg.growth}</span><b>长期成长总结</b><p>查看更多阶段变化</p></div><div class="benefit-card"><span>${svg.family}</span><b>家庭档案扩展</b><p>更多成员与长期记录</p></div><div class="benefit-card"><span>${svg.sparkle}</span><b>智能体权益</b><p>成长督导与报告解读</p></div></div><div class="panel" style="margin-top:12px"><div class="panel-title">我的权益使用情况</div>${listRow(svg.assessment,'完整测评报告','本月已使用 1 次','route','data-route="assessments"')}${listRow(svg.growth,'长期成长总结','本月已生成 1 份','route','data-route="growth/weekly"')}${listRow(svg.brain,'家庭档案','已建立 2 位成员','route','data-route="archive"')}</div></div></div>`;
}

function renderMembershipPlans(){
  const selected=state.membership.plan||'year';
  return `<div class="secondary-page membership-page membership-plans-page">${titleBar('选择会员方案',{back:'membership'})}<div class="page-body"><div class="plan-card ${selected==='year'?'selected':''}" data-action="plan-select" data-plan="year"><span class="recommend">推荐</span><h3>年度会员</h3><strong>¥198</strong><p>平均每月 ¥16.5 · 适合持续陪伴</p></div><div class="plan-card ${selected==='month'?'selected':''}" data-action="plan-select" data-plan="month"><h3>月度会员</h3><strong>¥29</strong><p>按月体验，可随时取消续费</p></div><div class="panel"><div class="panel-title">方案包含</div><div class="ability-row"><b>完整关系理解与修正</b><p>在重要事件中获得更完整的分析过程。</p></div><div class="ability-row"><b>测评完整报告</b><p>查看全部维度、历史变化和个性化解读。</p></div><div class="ability-row"><b>长期成长总结</b><p>查看月度、阶段性变化和行动效果。</p></div></div><button class="primary-btn full-btn" data-action="payment-sheet">确认开通 · ${selected==='year'?'¥198':'¥29'}</button><div class="subtle" style="text-align:center;margin-top:12px">Demo 为模拟支付，不会产生真实扣款。</div></div></div>`;
}

function renderOrders(){
  const orders=state.membership.orders;
  return `<div class="secondary-page membership-page orders-page">${titleBar('我的订单',{back:'membership'})}<div class="page-body">${orders.length?`<div class="panel">${orders.map(o=>`<div class="order-row"><span><b>${esc(o.title)}</b><br><small>${esc(o.date)}</small></span><span>${esc(o.amount)} · ${esc(o.status)}</span></div>`).join('')}</div>`:`<div class="empty-card card"><img src="${ASSETS.mascot}" alt=""><h3>还没有订单</h3><p>开通会员后，订单记录会出现在这里。</p><button class="secondary-btn" data-action="route" data-route="membership/plans">查看会员方案</button></div>`}</div></div>`;
}

// Upgrade stored V3.x data without clearing login/chat/actions or their results.
function migrateCenterState(){
  if(!state.tasks||typeof state.tasks!=='object')state.tasks={tab:'pending'};
  delete state.tasks.unread; // Visiting a task list never completes a task.
  if(!state.messages||typeof state.messages!=='object')state.messages={readIds:[]};
  if(Number.isFinite(state.messages.unread)){
    const unread=Math.max(0,Math.min(NOTIFICATIONS.length,state.messages.unread));
    state.messages.readIds=NOTIFICATIONS.slice(unread).map(n=>n.id);
  }
  if(!Array.isArray(state.messages.readIds))state.messages.readIds=[];
  state.messages.readIds=[...new Set(state.messages.readIds.filter(id=>NOTIFICATIONS.some(n=>n.id===id)))];
  delete state.messages.unread;
  if(!state.assessments.progressById||typeof state.assessments.progressById!=='object'||Array.isArray(state.assessments.progressById))state.assessments.progressById={};
  const id=state.assessments.currentId;
  if(id&&ASSESSMENTS.some(a=>a.id===id)&&!state.assessments.progressById[id]){
    state.assessments.progressById[id]={status:state.assessments.reportReady?'completed':'progress',questionIndex:state.assessments.questionIndex||0,answers:{...state.assessments.answers}};
  }
}
function getAssessmentView(a){
  const record=state.assessments.progressById[a.id];
  if(!record)return {...a};
  const status=record.status==='completed'?'completed':'progress';
  const count=Object.keys(record.answers||{}).filter(k=>Number.isInteger(Number(k))&&Number(k)>=0&&Number(k)<QUESTIONS.length).length;
  return {...a,status,progress:status==='completed'?100:Math.round(count/QUESTIONS.length*100),date:record.completedDate||a.date||''};
}
function getPendingTasks(){
  const actions=state.actions.filter(a=>a.status==='pending').map(a=>({id:'action:'+a.id,kind:'action',resourceId:a.id,title:a.title,sub:'待尝试 · 试过后回来反馈'}));
  const assessments=ASSESSMENTS.map(getAssessmentView).filter(a=>a.status==='progress').map(a=>({id:'assessment:'+a.id,kind:'assessment',resourceId:a.id,title:'继续完成'+a.title,sub:'已完成 '+(a.progress||0)+'%'}));
  return [...actions,...assessments];
}
function getUnreadMessageCount(){return NOTIFICATIONS.filter(n=>!state.messages.readIds.includes(n.id)).length;}
function renderTaskCenter(){
  const tab=state.tasks.tab||'pending';
  const tasks=getPendingTasks();
  const rows=tasks.map(t=>listRow(t.kind==='action'?svg.sprout:svg.assessment,t.title,t.sub,'route',`data-task-id="${esc(t.id)}" data-route="${t.kind==='action'?'growth/action/':'assessments/detail/'}${esc(t.resourceId)}"`)).join('');
  const pending=`<div class="panel"><div class="panel-title">待处理事项${tasks.length?' · '+tasks.length:''}</div>${rows||'<div class="empty-card"><h3>当前没有待处理事项</h3><p>新的行动与测评进度会出现在这里。</p></div>'}</div><div class="panel"><div class="panel-title">进行中的计划</div><div class="latest-action"><b>7 天少催促计划</b><p>第 2 天 / 共 7 天。今天先练习把提醒改成一个问题。</p><button class="inline-main" data-action="route" data-route="growth">查看今天任务</button></div></div>`;
  const completedRows=state.actions.filter(a=>a.status==='done').map(a=>listRow(svg.check,a.title,a.date+' · '+a.resultText,'route',`data-route="growth/action/${esc(a.id)}"`)).join('')+ASSESSMENTS.map(getAssessmentView).filter(a=>a.status==='completed').map(a=>listRow(svg.assessment,a.title,'测评已完成'+(a.date?' · '+a.date:''),'route',`data-route="assessments/report/${esc(a.id)}"`)).join('');
  const completed=`<div class="panel"><div class="panel-title">已完成事项</div>${completedRows||'<div class="empty-card"><p>完成行动反馈或测评后，记录会保留在这里。</p></div>'}</div>`;
  return `<div class="secondary-page task-page">${titleBar('任务中心',{back:'home'})}<div class="page-body"><div class="segmented"><button class="segment-btn ${tab==='pending'?'active':''}" data-action="task-tab" data-value="pending">待处理</button><button class="segment-btn ${tab==='completed'?'active':''}" data-action="task-tab" data-value="completed">已完成</button></div>${tab==='pending'?pending:completed}</div></div>`;
}
function renderMessages(){
  const rows=NOTIFICATIONS.map(n=>{
    const read=state.messages.readIds.includes(n.id);
    return `<button type="button" class="message-row inbox-message ${read?'is-read':'is-unread'}" data-action="message-open" data-id="${n.id}" data-read="${read}" aria-label="${read?'已读':'未读'}：${esc(n.title)}"><span class="message-icon">${svg[n.icon]}</span><span class="message-main"><b>${esc(n.title)}${read?'':'<i class="message-unread-dot" aria-hidden="true"></i>'}</b><p>${esc(n.body)}</p><time>${n.time}</time></span><span class="chevron" aria-hidden="true">›</span></button>`;
  }).join('');
  return `<div class="secondary-page messages-page">${titleBar('消息中心',{back:'home',right:{label:'全部已读',action:'messages-read'}})}<div class="page-body"><div class="panel message-panel">${rows}</div></div></div>`;
}
function markAllMessagesRead(){
  state.messages.readIds=NOTIFICATIONS.map(n=>n.id);
  saveState();renderRoute(currentRoute);toast('已全部标记为已读');
}
function openNotification(id){
  const n=NOTIFICATIONS.find(x=>x.id===id);if(!n)return;
  if(!state.messages.readIds.includes(id))state.messages.readIds.push(id);
  saveState();renderDrawer();
  if(n.kind==='action'){
    const a=state.actions.find(x=>x.id===n.resourceId);
    if(!a){renderRoute(currentRoute);toast('这条行动已不存在');return;}
    if(a.status==='pending'){renderRoute(currentRoute);showActionFeedback(a.id);}
    else navigate('growth/action/'+a.id);
  }else if(n.kind==='weekly')navigate('growth/weekly');
  else if(n.kind==='assessment'){
    const a=ASSESSMENTS.find(x=>x.id===n.resourceId);if(!a)return;
    navigate((getAssessmentView(a).status==='completed'?'assessments/report/':'assessments/detail/')+a.id);
  }
}

function renderProfile(){
  return `<div class="secondary-page profile-page">${titleBar('个人资料',{back:'home'})}<div class="page-body">
    <div class="profile-list">
      <button class="profile-list-row" data-action="profile-avatar"><span>头像</span><span class="profile-list-value">${userAvatarMarkup('profile-avatar-small')}${svg.back}</span></button>
      <button class="profile-list-row" data-action="profile-name"><span>昵称</span><span class="profile-list-value"><b>${esc(state.user.name)}</b>${svg.back}</span></button>
      <button class="profile-list-row" data-action="profile-role"><span>家庭身份</span><span class="profile-list-value"><b>${esc(roleLabel(state.user.role))}</b>${svg.back}</span></button>
    </div>
    <div class="profile-footnote">资料会同步用于侧栏、家庭档案和小亲对你的称呼。每项修改都会在你确认后才保存。</div>
  </div></div>`;
}

function renderSettings(){
  return `<div class="secondary-page settings-page">${titleBar('设置',{back:'home'})}<div class="page-body"><div class="settings-group">${listRow(svg.profile,'账号与安全','手机号、微信账号和注销','route','data-route="settings/account"')}${listRow(svg.notification,'通知设置','行动、计划和成长提醒','route','data-route="settings/notifications"')}${listRow(svg.shield,'隐私保护中心','家庭档案、AI 记忆和对话数据','route','data-route="settings/privacy"')}</div><div class="settings-group">${listRow(svg.help,'帮助中心','常见问题与联系客服','route','data-route="settings/help"')}${listRow(svg.info,'关于亲智聊','版本、协议和权限说明','route','data-route="settings/about"')}</div><button class="danger-btn full-btn" data-action="logout">退出登录</button></div></div>`;
}

function renderAccountSettings(){
  return `<div class="secondary-page settings-page account-settings-page">${titleBar('账号与安全',{back:'settings'})}<div class="page-body"><div class="settings-group"><button class="settings-row" data-action="account-phone"><b>手机号</b><small>${formatPhone(state.user.phone)}</small><span class="chevron">›</span></button><button class="settings-row" data-action="account-wechat"><b>微信账号</b><small>已绑定</small><span class="chevron">›</span></button><button class="settings-row" data-action="logout"><b>退出登录</b><span class="chevron">›</span></button></div><div class="settings-group"><button class="settings-row" data-action="account-delete"><b style="color:var(--danger)">注销账号</b><span class="chevron">›</span></button></div></div></div>`;
}

function renderNotificationSettings(){
  return `<div class="secondary-page settings-page notification-settings-page">${titleBar('通知设置',{back:'settings'})}<div class="page-body"><div class="settings-group">${notificationRow('行动提醒',true,'action')}${notificationRow('改变计划提醒',true,'plan')}${notificationRow('成长总结提醒',true,'growth')}${notificationRow('产品消息',false,'product')}</div></div></div>`;
}
function notificationRow(name,on,id){return `<button class="settings-row" data-action="notification-toggle" data-id="${id}"><b>${name}</b><span style="margin-left:auto"><span class="switch ${on?'on':''}"><i></i></span></span></button>`;}

function renderPrivacyCenter(){
  return `<div class="secondary-page settings-page privacy-page">${titleBar('隐私保护中心',{back:'settings'})}<div class="page-body"><div class="hero-card"><h1>你的家庭信息，由你控制</h1><p>你可以决定家庭档案、AI 记忆和对话内容怎样保存和使用。</p></div><div class="settings-group">${listRow(svg.family,'家庭档案权限','管理成员资料与使用范围','route','data-route="archive"')}${listRow(svg.brain,'AI 记忆权限','查看、关闭或删除记忆','route','data-route="archive/memories"')}<button class="settings-row" data-action="export-data"><b>下载个人数据</b><span class="chevron" style="margin-left:auto">›</span></button><button class="settings-row" data-action="clear-chat"><b>清除对话数据</b><span class="chevron" style="margin-left:auto">›</span></button></div><button class="danger-btn full-btn" data-action="clear-family">删除全部家庭数据</button></div></div>`;
}

function renderHelpCenter(){
  return `<div class="secondary-page settings-page help-page">${titleBar('帮助中心',{back:'settings'})}<div class="page-body"><div class="search-box">${svg.search}<input placeholder="搜索常见问题"></div><div class="settings-group">${listRow(svg.help,'小亲会记住哪些信息？','','help-answer','data-title="小亲会记住哪些信息？"')}${listRow(svg.help,'如何删除一段对话？','','help-answer','data-title="如何删除一段对话？"')}${listRow(svg.help,'测评报告可以修改吗？','','help-answer','data-title="测评报告可以修改吗？"')}${listRow(svg.help,'会员如何取消自动续费？','','help-answer','data-title="会员如何取消自动续费？"')}</div><div class="panel"><button class="primary-btn full-btn" data-action="feedback">意见反馈</button><button class="secondary-btn full-btn" data-action="support-toast" style="margin-top:10px">联系在线客服</button></div></div></div>`;
}

function renderAbout(){
  return `<div class="secondary-page settings-page about-page">${titleBar('关于亲智聊',{back:'settings'})}<div class="page-body"><div class="empty-card"><img src="${ASSETS.logo}" alt="" style="border-radius:25px"><h3>亲智聊</h3><p>家庭关系理解与行动陪伴产品<br>版本 1.0.0 Demo</p></div><div class="settings-group">${listRow(svg.file,'服务协议','','route','data-route="agreement/service"')}${listRow(svg.shield,'隐私政策','','route','data-route="agreement/privacy"')}${listRow(svg.file,'第三方信息共享清单','','about-toast')}${listRow(svg.settings,'权限使用说明','','about-toast')}</div></div></div>`;
}

function renderDemoTools(){
  return `<div class="secondary-page">${titleBar('Demo 工具',{back:state.loggedIn?'home':'login'})}<div class="page-body"><div class="panel"><div class="panel-title">状态跳转</div>${['home','growth','archive','assessments','guides','membership','task-center','messages','settings','feedback'].map(r=>`<button class="secondary-btn" data-action="route" data-route="${r}" style="margin:4px">${r}</button>`).join('')}</div><div class="panel"><button class="danger-btn full-btn" data-action="demo-reset">重置全部 Demo 数据</button></div></div></div>`;
}
function renderNotFound(){return `<div class="secondary-page">${titleBar('页面不存在',{back:'home'})}<div class="empty-card"><img src="${ASSETS.mascot}" alt=""><h3>没有找到这个页面</h3><p>可以返回首页继续体验。</p><button class="primary-btn" data-action="route" data-route="home">返回首页</button></div></div>`;}

function renderDrawer(){
  rememberDrawerScroll();
  if(!state.loggedIn){drawerEl.innerHTML='';return;}
  const pendingCount=getPendingTasks().length;
  const unreadCount=getUnreadMessageCount();
  const names=CHAT_HISTORY_TITLES;
  const role=roleLabel(state.user.role);
  drawerEl.innerHTML=`<header class="v35-account-bar v43-account-bar" aria-label="账号和快捷操作">
    <div class="v35-account v43-account">
      <button class="v35-avatar-button v43-avatar-button" data-action="route" data-route="profile" aria-label="编辑个人资料">${userAvatarMarkup('v35-user-avatar-img')}</button>
      <div class="v35-account-copy v43-account-copy">
        <button class="v35-name v43-name" data-action="route" data-route="profile">${esc(state.user.name)}</button>
        <span class="v43-role">${esc(role)}</span>
      </div>
    </div>
    <nav class="v35-quick-nav v43-quick-nav" aria-label="任务与消息">
      <button class="v35-quick-button v43-quick-button" data-action="route" data-route="messages" aria-label="消息中心，${unreadCount} 条未读消息">
        <span class="v35-quick-icon">${svg.notification}</span>
        ${unreadCount?`<em data-badge="messages">${unreadCount>99?'99+':unreadCount}</em>`:''}
      </button>
      <button class="v35-quick-button v43-quick-button" data-action="route" data-route="task-center" aria-label="任务中心，${pendingCount} 项待处理">
        <span class="v35-quick-icon">${svg.assessment}</span>
        ${pendingCount?`<em data-badge="tasks">${pendingCount>99?'99+':pendingCount}</em>`:''}
      </button>
      <button class="v35-close-button v43-close-button" data-action="drawer-close" aria-label="关闭侧栏">${svg.close}</button>
    </nav>
  </header>
  <div class="v35-drawer-scroll v43-drawer-scroll" id="drawerScroll" tabindex="0" aria-label="侧栏内容，可上下滚动">
    <button class="v35-membership v43-membership" data-action="route" data-route="membership">
      <span class="v43-membership-icon" aria-hidden="true">${svg.sparkle}</span>
      <span class="v35-membership-copy v43-membership-copy"><b>亲智聊会员</b><small>${state.membership.active?'会员权益已开启':'完整理解与成长权益'}</small></span>
      <span class="v35-membership-link v43-membership-link">查看权益<span aria-hidden="true">${svg.back}</span></span>
    </button>
    <nav class="v35-services v43-services" aria-label="常用功能">
      <button data-action="route" data-route="archive"><span>${svg.family}</span><b>家庭档案</b></button>
      <button data-action="route" data-route="assessments"><span>${svg.assessment}</span><b>我的测评</b></button>
      <button data-action="route" data-route="guides"><span>${svg.guide}</span><b>关系指南</b></button>
    </nav>
    <section class="v35-history v43-history" aria-labelledby="drawerHistoryTitle">
      <div class="v43-history-heading"><h3 id="drawerHistoryTitle">最近对话</h3><span>${names.length} 条</span></div>
      <div class="v35-history-list v43-history-list">${names.map((name,i)=>{
        const current=drawerView.selectedHistory===i&&state.chat.active;
        return `<button class="v35-history-row v43-history-row${current?' is-current':''}" data-action="open-history" data-index="${i}"${current?' aria-current="true"':''}><span class="v43-history-indicator" aria-hidden="true"></span><span class="v43-history-copy"><b>${esc(name)}</b><small>${esc(CHAT_HISTORY_SUMMARIES[i]||'继续这段对话')}</small></span></button>`;
      }).join('')}</div>
    </section>
    <footer class="v35-support v43-support" aria-label="帮助与设置">
      <button data-action="route" data-route="settings/help">${svg.help}<span>帮助与反馈</span><i aria-hidden="true">${svg.back}</i></button>
      <button data-action="route" data-route="settings">${svg.settings}<span>设置</span><i aria-hidden="true">${svg.back}</i></button>
    </footer>
  </div>`;
  drawerEl.setAttribute('aria-label','我的');
  const scroller=document.getElementById('drawerScroll');
  scroller.scrollTop=drawerView.scrollTop;
  scroller.addEventListener('scroll',()=>{
    if(drawerEl.dataset.state!=='closed')drawerView.scrollTop=scroller.scrollTop;
  },{passive:true});
}

function syncDrawerAvailability(){
  const homeActive=state.loggedIn&&(routeBase(currentRoute)==='home'||pageStack.innerHTML);
  edgeHandle.style.pointerEvents=routeBase(currentRoute)==='home'&&!pageStack.innerHTML?'auto':'none';
  // A drawer used as the underlay of a secondary page intentionally stays open.
  const keepUnderlay=!!pageStack.innerHTML&&secondaryUnderlay==='drawer';
  if(!homeActive&&!keepUnderlay&&(drawer.progress>0||drawerEl.dataset.state!=='closed'))closeDrawer(true);
}

function bindScreen(route){
  const base=routeBase(route);
  if(base==='login'){
    const cb=document.getElementById('loginConsent');
    if(cb)cb.addEventListener('change',()=>{state.consent=cb.checked;saveState();});
  }
  if(base==='login/phone'){
    const input=document.getElementById('phoneInput');
    if(input){input.focus();input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,11);});}
  }
  if(base==='login/code')bindCodeInputs();
  if(base==='login/quick'){
    const cb=document.getElementById('quickConsent');
    if(cb)cb.addEventListener('change',()=>{state.quickConsent=cb.checked;saveState();});
  }
  if(base==='feedback')bindFeedbackInputs();
  if(base==='home')bindHome();
  if(base==='assessments/generating/'+(routeParts(route)[2]||''))scheduleReport(routeParts(route)[2]);
  if(base.startsWith('guides/detail/'))bindArticleScroll();
}

function bindCodeInputs(){
  if(!state.codeExpireAt)state.codeExpireAt=Date.now()+58000;
  const boxes=[...document.querySelectorAll('.code-box')];
  boxes.forEach((box,i)=>{
    box.addEventListener('input',()=>{
      box.value=box.value.replace(/\D/g,'').slice(0,1);
      if(box.value&&i<boxes.length-1)boxes[i+1].focus();
      if(boxes.every(x=>x.value.length===1))finishLogin();
    });
    box.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!box.value&&i>0)boxes[i-1].focus();});
    box.addEventListener('paste',e=>{
      const nums=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);
      if(nums){e.preventDefault();nums.split('').forEach((n,j)=>{if(boxes[j])boxes[j].value=n;});if(nums.length===6)finishLogin();}
    });
  });
  setTimeout(()=>boxes[0]?.focus(),100);
  updateCountdown();
  countdownTimer=setInterval(updateCountdown,250);
}

function updateCountdown(){
  const btn=document.getElementById('resendBtn');if(!btn)return;
  const seconds=Math.max(0,Math.ceil((state.codeExpireAt-Date.now())/1000));
  if(seconds>0){btn.disabled=true;btn.classList.remove('ready');btn.textContent=seconds+'s 后重新获取';}
  else{btn.disabled=false;btn.classList.add('ready');btn.textContent='重新发送验证码';if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null;}}
}

function bindFeedbackInputs(){
  const txt=document.getElementById('feedbackText');
  const contact=document.getElementById('feedbackContact');
  txt?.addEventListener('input',()=>{state.feedback.text=txt.value.slice(0,240);const c=document.getElementById('feedbackCount');if(c)c.textContent=state.feedback.text.length;updateFeedbackButton();saveState();});
  contact?.addEventListener('input',()=>{state.feedback.contact=contact.value;saveState();});
}
function updateFeedbackButton(){const btn=document.querySelector('[data-action="feedback-submit"]');if(btn)btn.disabled=!(state.feedback.type&&state.feedback.text.trim().length>=10);}

function autoSizeTextarea(input){
  if(!input)return;
  input.style.height='auto';
  input.style.height=Math.min(input.scrollHeight,92)+'px';
}
function bindHome(){
  const area=document.getElementById('aiScroll');
  const input=document.getElementById('chatInput');
  const send=document.getElementById('chatSendBtn');
  if(input){
    input.addEventListener('compositionstart',()=>{chatComposing=true;});
    input.addEventListener('compositionend',()=>{chatComposing=false;});
    input.addEventListener('input',()=>{autoSizeTextarea(input);send?.classList.toggle('send-ready',!!input.value.trim());});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!chatComposing){e.preventDefault();sendChatInput();}});
  }
  if(area){
    setTimeout(()=>{
      if(pendingConversationStart){scrollConversationIntoView(false);pendingConversationStart=false;}
      else if(state.chat.active){area.scrollTop=area.scrollHeight;chatFollowLatest=true;}
      syncLatestButton();
    },30);
    area.addEventListener('scroll',()=>{
      const distance=area.scrollHeight-area.scrollTop-area.clientHeight;
      chatFollowLatest=distance<120;
      syncLatestButton(distance);
    },{passive:true});
  }
}
function syncLatestButton(distance){
  const back=document.getElementById('backLatest');if(!back)return;
  const area=document.getElementById('aiScroll');
  const d=distance!==undefined?distance:(area?area.scrollHeight-area.scrollTop-area.clientHeight:0);
  back.hidden=d<100;
}
function captureInputSnapshot(){
  const input=document.getElementById('chatInput');
  return input?{value:input.value,focused:document.activeElement===input,start:input.selectionStart||0,end:input.selectionEnd||0}:null;
}
function restoreInputSnapshot(snapshot){
  if(!snapshot)return;
  const input=document.getElementById('chatInput');if(!input)return;
  input.value=snapshot.value;autoSizeTextarea(input);
  document.getElementById('chatSendBtn')?.classList.toggle('send-ready',!!input.value.trim());
  if(snapshot.focused){input.focus({preventScroll:true});try{input.setSelectionRange(snapshot.start,snapshot.end);}catch(_){}}
}
function scrollConversationIntoView(smooth=true){
  const area=document.getElementById('aiScroll');const section=document.getElementById('conversationSection');
  if(!area||!section)return;
  const target=Math.max(0,section.offsetTop-8);
  area.scrollTo({top:target,behavior:smooth?'smooth':'auto'});
  chatFollowLatest=true;syncLatestButton();
}
function refreshConversation({scroll='auto'}={}){
  if(currentRoute!=='home')return;
  const section=document.getElementById('conversationSection');
  const area=document.getElementById('aiScroll');
  if(!section||!area){renderRoute('home');return;}
  const snapshot=captureInputSnapshot();
  const oldTop=area.scrollTop;
  const oldDistance=area.scrollHeight-area.scrollTop-area.clientHeight;
  section.classList.toggle('active',!!state.chat.active);
  section.classList.toggle('is-typing',!!state.chat.typing);
  section.innerHTML=state.chat.active?renderChat():'';
  document.querySelector('.v36-continuous-shell')?.classList.toggle('v36-conversation-active',!!state.chat.active);
  const brandSmall=document.querySelector('.v3-top-brand small');if(brandSmall)brandSmall.textContent=state.chat.active?'小亲正在陪你聊':'懂孩子，也懂你';
  const input=document.getElementById('chatInput');if(input)input.placeholder=state.chat.active?'继续和小亲说……':'和小亲说说发生了什么…';
  restoreInputSnapshot(snapshot);
  requestAnimationFrame(()=>{
    if(scroll==='start')scrollConversationIntoView(true);
    else if(scroll==='latest'||(scroll==='auto'&&chatFollowLatest)){area.scrollTo({top:area.scrollHeight,behavior:scroll==='latest'?'smooth':'auto'});chatFollowLatest=true;}
    else {area.scrollTop=oldTop;chatFollowLatest=oldDistance<120;}
    syncLatestButton();
  });
}

function bindArticleScroll(){
  const scroller=document.getElementById('articleScroll');const bar=document.getElementById('articleProgress');
  if(!scroller||!bar)return;
  articleScrollHandler=()=>{const max=scroller.scrollHeight-scroller.clientHeight;bar.style.width=(max?Math.min(100,scroller.scrollTop/max*100):0)+'%';};
  scroller.addEventListener('scroll',articleScrollHandler,{passive:true});articleScrollHandler();
}
function bindProfileInputs(){
  const name=document.getElementById('profileName');
  name?.addEventListener('input',()=>{state.user.name=name.value;});
}

screenHost.addEventListener('click',handleClick);
pageStack.addEventListener('click',handleClick);
drawerEl.addEventListener('click',handleClick);
overlayRoot.addEventListener('click',handleOverlayClick);

function handleClick(e){
  const el=e.target.closest('[data-action]');if(!el)return;
  const action=el.dataset.action;
  const fromDrawer=drawerEl.contains(el)&&drawer.open;
  if(action==='route'){if(fromDrawer)navigateFromDrawer(el.dataset.route);else navigate(el.dataset.route);}
  else if(action==='back')goBack(el.dataset.fallback||'home',el.dataset.forceBack==='1');
  else if(action==='feedback'){if(fromDrawer)navigateFromDrawer('feedback');else navigate('feedback');}
  else if(action==='begin-login')beginLogin(el.dataset.target);
  else if(action==='send-code')sendCode();
  else if(action==='resend-code')resendCode();
  else if(action==='quick-login')quickLogin();
  else if(action==='finish-login')finishLogin();
  else if(action==='chat-home'){chatFollowLatest=false;document.getElementById('aiScroll')?.scrollTo({top:0,behavior:'smooth'});}
  else if(action==='drawer-open')openDrawer();
  else if(action==='drawer-close')closeDrawer();
  else if(action==='start-scenario'){drawerView.selectedHistory=null;startScenario(el.dataset.scenario);}
  else if(action==='chat-send')sendChatInput();
  else if(action==='chat-choice')handleChatChoice(el.dataset.value);
  else if(action==='interpret-start')setChatNode('restore');
  else if(action==='interpret-later')continueTalking();
  else if(action==='restore-ok')handleRestoreOk();
  else if(action==='restore-wrong')askCorrection('哪一段和实际情况不一样？');
  else if(action==='restore-add')askCorrection('好，你想补充哪个关键细节？');
  else if(action==='relation-choice')handleRelationChoice(el.dataset.value);
  else if(action==='confirm-ok')handleConfirmOk();
  else if(action==='confirm-fix')setChatNodeWithMessage('revise','可以，我们先不往下走。哪一部分和你的真实感受不太一样？');
  else if(action==='revise-choice')handleRevise(el.dataset.value);
  else if(action==='action-show')setChatNode('action-card');
  else if(action==='action-stop')setChatNodeWithMessage('done','好，我们先停在这里。我会把刚才形成的理解保留下来。');
  else if(action==='action-try')acceptAction(el.dataset.alt==='1');
  else if(action==='action-change')setChatNode('action-alt');
  else if(action==='action-cant')setChatNode('action-hard');
  else if(action==='action-save-understanding')setChatNodeWithMessage('done','已经记下了。今天不行动也没关系。');
  else if(action==='action-talk-hard')setChatNodeWithMessage('done','好。你可以从最难做到的那一部分开始说，我先听。');
  else if(action==='sound-toggle'){state.sound=!state.sound;saveState();if(currentRoute==='home'){el.innerHTML=state.sound?svg.volume:svg.mute;}else renderRoute(currentRoute);toast(state.sound?'已开启声音':'已关闭声音');}
  else if(action==='agent-sheet')showAgentSheet();
  else if(action==='more-sheet')showMoreSheet();
  else if(action==='attachment-sheet')showAttachmentSheet();
  else if(action==='voice-start')startVoiceMock();
  else if(action==='scroll-latest')scrollLatest();
  else if(action==='message-copy'){navigator.clipboard?.writeText(document.querySelector('.message-line.ai:last-of-type .chat-message')?.innerText||'').catch(()=>{});toast('已复制小亲的回复');}
  else if(action==='message-helpful')toast('已记录：这条回复有帮助');
  else if(action==='message-regenerate'){toast('小亲正在重新整理');scheduleAI('我换一种更清楚的方式说：先不用判断谁对谁错，我们只看刚才压力是怎样一步步升高的。',state.chat.node||'done',320);}
  else if(action==='growth-weekly'||action==='weekly-to-chat'){if(action==='growth-weekly')navigate('growth/weekly');else weeklyToChat();}
  else if(action==='select-date'){state.growth.selectedDate=el.dataset.date;saveState();renderRoute(currentRoute);}
  else if(action==='month-prev')changeMonth(-1);
  else if(action==='month-next')changeMonth(1);
  else if(action==='growth-filter'){state.growth.actionFilter=el.dataset.value||'all';saveState();renderRoute(currentRoute);}
  else if(action==='action-feedback')showActionFeedback(el.dataset.id||'a26');
  else if(action==='not-tried')toast('等你试过再回来也可以');
  else if(action==='review-action')enterReviewMode(el.dataset.id);
  else if(action==='archive-tab'){state.archive.tab=el.dataset.value;saveState();renderRoute(currentRoute);}
  else if(action==='archive-members')navigate('archive/members');
  else if(action==='archive-basic')navigate('archive/basic/'+encodeURIComponent(el.dataset.category));
  else if(action==='memory-toggle')toggleMemory(el.dataset.id);
  else if(action==='memory-clear')confirmMemoryClear();
  else if(action==='edit-parent'||action==='edit-child')showMemberEdit(action==='edit-parent'?'parent':'child');
  else if(action==='member-add')showMemberAdd();
  else if(action==='member-demo-info')toast('更多成员的独立档案编辑将在下一版继续补齐');
  else if(action==='archive-correct')archiveToChat(el.dataset.member);
  else if(action==='assessment-tab'){state.assessments.tab=el.dataset.value;saveState();renderRoute(currentRoute);}
  else if(action==='assessment-start')startAssessment(el.dataset.id);
  else if(action==='assessment-answer')answerAssessment(el.dataset.value);
  else if(action==='assessment-prev')assessmentPrev();
  else if(action==='assessment-next')assessmentNext(el.dataset.id);
  else if(action==='assessment-exit')confirmAssessmentExit();
  else if(action==='member-select')showMemberSelect();
  else if(action==='report-chat')reportToChat();
  else if(action==='report-action')reportToAction();
  else if(action==='report-save')toast('测评结果已保存到家庭档案');
  else if(action==='guide-category')navigate('guides/category/'+encodeURIComponent(el.dataset.category));
  else if(action==='guide-chat')guideToChat(el.dataset.title||'我想聊聊刚才看到的内容');
  else if(action==='guide-action')guideToAction(el.dataset.title);
  else if(action==='guide-favorite')toggleGuideFavorite(el.dataset.id);
  else if(action==='member-orders')navigate('membership/orders');
  else if(action==='plan-select'){state.membership.plan=el.dataset.plan;saveState();renderRoute(currentRoute);}
  else if(action==='payment-sheet')showPaymentSheet();
  else if(action==='messages-read')markAllMessagesRead();
  else if(action==='message-open')openNotification(el.dataset.id);
  else if(action==='task-tab'){state.tasks.tab=el.dataset.value||'pending';saveState();renderRoute(currentRoute);}
  else if(action==='account-phone')showAccountPhoneSheet();
  else if(action==='account-wechat')showAccountWechatSheet();
  else if(action==='profile-avatar')showProfileAvatarSheet();
  else if(action==='profile-name')showNicknameEditor();
  else if(action==='profile-role')showProfileRoleEditor();
  else if(action==='notification-toggle'){el.querySelector('.switch')?.classList.toggle('on');}
  else if(action==='logout')confirmLogout();
  else if(action==='account-delete')showConfirm('注销账号','注销后将无法恢复当前 Demo 数据。',()=>resetDemo());
  else if(action==='export-data')exportData();
  else if(action==='clear-chat')showConfirm('清除对话数据','将删除当前所有聊天内容，但不会删除家庭档案。',()=>{state.chat=cloneDefault().chat;saveState();toast('对话数据已清除');});
  else if(action==='clear-family')showConfirm('删除全部家庭数据','将删除家庭档案和 AI 记忆。',()=>{state.archive=cloneDefault().archive;saveState();toast('家庭数据已删除');renderRoute(currentRoute);});
  else if(action==='help-answer')showHelpAnswer(el.dataset.title);
  else if(action==='support-toast')toast('在线客服将在正式版本接入');
  else if(action==='about-toast')toast('正式上线前补充完整说明');
  else if(action==='feedback-type'){state.feedback.type=el.dataset.value;saveState();renderRoute(currentRoute);}
  else if(action==='feedback-remove-image'){state.feedback.image=false;saveState();renderRoute(currentRoute);}
  else if(action==='open-file')openFilePicker();
  else if(action==='feedback-submit')submitFeedback();
  else if(action==='open-history')openHistory(Number(el.dataset.index));
  else if(action==='demo-reset')resetDemo();
}

function beginLogin(target){
  const cb=document.getElementById('loginConsent');
  if(cb)state.consent=cb.checked;
  saveState();
  if(state.consent){navigate(target);return;}
  pendingLoginTarget=target;
  showPrivacyModal();
}
function showPrivacyModal(){
  showOverlay(`<div class="overlay" data-overlay-close="0"><div class="modal-card"><h2>隐私保护提示</h2><p>欢迎使用亲智聊。我们重视你的隐私和家庭信息安全。使用前，请先阅读并了解《服务协议》和《隐私政策》。</p><div class="modal-actions"><button class="secondary-btn" data-overlay-action="privacy-no">不同意</button><button class="primary-btn" data-overlay-action="privacy-yes">同意</button></div></div></div>`);
}
function sendCode(){
  const input=document.getElementById('phoneInput');const value=(input?.value||'').replace(/\D/g,'');
  if(value.length!==11){input?.focus();input?.parentElement?.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:260});toast('请输入 11 位手机号');return;}
  state.user.phone=value;state.codeExpireAt=Date.now()+58000;saveState();navigate('login/code');
}
function resendCode(){
  state.codeExpireAt=Date.now()+58000;saveState();
  document.querySelectorAll('.code-box').forEach(x=>x.value='');
  updateCountdown();countdownTimer=setInterval(updateCountdown,250);document.querySelector('.code-box')?.focus();toast('验证码已重新发送');
}
function quickLogin(){
  const cb=document.getElementById('quickConsent');state.quickConsent=!!cb?.checked;saveState();
  if(!state.quickConsent){cb?.closest('.agreement-row')?.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:260});toast('请先阅读并同意协议');return;}
  finishLogin();
}
function finishLogin(){
  state.loggedIn=true;state.consent=true;saveState();
  routeStack=[];
  navigate('login/success',{replace:true,clearStack:true});
  aiTimer=setTimeout(()=>navigate('home',{replace:true,clearStack:true}),760);
}

function startScenario(kind){
  const map={
    homework:{seed:'刚刚又因为写作业吵架了，我不知道接下来怎么办。',reply:'我在。先不急着判断谁对谁错。第一次提醒孩子时，他当时正在做什么？'},
    repeat:{seed:'这个问题总是反复发生，说了很多次还是没变化。',reply:'听起来你已经为这件事尝试了很多次，也有点累了。最近一次发生时，是从哪个瞬间开始升级的？'},
    emotion:{seed:'我现在有点情绪卡住了，想先和你说一说。',reply:'好，我们先不急着处理孩子的问题。此刻最困住你的，是生气、委屈、内疚，还是别的感受？'},
    distance:{seed:'孩子越来越不愿意和我说话。',reply:'这种距离感会让人很担心。最近一次你想靠近他时，他是什么反应？'}
  };
  const s=map[kind]||map.homework;
  state.chat={active:true,scenario:kind,node:'none',messages:[{role:'user',html:esc(s.seed),time:todayTime()}],typing:true,reviewResult:null,freeTurns:0};
  pendingConversationStart=true;saveState();refreshConversation({scroll:'start'});
  clearTimeout(aiTimer);
  aiTimer=setTimeout(()=>{state.chat.typing=false;addChatMessage('ai',s.reply);state.chat.node='context1';saveState();refreshConversation({scroll:'auto'});},360);
}
function addChatMessage(role,text,{html=false,kind='',stage='',alt=false}={}){
  state.chat.messages.push({role,html:html?text:esc(text),time:kind?'':todayTime(),kind,stage,alt});
}
function addChatArtifact(kind,html,{stage='',alt=false}={}){addChatMessage('system',html,{html:true,kind,stage,alt});}
function setChatNode(node){state.chat.node=node;saveState();refreshConversation({scroll:'auto'});}
function setChatNodeWithMessage(node,message){addChatMessage('ai',message);state.chat.node=node;saveState();refreshConversation({scroll:'auto'});}
function scheduleAI(message,node,delay=420,{html=false}={}){
  state.chat.typing=true;saveState();refreshConversation({scroll:'auto'});
  clearTimeout(aiTimer);
  aiTimer=setTimeout(()=>{state.chat.typing=false;addChatMessage('ai',message,{html});state.chat.node=node;saveState();refreshConversation({scroll:'auto'});},delay);
}
function handleChatChoice(value){
  addChatMessage('user',value);
  if(state.chat.node==='context1')scheduleAI('听起来你当时已经有点着急了。那一刻你最担心的，更接近哪一种？','context2');
  else if(state.chat.node==='context2')scheduleAI('我大概听懂刚才发生的事情了。','invite');
  else if(state.chat.node==='revise')scheduleAI('谢谢你纠正我。我重新整理了这件事，请再看看是否更贴近。','confirm');
  else if(state.chat.node==='free-correction')scheduleAI('我明白了。谢谢你补充这个关键细节，我会按照新的信息重新理解。','restore');
  else {state.chat.node='done';saveState();refreshConversation({scroll:'auto'});}
}
function continueTalking(){addChatMessage('ai','好，我们先不往下分析。你继续说，我先听着。');state.chat.node='done';saveState();refreshConversation({scroll:'auto'});}
function handleRestoreOk(){
  addChatMessage('user','比较贴近');
  addChatArtifact('stage-summary','你确认了刚才的事件经过。',{stage:'restore'});
  scheduleAI('谢谢你确认。接下来我们一起看看，孩子和你各自可能经历了什么。','relation');
}
function askCorrection(prompt){addChatMessage('ai',prompt);state.chat.node='free-correction';saveState();refreshConversation({scroll:'auto'});}
function handleRelationChoice(value){
  addChatMessage('user',value);
  addChatArtifact('stage-summary','你补充了孩子当时更接近的状态：'+esc(value),{stage:'relation'});
  scheduleAI('谢谢你补充。结合这些信息，我把我们现在形成的理解整理出来了。','confirm');
}
function handleConfirmOk(){
  addChatMessage('user','这个理解比较贴近');
  addChatArtifact('interpret-confirmed','',{stage:'confirm'});
  scheduleAI('基于我们刚才形成的理解，要不要一起找一个今天就能尝试的小行动？','action-invite');
}
function handleRevise(value){addChatMessage('user',value);scheduleAI('谢谢你纠正我。我重新整理了这件事，请再看看是否更贴近。','confirm');}
function acceptAction(alt){
  const existing=state.actions.find(a=>a.id==='a26');
  const title=alt?'今晚只练习“少提醒一次”':'写作业时先不要连续催第二遍，给孩子 5 分钟缓冲';
  if(existing){existing.title=title;existing.status='pending';existing.result='•';existing.resultText='待尝试';}
  else state.actions.push({id:'a26',date:'2026-08-26',title,source:'写作业又吵起来了',result:'•',resultText:'待尝试',status:'pending'});
  addChatArtifact('action-saved','',{alt});
  addChatMessage('ai','好，我帮你记下这个小行动。等你试过以后，成长总结里会等你回来看看结果。');
  state.chat.node='done';saveState();refreshConversation({scroll:'auto'});toast('已加入成长总结');
}
function sendChatInput(){
  const input=document.getElementById('chatInput');const value=(input?.value||'').trim();if(!value)return;
  input.value='';autoSizeTextarea(input);document.getElementById('chatSendBtn')?.classList.remove('send-ready');
  if(!state.chat.active){
    state.chat={active:true,scenario:'free',node:'none',messages:[{role:'user',html:esc(value),time:todayTime()}],typing:true,reviewResult:null,freeTurns:0};
    pendingConversationStart=true;saveState();refreshConversation({scroll:'start'});
    clearTimeout(aiTimer);
    aiTimer=setTimeout(()=>{state.chat.typing=false;addChatMessage('ai','我在。你慢慢说，我先陪你把事情看清楚。<br>这件事是从哪个瞬间开始变得不对劲的？',{html:true});state.chat.node='context1';saveState();refreshConversation({scroll:'auto'});},360);return;
  }
  addChatMessage('user',value);
  if(state.chat.node==='free-correction')scheduleAI('我明白了。谢谢你补充这个关键细节，我会按照新的信息重新理解。','restore');
  else if(state.chat.node==='revise')scheduleAI('谢谢你纠正我。结合你刚才补充的内容，我重新整理了一下。','confirm');
  else{
    state.chat.freeTurns=(state.chat.freeTurns||0)+1;
    const next=state.chat.freeTurns>=2?'invite':'done';
    scheduleAI(state.chat.freeTurns>=2?'我大概听懂刚才发生的事情了。':'我听到了。你继续说，我先陪你把事情理清楚。',next);
  }
}
function scrollLatest(){const area=document.getElementById('aiScroll');if(area){chatFollowLatest=true;area.scrollTo({top:area.scrollHeight,behavior:'smooth'});syncLatestButton(0);}}

function changeMonth(delta){
  const [y,m]=state.growth.month.split('-').map(Number);const d=new Date(y,m-1+delta,1);state.growth.month=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;saveState();renderRoute(currentRoute);
}
function showActionFeedback(id){
  const a=state.actions.find(x=>x.id===id)||state.actions.find(x=>x.status==='pending');if(!a)return;
  showBottomSheet(`<h2 class="sheet-title-with-icon"><span class="sheet-title-icon">${svg.sprout}</span>做到了</h2><div class="sheet-sub">这次试下来感觉怎么样？</div><button class="sheet-option" data-overlay-action="feedback-result" data-id="${a.id}" data-result="🙂" data-text="比之前顺一点">🙂　比之前顺一点</button><button class="sheet-option" data-overlay-action="feedback-result" data-id="${a.id}" data-result="😐" data-text="好像没什么变化">😐　好像没什么变化</button><button class="sheet-option" data-overlay-action="feedback-result" data-id="${a.id}" data-result="🙁" data-text="反而更糟了">🙁　反而更糟了</button><button class="sheet-footer-btn" data-overlay-action="feedback-talk" data-id="${a.id}">想和小亲具体聊聊</button>`);
}
function recordActionResult(id,result,text){const a=state.actions.find(x=>x.id===id);if(a){a.result=result;a.resultText=text;a.status='done';state.growth.selectedDate=a.date;}saveState();closeOverlay();renderRoute(currentRoute);toast('已记录：'+text);}
function enterReviewMode(id,result){
  const a=state.actions.find(x=>x.id===id)||state.actions[0];const r=result||a.result;
  const openings={
    '🙂':'上次你试着少催了一次。听起来有一点点变化了。你愿意和我说说，哪里比之前顺了一点吗？',
    '😐':'你已经愿意去试一次了。虽然现在看起来变化不明显，但我们可以一起看看，卡在了哪里。',
    '🙁':'这次试下来让你更挫败了，是吗？你可以先跟我说说，哪里让你最难受。我们先把这次经历理一理，不急着下结论。'
  };
  state.chat.active=true;state.chat.node='done';state.chat.reviewResult=r;state.chat.messages.push({role:'ai',html:'<b>复盘 / 督导</b><br>'+esc(openings[r]||'你愿意回来聊聊这次尝试，说明这件事对你还是挺重要的。你可以从最想说的地方开始，我先听你讲讲这次到底发生了什么。'),time:todayTime()});saveState();closeOverlay();navigate('home');
}
function weeklyToChat(){state.chat.active=true;state.chat.node='done';addChatMessage('ai','<b>本周复盘</b><br>这周你已经开始少一点马上纠正，多一点先听发生了什么。你最想继续聊哪一次变化？',{html:true});saveState();navigate('home');}

function toggleMemory(id){const m=state.archive.memories.find(x=>x.id===id);if(m)m.enabled=!m.enabled;saveState();renderRoute(currentRoute);}
function confirmMemoryClear(){showConfirm('清除全部 AI 记忆','清除后，小亲不会再使用这些信息。原始聊天记录不会被删除。',()=>{state.archive.memories=[];saveState();renderRoute(currentRoute);toast('AI 记忆已清除');});}
let memberEditRoleDraft='';
let memberGenderDraft='男孩';
let memberNameDraft='';
let memberAgeDraft=10;
let newMemberRelationDraft='孩子';
let newMemberNameDraft='';
function showMemberEdit(type,preserve=false){
  const parent=type==='parent';
  if(parent){
    if(!preserve){memberEditRoleDraft=isFamilyRole(state.user.role)?state.user.role:'';memberNameDraft=state.user.name;}
    showBottomSheet(`<h2>编辑家长信息</h2><div class="sheet-sub">成员信息由你确认，家庭身份与个人资料使用同一套选项。</div><div class="field"><input id="memberNameInput" value="${esc(memberNameDraft)}" maxlength="16" placeholder="称呼或昵称"></div><div class="role-option-list compact-role-list">${FAMILY_ROLE_OPTIONS.map(item=>`<button class="sheet-option role-option ${memberEditRoleDraft===item.value?'selected':''}" data-overlay-action="member-role-draft" data-role="${esc(item.value)}"><span>${esc(item.label)}</span>${memberEditRoleDraft===item.value?`<i>${svg.check}</i>`:''}</button>`).join('')}</div><button class="primary-btn full-btn" data-overlay-action="member-save" data-member="parent">保存</button>`);
  }else{
    const child=state.family?.children?.[0]||{name:'小明',age:10,gender:'男孩',grade:'小学四年级'};
    if(!preserve){memberGenderDraft=child.gender||'男孩';memberNameDraft=child.name;memberAgeDraft=child.age;}
    showBottomSheet(`<h2>编辑孩子信息</h2><div class="sheet-sub">年龄和性别拆开填写，避免把多项信息塞进一个自由文本框。</div><div class="field"><input id="memberNameInput" value="${esc(memberNameDraft)}" maxlength="16" placeholder="孩子昵称"></div><div class="field"><input id="memberAgeInput" type="number" min="0" max="25" value="${esc(memberAgeDraft)}" placeholder="年龄"></div><div class="role-option-list compact-role-list">${['男孩','女孩','暂不填写'].map(g=>`<button class="sheet-option role-option ${memberGenderDraft===g?'selected':''}" data-overlay-action="member-gender-draft" data-gender="${g}"><span>${g}</span>${memberGenderDraft===g?`<i>${svg.check}</i>`:''}</button>`).join('')}</div><button class="primary-btn full-btn" data-overlay-action="member-save" data-member="child">保存</button>`);
  }
}
function showMemberAdd(){
  newMemberRelationDraft='孩子';newMemberNameDraft='';
  renderMemberAddSheet();
}
function renderMemberAddSheet(){
  showBottomSheet(`<h2>添加家庭成员</h2><div class="sheet-sub">关系使用固定选项，不再自由填写。</div><div class="field"><input id="newMemberName" value="${esc(newMemberNameDraft)}" placeholder="成员称呼"></div><div class="role-option-list compact-role-list">${['孩子','配偶','其他家庭成员'].map(r=>`<button class="sheet-option role-option ${newMemberRelationDraft===r?'selected':''}" data-overlay-action="member-add-role-draft" data-relation="${r}"><span>${r}</span>${newMemberRelationDraft===r?`<i>${svg.check}</i>`:''}</button>`).join('')}</div><button class="primary-btn full-btn" data-overlay-action="member-add-save">添加成员</button>`);
}
function archiveToChat(member){state.chat.active=true;state.chat.node='done';addChatMessage('ai',`你想补充或修正${member==='parent'?'家长':'孩子'}档案。哪一部分和真实情况不太一样？`);saveState();navigate('home');}

function rememberAssessmentProgress(status='progress'){
  const id=state.assessments.currentId;if(!id)return;
  const record={status,questionIndex:state.assessments.questionIndex,answers:{...state.assessments.answers}};
  if(status==='completed'){
    const d=new Date();record.completedDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  state.assessments.progressById[id]=record;
}
function startAssessment(id){
  if(!ASSESSMENTS.some(a=>a.id===id))return;
  const previous=state.assessments.progressById[id];
  state.assessments.currentId=id;
  state.assessments.questionIndex=previous&&previous.status==='progress'?Math.max(0,Math.min(QUESTIONS.length-1,previous.questionIndex||0)):0;
  state.assessments.answers=previous&&previous.status==='progress'?{...previous.answers}:{};
  state.assessments.reportReady=false;
  rememberAssessmentProgress();saveState();navigate('assessments/questions/'+id);
}
function answerAssessment(value){state.assessments.answers[state.assessments.questionIndex]=value;rememberAssessmentProgress();saveState();renderRoute(currentRoute);}
function assessmentPrev(){if(state.assessments.questionIndex>0){state.assessments.questionIndex--;rememberAssessmentProgress();saveState();renderRoute(currentRoute);}}
function assessmentNext(id){
  if(!state.assessments.answers[state.assessments.questionIndex])return;
  if(state.assessments.questionIndex<QUESTIONS.length-1){state.assessments.questionIndex++;rememberAssessmentProgress();saveState();renderRoute(currentRoute);}
  else{state.assessments.reportReady=false;rememberAssessmentProgress();saveState();navigate('assessments/generating/'+id);}
}
function confirmAssessmentExit(){showConfirm('暂时退出测评？','当前进度会自动保存，下次可以继续。',()=>{closeOverlay();goBack('assessments',true);});}
function scheduleReport(id){aiTimer=setTimeout(()=>{state.assessments.currentId=id;state.assessments.reportReady=true;state.assessments.tab='completed';rememberAssessmentProgress('completed');saveState();navigate('assessments/report/'+id,{replace:true});},1200);}
function showMemberSelect(){showBottomSheet(`<h2>选择测评对象</h2><div class="sheet-sub">测评结果会保存到对应成员档案。</div><button class="sheet-option" data-overlay-action="member-selected">${svg.child}　小明 · 10 岁</button><button class="sheet-option" data-overlay-action="member-add">＋　添加家庭成员</button>`);}
function reportToChat(){state.chat.active=true;state.chat.node='done';addChatMessage('ai','我看到了这次测评结果。结果显示“连续催促”可能会让孩子更难开始任务。<br><br>这和你们最近发生的事情贴近吗？',{html:true});saveState();navigate('home');}
function reportToAction(){
  let a=state.actions.find(x=>x.id==='assessment-action');
  if(!a){a={id:'assessment-action',date:'2026-09-03',title:'作业开始前，先帮助孩子说清第一步',source:'孩子任务启动观察报告',result:'•',resultText:'待尝试',status:'pending'};state.actions.push(a);}
  saveState();toast('已生成小行动并加入成长总结');
}

function toggleGuideFavorite(id){const i=state.guides.favorites.indexOf(id);if(i>=0)state.guides.favorites.splice(i,1);else state.guides.favorites.push(id);saveState();renderRoute(currentRoute);toast(i>=0?'已取消收藏':'已收藏');}
function guideToChat(title){state.chat.active=true;state.chat.node='done';addChatMessage('ai',`你刚刚看了《${title}》。这篇内容和你们最近的情况，哪里最像？`);saveState();navigate('home');}
function guideToAction(title){
  showBottomSheet(`<h2>把内容变成一个行动</h2><div class="sheet-sub">基于《${esc(title||'这篇内容')}》</div><div class="latest-action"><b>第一次提醒时，先问清孩子卡在哪里</b><p>“你是还没准备好，还是不知道从哪里开始？”</p></div><button class="primary-btn full-btn" data-overlay-action="guide-action-add">加入今天行动</button><button class="ghost-btn full-btn" data-overlay-action="close">换一个</button>`);
}

function showPaymentSheet(){
  const plan=state.membership.plan||'year';const price=plan==='year'?'¥198':'¥29';
  showBottomSheet(`<h2>确认支付 ${price}</h2><div class="sheet-sub">${plan==='year'?'年度会员':'月度会员'} · Demo 模拟支付</div><div class="pay-method"><span class="pay-logo wx">微</span><span style="flex:1"><b>微信支付</b><span class="subtle" style="display:block">推荐使用</span></span><span>●</span></div><div class="pay-method"><span class="pay-logo zfb">支</span><span style="flex:1"><b>支付宝</b><span class="subtle" style="display:block">安全支付</span></span><span>○</span></div><button class="primary-btn full-btn" data-overlay-action="payment-success" style="margin-top:16px">模拟支付成功</button><button class="secondary-btn full-btn" data-overlay-action="payment-fail" style="margin-top:10px">模拟支付失败</button>`);
}
function completePayment(success){
  if(!success){closeOverlay();toast('支付失败，请重试');return;}
  const plan=state.membership.plan||'year';const price=plan==='year'?'¥198':'¥29';state.membership.active=true;state.membership.orders.unshift({id:uid('order'),title:plan==='year'?'年度会员':'月度会员',amount:price,status:'支付成功',date:'2026-09-03'});saveState();
  showOverlay(`<div class="overlay"><div class="modal-card" style="text-align:center"><div class="success-icon">✓</div><h2 style="margin-top:15px">开通成功</h2><p>你现在可以查看完整测评报告和长期成长总结。</p><button class="primary-btn full-btn" data-overlay-action="payment-done">开始使用</button></div></div>`);
}


let profileRoleDraft='';
let avatarCropState=null;

function showProfileAvatarSheet(){
  showBottomSheet(`<h2>更换头像</h2><div class="sheet-sub">选择照片后可以先调整位置和大小，确认后才会保存。</div><div class="avatar-sheet-preview">${userAvatarMarkup('avatar-sheet-img')}</div><button class="sheet-option" data-overlay-action="profile-avatar-album">${svg.image}　从相册选择</button><button class="sheet-option" data-overlay-action="profile-avatar-camera">${svg.camera}　拍照</button>${state.user.avatarImage?`<button class="sheet-option danger-soft" data-overlay-action="profile-avatar-default">恢复默认头像</button>`:''}`);
}
function showNicknameEditor(){
  showOverlay(`<div class="editor-layer"><div class="editor-statusbar"><span>9:41</span><span class="status-icons">▮▮▮　Wi-Fi　▰</span></div><div class="editor-topbar"><button class="editor-cancel" data-overlay-action="editor-close">取消</button><b>编辑昵称</b><button class="editor-done" data-overlay-action="profile-name-confirm">完成</button></div><div class="editor-body"><div class="editor-field"><input id="nicknameEditorInput" value="${esc(state.user.name)}" maxlength="16" placeholder="请输入昵称"></div><div class="editor-note">最多 16 个字</div></div></div>`);
  setTimeout(()=>{const input=document.getElementById('nicknameEditorInput');input?.focus();input?.setSelectionRange(input.value.length,input.value.length);},40);
}
function showProfileRoleEditor(){
  profileRoleDraft=isFamilyRole(state.user.role)?state.user.role:'';
  renderProfileRoleEditor();
}
function renderProfileRoleEditor(){
  showOverlay(`<div class="editor-layer"><div class="editor-statusbar"><span>9:41</span><span class="status-icons">▮▮▮　Wi-Fi　▰</span></div><div class="editor-topbar"><button class="editor-cancel" data-overlay-action="editor-close">取消</button><b>选择家庭身份</b><button class="editor-done" data-overlay-action="profile-role-confirm" ${profileRoleDraft?'':'disabled'}>完成</button></div><div class="editor-body"><div class="role-editor-list">${FAMILY_ROLE_OPTIONS.map(item=>`<button class="role-editor-option ${profileRoleDraft===item.value?'selected':''}" data-overlay-action="profile-role-draft" data-role="${esc(item.value)}"><span>${esc(item.label)}</span><i>${profileRoleDraft===item.value?svg.check:''}</i></button>`).join('')}</div><div class="editor-note">家庭身份用于家庭档案和小亲对你的称呼，可随时修改。</div></div></div>`);
}
function openProfileAvatarPicker(capture=false){
  const input=document.createElement('input');input.type='file';input.accept='image/*';if(capture)input.capture='user';
  input.onchange=()=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onerror=()=>toast('头像读取失败，请重试');reader.onload=()=>showAvatarCropEditor(reader.result);reader.readAsDataURL(file);};
  input.click();
}
function showAvatarCropEditor(dataUrl){
  const img=new Image();
  img.onload=()=>{
    const logical=260;
    avatarCropState={image:img,dataUrl,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,baseScale:Math.max(logical/img.naturalWidth,logical/img.naturalHeight),zoom:1,offsetX:0,offsetY:0,dragging:false,lastX:0,lastY:0};
    showOverlay(`<div class="editor-layer"><div class="editor-statusbar"><span>9:41</span><span class="status-icons">▮▮▮　Wi-Fi　▰</span></div><div class="editor-topbar"><button class="editor-cancel" data-overlay-action="editor-close">取消</button><b>调整头像</b><button class="editor-done" data-overlay-action="profile-avatar-confirm">完成</button></div><div class="editor-body avatar-editor-body"><div class="avatar-crop-frame" id="avatarCropFrame"><canvas id="avatarCropCanvas" width="520" height="520"></canvas><div class="avatar-crop-mask"></div><div class="avatar-crop-ring"></div></div><div class="avatar-zoom-row"><span>－</span><input id="avatarZoom" type="range" min="1" max="3" step="0.01" value="1" aria-label="缩放头像"><span>＋</span></div><div class="avatar-editor-help">拖动照片调整位置，滑动缩放。<br>只有点击“完成”后才会更新头像。</div></div></div>`);
    bindAvatarCropEditor();drawAvatarCrop();
  };
  img.onerror=()=>toast('图片无法读取，请换一张试试');
  img.src=dataUrl;
}
function clampAvatarCrop(){
  if(!avatarCropState)return;
  const s=avatarCropState.baseScale*avatarCropState.zoom;
  const maxX=Math.max(0,(avatarCropState.naturalWidth*s-260)/2);
  const maxY=Math.max(0,(avatarCropState.naturalHeight*s-260)/2);
  avatarCropState.offsetX=Math.max(-maxX,Math.min(maxX,avatarCropState.offsetX));
  avatarCropState.offsetY=Math.max(-maxY,Math.min(maxY,avatarCropState.offsetY));
}
function drawAvatarCrop(){
  if(!avatarCropState)return;
  const canvas=document.getElementById('avatarCropCanvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');const ratio=2;
  const scale=avatarCropState.baseScale*avatarCropState.zoom*ratio;
  const dw=avatarCropState.naturalWidth*scale,dh=avatarCropState.naturalHeight*scale;
  const dx=(canvas.width-dw)/2+avatarCropState.offsetX*ratio;
  const dy=(canvas.height-dh)/2+avatarCropState.offsetY*ratio;
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#E7E8E2';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(avatarCropState.image,dx,dy,dw,dh);
}
function bindAvatarCropEditor(){
  const frame=document.getElementById('avatarCropFrame');const zoom=document.getElementById('avatarZoom');
  if(zoom)zoom.addEventListener('input',()=>{avatarCropState.zoom=Number(zoom.value)||1;clampAvatarCrop();drawAvatarCrop();});
  if(!frame)return;
  frame.addEventListener('pointerdown',e=>{if(!avatarCropState)return;avatarCropState.dragging=true;avatarCropState.lastX=e.clientX;avatarCropState.lastY=e.clientY;frame.setPointerCapture?.(e.pointerId);});
  frame.addEventListener('pointermove',e=>{if(!avatarCropState?.dragging)return;e.preventDefault();avatarCropState.offsetX+=e.clientX-avatarCropState.lastX;avatarCropState.offsetY+=e.clientY-avatarCropState.lastY;avatarCropState.lastX=e.clientX;avatarCropState.lastY=e.clientY;clampAvatarCrop();drawAvatarCrop();});
  const end=e=>{if(!avatarCropState)return;avatarCropState.dragging=false;try{frame.releasePointerCapture?.(e.pointerId);}catch(_){}};
  frame.addEventListener('pointerup',end);frame.addEventListener('pointercancel',end);
}
function saveAvatarCrop(){
  const canvas=document.getElementById('avatarCropCanvas');if(!canvas)return;
  state.user.avatarImage=canvas.toDataURL('image/jpeg',.9);saveState();avatarCropState=null;closeOverlay();renderRoute(currentRoute);toast('头像已更新');
}

function showAccountPhoneSheet(){
  showBottomSheet(`<h2>手机号</h2><div class="sheet-sub">当前绑定 ${esc(formatPhone(state.user.phone))}</div><div class="latest-action"><b>更换手机号</b><p>正式版本会先验证当前账号，再向新手机号发送验证码。</p></div><button class="primary-btn full-btn" data-overlay-action="account-phone-demo">验证并更换</button>`);
}
function showAccountWechatSheet(){
  showBottomSheet(`<h2>微信账号</h2><div class="sheet-sub">当前微信账号已绑定</div><div class="latest-action"><b>账号绑定状态正常</b><p>解除绑定前，需要先确认当前账号仍有可用的手机号登录方式。</p></div><button class="secondary-btn full-btn" data-overlay-action="account-wechat-demo">管理绑定</button>`);
}

function confirmLogout(){showConfirm('退出登录？','退出后仍会保留当前 Demo 数据。',()=>{state.loggedIn=false;routeStack=[];saveState();navigate('login',{replace:true,clearStack:true});});}
function resetDemo(){safeRemove(STORAGE_KEY);state=cloneDefault();routeStack=[];closeOverlay();closeDrawer(true);navigate('login',{replace:true,clearStack:true});toast('Demo 已重置');}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='亲智聊-demo-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('个人数据已导出');
}
function showHelpAnswer(title){showBottomSheet(`<h2>${esc(title)}</h2><div class="sheet-sub">常见问题说明</div><p class="subtle" style="font-size:14px">小亲只会使用你主动提供、并允许保存的信息。你可以在“家庭档案 → 小亲记忆”中查看、关闭或删除每一条记忆。</p><button class="primary-btn full-btn" data-overlay-action="close" style="margin-top:15px">知道了</button>`);}
function submitFeedback(){if(!(state.feedback.type&&state.feedback.text.trim().length>=10)){toast('请选择类型并填写不少于 10 个字');return;}state.feedback={type:'',text:'',contact:'',image:true};saveState();toast('意见反馈已提交');goBack(state.loggedIn?'home':'login');}
function openFilePicker(){
  const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=()=>{if(input.files&&input.files[0]){state.feedback.image=true;saveState();renderRoute(currentRoute);toast('已添加图片');}};input.click();
}
function openHistory(index){
  drawerView.selectedHistory=Number(index);
  closeDrawer(true);state.chat.active=true;state.chat.node='done';state.chat.messages=[{role:'ai',html:`这是你之前的对话：<b>${esc(CHAT_HISTORY_TITLES[index]||CHAT_HISTORY_TITLES[0])}</b><br>你可以继续从这里聊下去。`,time:todayTime()}];saveState();navigate('home');
}

function showOverlay(html){overlayRoot.innerHTML=html;}
function closeOverlay(){overlayRoot.innerHTML='';}
function showBottomSheet(content){showOverlay(`<div class="sheet-layer" data-overlay-action="scrim-close"><div class="bottom-sheet" data-sheet="1"><div class="sheet-handle"></div>${content}</div></div>`);}
function showConfirm(title,message,onConfirm){
  window.__qzlConfirm=onConfirm;
  showOverlay(`<div class="overlay"><div class="modal-card"><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="modal-actions"><button class="secondary-btn" data-overlay-action="close">取消</button><button class="primary-btn" data-overlay-action="confirm-callback">确认</button></div></div></div>`);
}
function showAgentSheet(){showBottomSheet(`<h2>选择智能体</h2><div class="sheet-sub">不同智能体仍然共享你允许使用的家庭信息。</div><button class="sheet-option" data-overlay-action="agent-select" data-agent="小亲"><b>小亲</b><span class="subtle" style="display:block">真实事件、关系理解和下一步行动</span></button><button class="sheet-option" data-overlay-action="agent-select" data-agent="成长督导"><b>成长督导</b><span class="subtle" style="display:block">回看行动过程，理解有效或无效的原因</span></button><button class="sheet-option" data-overlay-action="agent-select" data-agent="测评解读"><b>测评解读</b><span class="subtle" style="display:block">把测评结果放回家庭情境中理解</span></button>`);}
function showMoreSheet(){showBottomSheet(`<h2>更多</h2><button class="sheet-option" data-overlay-action="route" data-route="feedback">${svg.headphones}　意见反馈</button><button class="sheet-option" data-overlay-action="route" data-route="demo-tools">${svg.settings}　Demo 工具</button><button class="sheet-option" data-overlay-action="network-demo">${svg.repeat}　模拟网络异常</button>`);}
function showAttachmentSheet(){showBottomSheet(`<h2>添加内容</h2><div class="sheet-sub">Demo 只做本地预览，不会上传到服务器。</div><button class="sheet-option" data-overlay-action="camera">${svg.camera}　拍照</button><button class="sheet-option" data-overlay-action="album">${svg.image}　从相册选择</button><button class="sheet-option" data-overlay-action="attach-demo">${svg.attachment}　添加一张示例图片</button>`);}
function startVoiceMock(){
  showOverlay(`<div class="voice-overlay"><div class="voice-wave"><i></i><i></i><i></i><i></i><i></i></div><b>正在听…</b><div style="font-size:11px;margin-top:5px;color:#ddd">点击取消</div></div>`);
  overlayRoot.firstElementChild.addEventListener('click',closeOverlay,{once:true});
  aiTimer=setTimeout(()=>{if(!overlayRoot.innerHTML)return;closeOverlay();state.chat.active=true;state.chat.node='context1';state.chat.messages=[{role:'user',html:'刚刚又因为写作业吵架了。',time:todayTime()},{role:'ai',html:'我在。先不急着判断谁对谁错。第一次提醒孩子时，他正在做什么？',time:todayTime()}];saveState();renderRoute('home');toast('已转成文字');},1300);
}

function handleOverlayClick(e){
  const target=e.target.closest('[data-overlay-action]');
  if(!target){if(e.target.classList.contains('sheet-layer')||e.target.classList.contains('overlay'))closeOverlay();return;}
  const action=target.dataset.overlayAction;
  if(action==='close'||action==='scrim-close'){if(e.target===target||action==='close')closeOverlay();}
  else if(action==='privacy-no'){closeOverlay();pendingLoginTarget=null;}
  else if(action==='privacy-yes'){state.consent=true;saveState();const targetRoute=pendingLoginTarget;pendingLoginTarget=null;closeOverlay();if(targetRoute)navigate(targetRoute);}
  else if(action==='confirm-callback'){const cb=window.__qzlConfirm;window.__qzlConfirm=null;closeOverlay();if(typeof cb==='function')cb();}
  else if(action==='route'){const r=target.dataset.route;closeOverlay();navigate(r);}
  else if(action==='feedback-result'){recordActionResult(target.dataset.id,target.dataset.result,target.dataset.text);}
  else if(action==='feedback-talk'){closeOverlay();enterReviewMode(target.dataset.id);}
  else if(action==='member-save'){
    const name=document.getElementById('memberNameInput')?.value.trim();
    if(target.dataset.member==='parent'){
      if(name)state.user.name=name;
      if(memberEditRoleDraft)state.user.role=memberEditRoleDraft;
    }else{
      const child=state.family?.children?.[0];const age=Number(document.getElementById('memberAgeInput')?.value||0);
      if(child){if(name)child.name=name;if(age>=0&&age<=25)child.age=age;child.gender=memberGenderDraft||child.gender;}
    }
    saveState();closeOverlay();renderRoute(currentRoute);toast('成员信息已保存');
  }
  else if(action==='member-role-draft'){memberNameDraft=document.getElementById('memberNameInput')?.value.trim()||memberNameDraft;memberEditRoleDraft=target.dataset.role||memberEditRoleDraft;closeOverlay();showMemberEdit('parent',true);}
  else if(action==='member-gender-draft'){memberNameDraft=document.getElementById('memberNameInput')?.value.trim()||memberNameDraft;memberAgeDraft=Number(document.getElementById('memberAgeInput')?.value||memberAgeDraft);memberGenderDraft=target.dataset.gender||memberGenderDraft;closeOverlay();showMemberEdit('child',true);}
  else if(action==='member-add-role-draft'){newMemberNameDraft=document.getElementById('newMemberName')?.value.trim()||newMemberNameDraft;newMemberRelationDraft=target.dataset.relation||newMemberRelationDraft;closeOverlay();renderMemberAddSheet();}
  else if(action==='member-add-save'){
    const name=document.getElementById('newMemberName')?.value.trim();if(!name){toast('请输入成员称呼');return;}
    if(newMemberRelationDraft==='孩子')state.family.children.push({id:uid('child'),name,age:0,gender:'暂不填写',grade:''});
    else state.family.others.push({id:uid('member'),name,relation:newMemberRelationDraft});
    closeOverlay();saveState();renderRoute(currentRoute);toast('家庭成员已添加');
  }
  else if(action==='member-selected'){closeOverlay();toast('已选择小明');}
  else if(action==='member-add'){closeOverlay();showMemberAdd();}
  else if(action==='guide-action-add'){let a=state.actions.find(x=>x.id==='guide-action');if(!a){a={id:'guide-action',date:'2026-09-03',title:'第一次提醒时，先问清孩子卡在哪里',source:'关系指南',result:'•',resultText:'待尝试',status:'pending'};state.actions.push(a);}saveState();closeOverlay();toast('已加入今天行动');}
  else if(action==='payment-success')completePayment(true);
  else if(action==='payment-fail')completePayment(false);
  else if(action==='payment-done'){closeOverlay();navigate('membership',{replace:true});}
  else if(action==='agent-select'){closeOverlay();toast('已切换到'+target.dataset.agent);}
  else if(action==='editor-close'){avatarCropState=null;closeOverlay();}
  else if(action==='profile-name-confirm'){const value=document.getElementById('nicknameEditorInput')?.value.trim();if(!value){toast('请输入昵称');return;}state.user.name=value.slice(0,16);saveState();closeOverlay();renderRoute(currentRoute);toast('昵称已更新');}
  else if(action==='profile-role-draft'){profileRoleDraft=target.dataset.role||profileRoleDraft;renderProfileRoleEditor();}
  else if(action==='profile-role-confirm'){if(!profileRoleDraft){toast('请选择家庭身份');return;}state.user.role=profileRoleDraft;saveState();closeOverlay();renderRoute(currentRoute);toast('家庭身份已更新');}
  else if(action==='profile-avatar-album'){openProfileAvatarPicker(false);}
  else if(action==='profile-avatar-camera'){openProfileAvatarPicker(true);}
  else if(action==='profile-avatar-confirm'){saveAvatarCrop();}
  else if(action==='profile-avatar-default'){state.user.avatarImage='';saveState();closeOverlay();renderRoute(currentRoute);toast('已恢复默认头像');}
  else if(action==='account-phone-demo'){closeOverlay();toast('Demo：手机号验证流程已预留');}
  else if(action==='account-wechat-demo'){closeOverlay();toast('Demo：微信绑定管理已预留');}
  else if(action==='network-demo'){closeOverlay();showNetwork();}
  else if(action==='camera'||action==='album'){closeOverlay();openAttachmentFile(action==='camera');}
  else if(action==='attach-demo'){closeOverlay();state.chat.active=true;addChatMessage('user','[图片] 孩子写作业时的现场截图');addChatMessage('ai','我看到了这张图片。你愿意告诉我，当时最让你着急的是什么吗？');state.chat.node='context2';saveState();navigate('home');}
}

function openAttachmentFile(capture){
  const input=document.createElement('input');input.type='file';input.accept='image/*';if(capture)input.capture='environment';
  input.onchange=()=>{if(input.files?.[0]){state.chat.active=true;addChatMessage('user','[图片] '+input.files[0].name);addChatMessage('ai','图片已经收到。你可以再告诉我，当时发生了什么。');state.chat.node='done';saveState();navigate('home');}};input.click();
}

/* Drawer physics and gestures — V3.3 single-source geometry */
function drawerWidth(){
  // Measure the border box used by CSS. No separate 86%/380px constants.
  return drawerEl.getBoundingClientRect().width;
}
function setDrawerPhase(phase){
  const closed=phase==='closed';
  drawerEl.dataset.state=phase;
  drawerEl.setAttribute('aria-hidden',String(closed));
  drawerEl.toggleAttribute('inert',closed);
  drawerScrim.style.visibility=closed?'hidden':'visible';
}
function settleClosedDrawer(){
  if(drawer.open||drawer.dragging||drawer.progress>0)return;
  clearTimeout(drawerCloseTimer);drawerCloseTimer=null;
  drawerEl.classList.remove('animating');
  mainViewport.classList.remove('animating');
  drawerScrim.classList.remove('animating','active');
  drawerScrim.style.transition='none';
  drawerEl.style.transform='translate3d(-100%,0,0)';
  mainViewport.style.transform='none';
  mainViewport.style.borderRadius='0px';
  drawerScrim.style.opacity='0';
  setDrawerPhase('closed');
}
function setDrawerProgress(value,{animate=false}={}){
  const p=Math.max(0,Math.min(1,value));
  const wasVisible=drawerEl.dataset.state!=='closed';
  const shouldAnimate=animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  clearTimeout(drawerCloseTimer);drawerCloseTimer=null;
  drawer.progress=p;
  drawerEl.classList.toggle('animating',shouldAnimate);
  mainViewport.classList.toggle('animating',shouldAnimate);
  drawerScrim.classList.toggle('animating',shouldAnimate);
  drawerScrim.style.transition=shouldAnimate?'':'none';
  // Percentage is relative to the drawer's OWN border box; it also stays
  // correct after viewport resize, without recalculating a stale pixel offset.
  drawerEl.style.transform=`translate3d(${(p-1)*100}%,0,0)`;
  mainViewport.style.transform=p===0?'none':`translate3d(${p*18}px,0,0) scale(${1-p*.015})`;
  mainViewport.style.borderRadius=`${p*24}px`;
  mainViewport.style.overflow='hidden';
  drawerScrim.style.opacity=String(p*.24);
  drawerScrim.classList.toggle('active',p>.01);
  if(p>0){
    setDrawerPhase(drawer.dragging?'dragging':(p===1?(shouldAnimate?'opening':'open'):'dragging'));
  }else if(shouldAnimate&&wasVisible){
    setDrawerPhase('closing');
    // transitionend is primary; fallback also covers interrupted transitions.
    drawerCloseTimer=setTimeout(settleClosedDrawer,320);
  }else{
    settleClosedDrawer();
  }
}
function cancelDrawerTracking(){
  cancelAnimationFrame(drawer.raf);drawer.raf=0;
  drawer.tracking=false;drawer.dragging=false;drawer.direction=null;
}
function openDrawer(immediate=false){
  if(!state.loggedIn||routeBase(currentRoute)!=='home')return;
  const snap=drawerOpenScrollSnapshot;drawerOpenScrollSnapshot=null;
  blurChatInputPreserveScroll(snap);
  cancelDrawerTracking();drawer.open=true;renderDrawer();setDrawerProgress(1,{animate:!immediate});
}
function closeDrawer(immediate=false){
  rememberDrawerScroll();
  cancelDrawerTracking();drawer.open=false;setDrawerProgress(0,{animate:!immediate});
}
function finishDrawer(open){drawer.open=open;setDrawerProgress(open?1:0,{animate:true});}
drawerEl.addEventListener('transitionend',e=>{
  if(e.target!==drawerEl||e.propertyName!=='transform')return;
  if(!drawer.open&&drawer.progress===0)settleClosedDrawer();
  else if(drawer.open&&!drawer.dragging&&drawer.progress===1)setDrawerPhase('open');
});

function pointerStart(e){
  if(e.isPrimary===false||(e.button!==undefined&&e.button!==0)||overlayRoot.innerHTML)return;
  drawerHadMotion=false;drawerSuppressClickUntil=0;drawerPointerId=e.pointerId;
  // Edge gestures belong only to the AI home page, never to secondary pages.
  if(!state.loggedIn||routeBase(currentRoute)!=='home')return;
  const rect=frame.getBoundingClientRect();const x=e.clientX-rect.left;const y=e.clientY-rect.top;
  const canOpen=!drawer.open&&drawer.progress===0&&x>=0&&x<=24;
  const canClose=drawer.open&&x<=drawerWidth()+20;
  if(canOpen){const area=document.getElementById('aiScroll');blurChatInputPreserveScroll(area?.scrollTop??null);}
  if(!canOpen&&!canClose)return;
  drawer.tracking=true;drawer.dragging=false;drawer.direction=null;
  drawer.startX=x;drawer.startY=y;drawer.startProgress=drawer.progress;
  drawer.pendingProgress=drawer.progress;drawer.startOpen=drawer.open;
  drawer.lastX=x;drawer.lastT=performance.now();drawer.velocity=0;
}
function pointerMove(e){
  if(!drawer.tracking||drawerPointerId!==e.pointerId)return;
  const rect=frame.getBoundingClientRect();const x=e.clientX-rect.left;const y=e.clientY-rect.top;
  const dx=x-drawer.startX;const dy=y-drawer.startY;
  if(!drawer.direction&&Math.hypot(dx,dy)>7){
    drawerHadMotion=true;drawerSuppressClickUntil=performance.now()+400;
    drawer.direction=Math.abs(dx)>Math.abs(dy)*1.2?'x':'y';
    // Yield vertical gestures to the ONE native scroller; do not capture the
    // pointer or synthesize a second scroll area.
    if(drawer.direction==='y'){drawer.tracking=false;return;}
  }
  if(drawer.direction!=='x')return;
  if(!drawer.dragging){drawer.dragging=true;frame.setPointerCapture?.(e.pointerId);}
  e.preventDefault();
  const now=performance.now();const dt=Math.max(1,now-drawer.lastT);
  drawer.velocity=(x-drawer.lastX)/dt;drawer.lastX=x;drawer.lastT=now;
  const w=drawerWidth();if(w<=0)return;
  drawer.pendingProgress=Math.max(0,Math.min(1,drawer.startProgress+dx/w));
  cancelAnimationFrame(drawer.raf);
  drawer.raf=requestAnimationFrame(()=>setDrawerProgress(drawer.pendingProgress));
}
function pointerEnd(e){
  if(drawerPointerId!==e.pointerId)return;
  if(drawerHadMotion)drawerSuppressClickUntil=performance.now()+400;
  drawerPointerId=null;
  if(!drawer.tracking)return;drawer.tracking=false;
  if(!drawer.dragging)return;
  // A queued move must not repaint an already-closed drawer after release.
  cancelAnimationFrame(drawer.raf);drawer.raf=0;
  const pending=drawer.pendingProgress;
  const wasOpen=drawer.startOpen;
  drawer.dragging=false;
  setDrawerProgress(pending);
  const shouldOpen=e.type==='pointercancel'?wasOpen:
    (wasOpen?(pending>.65&&drawer.velocity>-0.45):(pending>.35||drawer.velocity>.45));
  finishDrawer(shouldOpen);
  if(frame.hasPointerCapture?.(e.pointerId))frame.releasePointerCapture(e.pointerId);
}
frame.addEventListener('click',e=>{
  if(e.detail===0||performance.now()>=drawerSuppressClickUntil)return;
  if(drawerEl.contains(e.target)||e.target===drawerScrim){e.preventDefault();e.stopImmediatePropagation();}
},true);
frame.addEventListener('pointerdown',e=>{
  const trigger=e.target.closest?.('[data-action="drawer-open"]');
  if(trigger){const area=document.getElementById('aiScroll');drawerOpenScrollSnapshot=area?.scrollTop??null;}
},true);
frame.addEventListener('pointerdown',pointerStart);
frame.addEventListener('pointermove',pointerMove,{passive:false});
frame.addEventListener('pointerup',pointerEnd);frame.addEventListener('pointercancel',pointerEnd);
drawerScrim.addEventListener('click',()=>{if(!drawer.dragging)closeDrawer();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(drawer.open)closeDrawer();else if(overlayRoot.innerHTML)closeOverlay();else goBack();}});

/* Extra route bindings delegated by inputs */
screenHost.addEventListener('input',e=>{
  if(e.target.id==='guideSearch'){state.guides.query=e.target.value;saveState();clearTimeout(aiTimer);aiTimer=setTimeout(()=>{if(routeBase(currentRoute)==='guides')renderRoute(currentRoute);},200);}
});

function syncDebug(){frame.classList.toggle('debug-mode',state.debug||safeGet(DEBUG_KEY)==='1');}
document.getElementById('debugFab').addEventListener('click',()=>navigate('demo-tools'));

/* Initialize */
migrateCenterState();
renderRoute(normalizeRoute());
syncDebug();
setDrawerProgress(0);

})();
