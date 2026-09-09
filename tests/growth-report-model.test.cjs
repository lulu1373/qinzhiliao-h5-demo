const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const filename = require('node:path').join(__dirname, '../assets/growth-report-model.js');
const model = fs.existsSync(filename) ? require(filename) : {};
const build = overrides => model.build({mode:'week',anchor:'2026-08-26',source:'personal',now:'2026-08-26',...overrides});

test('exports date and report functions', () => {
  assert.equal(typeof model.period, 'function');
  assert.equal(typeof model.shift, 'function');
  assert.equal(typeof model.build, 'function');
});
test('period starts on Monday and crosses year boundaries', () => {
  const p = model.period('week', '2027-01-01');
  assert.equal(p.start,'2026-12-28'); assert.equal(p.end,'2027-01-03');
  assert.equal(p.days.length,7); assert.equal(p.days[0].weekday,'周一');
  assert.equal(p.previous,'2026-12-21'); assert.equal(p.next,'2027-01-04');
});
test('shifts clamp month days, support leap years, and reject invalid dates', () => {
  assert.equal(model.shift('month','2024-01-31',1),'2024-02-29');
  assert.equal(model.shift('month','2024-03-31',-1),'2024-02-29');
  assert.equal(model.shift('day','2024-02-28',1),'2024-02-29');
  assert.equal(model.shift('week','2026-12-28',1),'2027-01-04');
  assert.equal(model.period('month','2024-02-20').days.length,29);
  assert.equal(model.period('day','2026-08-26').start,'2026-08-26');
  assert.throws(()=>model.period('year','2026-08-26'), /mode/);
  assert.throws(()=>model.period('day','2026-02-30'), /date/);
  assert.throws(()=>model.shift('day','2026-01-01',0.5), /delta/);
});
test('empty personal report excludes legacy examples and undated entries', () => {
  const r=build({actions:[{id:'a17',date:'2026-08-25'},{id:'u',title:'missing'}],records:[{id:'r'}],cards:[{id:'c'}]});
  assert.equal(r.hasData,false); assert.equal(r.undatedCount,3);
  assert.deepEqual(r.stats,{conversations:0,actions:0,feedbacks:0,recordDays:0});
  assert.deepEqual(r.emotions,[]); assert.deepEqual(r.highlights,{parent:[],child:[]});
  assert.equal(r.practice,null); assert.equal(r.insufficient,true);
});
test('filters dates, unique conversations and explicit personal provenance without mutating inputs', () => {
  const data={actions:[{id:'a26',provenance:'personal',date:'2026-08-26',result:'same',status:'done',feedbackAt:'2026-08-27T10:00:00Z'},{id:'past',date:'2026-08-22'}],records:[{id:'r1',date:'2026-08-24',conversationId:'c1',title:'一次倾听',summary:'我先听了一会儿',childObservation:'不应自动作为孩子进步'},{id:'r2',date:'2026-08-25',conversationId:'c1',title:'补充记录'},{id:'future',date:'2026-09-01'},{id:'bad',date:'2026-08-99'}],cards:[{id:'c1',savedAt:'2026-08-26T12:00:00+08:00'},{id:'old',savedAt:'2026-08-01'},{id:'unsaved',createdAt:'2026-08-25'}]};
  const original=JSON.stringify(data),r=build(data);
  assert.deepEqual(r.stats,{conversations:1,actions:1,feedbacks:1,recordDays:4});
  assert.equal(r.cards.length,1); assert.equal(r.undatedCount,2);
  assert.equal(r.highlights.child.length,0); assert.equal(r.practice,null);
  assert.match(r.summary.body,/1 次/); assert.match(r.highlights.parent[0].text,/我先听/);
  assert.deepEqual(r.highlights.parent[0].sources,['r1']);
  assert.equal(r.updatedAt,'2026-08-27T10:00:00Z'); assert.equal(JSON.stringify(data),original);
});
test('reports current period ongoing, not past or future', () => {
  assert.equal(build().ongoing,true);
  assert.equal(build({anchor:'2026-08-01'}).ongoing,false);
  assert.equal(build({anchor:'2026-09-01'}).ongoing,false);
});
test('example day contains grounded method details and action', () => {
  const r=build({mode:'day',source:'example'});
  assert.equal(r.isExample,true); assert.equal(r.period.start,model.EXAMPLE_ANCHOR);
  assert.equal(r.hasData,true); assert.ok(r.methods[0].principle);
  assert.ok(r.methods[0].steps.length>1); assert.ok(r.methods[0].phrase);
  assert.ok(r.methods[0].sources.every(id=>r.records.some(x=>x.id===id)));
  assert.ok(r.actions.length); assert.deepEqual(r.emotions,[]);
});
test('example week and month evidence points only to in-period records', () => {
  for(const mode of ['week','month']){
    const r=build({source:'example',mode});
    assert.ok(r.highlights.parent.length); assert.ok(r.highlights.child.length);
    assert.ok(r.practice); assert.ok(r.timeline.length);
    const ids=new Set(r.records.map(x=>x.id));
    for(const item of [...r.highlights.parent,...r.highlights.child,...r.topics,r.practice]) assert.ok(item.sources.every(id=>ids.has(id)));
    assert.ok(r.timeline.every(x=>ids.has(x.sourceId)));
    if(mode==='month') assert.ok(r.topics.length);
  }
});
test('example dataset does not contaminate personal records or empty sample periods', () => {
  assert.ok(model.EXAMPLE_RECORDS.length>=5); assert.ok(model.EXAMPLE_ACTIONS.length>=3);
  const r=build({records:model.EXAMPLE_RECORDS,actions:model.EXAMPLE_ACTIONS});
  assert.equal(r.hasData,false);
  assert.equal(build({source:'example',anchor:'2025-01-01'}).hasData,false);
});
test('correction stays attached to source and period after feedback updates', () => {
  const corrections={'personal:week:2026-08-24':{text:'这周没有感觉更顺利，只是记录了下来。',updatedAt:'2026-08-28T10:00:00Z'}};
  const r=build({corrections,records:[{id:'x',date:'2026-08-25',title:'一次对话'}]});
  assert.equal(r.summary.body,corrections['personal:week:2026-08-24'].text); assert.equal(r.summary.corrected,true);
  assert.equal(r.updatedAt,'2026-08-28T10:00:00Z');
  assert.notEqual(build({source:'example',corrections}).summary.corrected,true);
});
test('browser UMD global works and build validates source and arrays', () => {
  const context={};vm.runInNewContext(fs.readFileSync(filename,'utf8'),context);
  assert.equal(typeof context.QZLGrowthModel.build,'function');
  assert.throws(()=>build({source:'mixed'}),/source/);
  assert.throws(()=>build({records:{}}),/records/);
});
test('earlier example days describe their actual event, not the anchor day', () => {
  const r=build({source:'example',mode:'day',anchor:'2026-08-17'});
  assert.match(r.summary.body,/睡前|学校/);
  assert.doesNotMatch(r.summary.body,/写作业又卡住/);
  assert.equal(r.practice.before,r.methods[0].before);
});
test('monthly example timeline includes explicitly observed child events', () => {
  const r=build({source:'example',mode:'month'});
  const children=r.timeline.filter(x=>x.subject==='child');
  assert.ok(children.length>0);
  assert.ok(children.every(x=>r.records.find(y=>y.id===x.sourceId).childObservation===x.body));
});
test('isolated example feedback updates only allowlisted fields and known actions', () => {
  const r=build({source:'example',exampleFeedback:{a26:{status:'done',result:'worse',resultText:'更难了',feedbackAt:'2026-08-26T13:00:00Z',title:'overwrite'},unknown:{result:'better'}}});
  assert.equal(r.actions.find(x=>x.id==='a26').result,'worse');
  assert.notEqual(r.actions.find(x=>x.id==='a26').title,'overwrite');
  assert.equal(r.stats.feedbacks,1);
  assert.equal(model.EXAMPLE_ACTIONS.find(x=>x.id==='a26').result,null);
  assert.equal(build({source:'personal',exampleFeedback:{a26:{result:'worse'}}}).hasData,false);
});
test('feedback belongs to its actual period even when action was created earlier', () => {
  const action={id:'personal-old',date:'2026-08-17',provenance:'personal',status:'done',result:'same',feedbackAt:'2026-08-26T15:00:00+08:00'};
  const r=build({actions:[action]});
  assert.equal(r.hasData,true); assert.equal(r.actions[0].id,'personal-old');
  assert.deepEqual(r.stats,{conversations:0,actions:0,feedbacks:1,recordDays:1});
  const previous=build({anchor:'2026-08-17',actions:[action]});
  assert.equal(previous.stats.actions,1); assert.equal(previous.stats.feedbacks,0);
});

