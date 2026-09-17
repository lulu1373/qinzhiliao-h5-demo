(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.QZLCourseModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const DAY = 24 * 60 * 60 * 1000;
  const QUOTE_TTL = 15 * 60 * 1000;
  const CATALOG = [
    {id:'R501', title:'李中莹·父母4堂学会有效亲子沟通课', type:'standard', topic:'亲子沟通', subtitle:'只需这一招，学会正确沟通，当会说话的父母', amountFen:19900, cover:'assets/course-parent-communication.webp', visible:true, lessons:[['r501-1','看见沟通背后的关系',900],['r501-2','把指责换成可回应的话',960],['r501-3','冲突时先稳住连接',960],['r501-4','把方法带回家庭日常',1080]]},
    {id:'R502', title:'李中莹●11堂情绪压力管理课', type:'standard', topic:'情绪压力', subtitle:'告别无用情绪宣泄，有效缓解焦虑与压力', amountFen:29900, cover:'assets/course-emotion-pressure.webp', visible:true, lessons:[['r502-1','认识情绪发出的信号',900],['r502-2','在压力里找回选择',960],['r502-3','建立稳定的日常练习',1080]]},
    {id:'R503', title:'李中莹·心理成长课18讲', type:'standard', topic:'自我成长', subtitle:'人生瓶颈该怎么办？一起找到内心的力量', amountFen:39900, cover:'assets/course-personal-growth.webp', visible:true, lessons:[['r503-1','看见重复出现的困扰',900],['r503-2','理解自己的内在需要',960],['r503-3','让改变从一小步开始',1080]]},
    {id:'R504', title:'李中莹·培养孩子学习天赋与优势35讲', type:'standard', topic:'学习动力', subtitle:'以心理学与脑科学为基础，看见孩子的学习优势', amountFen:298000, cover:'assets/course-learning-strengths.webp', visible:true, lessons:[['r504-1','理解孩子的学习特点',900],['r504-2','找到优势与内在动力',960],['r504-3','建立可持续的学习节奏',1080]]},
    {id:'R505', title:'李中莹婚恋私房课｜第一期', type:'standard', topic:'伴侣关系', subtitle:'每个人都需要的亲密关系辅导宝典', amountFen:398000, cover:'assets/course-partner-relationship.webp', visible:true, lessons:[['r505-1','看见关系里的互动循环',900],['r505-2','把冲突变成可以谈的话题',960],['r505-3','重新建立合作与连接',1080]]},
    {id:'R506', title:'李中莹·培养亲子有效沟通35讲', type:'standard', topic:'亲子沟通', subtitle:'依据心理学技巧，用沟通改善亲子关系', amountFen:298000, cover:'assets/course-parent-dialogue.webp', visible:true, lessons:[['r506-1','理解沟通中的情绪',900],['r506-2','听懂孩子真正想表达什么',960],['r506-3','建立可持续的家庭沟通',1080]]},
    {id:'R507', title:'人生的15项缺失', type:'standard', topic:'自我成长', subtitle:'认识生命经验里仍需要被看见的部分', amountFen:159900, cover:'assets/course-life-missing.webp', visible:true, lessons:[['r507-1','看见生命中的缺失',900],['r507-2','理解经验留下的影响',960],['r507-3','让内在慢慢得到补充',1080]]},
    {id:'B001', title:'新人亲子沟通礼包', type:'newcomer', topic:'亲子沟通', subtitle:'先把冲突说清楚，再一起找下一步', amountFen:990, visible:false, lessons:[['b001-1','先听完再回应',480],['b001-2','把催促改成提问',480],['b001-3','冲突后重新靠近',540]]},
    {id:'M201', title:'孩子情绪来了，父母先稳住', type:'member', topic:'情绪与冲突', subtitle:'识别情绪升级前的那个瞬间', normalFen:5900, memberFen:990, visible:false, lessons:[['m201-1','情绪不是故意捣乱',720],['m201-2','先帮自己停半步',840],['m201-3','冲突后怎样修复',840]]},
    {id:'M202', title:'伴侣一起养育，不必站在对立面', type:'member', topic:'伴侣协作', subtitle:'把分歧变成可以谈的共同规则', normalFen:6900, memberFen:990, visible:false, lessons:[['m202-1','看见彼此的压力',720],['m202-2','分歧里先不结盟',720],['m202-3','一起定一个小约定',720]]},
    {id:'M203', title:'有边界，也有连接', type:'member', topic:'亲子沟通', subtitle:'不靠威胁，也能把话说清楚', normalFen:5900, memberFen:990, visible:false, lessons:[['m203-1','边界从具体开始',600],['m203-2','规则不等于控制',720],['m203-3','后果怎样共同商量',720]]},
    {id:'P301', title:'给父母的暂停练习', type:'points', topic:'自我照顾', subtitle:'在反应之前，给自己一个停顿', pointsCost:120, firstPointsCost:60, visible:false, lessons:[['p301-1','识别身体里的提醒',480],['p301-2','给自己十秒钟',480]]},
    {id:'P302', title:'一次家庭反思，重新看见彼此', type:'points', topic:'家庭关系', subtitle:'不急着判断，先整理经历', pointsCost:240, visible:false, lessons:[['p302-1','回看发生了什么',600],['p302-2','区分事实和感受',600],['p302-3','留下下次可试的一步',600]]},
    {id:'S401', title:'亲子关系系统课', type:'standard', topic:'系统成长', subtitle:'从理解互动循环到建立家庭节奏', amountFen:12900, visible:false, lessons:[['s401-1','关系循环从哪里开始',1200],['s401-2','听见彼此的难处',1200],['s401-3','让规则可执行',1200],['s401-4','冲突后的修复',1200],['s401-5','家庭会议怎么开',1200],['s401-6','把改变放回日常',1200]]}
  ].map(product => ({...product, lessons:product.lessons.map(([id,title,durationSeconds]) => ({id,title,durationSeconds}))}));

  const byId = id => CATALOG.find(product => product.id === id);
  const clone = value => JSON.parse(JSON.stringify(value));
  const asArray = value => Array.isArray(value) ? value : [];
  const validDate = value => Number.isFinite(new Date(value).getTime());
  const nowISO = value => validDate(value) ? new Date(value).toISOString() : new Date().toISOString();
  const plusDays = (value, days) => new Date(new Date(value).getTime() + days * DAY).toISOString();
  const newId = (prefix, now) => `${prefix}_${String(now || Date.now()).replace(/[^0-9]/g,'').slice(-10)}_${Math.random().toString(36).slice(2,7)}`;
  const monthEnd = (year, month) => new Date(Date.UTC(year,month,0)).getUTCDate();
  const localDay = value => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return String(value);
    return new Date(nowISO(value)).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
  };
  const anchoredDay = (year, month, anchorDay) => `${year}-${String(month).padStart(2,'0')}-${String(Math.min(anchorDay,monthEnd(year,month))).padStart(2,'0')}`;

  function membershipCycleId(anchorDate, now) {
    const anchor = localDay(anchorDate), today = localDay(now);
    const [,anchorMonth,anchorDay] = anchor.split('-').map(Number);
    let [year,month] = today.split('-').map(Number);
    let candidate = anchoredDay(year,month,anchorDay);
    if (today < candidate) {
      month -= 1;
      if (month < 1) { year -= 1; month = 12; }
      candidate = anchoredDay(year,month,anchorDay);
    }
    return candidate < anchor ? anchor : candidate;
  }

  function normalize(raw) {
    const input = raw && typeof raw === 'object' ? raw : {};
    const membership = input.membership && typeof input.membership === 'object' ? input.membership : {};
    const points = input.points && typeof input.points === 'object' ? input.points : {};
    const entitlements = asArray(input.entitlements).filter(item => item && byId(item.productId));
    const orders = asArray(input.orders).filter(item => item && item.id && byId(item.productId));
    const ledger = asArray(points.ledger).filter(item => item && item.entryId && Number.isFinite(Number(item.remaining))).map(item => ({...item, amount:Number(item.amount || item.remaining || 0),remaining:Math.max(0, Number(item.remaining || 0))}));
    const consumed = orders.filter(order => order.productId === 'P301' && order.method === 'points' && order.status === 'succeeded').length;
    const data = {
      version:1,
      membership:{active:membership.active === true, anchorDate:typeof membership.anchorDate === 'string' ? membership.anchorDate : '', cycleId:typeof membership.cycleId === 'string' ? membership.cycleId : '', quota:Number.isInteger(membership.quota) ? membership.quota : 2, used:Number.isInteger(membership.used) ? membership.used : 0},
      points:{ledger, balance:ledger.reduce((sum, item) => sum + item.remaining, 0)},
      orders,
      entitlements,
      preferences:{proactiveRecommendations:input.preferences?.proactiveRecommendations !== false},
      progress:input.progress && typeof input.progress === 'object' ? clone(input.progress) : {},
      recommendationHidden:typeof input.recommendationHidden === 'string' ? input.recommendationHidden : '',
      checkinPromptDay:typeof input.checkinPromptDay === 'string' ? input.checkinPromptDay : '',
      recommendationExposure:input.recommendationExposure && typeof input.recommendationExposure === 'object' ? clone(input.recommendationExposure) : {},
      firstPointsRedemption:input.firstPointsRedemption === true || consumed > 0
    };
    return data;
  }

  function entitlement(state, productId, now) {
    const instant = new Date(nowISO(now)).getTime();
    return normalize(state).entitlements.find(item => item.productId === productId && item.status === 'active' && new Date(item.validUntil).getTime() > instant);
  }
  function canLearn(state, productId, now) { return !!entitlement(state, productId, now); }

  function reservationIsLive(order, now) {
    const expiresAt = new Date(order?.quoteExpiresAt).getTime();
    return ['pending','processing'].includes(order?.status) && Number.isFinite(expiresAt) && expiresAt > new Date(nowISO(now)).getTime();
  }

  function reservedByEntry(orders, now) {
    const reserved = new Map();
    asArray(orders).filter(order => order.method === 'points' && reservationIsLive(order,now)).forEach(order => {
      asArray(order.allocations).forEach(allocation => reserved.set(allocation.entryId,(reserved.get(allocation.entryId) || 0) + Number(allocation.amount || 0)));
    });
    return reserved;
  }
  function availablePointBalance(state, now) {
    const instant = new Date(nowISO(now)).getTime(), reserved = reservedByEntry(state.orders,now);
    return state.points.ledger.reduce((sum,item) => sum + (new Date(item.expiresAt).getTime() > instant ? Math.max(0,item.remaining-(reserved.get(item.entryId) || 0)) : 0),0);
  }

  function pointBalances(raw, now) {
    const state = normalize(raw), instant = new Date(nowISO(now)).getTime();
    const total = state.points.ledger.reduce((sum,item) => sum + (item.kind !== 'spend' && new Date(item.expiresAt).getTime() > instant ? Math.max(0,item.remaining) : 0),0);
    const available = availablePointBalance(state,now);
    return {available,frozen:Math.max(0,total-available),total};
  }

  function reservedMemberQuota(state, now) {
    return state.orders.filter(order => order.memberReservation && order.memberCycleId === state.membership.cycleId && reservationIsLive(order,now)).length;
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
      const remaining = state.membership.quota - state.membership.used - reservedMemberQuota(state,now);
      if (state.membership.active && remaining > 0) return {available:true,method:'cash',amountFen:product.memberFen,label:'会员专享 ¥9.9',reason:''};
      return {available:false,method:'cash',amountFen:product.normalFen,label:'会员专享 ¥9.9',reason:state.membership.active ? 'member_quota_used' : 'member_required'};
    }
    if (product.type === 'points') {
      const hasWelcomePrice = Number.isFinite(Number(product.firstPointsCost));
      const cost = hasWelcomePrice && !state.firstPointsRedemption ? Number(product.firstPointsCost) : Number(product.pointsCost);
      const available = availablePointBalance(state,now);
      return {available:available >= cost,method:'points',amountFen:0,pointsCost:cost,label:`${cost} 积分兑换`,reason:available >= cost ? '' : 'points_insufficient'};
    }
    return {available:true,method:'cash',amountFen:product.amountFen,label:`¥${(product.amountFen / 100).toFixed(0)}`,reason:''};
  }

  function reservePoints(ledger, cost, now, orders=[]) {
    const usable = ledger.filter(item => new Date(item.expiresAt).getTime() > new Date(now).getTime() && item.remaining > 0).sort((a,b) => new Date(a.expiresAt) - new Date(b.expiresAt));
    const reserved = reservedByEntry(orders,now);
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
    if (state.orders.some(order => order.productId === productId && reservationIsLive(order,now))) throw new Error('这门课程已有待确认订单');
    if (!offer.available || offer.method !== method) throw new Error(offer.reason === 'points_insufficient' ? '积分不足，先完成任务再来兑换' : '当前不满足获取条件');
    const createdAt = nowISO(now);
    const order = {id:newId('course',now), productId, method, status:'pending', createdAt, quoteExpiresAt:new Date(new Date(createdAt).getTime() + QUOTE_TTL).toISOString(), amountFen:offer.amountFen || 0, pointsCost:offer.pointsCost || 0, allocations:method === 'points' ? reservePoints(state.points.ledger, offer.pointsCost, createdAt,state.orders) : [], memberCycleId:product.type === 'member' ? state.membership.cycleId : '', memberReservation:product.type === 'member'};
    return {...state, orders:[...state.orders, order]};
  }

  function redeemPoints(raw, cost, now, fixedAllocations=null) {
    const state = normalize(raw), allocations = fixedAllocations || reservePoints(state.points.ledger, Number(cost), nowISO(now),state.orders);
    const ledger = state.points.ledger.map(item => {
      const allocation = allocations.find(value => value.entryId === item.entryId);
      return allocation ? {...item, remaining:item.remaining - allocation.amount} : item;
    });
    const spend = {entryId:newId('points_spend',now),kind:'spend',amount:-Number(cost),remaining:0,occurredAt:nowISO(now),sourceType:'course_redemption'};
    const nextLedger = [...ledger,spend];
    return {...state, points:{ledger:nextLedger,balance:nextLedger.reduce((sum,item) => sum + item.remaining,0)}};
  }

  function settleOrder(raw, status, now, orderId='') {
    const state = normalize(raw);
    const instant = new Date(nowISO(now)).getTime();
    const pending = orderId
      ? state.orders.find(order => order.id === orderId && (order.status === 'pending' || order.status === 'processing'))
      : [...state.orders].reverse().find(order => order.status === 'pending' || order.status === 'processing');
    if (!pending) return state;
    if (pending.status === 'succeeded') return state;
    if (!['success','failed','processing','cancelled'].includes(status)) throw new Error('未知交易结果');
    const product = byId(pending.productId);
    const invalidMemberCycle = product?.type === 'member' && pending.memberReservation && pending.memberCycleId !== state.membership.cycleId;
    const invalidPointAllocation = pending.method === 'points' && (
      asArray(pending.allocations).reduce((sum,item) => sum + Number(item.amount || 0),0) !== Number(pending.pointsCost || 0) ||
      asArray(pending.allocations).some(allocation => {
        const lot = state.points.ledger.find(item => item.entryId === allocation.entryId);
        return !lot || new Date(lot.expiresAt).getTime() <= instant || Number(lot.remaining) < Number(allocation.amount || 0);
      })
    );
    if (status === 'success' && (new Date(pending.quoteExpiresAt).getTime() <= instant || invalidMemberCycle || invalidPointAllocation)) {
      return {...state,orders:state.orders.map(order => order.id === pending.id ? {...order,status:'expired'} : order)};
    }
    if (status === 'processing') return {...state, orders:state.orders.map(order => order.id === pending.id ? {...order,status:'processing'} : order)};
    if (status === 'failed' || status === 'cancelled') return {...state, orders:state.orders.map(order => order.id === pending.id ? {...order,status:status === 'failed' ? 'failed' : 'cancelled'} : order)};
    if (entitlement(state,pending.productId,now)) return {...state,orders:state.orders.map(order => order.id===pending.id ? {...order,status:'succeeded',completedAt:nowISO(now)} : order)};
    let next = state;
    if (pending.method === 'points') next = redeemPoints(next,pending.pointsCost,nowISO(now),pending.allocations);
    const ent = {id:newId('entitlement',now),productId:pending.productId,orderId:pending.id,source:pending.method,validFrom:nowISO(now),validUntil:plusDays(nowISO(now),365),status:'active'};
    next = {...next, entitlements:[...next.entitlements,ent], orders:next.orders.map(order => order.id===pending.id ? {...order,status:'succeeded',completedAt:nowISO(now)} : order)};
    if (product.type === 'member' && pending.memberReservation) next = {...next,membership:{...next.membership,used:next.membership.used + 1}};
    if (pending.method === 'points' && pending.productId === 'P301') next = {...next,firstPointsRedemption:true};
    return normalize(next);
  }

  function recommendationAvailable(raw, localDay) {
    const hidden = normalize(raw).recommendationHidden;
    return !hidden || hidden !== String(localDay || '').slice(0,10);
  }

  return {CATALOG, normalize, offerFor, createOrder, settleOrder, redeemPoints, pointBalances, canLearn, entitlement, recommendationAvailable, membershipCycleId};
});
