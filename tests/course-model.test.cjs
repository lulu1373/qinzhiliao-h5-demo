const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '../assets/course-model.js');
const M = fs.existsSync(file) ? require(file) : {};

test('exports the classroom domain contract', () => {
  for (const key of ['CATALOG', 'normalize', 'offerFor', 'createOrder', 'settleOrder', 'redeemPoints']) {
    assert.equal(typeof M[key], key === 'CATALOG' ? 'object' : 'function');
  }
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
