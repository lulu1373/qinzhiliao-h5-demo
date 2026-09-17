const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '../assets/course-model.js');
const M = fs.existsSync(file) ? require(file) : {};

test('exports the classroom domain contract', () => {
  for (const key of ['CATALOG', 'normalize', 'offerFor', 'createOrder', 'settleOrder', 'redeemPoints', 'membershipCycleId']) {
    assert.equal(typeof M[key], key === 'CATALOG' ? 'object' : 'function');
  }
});

test('membership cycles follow the activation-day anchor and clamp to month end', () => {
  assert.equal(M.membershipCycleId('2026-01-31', '2026-02-27T12:00:00+08:00'), '2026-01-31');
  assert.equal(M.membershipCycleId('2026-01-31', '2026-02-28T12:00:00+08:00'), '2026-02-28');
  assert.equal(M.membershipCycleId('2026-01-31', '2026-03-01T12:00:00+08:00'), '2026-02-28');
  assert.equal(M.membershipCycleId('2026-01-31', '2026-03-31T12:00:00+08:00'), '2026-03-31');
  assert.equal(M.membershipCycleId('2026-09-03', '2026-10-02T12:00:00+08:00'), '2026-09-03');
  assert.equal(M.membershipCycleId('2026-09-03', '2026-10-03T12:00:00+08:00'), '2026-10-03');
});

test('newcomer bundle is purchased once and membership offer consumes only its cycle quota', () => {
  const state = M.normalize({ membership:{active:true,cycleId:'2026-09-17',quota:2,used:0} });
  const newcomer = M.offerFor(state, 'B001', '2026-09-17T10:00:00.000Z');
  assert.deepEqual(newcomer, { available:true, method:'cash', amountFen:990, label:'新人 ¥9.9', reason:'' });
  const first = M.settleOrder(M.createOrder(state, 'B001', 'cash', '2026-09-17T10:00:00.000Z'), 'success', '2026-09-17T10:01:00.000Z');
  assert.equal(M.offerFor(first, 'B001', '2026-09-17T10:02:00.000Z').reason, 'owned');
  const memberOrder = M.settleOrder(M.createOrder(first, 'M201', 'cash', '2026-09-17T10:02:00.000Z'), 'success', '2026-09-17T10:03:00.000Z');
  assert.equal(memberOrder.membership.used, 1);
  assert.equal(M.offerFor(memberOrder, 'M202', '2026-09-17T10:04:00.000Z').amountFen, 990);
  assert.equal(M.offerFor({...memberOrder, membership:{...memberOrder.membership, used:2}}, 'M202', '2026-09-17T10:04:00.000Z').reason, 'member_quota_used');
});

test('points redemption is atomic, prefers the earliest expiry and never double deducts', () => {
  const state = M.normalize({ points:{ledger:[
    {entryId:'soon',kind:'earn',amount:80,remaining:80,expiresAt:'2026-09-20T00:00:00.000Z'},
    {entryId:'later',kind:'earn',amount:100,remaining:100,expiresAt:'2026-10-20T00:00:00.000Z'}
  ]} });
  const pending = M.createOrder(state, 'P301', 'points', '2026-09-17T10:00:00.000Z');
  const success = M.settleOrder(pending, 'success', '2026-09-17T10:00:01.000Z');
  assert.equal(success.points.ledger.find(item => item.entryId === 'soon').remaining, 20);
  assert.equal(success.points.ledger.find(item => item.entryId === 'later').remaining, 100);
  assert.equal(success.points.balance, 120);
  const repeated = M.settleOrder(success, 'success', '2026-09-17T10:00:02.000Z');
  assert.deepEqual(repeated.points, success.points);
  assert.throws(() => M.redeemPoints(M.normalize({points:{ledger:[{entryId:'x',kind:'earn',amount:40,remaining:40,expiresAt:'2026-10-01T00:00:00.000Z'}]}}), 60, '2026-09-17T10:00:00.000Z'), /积分不足/);
});

