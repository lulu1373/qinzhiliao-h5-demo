(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.QZLCourseModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const DAY = 24 * 60 * 60 * 1000;
  const CATALOG = [
    {id:'B001', title:'新人亲子沟通礼包', type:'newcomer', topic:'亲子沟通', subtitle:'先把冲突说清楚，再一起找下一步', amountFen:990, lessons:[['b001-1','先听完再回应',480],['b001-2','把催促改成提问',480],['b001-3','冲突后重新靠近',540]]},
    {id:'M201', title:'孩子情绪来了，父母先稳住', type:'member', topic:'情绪与冲突', subtitle:'识别情绪升级前的那个瞬间', normalFen:5900, memberFen:990, lessons:[['m201-1','情绪不是故意捣乱',720],['m201-2','先帮自己停半步',840],['m201-3','冲突后怎样修复',840]]},
    {id:'M202', title:'伴侣一起养育，不必站在对立面', type:'member', topic:'伴侣协作', subtitle:'把分歧变成可以谈的共同规则', normalFen:6900, memberFen:990, lessons:[['m202-1','看见彼此的压力',720],['m202-2','分歧里先不结盟',720],['m202-3','一起定一个小约定',720]]},
    {id:'M203', title:'有边界，也有连接', type:'member', topic:'亲子沟通', subtitle:'不靠威胁，也能把话说清楚', normalFen:5900, memberFen:990, lessons:[['m203-1','边界从具体开始',600],['m203-2','规则不等于控制',720],['m203-3','后果怎样共同商量',720]]},
    {id:'P301', title:'给父母的暂停练习', type:'points', topic:'自我照顾', subtitle:'在反应之前，给自己一个停顿', pointsCost:120, firstPointsCost:60, lessons:[['p301-1','识别身体里的提醒',480],['p301-2','给自己十秒钟',480]]},
    {id:'P302', title:'一次家庭反思，重新看见彼此', type:'points', topic:'家庭关系', subtitle:'不急着判断，先整理经历', pointsCost:240, lessons:[['p302-1','回看发生了什么',600],['p302-2','区分事实和感受',600],['p302-3','留下下次可试的一步',600]]},
    {id:'S401', title:'亲子关系系统课', type:'standard', topic:'系统成长', subtitle:'从理解互动循环到建立家庭节奏', amountFen:12900, lessons:[['s401-1','关系循环从哪里开始',1200],['s401-2','听见彼此的难处',1200],['s401-3','让规则可执行',1200],['s401-4','冲突后的修复',1200],['s401-5','家庭会议怎么开',1200],['s401-6','把改变放回日常',1200]]}
  ].map(product => ({...product, lessons:product.lessons.map(([id,title,durationSeconds]) => ({id,title,durationSeconds}))}));

  const byId = id => CATALOG.find(product => product.id === id);
  const clone = value => JSON.parse(JSON.stringify(value));
  const asArray = value => Array.isArray(value) ? value : [];
  const validDate = value => Number.isFinite(new Date(value).getTime());
  const nowISO = value => validDate(value) ? new Date(value).toISOString() : new Date().toISOString();
  const plusDays = (value, days) => new Date(new Date(value).getTime() + days * DAY).toISOString();
  const newId = (prefix, now) => `${prefix}_${String(now || Date.now()).replace(/[^0-9]/g,'').slice(-10)}_${Math.random().toString(36).slice(2,7)}`;

  function normalize(raw) {
    const input = raw && typeof raw === 'object' ? raw : {};
    const membership = input.membership && typeof input.membership === 'object' ? input.membership : {};
    const points = input.points && typeof input.points === 'object' ? input.points : {};
    const entitlements = asArray(input.entitlements).filter(item => item && byId(item.productId));
    const orders = asArray(input.orders).filter(item => item && item.id && byId(item.productId));
    const ledger = asArray(points.ledger).filter(item => item && item.entryId && Number.isFinite(Number(item.remaining))).map(item => ({...item, amount:Number(item.amount || item.remaining || 0),remaining:Math.max(0, Number(item.remaining || 0))}));
    const consumed = orders.filter(order => order.method === 'points' && order.status === 'succeeded').length;
    const data = {
      version:1,
      membership:{active:membership.active === true, cycleId:typeof membership.cycleId === 'string' ? membership.cycleId : '', quota:Number.isInteger(membership.quota) ? membership.quota : 2, used:Number.isInteger(membership.used) ? membership.used : 0},
      points:{ledger, balance:ledger.reduce((sum, item) => sum + item.remaining, 0)},
      orders,
      entitlements,
      preferences:{proactiveRecommendations:input.preferences?.proactiveRecommendations !== false},
      progress:input.progress && typeof input.progress === 'object' ? clone(input.progress) : {},
      recommendationHidden:typeof input.recommendationHidden === 'string' ? input.recommendationHidden : '',
      firstPointsRedemption:input.firstPointsRedemption === true || consumed > 0
    };
    return data;
  }

  function entitlement(state, productId, now) {
    const instant = new Date(nowISO(now)).getTime();
    return normalize(state).entitlements.find(item => item.productId === productId && item.status === 'active' && new Date(item.validUntil).getTime() > instant);
  }
  function canLearn(state, productId, now) { return !!entitlement(state, productId, now); }

  function reservedByEntry(orders) {
    const reserved = new Map();
    asArray(orders).filter(order => order.method === 'points' && ['pending','processing'].includes(order.status)).forEach(order => {
      asArray(order.allocations).forEach(allocation => reserved.set(allocation.entryId,(reserved.get(allocation.entryId) || 0) + Number(allocation.amount || 0)));
    });
    return reserved;
  }
  function availablePointBalance(state, now) {
    const instant = new Date(nowISO(now)).getTime(), reserved = reservedByEntry(state.orders);
    return state.points.ledger.reduce((sum,item) => sum + (new Date(item.expiresAt).getTime() > instant ? Math.max(0,item.remaining-(reserved.get(item.entryId) || 0)) : 0),0);
  }

  function offerFor(raw, productId, now) {
    const state = normalize(raw), product = byId(productId);
    if (!product) return {available:false,method:'',amountFen:0,label:'',reason:'not_found'};
    if (entitlement(state, productId, now)) return {available:false,method:'owned',amountFen:0,label:'已拥有',reason:'owned'};
    if (product.type === 'newcomer') {
      if (state.orders.some(order => order.productId === productId && order.status === 'succeeded')) return {available:false,method:'cash',amountFen:990,label:'新人 ¥9.9',reason:'newcomer_used'};
      return {available:true,method:'cash',amountFen:990,label:'新人 ¥9.9',reason:''};
    }
    if (product.type === 'member') {
      if (state.membership.active && state.membership.used < state.membership.quota) return {available:true,method:'cash',amountFen:product.memberFen,label:'会员专享 ¥9.9',reason:''};
      return {available:false,method:'cash',amountFen:product.normalFen,label:'会员专享 ¥9.9',reason:state.membership.active ? 'member_quota_used' : 'member_required'};
    }
    if (product.type === 'points') {
      const cost = state.firstPointsRedemption ? product.pointsCost : product.firstPointsCost;
      const available = availablePointBalance(state,now);
      return {available:available >= cost,method:'points',amountFen:0,pointsCost:cost,label:`${cost} 积分兑换`,reason:available >= cost ? '' : 'points_insufficient'};
    }
    return {available:true,method:'cash',amountFen:product.amountFen,label:`¥${(product.amountFen / 100).toFixed(0)}`,reason:''};
  }

  function reservePoints(ledger, cost, now, orders=[]) {
    const usable = ledger.filter(item => new Date(item.expiresAt).getTime() > new Date(now).getTime() && item.remaining > 0).sort((a,b) => new Date(a.expiresAt) - new Date(b.expiresAt));
    const reserved = reservedByEntry(orders);
    let needed = cost;
    const allocations = [];
    for (const item of usable) {
      const amount = Math.min(needed, Math.max(0,item.remaining-(reserved.get(item.entryId) || 0)));
      if (amount) allocations.push({entryId:item.entryId, amount});
      needed -= amount;
      if (!needed) break;
    }
    if (needed) throw new Error('积分不足，先完成任务再来兑换');
    return allocations;
  }

  function createOrder(raw, productId, method, now) {
    const state = normalize(raw), offer = offerFor(state, productId, now), product = byId(productId);
    if (!product) throw new Error('课程暂不可用');
    if (state.orders.some(order => order.productId === productId && ['pending','processing'].includes(order.status))) throw new Error('这门课程已有待确认订单');
    if (!offer.available || offer.method !== method) throw new Error(offer.reason === 'points_insufficient' ? '积分不足，先完成任务再来兑换' : '当前不满足获取条件');
    const order = {id:newId('course',now), productId, method, status:'pending', createdAt:nowISO(now), quoteExpiresAt:plusDays(nowISO(now), 1), amountFen:offer.amountFen || 0, pointsCost:offer.pointsCost || 0, allocations:method === 'points' ? reservePoints(state.points.ledger, offer.pointsCost, nowISO(now),state.orders) : [], memberCycleId:product.type === 'member' ? state.membership.cycleId : '', memberReservation:product.type === 'member'};
    return {...state, orders:[...state.orders, order]};
  }

  function redeemPoints(raw, cost, now, fixedAllocations=null) {
    const state = normalize(raw), allocations = fixedAllocations || reservePoints(state.points.ledger, Number(cost), nowISO(now),state.orders);
    const ledger = state.points.ledger.map(item => {
      const allocation = allocations.find(value => value.entryId === item.entryId);
      return allocation ? {...item, remaining:item.remaining - allocation.amount} : item;
    });
    return {...state, points:{ledger,balance:ledger.reduce((sum,item) => sum + item.remaining,0)}};
  }

  function settleOrder(raw, status, now, orderId='') {
    const state = normalize(raw);
    const pending = orderId
      ? state.orders.find(order => order.id === orderId && (order.status === 'pending' || order.status === 'processing'))
      : [...state.orders].reverse().find(order => order.status === 'pending' || order.status === 'processing');
    if (!pending) return state;
    if (pending.status === 'succeeded') return state;
    if (!['success','failed','processing','cancelled'].includes(status)) throw new Error('未知交易结果');
    if (status === 'processing') return {...state, orders:state.orders.map(order => order.id === pending.id ? {...order,status:'processing'} : order)};
    if (status === 'failed' || status === 'cancelled') return {...state, orders:state.orders.map(order => order.id === pending.id ? {...order,status:status === 'failed' ? 'failed' : 'cancelled'} : order)};
    if (entitlement(state,pending.productId,now)) return {...state,orders:state.orders.map(order => order.id===pending.id ? {...order,status:'succeeded',completedAt:nowISO(now)} : order)};
    let next = state;
    if (pending.method === 'points') next = redeemPoints(next,pending.pointsCost,nowISO(now),pending.allocations);
    const product = byId(pending.productId);
    const ent = {id:newId('entitlement',now),productId:pending.productId,orderId:pending.id,source:pending.method,validFrom:nowISO(now),validUntil:plusDays(nowISO(now),365),status:'active'};
    next = {...next, entitlements:[...next.entitlements,ent], orders:next.orders.map(order => order.id===pending.id ? {...order,status:'succeeded',completedAt:nowISO(now)} : order)};
    if (product.type === 'member' && pending.memberReservation) next = {...next,membership:{...next.membership,used:next.membership.used + 1}};
    if (pending.method === 'points') next = {...next,firstPointsRedemption:true};
    return normalize(next);
  }

  function recommendationAvailable(raw, localDay) {
    const hidden = normalize(raw).recommendationHidden;
    return !hidden || hidden !== String(localDay || '').slice(0,10);
  }

  return {CATALOG, normalize, offerFor, createOrder, settleOrder, redeemPoints, canLearn, entitlement, recommendationAvailable};
});
