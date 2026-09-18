/* Injected inside the existing H5 closure by tools/build_growth_reports.py. */
function installCourse() {
  const model = window.QZLCourseModel, view = window.QZLCourseView;
  if (!model || !view) return;
  const courseRoutes = base => base === 'courses' || base === 'my-learning' || base === 'points' || base === 'demo-tools' || base.startsWith('courses/') || base.startsWith('points/');
  const day = () => new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
  const iso = () => new Date().toISOString();
  let checkinTimer = null;
  const context = () => {
    const data = read(), balances = model.pointBalances(data,iso());
    return {data:{...data,points:{...data.points,balance:balances.available,frozen:balances.frozen,total:balances.total}},model,esc,today:day()};
  };
  const availablePoints = (data = read()) => model.pointBalances(data,iso()).available;
  function read() {
    const old = state.course && typeof state.course === 'object' ? state.course : {};
    const inherited = old.membership && typeof old.membership === 'object' ? old.membership : {};
    const activationDates = (state.membership?.orders || []).map(order => String(order?.date || '')).filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort().reverse();
    const anchorDate = activationDates[0] || inherited.anchorDate || day();
    const cycleId = model.membershipCycleId(anchorDate,iso());
    const membership = {...inherited,active:!!state.membership?.active,anchorDate,cycleId,quota:2,used:inherited.cycleId === cycleId ? Number(inherited.used || 0) : 0};
    const next = model.normalize({...old,membership});
    if (!state.course || JSON.stringify(old) !== JSON.stringify(next)) state = {...state,course:next};
    return state.course;
  }
  function commit(data, patch = {}) {
    const previous = state;
    const next = {...state,...patch,course:model.normalize(data)};
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
      state = next;
      saveState();
    } catch (_) {
      state = previous;
      throw new Error('这次没能保存，请稍后重试。');
    }
  }
  function go(route, replace = false) { navigate(route,{replace}); }
  function routeForLesson(productId, lessonId) { return `courses/learn/${encodeURIComponent(productId)}/${encodeURIComponent(lessonId)}`; }
  function pendingOrder(id) { return read().orders.find(order => order.id === id && ['pending','processing'].includes(order.status)); }
  function paymentSheet(order) {
    const product = model.CATALOG.find(item => item.id === order.productId);
    if (!product) return;
    const amount = order.method === 'points' ? `${order.pointsCost} 积分` : `¥${(order.amountFen / 100).toFixed(2)}`;
    showBottomSheet(`<div class="course-payment-sheet"><small>演示支付</small><h2>${esc(product.title)}</h2><p>本次${order.method === 'points' ? '兑换' : '支付'}：<b>${amount}</b></p><p class="course-demo-note">不会扣款；关闭这个面板不会取消订单。</p><button class="course-primary full" data-course-action="settle" data-order-id="${esc(order.id)}" data-result="success">模拟成功</button><button class="course-secondary full" data-course-action="settle" data-order-id="${esc(order.id)}" data-result="failed">模拟失败</button><button class="course-sheet-link" data-course-action="settle" data-order-id="${esc(order.id)}" data-result="processing">模拟处理中</button></div>`);
  }
  function settle(id, result) {
    const order = pendingOrder(id); if (!order) return toast('这笔课程订单已处理');
    let next = read();
    if (result === 'success') next = model.settleOrder(next,'success',iso(),id);
    else if (result === 'processing') next = model.settleOrder(next,'processing',iso(),id);
    else next = model.settleOrder(next,'failed',iso(),id);
    const finalOrder = next.orders.find(item => item.id === id);
    const succeeded = finalOrder?.status === 'succeeded';
    commit(next); closeOverlay();
    go(result === 'success' || result === 'failed' ? `courses/result/${id}` : `courses/checkout/${order.productId}?method=${order.method}&orderId=${id}`,true);
    toast(succeeded ? '课程已加入我的学习' : result === 'processing' ? '正在确认结果' : finalOrder?.status === 'expired' ? '订单已超时，请重新确认' : '这次模拟支付未完成');
  }
  function earn(sourceType, sourceId, amount) {
    const data = read(), sourceDay = day();
    if (data.points.ledger.some(item => item.sourceType === sourceType && item.sourceId === sourceId)) return 0;
    if (data.points.ledger.some(item => item.kind === 'earn' && item.sourceType === sourceType && item.sourceDay === sourceDay)) return 0;
    const earned = data.points.ledger.filter(item => item.kind === 'earn' && item.sourceDay === sourceDay).reduce((sum,item) => sum + Number(item.amount || 0),0);
    const grant = Math.max(0,Math.min(Number(amount || 0),26-earned));
    if (!grant) return 0;
    const expiry = new Date(); expiry.setFullYear(expiry.getFullYear()+1);
    const ledger = [...data.points.ledger,{entryId:`${sourceType}_${sourceId}`,kind:'earn',amount:grant,remaining:grant,expiresAt:expiry.toISOString(),sourceType,sourceId,sourceDay,occurredAt:iso()}];
    commit({...data,points:{ledger}});
    return grant;
  }
  function hasCheckedIn(data = read()) {
    return data.points.ledger.some(item => item.sourceType === 'checkin' && item.sourceDay === day());
  }
  function checkinPromptHtml(success = false) {
    if (success) return `<div class="course-checkin-prompt course-checkin-success"><span class="course-checkin-icon">✓</span><small>今日打卡完成</small><h2>积分 +2</h2><p>你的成长积分已经到账，可以用来兑换精选课程。</p><button class="course-primary full" data-course-action="close-checkin">继续聊聊</button><button class="course-sheet-link" data-course-action="route" data-route="points">查看积分余额</button></div>`;
    return `<div class="course-checkin-prompt"><span class="course-checkin-icon">+2</span><small>每日成长打卡</small><h2>今天也来陪自己走一步</h2><p>领取今日积分，完成对话、学习和行动反馈还可以继续获得积分。</p><div class="course-checkin-balance"><span>当前积分</span><b>${availablePoints()}</b></div><button class="course-primary full" data-course-action="claim-checkin">打卡领 2 积分</button><button class="course-sheet-link" data-course-action="close-checkin">稍后再说</button></div>`;
  }
  function scheduleCheckinPrompt(delay = 850) {
    clearTimeout(checkinTimer);
    if (!state.loggedIn || routeBase(currentRoute) !== 'home' || state.chat?.active || hasCheckedIn()) return;
    checkinTimer = setTimeout(() => {
      const data = read();
      if (routeBase(currentRoute) !== 'home' || state.chat?.active || hasCheckedIn(data) || data.checkinPromptDay === day()) return;
      if (drawerEl.dataset.state !== 'closed' || overlayRoot.innerHTML) { scheduleCheckinPrompt(650); return; }
      commit({...data,checkinPromptDay:day()});
      showBottomSheet(checkinPromptHtml(false));
    },delay);
  }
  function rewardLearning(productId, lessonId) {
    const data = read(), progress = data.progress[`${productId}:${lessonId}`];
    if (progress?.completedAt) { toast('这节课已经完成过了'); return; }
    commit({...data,progress:{...data.progress,[`${productId}:${lessonId}`]:{completedAt:iso(),covered:1}}});
    const grant = earn('course_lesson',`${productId}:${lessonId}`,6);
    toast(grant ? `完成演示学习，获得 ${grant} 积分` : '完成演示学习，今日积分已达上限');
    renderRoute(currentRoute);
  }
  function addAction(productId, lessonId) {
    const product = model.CATALOG.find(item => item.id === productId), lesson = product?.lessons.find(item => item.id === lessonId);
    if (!product || !lesson) return;
    showBottomSheet(`<div class="course-action-sheet"><small>课程练习</small><h2>把这一步加入行动</h2><p>下次互动时，先停半步，听完对方想表达的内容，再决定怎样回应。</p><button class="course-primary full" data-course-action="confirm-add-action" data-product-id="${productId}" data-lesson-id="${lessonId}">确认加入行动</button><button class="course-sheet-link" data-overlay-action="close">暂时不加</button></div>`);
  }
  function confirmAction(productId, lessonId) {
    const product = model.CATALOG.find(item => item.id === productId), lesson = product?.lessons.find(item => item.id === lessonId);
    if (!product || !lesson) return;
    const actionId = `course-action-${productId}-${lessonId}`;
    if (!(state.actions || []).some(item => item.id === actionId)) {
      state = {...state,actions:[...(state.actions || []),{id:actionId,date:day(),title:`${product.title}：${lesson.title}`,source:'简快课堂 · 课程练习',why:'把课程里的理解放回下一次真实互动。',script:'我先停一下，听完你想说的，再一起决定下一步。',observe:'对方是否愿意多说一点，互动是否少一点拉扯。',status:'pending',result:null,resultText:'待尝试',provenance:'personal',sourceKind:'course_lesson',productId,lessonId}]};
      saveState();
    }
    closeOverlay(); toast('已加入成长行动'); go('growth');
  }
  function demoState(kind) {
    if (kind === 'reset') { commit(model.normalize({})); toast('课程演示数据已清空'); renderRoute(currentRoute); return; }
    if (kind === 'member') { commit(model.normalize({membership:{active:true,anchorDate:day(),cycleId:model.membershipCycleId(day(),iso()),quota:2,used:0}}),{membership:{...state.membership,active:true}}); }
    else if (kind === 'points') { const expiry = new Date(); expiry.setMonth(expiry.getMonth()+12); commit(model.normalize({points:{ledger:[{entryId:'demo-points',kind:'earn',amount:160,remaining:160,expiresAt:expiry.toISOString(),occurredAt:iso()}]}})); }
    else commit(model.normalize({}));
    toast(kind === 'member' ? '已切换为有效会员' : kind === 'points' ? '已切换为积分充足' : '已切换为新注册用户'); renderRoute(currentRoute);
  }
  function showRecommendation() {
    const data = read();
    if (!data.preferences.proactiveRecommendations || !model.recommendationAvailable(data,day())) return '';
    if (!state.chat?.active || (state.chat.messages || []).length < 2) return '';
    const node = String(state.chat.node || '');
    const confirmed = ['card-reveal-back','card-reveal-front','action-card'].includes(node);
    if (!confirmed) return '';
    const conversationText = (state.chat.messages || []).map(message => String(message.html || '').replace(/<[^>]*>/g,' ')).join(' ');
    const topicMap = [
      {pattern:/伴侣|夫妻|共同养育|育儿分歧|爸爸.*妈妈|妈妈.*爸爸/,productId:'M202'},
      {pattern:/规则|边界|催促|作业|冲突|控制|威胁/,productId:'M203'},
      {pattern:/情绪|发火|哭闹|崩溃|生气|失控/,productId:'M201'}
    ];
    const match = topicMap.find(item => item.pattern.test(conversationText));
    if (!match) return '';
    const product = model.CATALOG.find(item => item.id === match.productId);
    if (!product) return '';
    const conversationId = String(state.chat.conversationId || '');
    const exposure = data.recommendationExposure || {};
    if (exposure.conversationId && exposure.conversationId !== conversationId) {
      const withinSevenDays = exposure.courseId === product.id && Date.now() - new Date(exposure.shownAt || 0).getTime() < 7 * 24 * 60 * 60 * 1000;
      if (exposure.day === day() || withinSevenDays) return '';
    }
    if (!exposure.conversationId || exposure.conversationId !== conversationId) {
      commit({...data,recommendationExposure:{conversationId,courseId:product.id,day:day(),shownAt:iso()}});
    }
    return `<aside class="course-chat-recommendation"><small>结合刚才的理解</small><b>${esc(product.title)}</b><p>与你们刚确认的互动主题相关，可以先看看这门课是否适合当下。</p><div><button data-course-action="preview-recommendation" data-product-id="${product.id}">了解这门课</button><button data-course-action="hide-recommendation">先继续聊</button></div></aside>`;
  }
  function showRecommendationPreview(productId) {
    const product = model.CATALOG.find(item => item.id === productId);
    if (!product) return;
    const first = product.lessons[0];
    showBottomSheet(`<div class="course-chat-preview"><small>与本次对话相关</small><h2>${esc(product.title)}</h2><p>${esc(product.subtitle)}</p><section><b>你可以先了解</b><span>${esc(first?.title || '课程介绍')}</span><span>把刚才确认的理解变成一次可尝试的练习</span></section><button class="course-primary full" data-course-action="detail" data-product-id="${product.id}">查看课程详情</button><button class="course-sheet-link" data-course-action="close-checkin">回到对话</button></div>`);
  }
  const originalRender = renderScreen;
  renderScreen = function(route) {
    const base = routeBase(route);
    if (courseRoutes(base)) return view.render(route,context());
    if (base === 'membership') {
      const data = read(), remaining = data.membership.active ? Math.max(0,data.membership.quota-data.membership.used) : 0;
      return originalRender(route).replace('<div class="section-title"><span>会员专属权益</span></div>',`<section class="course-member-rights"><b>会员专享课</b><small>${data.membership.active ? `本期剩余 ${remaining} 个 ¥9.9 课程名额` : '开通会员后，可购买更多 ¥9.9 低价课'}</small><button data-course-action="route" data-route="courses">去简快课堂</button></section><div class="section-title"><span>会员专属权益</span></div>`);
    }
    const html = originalRender(route);
    if (base === 'home') scheduleCheckinPrompt();
    return html;
  };
  const oldChat = renderChat;
  renderChat = function() { return `${oldChat()}${showRecommendation()}`; };
  const oldConfirmSummary = handleConfirmOkV90;
  handleConfirmOkV90 = function() {
    const rewardId = state.cards?.activeRunId || state.chat?.conversationId || day();
    oldConfirmSummary();
    const grant = earn('chat_summary',rewardId,4);
    if (grant) toast(`已确认这份理解，获得 ${grant} 积分`);
  };
  const oldActionFeedback = recordActionResult;
  recordActionResult = function(id,result,text) {
    const wasDone = (state.actions || []).find(item => item.id === id)?.status === 'done';
    oldActionFeedback(id,result,text);
    if (!wasDone) {
      const grant = earn('action_feedback',id,8);
      if (grant) toast(`已记录行动反馈，获得 ${grant} 积分`);
    }
  };
  const oldDrawer = renderDrawer;
  renderDrawer = function() {
    oldDrawer();
    const data = read(), scroll = drawerEl.querySelector('.v6-drawer-scroll'), orbit = drawerEl.querySelector('.v6-tool-orbit');
    if (scroll && !scroll.querySelector('.course-points-summary')) {
      const checked = hasCheckedIn(data);
      scroll.insertAdjacentHTML('afterbegin',`<section class="course-points-summary"><button class="course-points-main" data-course-action="route" data-route="points"><span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M9 12h6M12 9v6"/></svg></span><span><small>成长积分</small><b>${availablePoints(data)}</b><em>查看明细与兑换</em></span><i>›</i></button><button class="course-checkin-mini" data-course-action="${checked ? 'route' : 'checkin'}" ${checked ? 'data-route="points"' : ''}>${checked ? '今日已签到' : '签到 +2'}</button></section>`);
    }
    if (orbit && !orbit.querySelector('.course-drawer-tool')) {
      orbit.insertAdjacentHTML('afterbegin',view.drawerEntry(context()));
      orbit.insertAdjacentHTML('beforeend',`<button data-action="route" data-route="task-center"><span class="course-tool-task">${svg.task}</span><b>任务中心</b></button><button data-action="route" data-route="messages"><span class="course-tool-message">${svg.notification}</span><b>消息通知</b></button>`);
    }
  };
  window.addEventListener('qzl:reward',event => {
    const detail = event.detail && typeof event.detail === 'object' ? event.detail : {};
    const rewards = {checkin:2,chat_summary:4,course_lesson:6,action_feedback:8,reflection:6};
    const sourceType = String(detail.sourceType || ''), sourceId = String(detail.sourceId || '').slice(0,160);
    if (!sourceId || !Object.prototype.hasOwnProperty.call(rewards,sourceType)) return;
    const grant = earn(sourceType,sourceId,rewards[sourceType]);
    if (grant) {
      if (drawerEl.dataset.state !== 'closed') renderDrawer();
      toast(`成长积分 +${grant}`);
    }
  });
  document.addEventListener('click',event => {
    const el = event.target.closest('[data-course-action]'); if (!el) return;
    event.preventDefault(); event.stopPropagation();
    const action = el.dataset.courseAction;
    try {
      if (action === 'route') {
        const target = el.dataset.route || 'courses';
        if (drawerEl.contains(el) && drawer.open) navigateFromDrawer(target);
        else go(target);
      }
      else if (action === 'back') goBack(el.dataset.fallback || 'courses');
      else if (action === 'detail') go(`courses/detail/${encodeURIComponent(el.dataset.productId || '')}`);
      else if (action === 'official') {
        const url = new URL(decodeURIComponent(el.dataset.url || ''),location.href);
        if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'appggfriu8w9694.h5.xet.pomoho.com') throw new Error('官方课程地址无效');
        window.open(url.href,'_blank','noopener,noreferrer');
      }
      else if (action === 'checkout') go(`courses/checkout/${encodeURIComponent(el.dataset.productId || '')}?method=${encodeURIComponent(el.dataset.method || 'cash')}`);
      else if (action === 'learn') { const product = model.CATALOG.find(item => item.id === el.dataset.productId); if (product) go(routeForLesson(product.id,product.lessons[0].id)); }
      else if (action === 'preview') go(`courses/detail/${encodeURIComponent(el.dataset.productId || '')}`);
      else if (action === 'preview-recommendation') showRecommendationPreview(el.dataset.productId || '');
      else if (action === 'pay') { const data = model.createOrder(read(),el.dataset.productId,el.dataset.method,iso()); commit(data); const order=data.orders[data.orders.length-1]; go(`courses/checkout/${order.productId}?method=${order.method}&orderId=${order.id}`,true); paymentSheet(order); }
      else if (action === 'pay-existing') { const order=pendingOrder(el.dataset.orderId); if(order) paymentSheet(order); }
      else if (action === 'settle') settle(el.dataset.orderId,el.dataset.result);
      else if (action === 'cancel-order') { const data=read(); commit({...data,orders:data.orders.map(order=>order.id===el.dataset.orderId?{...order,status:'cancelled'}:order)}); go('courses/orders',true); toast('订单已取消'); }
      else if (action === 'complete-lesson') rewardLearning(el.dataset.productId,el.dataset.lessonId);
      else if (action === 'checkin') { const grant=earn('checkin',day(),2); toast(grant ? `签到成功，获得 ${grant} 积分` : '今天已经签到或积分已达上限'); renderRoute(currentRoute); }
      else if (action === 'claim-checkin') { const grant=earn('checkin',day(),2); showBottomSheet(checkinPromptHtml(grant > 0 || hasCheckedIn())); }
      else if (action === 'close-checkin') closeOverlay();
      else if (action === 'add-action') addAction(el.dataset.productId,el.dataset.lessonId);
      else if (action === 'confirm-add-action') confirmAction(el.dataset.productId,el.dataset.lessonId);
      else if (action === 'toggle-recommendation') { const data=read(); commit({...data,preferences:{...data.preferences,proactiveRecommendations:!data.preferences.proactiveRecommendations}}); renderRoute(currentRoute); }
      else if (action === 'hide-recommendation') { const data=read(); commit({...data,recommendationHidden:day()}); refreshConversation({scroll:'auto'}); toast('今天不再主动推荐课程'); }
      else if (action === 'demo-state') demoState(el.dataset.demo);
      else if (action === 'search') { const value=document.getElementById('courseSearch')?.value.trim() || ''; go(`courses/list?q=${encodeURIComponent(value)}`,true); }
      else if (action === 'order') { const order=read().orders.find(item=>item.id===el.dataset.orderId); if(order) go(`courses/order/${order.id}`); }
    } catch (error) { toast(error.message || '暂时没有完成，请重试'); }
  });
  read();
}
installCourse();
