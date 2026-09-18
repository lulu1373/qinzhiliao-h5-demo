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
  assert.equal(view.homeEntry(ctx()), '');
  assert.match(view.drawerEntry(ctx()), /我的学习/);
  assert.doesNotMatch(view.drawerEntry(ctx()), /v6-drawer-feature/);
});

test('every course route renders inside its own vertical scroll region', () => {
  for (const route of ['courses','courses/list','points','points/ledger','my-learning']) {
    assert.match(view.render(route, ctx()), /<main class="[^"]*course-page[^"]*qzl-page-scroll/);
  }
});

test('all-courses list uses real store covers, prices and official products only', () => {
  const html = view.render('courses/list', ctx());
  assert.match(html, /10 门真实课程/);
  assert.match(html, /李中莹·NLP人生智慧深度答疑会/);
  assert.match(html, /简快身心积极疗法-高级班/);
  assert.match(html, /assets\/courses\//);
  assert.match(html, /¥3980/);
  assert.match(html, /data-course-source="xet"/);
  assert.doesNotMatch(html, /新人亲子沟通礼包/);
  assert.doesNotMatch(html, /给父母的暂停练习/);
});

test('real course detail links to the official store without invented lessons or checkout', () => {
  const html = view.render('courses/detail/SPU_SRV_7552428368961d8zaFyye25', ctx());
  assert.match(html, /官方课程/);
  assert.match(html, /data-course-action="official"/);
  assert.match(html, /¥3980/);
  assert.doesNotMatch(html, /<h2>课程目录/);
  assert.doesNotMatch(html, /data-course-action="checkout"/);
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
  assert.match(html, /当前可用/);
  assert.match(html, /去完成/);
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

test('points ledger displays original earn and spend amounts', () => {
  const base = M.normalize({points:{ledger:[
    {entryId:'wallet',kind:'earn',amount:160,remaining:160,expiresAt:'2026-10-01T00:00:00.000Z'}
  ]}});
  const paid = M.settleOrder(M.createOrder(base, 'P301', 'points', '2026-09-17T10:00:00.000Z'), 'success', '2026-09-17T10:01:00.000Z');
  const html = view.render('points/ledger', ctx(paid));
  assert.match(html, /\+160/);
  assert.match(html, /−60/);
  assert.doesNotMatch(html, />-0</);
});

test('membership activation records the real Shanghai operation day', () => {
  const shell = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(shell, /date:new Date\(\)\.toLocaleDateString\('sv-SE',\{timeZone:'Asia\/Shanghai'\}\)/);
  assert.doesNotMatch(shell, /membership\.orders\.unshift\([^\n]*date:'2026-09-03'/);
});