test('example feedback in a later period is summarized without inventing a conversation', () => {
  const r=build({source:'example',mode:'day',anchor:'2026-09-09',now:'2026-09-09',exampleFeedback:{a26:{result:'same',feedbackAt:'2026-09-09T09:00:00+08:00'}}});
  assert.equal(r.hasData,true); assert.equal(r.stats.conversations,0);
  assert.equal(r.stats.feedbacks,1); assert.equal(r.practice,null);
  assert.match(r.summary.body,/反馈/);
});
test('period labels include the year with readable cross-year ranges', () => {
  assert.equal(model.period('day','2026-08-26').label,'2026年8月26日');
  assert.equal(model.period('week','2026-08-26').label,'2026年8月24日—8月30日');
  assert.equal(model.period('week','2027-01-01').label,'2026年12月28日—2027年1月3日');
});
test('personal feedback summary counts independently of newly created actions', () => {
  const r=build({actions:[{id:'old',date:'2026-08-17',result:'same',feedbackAt:'2026-08-26T13:00:00Z'}]});
  assert.match(r.summary.body,/0 个行动/); assert.match(r.summary.body,/1 条行动反馈/);
  assert.doesNotMatch(r.summary.body,/其中/);
});
test('monthly example summary does not assert old action results after correction', () => {
  const r=build({source:'example',mode:'month',exampleFeedback:{a17:{result:'worse',feedbackAt:'2026-08-26T14:00:00Z'},a23:{result:'worse',feedbackAt:'2026-08-26T14:00:00Z'}}});
  assert.doesNotMatch(r.summary.body,/一次记录顺了一点|另一次没有变化/);
});
test('explicit local feedbackDate wins over ISO UTC date at local midnight', () => {
  const action={id:'local',date:'2026-08-20',result:'same',feedbackAt:'2026-08-30T16:30:00Z',feedbackDate:'2026-08-31'};
  const current=build({anchor:'2026-08-31',actions:[action]});
  assert.equal(current.stats.feedbacks,1); assert.equal(current.stats.recordDays,1);
  assert.equal(current.updatedAt,action.feedbackAt);
  assert.equal(build({actions:[action]}).stats.feedbacks,0);
  const sample=build({source:'example',anchor:'2026-08-31',exampleFeedback:{a26:action}});
  assert.equal(sample.stats.feedbacks,1); assert.equal(sample.actions[0].feedbackDate,'2026-08-31');
});
test('savedDate keeps cards in their local day while retaining the ISO update timestamp', () => {
  const card={id:'midnight-card',savedAt:'2026-08-30T16:30:00Z',savedDate:'2026-08-31'};
  const r=build({anchor:'2026-08-31',cards:[card]});
  assert.equal(r.cards.length,1); assert.equal(r.stats.recordDays,1);
  assert.equal(r.updatedAt,card.savedAt);
  assert.equal(build({cards:[card]}).cards.length,0);
  const invalidLocal=build({cards:[{...card,savedDate:'bad'}]});
  assert.equal(invalidLocal.cards.length,1);
});
