const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../assets/growth-milestone-model.js');
const base = {title:'停下来听完',date:'2026-08-26',category:'see-self',description:'我先听完了孩子的话。',meaning:'我记得给彼此一点时间。',subject:'parent',memberId:'self'};
const options = {id:'m1',now:'2026-09-09T02:00:00.000Z',today:'2026-09-09',familyId:'f1'};
const source = {id:'r1',kind:'conversation',title:base.title,date:base.date,excerpt:base.description,revision:'hash1',provenance:'personal'};
const make = (input={},opts={}) => model.create({...base,...input},{...options,...opts});

test('confirmed milestones retain explicit event and confirmation dates',()=>{
 const item=make({title:'  停下来听完  '});
 assert.equal(item.title,base.title); assert.equal(item.date,'2026-08-26');
 assert.equal(item.confirmedAt,options.now);assert.equal(item.status,'confirmed');assert.equal(item.familyId,'f1');assert.equal(item.provenance,'personal');assert.equal(item.memberId,'self');
});
test('creation does not mutate input or source and snapshots source autofill',()=>{
 const before=JSON.stringify({base,source});const item=make({}, {source});
 assert.equal(JSON.stringify({base,source}),before);assert.notEqual(item.source,source);
 assert.deepEqual(item.source.autofill,{title:source.title,description:source.excerpt});
 item.source.excerpt='edited';assert.equal(source.excerpt,base.description);
});
test('manual entries have no fabricated source',()=>{assert.equal(make().source,null);});
test('invalid dates and future dates are rejected',()=>{
 for(const date of ['2026-02-29','2026-13-01','2026-08-32','2026-9-01','2026-09-10','bad','']) assert.throws(()=>make({date}),/日期/);
 assert.equal(make({date:'2024-02-29'}).date,'2024-02-29');
});
test('required identity and title are validated',()=>{
 assert.throws(()=>make({title:'  '}),/标题/);assert.throws(()=>make({}, {id:''}),/标识/);assert.throws(()=>make({}, {familyId:''}),/家庭/);
});
test('field length limits and enums are enforced',()=>{
 for(const [field,max] of [['title',80],['description',1200],['meaning',800],['memberId',100]]) assert.throws(()=>make({[field]:'字'.repeat(max+1)}),/最多/);
 assert.throws(()=>make({category:'score'}),/分类/);assert.throws(()=>make({subject:'stranger'}),/对象/);
});
test('source kind and provenance validated',()=>{
 assert.throws(()=>make({}, {source:{...source,kind:'card'}}),/来源/);
 assert.throws(()=>make({}, {source:{...source,provenance:'other'}}),/来源/);
});
test('source provenance cannot contaminate personal counts',()=>{
 const item=make({}, {source:{...source,provenance:'example'},familyId:'example-family'});
 assert.equal(item.provenance,'example');assert.equal(model.list([item],{familyId:'f1',source:'personal'}).length,0);
});
test('list includes only confirmed records with correct ownership and provenance',()=>{
 const good=make();const values=[good,{...good,id:'draft',status:'draft'},{...good,id:'unconfirmed',confirmedAt:null},{...good,id:'other',familyId:'f2'},{...good,id:'sample',provenance:'example'},{...good,id:'bad',date:'2026-02-30'},null];
 assert.deepEqual(model.list(values,{familyId:'f1',source:'personal'}).map(x=>x.id),['m1']);
});
test('inclusive period filtering uses event date across month and year boundaries',()=>{
 const dates=['2025-12-31','2026-01-01','2026-01-31','2026-02-01'];const items=dates.map((date,i)=>make({date},{id:'m'+i}));
 assert.deepEqual(model.list(items,{familyId:'f1',source:'personal',start:'2026-01-01',end:'2026-01-31'}).map(x=>x.date),['2026-01-31','2026-01-01']);
 assert.deepEqual(model.list(items,{familyId:'f1',source:'personal',start:'2025-12-31',end:'2026-01-01'}).map(x=>x.date),['2026-01-01','2025-12-31']);
 assert.equal(items[0].date,'2025-12-31');
});
test('list deduplicates persistent IDs without editing source array',()=>{
 const item=make();const items=[item,item];assert.equal(model.list(items,{familyId:'f1',source:'personal'}).length,1);assert.equal(items.length,2);
});
test('invalid date ranges fail explicitly',()=>{
 assert.throws(()=>model.list([],{familyId:'f1',source:'personal',start:'2026-02-30'}),/日期/);
 assert.throws(()=>model.list([],{familyId:'f1',source:'personal',start:'2026-02-02',end:'2026-01-01'}),/范围/);
});
test('source identity dedup is family provenance and kind scoped',()=>{
 const item=make({}, {source});const items=[item];
 assert.equal(model.findBySource(items,source,{familyId:'f1',provenance:'personal'}).id,'m1');
 assert.equal(model.findBySource(items,{...source,kind:'action'},{familyId:'f1',provenance:'personal'}),null);
 assert.equal(model.findBySource(items,source,{familyId:'f2',provenance:'personal'}),null);
 assert.equal(model.findBySource(items,source,{familyId:'f1',provenance:'example'}),null);
 assert.equal(model.findBySource([{...item,status:'draft'}],source,{familyId:'f1',provenance:'personal'}),null);
});
test('update is immutable and preserves identity confirmation and source baseline',()=>{
 const item=make({}, {source});const before=JSON.stringify(item);const next=model.update(item,{...base,title:'自己写的标题',memberId:'child:1'},{now:'2026-09-09T03:00:00Z',today:options.today});
 assert.equal(JSON.stringify(item),before);assert.equal(next.id,item.id);assert.equal(next.confirmedAt,item.confirmedAt);assert.equal(next.title,'自己写的标题');assert.equal(next.memberId,'child:1');assert.equal(next.source.autofill.title,base.title);assert.notEqual(next.source,item.source);
});
test('partial update preserves other fields and validates event date',()=>{
 const item=make();assert.equal(model.update(item,{title:'新的标题'},options).description,base.description);
 assert.throws(()=>model.update(item,{date:'2027-01-01'},options),/日期/);
});
test('source revision changes flag review and never replace confirmed content',()=>{
 const item=make({}, {source});const before=JSON.stringify(item);const [next]=model.reconcile([item],[{...source,revision:'hash2',excerpt:'后来发生的事',title:'新标题'}]);
 assert.equal(next.sourceChanged,true);assert.equal(next.description,base.description);assert.equal(next.title,base.title);assert.equal(next.source.excerpt,source.excerpt);assert.equal(JSON.stringify(item),before);
});
test('unchanged source remains unflagged',()=>{
 const [next]=model.reconcile([make({}, {source})],[source]);assert.equal(next.sourceChanged,false);assert.equal(next.sourceDeleted,false);
});
test('deleted source scrubs quoted content and unchanged autofill but preserves authored meaning',()=>{
 const item=make({}, {source});const [next]=model.reconcile([item],[]);
 assert.equal(next.sourceDeleted,true);assert.equal(next.description,'');assert.notEqual(next.title,base.title);assert.equal(next.meaning,base.meaning);
 const serialized=JSON.stringify(next);for(const text of [base.title,base.description,'hash1']) assert.equal(serialized.includes(text),false);
 assert.equal(item.description,base.description);
});
test('deleted source preserves independently edited title and description',()=>{
 const item=make({title:'属于我的标题',description:'我自己补充的记录'},{source});const [next]=model.reconcile([item],[]);
 assert.equal(next.title,'属于我的标题');assert.equal(next.description,'我自己补充的记录');assert.equal(next.meaning,base.meaning);
 assert.equal(JSON.stringify(next).includes(source.excerpt),false);
});
test('manual source-less records survive reconciliation and deletion is idempotent',()=>{
 const manual=make();assert.deepEqual(model.reconcile([manual],[]),[manual]);
 const deleted=model.reconcile([make({}, {source})],[]);assert.deepEqual(model.reconcile(deleted,[]),deleted);
});
test('reconcile does not confuse action and conversation IDs or examples',()=>{
 const item=make({}, {source});const [next]=model.reconcile([item],[{...source,kind:'action'},{...source,provenance:'example'}]);assert.equal(next.sourceDeleted,true);
});
test('remove leaves original items and source untouched',()=>{
 const item=make({}, {source});const items=[item,make({}, {id:'m2'})];assert.deepEqual(model.remove(items,'m1').map(x=>x.id),['m2']);assert.equal(items.length,2);assert.equal(item.source.excerpt,base.description);
});
test('example milestones are explicitly isolated and frozen fixtures',()=>{
 assert.ok(model.EXAMPLE_MILESTONES.length>0);assert.ok(Object.isFrozen(model.EXAMPLE_MILESTONES));
 for(const item of model.EXAMPLE_MILESTONES){assert.equal(item.provenance,'example');assert.equal(item.familyId,'example-family');assert.ok(item.date.startsWith('2026-08'));assert.ok(item.confirmedAt);assert.ok(Object.isFrozen(item));}
 assert.equal(model.list(model.EXAMPLE_MILESTONES,{familyId:'f1',source:'personal'}).length,0);
});
test('deleting a source removes known quotes from edited fields while retaining additions',()=>{
 const item=make({title:source.title+'：补充',description:source.excerpt+'\n自己的补充',meaning:'我想记住：'+source.excerpt+'\n这次愿意重新试试。'},{source});
 const [next]=model.reconcile([item],[]);
 assert.equal(next.title,'补充');assert.equal(next.description,'自己的补充');assert.equal(next.meaning.includes(source.excerpt),false);assert.ok(next.meaning.includes('这次愿意重新试试。'));
 assert.equal(JSON.stringify(next).includes(source.title),false);
});
test('all editable fields scrub both source snapshots and original autofill variants',()=>{
 const item=make({title:'自己的标题',description:'前言 '+source.title+' 后记',meaning:'补充 '+source.excerpt+' 收尾'},{source});
 item.source.autofill={title:'曾经自动生成的标题',description:'曾经自动生成的经过'};
 item.description+=' 曾经自动生成的经过';item.meaning+=' 曾经自动生成的标题';
 const [next]=model.reconcile([item],[]);
 for(const quote of [source.title,source.excerpt,item.source.autofill.title,item.source.autofill.description])assert.equal(JSON.stringify(next).includes(quote),false);
 assert.ok(next.description.includes('前言'));assert.ok(next.description.includes('后记'));assert.ok(next.meaning.includes('收尾'));
});
test('short source snippets do not erase incidental authored words',()=>{
 const short={...source,title:'我',excerpt:'好'};
 const item=make({title:'我自己的记录',description:'我想好好听一听。',meaning:'好好留意自己的感受。'},{source:short});
 const [next]=model.reconcile([item],[]);
 assert.equal(next.title,item.title);assert.equal(next.description,item.description);assert.equal(next.meaning,item.meaning);
 const [exact]=model.reconcile([make({title:'我',description:'好\n自己补充的事',meaning:'好'},{source:short})],[]);
 assert.equal(exact.title,'一个值得留下的时刻');assert.equal(exact.description,'自己补充的事');assert.equal(exact.meaning,'');
});
test('source changed then deleted still scrubs the saved original quotes',()=>{
 const item=make({description:source.excerpt+'\n我的补充'},{source});
 const changed=model.reconcile([item],[{...source,revision:'hash2',excerpt:'新的来源内容'}]);
 assert.equal(changed[0].sourceChanged,true);
 const [deleted]=model.reconcile(changed,[]);assert.equal(deleted.description,'我的补充');assert.equal(deleted.sourceChanged,false);
});
test('undo restoration can reconcile the removed snapshot against deleted sources',()=>{
 const item=make({description:source.excerpt+'\n我的补充',meaning:source.title+'\n独立的意义'},{source});
 const remaining=model.remove([item],item.id);
 const [restored]=model.reconcile([...remaining,item],[]);
 assert.equal(restored.id,item.id);assert.equal(restored.description,'我的补充');assert.equal(restored.meaning,'独立的意义');assert.equal(restored.sourceDeleted,true);
 assert.equal(item.description,source.excerpt+'\n我的补充');
});
