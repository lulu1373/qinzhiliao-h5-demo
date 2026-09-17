const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../assets/course-view.js');
const view = fs.existsSync(file) ? require(file) : {};
const M = require('../assets/course-model.js');
const ctx = (data = M.normalize()) => ({data, model:M, esc:value => String(value ?? '').replace(/[<>&]/g, char => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[char]))});

test('exports course view contract', () => {
  for (const key of ['render', 'homeEntry', 'drawerEntry']) assert.equal(typeof view[key], 'function');
});

test('classroom gives newcomer bundle, learning continuation and points clear entry labels', () => {
  const html = view.render('courses', ctx());
  assert.match(html, /简快课堂/);
  assert.match(html, /新人 ¥9\.9/);
  assert.match(html, /成长积分/);
  assert.match(html, /data-course-action="detail" data-product-id="B001"/);
  assert.match(view.homeEntry(ctx()), /简快课堂/);
  assert.match(view.drawerEntry(ctx()), /我的学习/);
});

test('detail and checkout make the selected method and simulation explicit', () => {
  const detail = view.render('courses/detail/B001', ctx());
  assert.match(detail, /新人亲子沟通礼包/);
  assert.match(detail, /模拟支付/);
  assert.match(detail, /data-course-action="checkout"/);
  const checkout = view.render('courses/checkout/B001?method=cash', ctx());
  assert.match(checkout, /确认获取/);
  assert.match(checkout, /不会扣款/);
  assert.match(checkout, /data-course-action="pay"/);
});

test('learning page marks demo media and blocks locked course content', () => {
  const locked = view.render('courses/learn/B001/b001-1', ctx());
  assert.match(locked, /先获取课程/);
  const owned = M.settleOrder(M.createOrder(M.normalize(), 'B001', 'cash', '2026-09-17T10:00:00.000Z'), 'success', '2026-09-17T10:00:01.000Z');
  const learning = view.render('courses/learn/B001/b001-1', ctx(owned));
  assert.match(learning, /演示播放器/);
  assert.match(learning, /加入行动/);
});

test('points page exposes a deliberate daily check-in action', () => {
  const html = view.render('points', ctx());
  assert.match(html, /今日签到/);
  assert.match(html, /data-course-action="checkin"/);
});

test('order detail keeps the acquisition record separate from the learning entitlement', () => {
  const pending = M.createOrder(M.normalize(), 'B001', 'cash', '2026-09-17T10:00:00.000Z');
  const paid = M.settleOrder(pending, 'success', '2026-09-17T10:00:01.000Z');
  const order = paid.orders[0];
  const html = view.render(`courses/order/${order.id}`, ctx(paid));
  assert.match(html, /订单详情/);
  assert.match(html, /已获取/);
  assert.match(html, /有效期/);
  assert.match(html, /data-course-action="learn"/);
});
