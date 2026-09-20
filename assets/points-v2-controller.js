/* Injected inside the existing H5 closure by tools/build_growth_reports.py. */
function installPointsV2(){
  const model=window.QZLPointsV2Model,view=window.QZLPointsV2View,courseModel=window.QZLCourseModel;
  if(!model||!view||!courseModel)return;
  window.QZLPointsV2Installed=true;
  const now=()=>new Date().toISOString();
  const today=()=>model.localDay(now());
  let reminderTimer=null;
  function readCourse(){return courseModel.normalize(state.course&&typeof state.course==='object'?state.course:{});}
  function readMeta(){return model.normalizeMeta(state.pointsV2);}
  function context(){
    const course=readCourse(),meta=readMeta(),balance=courseModel.pointBalances(course,now()).available;
    return {model,course,meta,balance,today:today(),esc};
  }
  function commit(course,meta){
    const previous=state;
    const next={...state,course:courseModel.normalize(course),pointsV2:model.normalizeMeta(meta)};
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
      state=next;saveState();
    }catch(error){state=previous;throw new Error('这次没能保存，请稍后重试。');}
  }
  function award(sourceType,sourceId,amount,{dailyLimit=1,title=''}={}){
    const result=model.addEarn(readCourse(),sourceType,String(sourceId||''),amount,now(),{dailyLimit,title});
    if(!result.grant)return 0;
    commit(result.course,readMeta());
    return result.grant;
  }
  function scheduleReminder(delay=900){
    clearTimeout(reminderTimer);
    if(!state.loggedIn||routeBase(currentRoute)!=='home'||state.chat?.active)return;
    reminderTimer=setTimeout(()=>{
      const ctx=context();
      if(routeBase(currentRoute)!=='home'||state.chat?.active||model.hasCheckin(ctx.course,ctx.today)||ctx.meta.reminder.dismissedDate===ctx.today)return;
      if(drawerEl.dataset.state!=='closed'||overlayRoot.innerHTML){scheduleReminder(650);return;}
      showOverlay(`<div class="pv2-reminder-layer" data-overlay-action="scrim-close"><div class="pv2-reminder-modal">${view.reminder(ctx)}</div></div>`);
    },delay);
  }
  function rewardSheet(reward){
    const ctx=context(),after=ctx.balance-reward.cost;
    return `<div class="pv2-redeem-sheet"><span class="pv2-redeem-art">${view.icon(reward.kind==='课程'?'course':reward.kind==='工具'?'reward':'card')}</span><small>积分兑换</small><h2>${esc(reward.title)}</h2><p>需要 <b>${reward.cost}</b> 积分</p><div><span>当前积分</span><strong>${ctx.balance}</strong></div><div><span>兑换后剩余</span><strong>${Math.max(0,after)}</strong></div><button data-points-action="confirm-redeem" data-reward-id="${reward.id}" ${after<0?'disabled':''}>确认兑换</button><button data-points-action="close-sheet">再想想</button></div>`;
  }
  const originalRender=renderScreen;
  renderScreen=function(route){
    const base=routeBase(route);
    if(base==='points'||base.startsWith('points/'))return view.render(route,context());
    const html=originalRender(route);
    if(base==='home')scheduleReminder();
    return html;
  };
  const oldSaveCard=saveActiveCardV90;
  saveActiveCardV90=function(){
    const before=state.cards?.toolbox?.length||0;
    oldSaveCard();
    const after=state.cards?.toolbox?.length||0;
    if(after>before){
      const card=state.cards.toolbox[0],grant=award('card_saved',card?.id||uid('cardreward'),3,{dailyLimit:1,title:'完成亲子卡'});
      if(grant)toast('亲子卡已保存，成长积分 +3');
    }
  };
  window.addEventListener('qzl:points-v2-reward',event=>{
    const d=event.detail&&typeof event.detail==='object'?event.detail:{};
    const rules={community_post:{amount:1,limit:3,title:'社区发布'}};
    const rule=rules[d.sourceType];if(!rule||!d.sourceId)return;
    const grant=award(d.sourceType,d.sourceId,rule.amount,{dailyLimit:rule.limit,title:rule.title});
    if(grant)toast(`成长积分 +${grant}`);
  });
  document.addEventListener('click',event=>{
    const el=event.target.closest('[data-points-action]');if(!el)return;
    event.preventDefault();event.stopPropagation();
    const action=el.dataset.pointsAction;
    try{
      if(action==='back')goBack(el.dataset.fallback||'points');
      else if(action==='route'||action==='task-go')navigate(el.dataset.route||'points');
      else if(action==='claim-checkin'){
        const result=model.claimCheckin(readCourse(),readMeta(),now());
        if(result.already){toast('今天已经签到');return;}
        commit(result.course,result.meta);
        renderRoute(currentRoute);
        toast(`签到成功，成长积分 +${result.grant}`);
      }
      else if(action==='calendar')navigate('points/calendar?month='+encodeURIComponent(el.dataset.month||model.monthKey(today())),{replace:true});
      else if(action==='task-tab')navigate('points/tasks?tab='+encodeURIComponent(el.dataset.tab||'all'),{replace:true});
      else if(action==='ledger-filter')navigate('points/ledger?filter='+encodeURIComponent(el.dataset.filter||'all'),{replace:true});
      else if(action==='redeem'){
        const reward=model.rewardById(el.dataset.rewardId||'');if(reward)showBottomSheet(rewardSheet(reward));
      }
      else if(action==='confirm-redeem'){
        const result=model.redeem(readCourse(),readMeta(),el.dataset.rewardId,now());
        commit(result.course,result.meta);closeOverlay();renderRoute(currentRoute);toast('兑换成功，已加入你的成长权益');
      }
      else if(action==='dismiss-reminder'){
        const meta=readMeta();meta.reminder.dismissedDate=today();commit(readCourse(),meta);closeOverlay();
      }
      else if(action==='reminder-checkin'){
        const result=model.claimCheckin(readCourse(),readMeta(),now());
        if(result.already){
          closeOverlay();
          toast('今天已经签到');
          return;
        }
        commit(result.course,result.meta);
        closeOverlay();
        if(routeBase(currentRoute)==='home')renderRoute(currentRoute);
        toast(`签到成功，成长积分 +${result.grant}`);
      }
      else if(action==='close-sheet')closeOverlay();
    }catch(error){toast(error.message||'暂时没有完成，请重试');}
  });
  state={...state,pointsV2:readMeta()};saveState();
}
installPointsV2();