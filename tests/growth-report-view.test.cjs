const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const target = path.join(__dirname, '../assets/growth-report-view.js');
const view = fs.existsSync(target) ? require(target) : {};
const ui = {mode:'week',anchor:'2026-08-26',source:'personal',recordView:'list',subject:'parent',corrections:{}};
const empty = {mode:'week',source:'personal',empty:true,period:{label:'8月24日—8月30日',start:'2026-08-24',end:'2026-08-30',inProgress:true},stats:{},records:[],actions:[],days:[]};
test('personal empty report provides source switch and honest zero-record state', () => {
  assert.equal(typeof view.render, 'function', 'render must be implemented');
  const html = view.render(empty, ui, {});
  assert.match(html,/这段时间还没有记录/);
  assert.match(html,/查看完整示例/);
  assert.match(html,/data-gr-action="source" data-value="example"/);
  assert.doesNotMatch(html,/你开始把|顺一点|提升/);
});
test('mode and period controls remain usable in empty periods', () => {
  assert.equal(typeof view.render,'function');
  const html=view.render(empty,ui,{});
  for (const mode of ['day','week','month']) assert.match(html,new RegExp(`data-gr-action="mode" data-value="${mode}"`));
  assert.match(html,/data-gr-action="shift" data-delta="-1"/);
  assert.match(html,/data-gr-action="shift" data-delta="1"/);
  assert.match(html,/8月24日—8月30日/);
});
test('source details escape arbitrary record text and identifiers', () => {
  assert.equal(typeof view.renderSources,'function');
  const html=view.renderSources([{id:'a" onmouseover="x',date:'2026-08-26',title:'<img src=x onerror=alert(1)>',excerpt:'<script>attack</script>',kind:'chat'}],{});
  assert.doesNotMatch(html,/<script>|<img src=x|onmouseover="x/);
  assert.match(html,/&lt;script&gt;attack/);
  assert.match(html,/2026-08-26/);
});
test('records provide accessible calendar/list switch and return to report', () => {
  assert.equal(typeof view.renderRecords,'function');
  const html=view.renderRecords(empty,ui,{});
  assert.match(html,/data-gr-action="report"/);
  assert.match(html,/data-gr-action="record-view" data-value="calendar"/);
  assert.match(html,/data-gr-action="record-view" data-value="list"/);
});
const record = {id:'r1',date:'2026-08-26',title:'写作业又吵起来了',kind:'chat',excerpt:'提醒多了又容易顶起来',topic:'作业开始',concern:'不提醒担心拖到太晚'};
const method={id:'m1',title:'困难分解启动法',summary:'先找到孩子愿意开始的第一步。',principle:'把大任务拆成小任务。',before:'赶快全部写完',after:'先选一道题',steps:['先听听哪里难','找一个小开始'],phrase:'我们先试哪一步？',status:'了解过',sources:['r1']};
const populated={...empty,empty:false,hasData:true,isExample:true,ongoing:true,summary:{title:'先听完，再回应',body:'目前的记录里，你愿意停下来重新理解。'},records:[record],stats:{conversations:1,actions:1,feedbacks:1},highlights:{parent:[{text:'先停一下再回应',sources:['r1']}],child:[{text:'孩子愿意多说一点原因',sources:['r1']}]},practice:{title:'倾听与回应',before:'连续提醒',after:'先问哪里难',observe:'时间紧时是否做得到',sources:['r1']},methods:[method],topics:[{id:'t1',title:'时间压力',body:'催促在时间紧时出现',sources:['r1']}],timeline:[{date:'2026-08-26',title:'回来复盘',body:'记录了当时的回应',subject:'parent',sourceId:'r1'}],actions:[],emotions:[],updatedAt:'2026-08-26T15:00:00+08:00'};
test('weekly report distinguishes parent evidence and contains concrete practice, no ability scoring',()=>{
 const html=view.render(populated,{...ui,source:'example'},{});
 assert.match(html,/示例报告 · 非你的真实记录/);
 assert.match(html,/先听完，再回应/);
 assert.match(html,/你这边/); assert.match(html,/孩子这边/);
 assert.match(html,/根据你的记录/);
 assert.match(html,/正在练习/); assert.match(html,/连续提醒/); assert.match(html,/先问哪里难/);
 assert.match(html,/data-gr-action="source-detail" data-id="r1"/);
 assert.match(html,/进行中/);
 assert.doesNotMatch(html,/提升\s*\d+%/);
});
test('daily report surfaces a source, method summary and recap action',()=>{
 const html=view.render({...populated,mode:'day'},{...ui,mode:'day',source:'example'},{});
 assert.match(html,/今日回顾/); assert.match(html,/提醒多了/);
 assert.match(html,/困难分解启动法/); assert.match(html,/data-gr-action="method" data-id="m1"/);
 assert.match(html,/和小亲复盘/); assert.doesNotMatch(html,/能力评分/);
});
test('monthly report avoids fabricated emotion chart and supports topic corrections and timelines',()=>{
 const html=view.render({...populated,mode:'month'},{...ui,mode:'month',source:'example',corrections:{t1:{value:'disagree',text:'其实是没睡好'}}},{});
 assert.match(html,/情绪记录还不够/);
 assert.match(html,/其实是没睡好/); assert.match(html,/待核验/);
 assert.match(html,/data-gr-action="topic-correct" data-id="t1" data-value="disagree"/);
 assert.match(html,/data-gr-action="subject" data-value="child"/);
 assert.match(html,/data-gr-action="route" data-route="archive"/);
});
test('method detail includes principle, concrete steps and example phrase with escaped content',()=>{
 assert.equal(typeof view.renderMethod,'function');
 const html=view.renderMethod({...method,title:'<img src=x>',phrase:'<script>bad</script>'},{});
 assert.match(html,/核心原理/); assert.match(html,/先听听哪里难/); assert.match(html,/可以试的一句话/);
 assert.doesNotMatch(html,/<script>|<img src=x>/); assert.match(html,/&lt;img src=x&gt;/);
});
const model = require('../assets/growth-report-model.js');
test('model output renders all modes and keeps action-only personal reports visible',()=>{
 for (const mode of ['day','week','month']) {
  const report=model.build({mode,anchor:'2026-08-26',source:'example'});
  const html=view.render(report,{...ui,mode,source:'example'},{});
  assert.match(html,/小亲的/); assert.doesNotMatch(html,/undefined|\[object Object\]/);
 }
 const report=model.build({mode:'week',anchor:'2026-08-26',source:'personal',actions:[{id:'p1',date:'2026-08-26',title:'听完再回应',status:'pending'}]});
 const html=view.render(report,ui,{});
 assert.match(html,/听完再回应/); assert.doesNotMatch(html,/这段时间还没有记录/);
 assert.match(html,/data-gr-action="feedback" data-id="p1"/);
 assert.match(html,/data-gr-action="not-tried" data-id="p1"/);
});
test('calendar records show monthly dates, action dots and only selected-day actions',()=>{
 const report=model.build({mode:'month',anchor:'2026-08-26',source:'example'});
 const html=view.renderRecords(report,{...ui,recordView:'calendar',selectedDate:'2026-08-26',source:'example'},{});
 assert.match(html,/data-gr-action="record-date" data-date="2026-08-01"/);
 assert.match(html,/data-gr-action="record-date" data-date="2026-08-31"/);
 assert.match(html,/写作业时先减少一次催促/);
 assert.doesNotMatch(html,/睡前先听孩子说完，再回应/);
 assert.match(html,/data-gr-action="shift" data-delta="-1"/);
 assert.match(html,/2026年8月/);
});
test('calendar selected empty day stays empty while unfiltered list shows the whole month',()=>{
 const report=model.build({mode:'month',anchor:'2026-08-26',source:'example'});
 const blank=view.renderRecords(report,{...ui,recordView:'calendar',selectedDate:'2026-08-02',source:'example'},{});
 assert.match(blank,/这一天还没有行动/);
 const list=view.renderRecords(report,{...ui,recordView:'list',selectedDate:'2026-08-02',source:'example'},{});
 assert.match(list,/睡前先听孩子说完，再回应/);
 assert.match(list,/写作业时先减少一次催促/);
});
test('daily report contains one full week date strip and selects the requested day',()=>{
 const report=model.build({mode:'day',anchor:'2026-08-26',source:'example'});
 const html=view.render(report,{...ui,mode:'day',source:'example'},{});
 assert.equal((html.match(/data-gr-action="date"/g)||[]).length,7);
 assert.match(html,/data-date="2026-08-24"/); assert.match(html,/data-date="2026-08-30"/);
});
test('example source label explicitly distinguishes demo data from the users own records',()=>{
 const report=model.build({mode:'week',anchor:'2026-08-26',source:'example'});
 const html=view.render(report,{...ui,source:'example'},{});
 assert.match(html,/示例报告 · 非你的真实记录/);
});
test('cross-month feedback appears on its feedback date and records creation separately',()=>{
 const report=model.build({mode:'month',anchor:'2026-09-09',source:'personal',actions:[{id:'cross',date:'2026-08-26',title:'跨月尝试',result:'better',feedbackAt:'2026-09-09T02:00:00Z'}]});
 const html=view.renderRecords(report,{...ui,recordView:'calendar',selectedDate:'2026-09-09'},{});
 assert.match(html,/aria-label="2026-09-09，1 个行动"/);
 assert.match(html,/跨月尝试/);
 assert.match(html,/创建于 2026-08-26/);
 assert.match(html,/本期反馈：2026-09-09/);
 const blank=view.renderRecords(report,{...ui,recordView:'calendar',selectedDate:'2026-09-08'},{});
 assert.doesNotMatch(blank,/跨月尝试/);
});
test('explicit feedback date wins and creation and feedback dates each open the same action',()=>{
 const report=model.build({mode:'month',anchor:'2026-09-09',source:'personal',actions:[{id:'twodays',date:'2026-09-02',title:'两个日期同一行动',result:'same',feedbackDate:'2026-09-08',feedbackAt:'2026-09-09T02:00:00Z'}]});
 for(const selectedDate of ['2026-09-02','2026-09-08']) {
  const html=view.renderRecords(report,{...ui,recordView:'calendar',selectedDate},{});
  assert.match(html,/两个日期同一行动/);
  assert.match(html,/aria-label="2026-09-08，1 个行动"/);
  assert.match(html,/aria-label="2026-09-09，0 个行动"/);
 }
});
test('timestamps without valid feedback result do not create calendar events',()=>{
 const report=model.build({mode:'month',anchor:'2026-09-09',source:'personal',actions:[{id:'pending',date:'2026-09-02',title:'还没反馈的行动',result:'pending',feedbackDate:'2026-09-08'}]});
 const html=view.renderRecords(report,{...ui,recordView:'calendar',selectedDate:'2026-09-08'},{});
 assert.match(html,/aria-label="2026-09-08，0 个行动"/);
 assert.doesNotMatch(html,/还没反馈的行动/);
 const list=view.renderRecords(report,{...ui,recordView:'list'},{});
 assert.doesNotMatch(list,/本期反馈/);
});
test('month does not label ordinary conversation records as confirmed milestones',()=>{
 const report=model.build({mode:'month',anchor:'2026-08-26',source:'example'});
 const html=view.render(report,{...ui,mode:'month',source:'example'},{});
 assert.doesNotMatch(html,/本月留下的具体时刻/);
 assert.match(html,/成长时间线/);
});
test('confirmed milestone slot is included even if personal report has no other activity',()=>{
 const report=model.build({mode:'month',anchor:'2026-08-26',source:'personal'});
 const html=view.render(report,{...ui,mode:'month'},{renderMilestones:()=>'<section>本期里程碑：独立记录的时刻</section>'});
 assert.match(html,/本期里程碑：独立记录的时刻/);
});
