const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../assets/points-v2-model.js');
const V=require('../assets/points-v2-view.js');
const ctx={model:M,course:{points:{ledger:[]}},meta:M.normalizeMeta({}),balance:126,today:'2026-09-18',esc:s=>String(s).replaceAll('&','&amp;')};

test('renders all points v2 routes',()=>{
  const cases=[
    ['points','成长积分'],['points/checkin','每日签到'],['points/calendar','签到日历'],['points/tasks','任务中心'],
    ['points/wallet?tab=ledger','我的积分'],['points/ledger','积分明细'],['points/rewards','积分兑换'],['points/level','我的等级'],['points/rules','积分规则']
  ];
  for(const [route,title] of cases){const html=V.render(route,ctx);assert.match(html,/points-v2-page/);assert.ok(html.includes(title),route);}
});

test('dashboard exposes balance, date checkin, tasks, ledger and rewards',()=>{
  const html=V.render('points',ctx);
  assert.match(html,/126/);assert.match(html,/9月18日/);assert.match(html,/points\/tasks/);assert.match(html,/points\/wallet\?tab=ledger/);assert.match(html,/明细与兑换/);
});

test('checkin is an explicit claim, not automatic',()=>{
  const html=V.render('points/checkin',ctx);
  assert.match(html,/data-points-action="claim-checkin"/);assert.match(html,/领取奖励/);
});

test('reminder offers sign in and dismiss actions',()=>{
  const html=V.reminder(ctx);
  assert.match(html,/reminder-checkin/);assert.match(html,/dismiss-reminder/);assert.match(html,/今天还没有签到/);
});