test('course entitlement outlives membership and expires independently after 365 days', () => {
  const base = M.normalize({ membership:{active:true,cycleId:'2026-09-17',quota:2,used:0} });
  const bought = M.settleOrder(M.createOrder(base, 'M201', 'cash', '2026-09-17T10:00:00.000Z'), 'success', '2026-09-17T10:00:01.000Z');
  const expiredMember = {...bought, membership:{...bought.membership, active:false}};
  assert.equal(M.canLearn(expiredMember, 'M201', '2026-10-01T00:00:00.000Z'), true);
  assert.equal(M.canLearn(expiredMember, 'M201', '2027-09-18T00:00:00.000Z'), false);
});

test('prevents duplicate pending orders and only suppresses recommendations for the selected day', () => {
  const first = M.createOrder(M.normalize(), 'B001', 'cash', '2026-09-17T10:00:00.000Z');
  assert.throws(() => M.createOrder(first, 'B001', 'cash', '2026-09-17T10:01:00.000Z'), /待确认/);
  assert.equal(M.recommendationAvailable(M.normalize({recommendationHidden:'2026-09-17'}), '2026-09-17'), false);
  assert.equal(M.recommendationAvailable(M.normalize({recommendationHidden:'2026-09-17'}), '2026-09-18'), true);
});

test('pending point exchanges lock their allocations before another order can spend them', () => {
  const base = M.normalize({points:{ledger:[{entryId:'wallet',kind:'earn',amount:300,remaining:300,expiresAt:'2026-10-01T00:00:00.000Z'}]},firstPointsRedemption:true});
  const first = M.createOrder(base, 'P301', 'points', '2026-09-17T10:00:00.000Z');
  assert.throws(() => M.createOrder(first, 'P302', 'points', '2026-09-17T10:01:00.000Z'), /积分不足/);
  const paid = M.settleOrder(first, 'success', '2026-09-17T10:02:00.000Z');
  assert.equal(paid.points.balance, 180);
});

test('settles the requested order when separate pending course orders coexist', () => {
  const base = M.normalize({membership:{active:true,cycleId:'2026-09-17',quota:2,used:0}});
  const first = M.createOrder(base, 'B001', 'cash', '2026-09-17T10:00:00.000Z');
  const second = M.createOrder(first, 'M201', 'cash', '2026-09-17T10:01:00.000Z');
  const settled = M.settleOrder(second, 'success', '2026-09-17T10:02:00.000Z', first.orders[0].id);
  assert.equal(settled.orders.find(order => order.id === first.orders[0].id).status, 'succeeded');
  assert.equal(settled.orders.find(order => order.id === second.orders[1].id).status, 'pending');
  assert.equal(M.canLearn(settled, 'B001', '2026-09-17T10:03:00.000Z'), true);
  assert.equal(M.canLearn(settled, 'M201', '2026-09-17T10:03:00.000Z'), false);
});

test('a product without a welcome points price always uses its regular price', () => {
  const state = M.normalize({points:{ledger:[
    {entryId:'wallet',kind:'earn',amount:300,remaining:300,expiresAt:'2026-10-01T00:00:00.000Z'}
  ]}});
  const offer = M.offerFor(state, 'P302', '2026-09-17T10:00:00.000Z');
  assert.equal(offer.pointsCost, 240);
  assert.equal(offer.label, '240 积分兑换');
  assert.equal(Number.isFinite(offer.pointsCost), true);
});

test('the welcome points price belongs only to P301', () => {
  const state = M.normalize({points:{ledger:[
    {entryId:'wallet',kind:'earn',amount:500,remaining:500,expiresAt:'2026-10-01T00:00:00.000Z'}
  ]}});
  const p302 = M.settleOrder(M.createOrder(state, 'P302', 'points', '2026-09-17T10:00:00.000Z'), 'success', '2026-09-17T10:01:00.000Z');
  assert.equal(M.offerFor(p302, 'P301', '2026-09-17T10:02:00.000Z').pointsCost, 60);
});

