(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.QZLPointsV2View=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const esc=(ctx,v)=>ctx.esc?ctx.esc(v):String(v??'');
  const parts=route=>String(route||'').split('?')[0].split('/').filter(Boolean);
  const query=route=>Object.fromEntries(new URLSearchParams(String(route||'').split('?')[1]||''));
  const pad=n=>String(n).padStart(2,'0');
  const zhDate=day=>{const [y,m,d]=String(day).split('-');return `${Number(m)}月${Number(d)}日`;};
  function icon(name,tone=''){
    const map={
      sprout:'<path d="M32 52V30"/><path d="M31 34C18 34 11 27 12 16c12-.6 19 5 19 18Z"/><path d="M33 30c1-11 9-18 20-17 0 11-8 17-20 17Z"/>',
      calendar:'<rect x="10" y="14" width="44" height="40" rx="9"/><path d="M18 9v11M46 9v11M10 25h44"/><path d="m23 39 6 6 12-14"/>',
      chat:'<path d="M12 16h40v27H29L17 52v-9h-5Z"/><circle cx="25" cy="29" r="2"/><circle cx="32" cy="29" r="2"/><circle cx="39" cy="29" r="2"/>',
      card:'<rect x="14" y="12" width="36" height="42" rx="8"/><path d="M21 22h22M21 30h15"/><path d="m32 36 2.5 5.5 6 .6-4.6 4 1.3 5.9-5.2-3-5.2 3 1.3-5.9-4.6-4 6-.6Z"/>',
      action:'<path d="M12 15h40v39H12Z"/><path d="M20 11v9M44 11v9M12 26h40"/><path d="m22 40 5 5 11-12"/>',
      task:'<rect x="13" y="12" width="38" height="43" rx="8"/><path d="M23 12V8h18v4M22 27h20M22 37h13"/><path d="m22 47 4 4 8-9"/>',
      course:'<path d="M11 15c8-2 14-1 21 3v34c-7-4-13-5-21-3Z"/><path d="M53 15c-8-2-14-1-21 3v34c7-4 13-5 21-3Z"/><path d="M32 18v34"/>',
      community:'<circle cx="24" cy="24" r="7"/><circle cx="43" cy="26" r="6"/><path d="M12 49c1-10 5-15 12-15s11 5 12 15M35 48c1-8 4-12 8-12s7 4 8 12"/>',
      gift:'<rect x="10" y="27" width="44" height="27" rx="6"/><path d="M8 20h48v10H8Z"/><path d="M32 20v34"/><path d="M32 20c-6-12-18-8-14 0h14Zm0 0c6-12 18-8 14 0H32Z"/>',
      coin:'<circle cx="32" cy="32" r="22"/><path d="M24 25h16M22 32h20M32 18v28"/>',
      history:'<circle cx="32" cy="32" r="22"/><path d="M32 20v13l9 6"/><path d="M12 18v-8M12 10h8"/>',
      reward:'<path d="M18 12h28v15H18Z"/><path d="M15 27h34v26H15Z"/><path d="M32 12v41"/><path d="M32 12c-4-8-12-8-12-2s8 5 12 2Zm0 0c4-8 12-8 12-2s-8 5-12 2Z"/>',
      level:'<circle cx="32" cy="26" r="13"/><path d="m24 38-4 16 12-7 12 7-4-16"/><path d="m32 17 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2-4.5-4.4 6.2-.9Z"/>',
      check:'<circle cx="32" cy="32" r="22"/><path d="m21 32 7 7 15-16"/>',
      arrow:'<path d="m25 16 16 16-16 16"/>',
      back:'<path d="m39 15-17 17 17 17"/>',
      lock:'<rect x="15" y="27" width="34" height="27" rx="6"/><path d="M22 27v-7a10 10 0 0 1 20 0v7"/>'
    };
    return `<svg class="pv2-svg ${tone}" viewBox="0 0 64 64" aria-hidden="true">${map[name]||map.coin}</svg>`;
  }
  const richIcon=name=>typeof window!=='undefined'&&window.QZLPointsV3Icons?.render?window.QZLPointsV3Icons.render(name):icon(name);
  const mascot=()=>'<span class="pv2-mascot pv3-mascot"><img src="assets/mascot-clean-v90.png" alt="小亲"><i>'+icon('sprout')+'</i></span>';
  function shell(title,body,{back='home',right=''}={}){
    return `<main class="points-v2-page qzl-stacked-page"><header class="pv2-titlebar"><button data-points-action="back" data-fallback="${back}" aria-label="返回">${icon('back')}</button><b>${title}</b><span>${right}</span></header><section class="pv2-scroll">${body}</section></main>`;
  }
  function weekStrip(ctx){
    const model=ctx.model,today=ctx.today,course=ctx.course,set=new Set(model.checkedDays(course));
    const dt=new Date(today+'T12:00:00+08:00'),dow=(dt.getDay()+6)%7,monday=model.addDays(today,-dow);
    const cells=Array.from({length:7},(_,i)=>{const d=model.addDays(monday,i),n=Number(d.slice(8)),isToday=d===today,checked=set.has(d);return `<div class="pv2-week-day ${checked?'done':''} ${isToday?'today':''}"><small>${['一','二','三','四','五','六','日'][i]}</small><i>${checked?icon('check'):isToday?'今':n}</i><em>${isToday?'今天':n}</em></div>`;}).join('');
    return `<div class="pv2-week-strip">${cells}</div>`;
  }
  function dashboard(ctx){
    const m=ctx.model,s=m.monthStats(ctx.course,m.monthKey(ctx.today),ctx.today),level=m.levelInfo(ctx.course),streak=m.streak(ctx.course,ctx.today),checked=m.hasCheckin(ctx.course,ctx.today),nextReward=m.CHECKIN_REWARDS[streak%7];
    const body=`
      <section class="pv3-growth-card">
        <div class="pv3-growth-top">
          <div class="pv3-growth-copy"><small>每一次陪伴</small><h2>都在靠近更好的自己</h2>
            <button class="pv3-balance" data-points-action="route" data-route="points/wallet?tab=ledger"><strong>${ctx.balance}</strong><span>成长积分 ›</span></button>
          </div>
          ${mascot()}
        </div>
        <div class="pv3-stat-row">
          <button data-points-action="route" data-route="points/checkin"><b>${streak} 天</b><small>连续陪伴</small></button>
          <button data-points-action="route" data-route="points/calendar"><b>${m.checkedDays(ctx.course).length} 天</b><small>累计签到</small></button>
          <button data-points-action="route" data-route="points/level"><b>Lv.${level.current.level}</b><small>${level.current.name}</small></button>
        </div>
      </section>

      <button class="pv3-checkin-entry ${checked?'is-done':''}" data-points-action="route" data-route="points/checkin">
        <span class="pv3-entry-icon pv3-gold">${richIcon('checkin')}</span>
        <span class="pv3-entry-copy"><small>今天 · ${zhDate(ctx.today)}</small><b>${checked?'今天已签到':'签到领取 +'+nextReward+' 积分'}</b><em>${checked?'明天继续回来看看自己':'点一下，把今天的陪伴留下来'}</em></span>
        <i class="pv3-entry-arrow">${icon('arrow')}</i>
      </button>

      <section class="pv3-week-card">
        <header><div><small>成长足迹</small><h3>本周签到</h3></div><button data-points-action="route" data-route="points/calendar">查看月历 ›</button></header>
        ${weekStrip(ctx)}
        <div class="pv3-week-footer"><span>${checked?'今天已经留下这一小步':'今天签到后，会点亮一个成长印记'}</span><b>本月 +${s.earned} 积分</b></div>
      </section>

      <button class="pv3-feature-entry" data-points-action="route" data-route="points/tasks">
        <span class="pv3-entry-icon pv3-blue">${richIcon('task')}</span>
        <span class="pv3-entry-copy"><small>成长任务</small><b>做任务赚积分</b><em>对话、亲子卡、行动反馈、课程和社区</em></span>
        <i class="pv3-entry-arrow">${icon('arrow')}</i>
      </button>

      <button class="pv3-feature-entry pv3-wallet-entry" data-points-action="route" data-route="points/wallet?tab=ledger">
        <span class="pv3-entry-icon pv3-yellow">${richIcon('wallet')}</span>
        <span class="pv3-entry-copy"><small>我的积分</small><b>明细与兑换</b><em>查看每笔积分，也可以兑换成长权益</em></span>
        <i class="pv3-entry-arrow">${icon('arrow')}</i>
      </button>`;
    return shell('成长积分',body,{right:'<button data-points-action="route" data-route="points/rules">积分规则</button>'});
  }
  function checkin(ctx){
    const m=ctx.model,done=m.hasCheckin(ctx.course,ctx.today),streak=m.streak(ctx.course,ctx.today),nextDay=((streak%7)+1),reward=done?0:m.CHECKIN_REWARDS[nextDay-1];
    const cycle=m.CHECKIN_REWARDS.map((r,i)=>`<div class="pv2-cycle-day ${i<streak%7?'done':''} ${!done&&i===streak%7?'today':''}"><i>${richIcon('gift')}</i><b>+${r}</b><small>第${i+1}天</small></div>`).join('');
    const body=`
      <section class="pv2-checkin-hero">${mascot()}<div><small>今天也在用心陪伴 👋</small><h2>给自己一个小小的奖励吧</h2></div></section>
      <section class="pv2-checkin-card"><small>${zhDate(ctx.today)} 星期${['日','一','二','三','四','五','六'][new Date(ctx.today+'T12:00:00+08:00').getDay()]}</small><strong>${done?'✓':'+'+reward}</strong><p>${done?'今日奖励已领取':'成长积分'}</p><button data-points-action="claim-checkin" ${done?'disabled':''}>${done?'今日已签到':'领取奖励'}</button></section>
      <section class="pv2-panel"><header><h3>连续签到奖励</h3></header><div class="pv2-cycle">${cycle}</div><p class="pv2-tip">💡 连续 7 天可获得额外奖励；中断后从第 1 天重新开始。</p></section>`;
    return shell('每日签到',body,{back:'points'});
  }
  function calendarPage(ctx,route){
    const m=ctx.model,q=query(route),month=/^\d{4}-\d{2}$/.test(q.month||'')?q.month:m.monthKey(ctx.today),cells=m.calendar(ctx.course,month,ctx.today),stats=m.monthStats(ctx.course,month,ctx.today),[y,mo]=month.split('-').map(Number);
    const prev=mo===1?`${y-1}-12`:`${y}-${pad(mo-1)}`,next=mo===12?`${y+1}-01`:`${y}-${pad(mo+1)}`;
    const grid=cells.map(c=>c.empty?'<i class="pv2-cal-empty"></i>':`<button class="pv2-cal-day ${c.checked?'done':''} ${c.today?'today':''} ${c.future?'future':''} ${c.missed?'missed':''}" disabled><b>${c.label}</b><span>${c.checked?'✓':c.today?'今天':''}</span></button>`).join('');
    const body=`
      <section class="pv2-calendar-card"><header><button data-points-action="calendar" data-month="${prev}">‹</button><b>${y} 年 ${mo} 月</b><button data-points-action="calendar" data-month="${next}">›</button></header><div class="pv2-cal-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="pv2-cal-grid">${grid}</div><footer><span><i class="dot done"></i>已签到</span><span><i class="dot today"></i>今天</span><span><i class="dot missed"></i>未签到</span><span><i class="dot future"></i>未来日期</span></footer></section>
      <section class="pv2-month-stats"><div><b>${stats.days} 天</b><small>本月签到</small></div><div><b>${stats.longest} 天</b><small>最长连续</small></div><div><b>+${stats.earned}</b><small>本月获得积分</small></div></section>`;
    return shell('签到日历',body,{back:'points/checkin'});
  }
  function tasks(ctx,route){
    const tab=query(route).tab||'all',all=ctx.model.taskStatus(ctx.course,ctx.today),items=all.filter(t=>tab==='all'||t.group===tab);
    const tabs=[['all','全部任务'],['daily','每日任务'],['growth','成长任务'],['community','社区任务']].map(([id,label])=>`<button class="${tab===id?'active':''}" data-points-action="task-tab" data-tab="${id}">${label}</button>`).join('');
    const rows=items.map(t=>`<article class="pv2-task-row pv3-task-row"><span class="pv3-task-icon">${richIcon(t.id==='checkin'?'checkin':t.id==='chat'?'chat':t.id==='card'?'card':t.id==='feedback'?'action':t.id==='course'?'course':'community')}</span><div><b>${t.title}</b><small>${t.desc}</small><strong>+${t.reward} 积分</strong></div><em>${t.count}/${t.limit}</em><button data-points-action="task-go" data-route="${t.route}" ${t.done?'disabled':''}>${t.done?'已完成':'去'+(t.id==='course'?'学习':t.id==='community'?'发布':t.id==='checkin'?'签到':'完成')}</button></article>`).join('');
    return shell('任务中心',`<nav class="pv2-tabs">${tabs}</nav><section class="pv2-task-banner"><div><small>在行动中积累成长</small><h2>每一小步，都值得被鼓励</h2></div>${mascot()}</section><section class="pv2-task-list">${rows}</section>`,{back:'points'});
  }
  function wallet(ctx,route){
    const tab=query(route).tab==='rewards'?'rewards':'ledger',level=ctx.model.levelInfo(ctx.course);
    const nav=`<nav class="pv3-wallet-tabs"><button class="${tab==='ledger'?'active':''}" data-points-action="route" data-route="points/wallet?tab=ledger">积分明细</button><button class="${tab==='rewards'?'active':''}" data-points-action="route" data-route="points/wallet?tab=rewards">积分兑换</button></nav>`;
    const head=`<section class="pv3-wallet-hero"><span class="pv3-wallet-icon">${richIcon('wallet')}</span><div><small>当前可用</small><strong>${ctx.balance}</strong><b>成长积分</b><p>Lv.${level.current.level} · ${level.current.name}</p></div></section>`;
    let content='';
    if(tab==='ledger'){
      const iconFor=x=>({checkin:'checkin',chat_summary:'chat',card_saved:'card',action_feedback:'action',course_lesson:'course',community_post:'community',reward_redemption:'gift',course_redemption:'course'}[x.sourceType]||'history');
      const rows=ctx.model.ledgerRows(ctx.course);
      content=rows.length?`<section class="pv3-wallet-list">${rows.map(x=>{const d=x.sourceDay||String(x.occurredAt||'').slice(0,10),time=x.occurredAt?new Date(x.occurredAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Shanghai'}):'';return `<article class="pv3-wallet-row"><span>${richIcon(iconFor(x))}</span><div><b>${esc(ctx,x.displayTitle)}</b><small>${d} · ${time}</small></div><strong class="${x.kind}">${Number(x.amount)>0?'+':''}${x.amount}</strong></article>`;}).join('')}</section>`:'<div class="pv2-empty">还没有积分记录</div>';
    }else{
      content=`<section class="pv3-wallet-rewards">${ctx.model.REWARDS.map(r=>`<article class="pv3-wallet-reward"><span>${richIcon(r.kind==='课程'?'course':r.kind==='工具'?'gift':r.kind==='实物'?'card':'medal')}</span><div><b>${r.title}</b><small>${r.desc}</small><strong>${r.cost} 积分</strong></div><button data-points-action="redeem" data-reward-id="${r.id}">去兑换</button></article>`).join('')}</section>`;
    }
    return shell('我的积分',head+nav+content,{back:'points'});
  }
  function ledger(ctx,route){
    const filter=query(route).filter||'all',rows=ctx.model.ledgerRows(ctx.course).filter(x=>filter==='all'||(filter==='earn'?x.kind==='earn':x.kind==='spend'));
    const tabs=[['all','全部类型'],['earn','获得'],['spend','支出']].map(([id,label])=>`<button class="${filter===id?'active':''}" data-points-action="ledger-filter" data-filter="${id}">${label}</button>`).join('');
    const html=rows.length?rows.map(x=>{const d=x.sourceDay||String(x.occurredAt||'').slice(0,10),time=x.occurredAt?new Date(x.occurredAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Shanghai'}):'';return `<article class="pv2-ledger-row"><span class="pv2-iconbox ${x.kind==='earn'?'green':'blue'}">${icon(x.kind==='earn'?'check':'reward')}</span><div><b>${esc(ctx,x.displayTitle)}</b><small>${d} · ${time}</small></div><strong class="${x.kind}">${Number(x.amount)>0?'+':''}${x.amount}</strong></article>`;}).join(''):'<div class="pv2-empty">还没有积分记录</div>';
    return shell('积分明细',`<nav class="pv2-tabs pv2-ledger-tabs">${tabs}</nav><section class="pv2-ledger-list">${html}</section>`,{back:'points'});
  }
  function rewards(ctx){
    const rows=ctx.model.REWARDS.map(r=>`<article class="pv2-reward-row pv3-reward-row"><span class="pv2-reward-art ${r.tone}">${richIcon(r.kind==='课程'?'course':r.kind==='工具'?'gift':r.kind==='实物'?'card':'medal')}</span><div><b>${r.title}</b><small>${r.desc}</small><strong>${r.cost} 积分</strong></div><button data-points-action="redeem" data-reward-id="${r.id}">去兑换</button></article>`).join('');
    return shell('积分兑换',`<section class="pv2-reward-head"><span>我的积分：<b>${ctx.balance}</b></span></section><nav class="pv2-tabs"><button class="active">全部</button><button>课程</button><button>工具</button><button>会员</button><button>实物</button></nav><section class="pv2-reward-list">${rows}</section>`,{back:'points'});
  }
  function level(ctx){
    const info=ctx.model.levelInfo(ctx.course),rows=ctx.model.LEVELS.map(l=>`<div class="pv2-level-row ${l.level===info.current.level?'current':''}"><span>Lv.${l.level}</span><b>${l.name}</b><small>${l.benefit}</small></div>`).join('');
    return shell('我的等级',`<section class="pv2-level-hero">${mascot()}<div><strong>Lv.${info.current.level}</strong><b>${info.current.name} 👋</b><div class="pv2-level-progress"><i style="width:${Math.round(info.progress*100)}%"></i></div><small>${info.next?'再获得 '+info.remaining+' 积分可升级到 Lv.'+info.next.level:'已达到最高等级'}</small></div></section><section class="pv2-panel"><header><h3>各等级权益</h3></header><div class="pv2-level-list">${rows}</div></section>`,{back:'points'});
  }
  function rules(ctx){
    return shell('积分规则',`<section class="pv2-panel pv2-rules"><h3>成长积分怎么获得</h3><p>每日签到、完成对话、亲子卡、行动反馈、课程学习与社区分享，都可以获得积分。每项任务有每日次数上限。</p><h3>积分怎么使用</h3><p>积分可以兑换课程、工具与成长权益。兑换只会减少可用积分，不会让成长等级倒退。</p><h3>积分有效期</h3><p>每笔获得的积分有效期为 1 年，兑换时优先使用更早到期的积分。</p></section>`,{back:'points'});
  }
  function reminder(ctx){
    return `<div class="pv2-reminder"><button class="pv2-reminder-close" data-points-action="dismiss-reminder" aria-label="关闭">×</button>${mascot()}<h2>今天还没有签到哦</h2><p>给自己 1 分钟，领取今天的小奖励吧</p><strong>+2 <small>成长积分</small></strong><button class="pv2-reminder-primary" data-points-action="reminder-checkin">立即签到</button><button class="pv2-reminder-later" data-points-action="dismiss-reminder">稍后再说</button></div>`;
  }
  function render(route,ctx){
    const base=parts(route).join('/');
    if(base==='points')return dashboard(ctx);
    if(base==='points/checkin')return checkin(ctx);
    if(base==='points/calendar')return calendarPage(ctx,route);
    if(base==='points/tasks')return tasks(ctx,route);
    if(base==='points/wallet')return wallet(ctx,route);
    if(base==='points/ledger')return ledger(ctx,route);
    if(base==='points/rewards')return rewards(ctx);
    if(base==='points/level')return level(ctx);
    if(base==='points/rules')return rules(ctx);
    return dashboard(ctx);
  }
  return {render,reminder,icon};
});