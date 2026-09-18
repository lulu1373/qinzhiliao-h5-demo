(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.QZLPointsV2Model=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const DAY=86400000;
  const CHECKIN_REWARDS=[2,2,3,2,3,3,5];
  const LEVELS=[
    {level:1,name:'初心萌芽',min:0,max:99,benefit:'基础功能使用'},
    {level:2,name:'坚定前行',min:100,max:299,benefit:'部分课程优惠'},
    {level:3,name:'成长同行者',min:300,max:599,benefit:'专属徽章 · 更多内容'},
    {level:4,name:'温暖引领者',min:600,max:999,benefit:'更多课程优惠 · 专属活动'},
    {level:5,name:'发光的你',min:1000,max:Infinity,benefit:'定制权益 + 线下活动'}
  ];
  const TASKS=[
    {id:'checkin',title:'每日签到',desc:'每天回来看看自己',reward:2,limit:1,route:'points/checkin',group:'daily',sourceType:'checkin'},
    {id:'chat',title:'完成一次对话',desc:'和小亲完成一次真实梳理',reward:1,limit:1,route:'home',group:'daily',sourceType:'chat_summary'},
    {id:'card',title:'完成一张亲子卡',desc:'把一次理解留下来',reward:3,limit:1,route:'home',group:'growth',sourceType:'card_saved'},
    {id:'feedback',title:'完成行动反馈',desc:'记录实践后的真实结果',reward:5,limit:1,route:'growth',group:'growth',sourceType:'action_feedback'},
    {id:'course',title:'学习一节课程',desc:'完成一节课程并回顾',reward:5,limit:1,route:'courses',group:'growth',sourceType:'course_lesson'},
    {id:'community',title:'社区发布优质内容',desc:'分享一次真实的家庭尝试',reward:1,limit:3,route:'experience/community',group:'community',sourceType:'community_post'}
  ];
  const REWARDS=[
    {id:'reward-course',title:'亲子沟通体验课',desc:'用更温和的方式理解孩子',cost:200,kind:'课程',tone:'peach'},
    {id:'reward-tools',title:'情绪管理工具包',desc:'5 个实用工具卡片',cost:120,kind:'工具',tone:'violet'},
    {id:'reward-card',title:'定制亲子对话卡',desc:'专属你的亲子沟通主题',cost:80,kind:'实物',tone:'blue'},
    {id:'reward-plan',title:'7 天成长陪伴计划',desc:'每天一个小练习',cost:50,kind:'会员',tone:'pink'}
  ];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const asArray=v=>Array.isArray(v)?v:[];
  const validDate=v=>Number.isFinite(new Date(v).getTime());
  const iso=v=>validDate(v)?new Date(v).toISOString():new Date().toISOString();
  const localDay=v=>{
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(v||'')))return String(v);
    return new Date(iso(v)).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
  };
  const addDays=(day,delta)=>{
    const [y,m,d]=day.split('-').map(Number);
    const dt=new Date(Date.UTC(y,m-1,d+delta,12));
    return dt.toISOString().slice(0,10);
  };
  const monthKey=day=>String(day||'').slice(0,7);
  function normalizeMeta(raw){
    const x=raw&&typeof raw==='object'?raw:{};
    return {
      version:2,
      reminder:{dismissedDate:typeof x.reminder?.dismissedDate==='string'?x.reminder.dismissedDate:''},
      rewards:asArray(x.rewards).filter(r=>r&&r.rewardId&&r.redeemedAt).map(clone)
    };
  }
  const ledgerOf=course=>asArray(course?.points?.ledger);
  function checkedDays(course){
    return [...new Set(ledgerOf(course).filter(x=>x?.sourceType==='checkin'&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.sourceDay||''))).map(x=>x.sourceDay))].sort();
  }
  function hasCheckin(course,day){return checkedDays(course).includes(day);}
  function streak(course,asOf){
    const set=new Set(checkedDays(course)),today=localDay(asOf);
    let cursor=set.has(today)?today:addDays(today,-1),n=0;
    while(set.has(cursor)){n++;cursor=addDays(cursor,-1);}
    return n;
  }
  function longestStreak(course){
    const days=checkedDays(course);let best=0,run=0,prev='';
    for(const d of days){run=prev&&addDays(prev,1)===d?run+1:1;best=Math.max(best,run);prev=d;}
    return best;
  }
  function lifetimeEarned(course){return ledgerOf(course).filter(x=>x.kind==='earn').reduce((s,x)=>s+Math.max(0,Number(x.amount||0)),0);}
  function lifetimeSpent(course){return ledgerOf(course).filter(x=>x.kind==='spend').reduce((s,x)=>s+Math.abs(Number(x.amount||0)),0);}
  function availableBalance(course,now){
    const t=new Date(iso(now)).getTime();
    return ledgerOf(course).filter(x=>x.kind!=='spend'&&Number(x.remaining)>0&&(!x.expiresAt||new Date(x.expiresAt).getTime()>t)).reduce((s,x)=>s+Number(x.remaining||0),0);
  }
  function addEarn(course,sourceType,sourceId,amount,now,{dailyLimit=1,title=''}={}){
    const next=clone(course||{});next.points=next.points||{};next.points.ledger=asArray(next.points.ledger);
    const day=localDay(now),key=String(sourceId||'');
    if(next.points.ledger.some(x=>x.sourceType===sourceType&&x.sourceId===key))return {course:next,grant:0,reason:'duplicate'};
    const todayCount=next.points.ledger.filter(x=>x.kind==='earn'&&x.sourceType===sourceType&&x.sourceDay===day).length;
    if(todayCount>=dailyLimit)return {course:next,grant:0,reason:'limit'};
    const grant=Math.max(0,Number(amount||0));if(!grant)return {course:next,grant:0,reason:'zero'};
    const exp=new Date(iso(now));exp.setFullYear(exp.getFullYear()+1);
    next.points.ledger.push({
      entryId:'pv2_'+sourceType+'_'+String(key||day).replace(/[^a-zA-Z0-9_-]/g,'').slice(-80),
      kind:'earn',amount:grant,remaining:grant,expiresAt:exp.toISOString(),
      sourceType,sourceId:key,sourceDay:day,occurredAt:iso(now),title
    });
    next.points.balance=next.points.ledger.reduce((s,x)=>s+Math.max(0,Number(x.remaining||0)),0);
    return {course:next,grant,reason:''};
  }
  function claimCheckin(course,meta,now){
    const day=localDay(now);
    if(hasCheckin(course,day))return {course:clone(course),meta:normalizeMeta(meta),grant:0,already:true,dayIndex:((streak(course,day)-1)%7)+1};
    const previous=streak(course,addDays(day,-1)),dayIndex=(previous%7)+1,reward=CHECKIN_REWARDS[dayIndex-1];
    const result=addEarn(course,'checkin','checkin:'+day,reward,now,{dailyLimit:1,title:'每日签到'});
    const nextMeta=normalizeMeta(meta);nextMeta.reminder.dismissedDate=day;
    return {course:result.course,meta:nextMeta,grant:result.grant,already:false,dayIndex};
  }
  function taskStatus(course,now){
    const day=localDay(now),ledger=ledgerOf(course);
    return TASKS.map(t=>{
      const count=ledger.filter(x=>x.kind==='earn'&&x.sourceType===t.sourceType&&x.sourceDay===day).length;
      return {...t,count,done:count>=t.limit};
    });
  }
  function monthStats(course,month,now){
    const m=month||monthKey(localDay(now)),days=checkedDays(course).filter(d=>d.startsWith(m));
    const earned=ledgerOf(course).filter(x=>x.kind==='earn'&&String(x.sourceDay||'').startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
    return {days:days.length,earned,longest:longestStreak(course)};
  }
  function calendar(course,month,now){
    const today=localDay(now),m=month||monthKey(today),[y,mo]=m.split('-').map(Number);
    const first=new Date(Date.UTC(y,mo-1,1,12)),last=new Date(Date.UTC(y,mo,0,12)).getUTCDate();
    const offset=(first.getUTCDay()+6)%7,set=new Set(checkedDays(course)),cells=[];
    for(let i=0;i<offset;i++)cells.push({empty:true});
    for(let d=1;d<=last;d++){
      const day=m+'-'+String(d).padStart(2,'0');
      cells.push({day,label:d,checked:set.has(day),today:day===today,future:day>today,missed:day<today&&!set.has(day)});
    }
    return cells;
  }
  function levelInfo(course){
    const xp=lifetimeEarned(course),current=[...LEVELS].reverse().find(l=>xp>=l.min)||LEVELS[0],next=LEVELS.find(l=>l.level===current.level+1);
    return {xp,current,next,remaining:next?Math.max(0,next.min-xp):0,progress:next?Math.max(0,Math.min(1,(xp-current.min)/(next.min-current.min))):1};
  }
  function rewardById(id){return REWARDS.find(r=>r.id===id);}
  function redeem(course,meta,rewardId,now){
    const reward=rewardById(rewardId);if(!reward)throw new Error('没有找到这个兑换项');
    const balance=availableBalance(course,now);if(balance<reward.cost)throw new Error('积分不足，先完成任务再来兑换');
    const next=clone(course||{});next.points=next.points||{};next.points.ledger=asArray(next.points.ledger);
    let left=reward.cost;
    const usable=next.points.ledger.filter(x=>x.kind!=='spend'&&Number(x.remaining)>0&&(!x.expiresAt||new Date(x.expiresAt)>new Date(iso(now)))).sort((a,b)=>new Date(a.expiresAt||0)-new Date(b.expiresAt||0));
    for(const item of usable){const take=Math.min(left,Number(item.remaining||0));item.remaining-=take;left-=take;if(!left)break;}
    next.points.ledger.push({entryId:'pv2_spend_'+rewardId+'_'+Date.now(),kind:'spend',amount:-reward.cost,remaining:0,occurredAt:iso(now),sourceType:'reward_redemption',sourceId:rewardId,sourceDay:localDay(now),title:'兑换'+reward.title});
    next.points.balance=next.points.ledger.reduce((s,x)=>s+Math.max(0,Number(x.remaining||0)),0);
    const nextMeta=normalizeMeta(meta);nextMeta.rewards.push({rewardId,redeemedAt:iso(now)});
    return {course:next,meta:nextMeta,reward};
  }
  function ledgerRows(course){
    return [...ledgerOf(course)].sort((a,b)=>new Date(b.occurredAt||0)-new Date(a.occurredAt||0)).map(x=>({...x,displayTitle:x.title||({
      checkin:'每日签到',chat_summary:'完成对话',card_saved:'亲子卡',action_feedback:'行动反馈',course_lesson:'学习课程',community_post:'社区发布',course_redemption:'兑换课程',reward_redemption:'积分兑换'
    }[x.sourceType]||'成长积分')}));
  }
  return {CHECKIN_REWARDS,LEVELS,TASKS,REWARDS,normalizeMeta,localDay,addDays,monthKey,checkedDays,hasCheckin,streak,longestStreak,lifetimeEarned,lifetimeSpent,availableBalance,addEarn,claimCheckin,taskStatus,monthStats,calendar,levelInfo,rewardById,redeem,ledgerRows};
});