test('pending member orders reserve quota before payment', () => {
  const base = M.normalize({membership:{active:true,cycleId:'cycle-a',quota:2,used:0}});
  const first = M.createOrder(base, 'M201', 'cash', '2026-09-17T10:00:00.000Z');
  const second = M.createOrder(first, 'M202', 'cash', '2026-09-17T10:01:00.000Z');
  assert.equal(M.offerFor(second, 'M203', '2026-09-17T10:02:00.000Z').reason, 'member_quota_used');
  assert.throws(() => M.createOrder(second, 'M203', 'cash', '2026-09-17T10:02:00.000Z'), /名额|条件/);
});

test('successful points redemption appends an immutable spend event', () => {
  const base = M.normalize({points:{ledger:[
    {entryId:'earn-160',kind:'earn',amount:160,remaining:160,expiresAt:'2026-10-01T00:00:00.000Z'}
  ]}});
  const success = M.settleOrder(M.createOrder(base, 'P301', 'points', '2026-09-17T10:00:00.000Z'), 'success', '2026-09-17T10:01:00.000Z');
  assert.equal(success.points.ledger.find(item => item.entryId === 'earn-160').amount, 160);
  assert.equal(success.points.ledger.some(item => item.kind === 'spend' && item.amount === -60), true);
  assert.equal(success.points.balance, 100);
});

test('a pending quote cannot settle after fifteen minutes', () => {
  const pending = M.createOrder(M.normalize(), 'B001', 'cash', '2026-09-17T10:00:00.000Z');
  const expired = M.settleOrder(pending, 'success', '2026-09-17T10:16:00.000Z');
  assert.equal(expired.orders[0].status, 'expired');
  assert.equal(expired.entitlements.length, 0);
});

test('point balance separates available and frozen amounts', () => {
  const base = M.normalize({points:{ledger:[
    {entryId:'wallet',kind:'earn',amount:160,remaining:160,expiresAt:'2026-10-01T00:00:00.000Z'}
  ]}});
  const pending = M.createOrder(base, 'P301', 'points', '2026-09-17T10:00:00.000Z');
  assert.deepEqual(M.pointBalances(pending, '2026-09-17T10:01:00.000Z'), {available:100,frozen:60,total:160});
});

test('an expired quote releases its frozen points before settlement', () => {
  const base = M.normalize({points:{ledger:[
    {entryId:'wallet',kind:'earn',amount:160,remaining:160,expiresAt:'2026-10-01T00:00:00.000Z'}
  ]}});
  const pending = M.createOrder(base, 'P301', 'points', '2026-09-17T10:00:00.000Z');
  assert.deepEqual(M.pointBalances(pending, '2026-09-17T10:16:00.000Z'), {available:160,frozen:0,total:160});
});

test('a point order cannot consume a lot that expired before settlement', () => {
  const base = M.normalize({points:{ledger:[
    {entryId:'short-lived',kind:'earn',amount:160,remaining:160,expiresAt:'2026-09-17T10:05:00.000Z'}
  ]}});
  const pending = M.createOrder(base, 'P301', 'points', '2026-09-17T10:00:00.000Z');
  const expired = M.settleOrder(pending, 'success', '2026-09-17T10:06:00.000Z');
  assert.equal(expired.orders[0].status, 'expired');
  assert.equal(expired.entitlements.length, 0);
  assert.equal(expired.points.ledger[0].remaining, 160);
});

test('an order from a previous membership cycle cannot consume the current quota', () => {
  const oldCycle = M.normalize({membership:{active:true,cycleId:'2026-08',quota:2,used:0}});
  const pending = M.createOrder(oldCycle, 'M201', 'cash', '2026-09-17T10:00:00.000Z');
  const advanced = {...pending,membership:{active:true,cycleId:'2026-09',quota:2,used:0}};
  const expired = M.settleOrder(advanced, 'success', '2026-09-17T10:01:00.000Z');
  assert.equal(expired.orders[0].status, 'expired');
  assert.equal(expired.membership.used, 0);
  assert.equal(expired.entitlements.length, 0);
});
