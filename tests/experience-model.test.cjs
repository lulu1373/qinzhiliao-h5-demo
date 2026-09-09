const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../assets/experience-model.js');
const M = fs.existsSync(file) ? require(file) : {};
test('exports the experience model contract', () => assert.equal(typeof M.normalize, 'function'));
test('normalizes missing/corrupt fields without losing legacy data', () => {
 const input = { legacy: { keep: 1 }, journeys: null, saved: 'bad', ui: { filter: 'all' } };
 const output = M.normalize(input);
 assert.equal(output.version, 1); assert.deepEqual(output.journeys, []); assert.deepEqual(output.saved, []);
 assert.deepEqual(output.legacy, { keep: 1 }); assert.deepEqual(output.ui, { filter: 'all' }); assert.equal(input.journeys, null);
 assert.deepEqual(M.normalize(null).draft, {});
});
test('starts an immutable idempotent journey and validates scene', () => {
 const raw = M.normalize(); const out = M.start(raw, { id: 'j1', scene: 'screen', now: '2026-09-09' });
 assert.equal(raw.journeys.length, 0); assert.equal(out.journeys[0].relationship, '孩子');
 assert.equal(out.journeys[0].step, 'context'); assert.equal(out.journeys[0].createdAt, '2026-09-09');
 assert.equal(M.start(out, { id: 'j1', scene: 'screen' }).journeys.length, 1);
 assert.throws(() => M.start(raw, {id:'x',scene:'unknown'})); assert.throws(() => M.start(raw, {scene:'play'}));
});
test('patches only valid journey fields, preserving original', () => {
 const raw = M.start({}, { id:'j', scene:'self' });
 const out = M.patchJourney(raw, 'j', { relationship:'自己', description:'想休息', step:'support', id:'hacked' });
 assert.equal(out.journeys[0].id, 'j'); assert.equal(raw.journeys[0].description, '');
 assert.equal(out.journeys[0].relationship,'自己'); assert.equal(out.journeys[0].step,'support');
 assert.throws(()=>M.patchJourney(raw,'j',{step:'bad'})); assert.throws(()=>M.patchJourney(raw,'j',{relationship:'bad'}));
 assert.throws(()=>M.patchJourney(raw,'missing',{}));
});
test('local posts and comments trim, validate, retain text and deduplicate IDs', () => {
 const raw = M.savePost({}, { id:'p', title:' 我的尝试 ', body:'<b>不是标记</b>', group:'screen', now:'2026-09-09' });
 assert.equal(raw.posts[0].title,'我的尝试'); assert.equal(raw.posts[0].body,'<b>不是标记</b>'); assert.equal(raw.posts[0].demo,true);
 assert.equal(M.savePost(raw,{id:'p',title:'再次',body:'再次',group:'screen'}).posts.length,1);
 const out = M.addComment(raw,{id:'c',postId:'p',body:' 我也试试 '});
 assert.equal(raw.comments.length,0); assert.equal(out.comments[0].body,'我也试试');
 assert.equal(M.addComment(out,{id:'c',postId:'p',body:'重复'}).comments.length,1);
 assert.throws(()=>M.savePost(raw,{id:'x',title:' ',body:'正文'}));
 assert.throws(()=>M.savePost(raw,{id:'x',title:'标题',body:'x'.repeat(2001)}));
 assert.throws(()=>M.addComment(raw,{id:'x',postId:'p',body:' '}));
 assert.throws(()=>M.addComment(raw,{id:'x',postId:'missing',body:'正文'}));
});
test('toggles allowed fields immutably and retains draft siblings', () => {
 const raw = M.normalize({draft:{title:'标题'}}); const a = M.toggle(raw,'saved','post-1');
 assert.deepEqual(a.saved,['post-1']); assert.deepEqual(raw.saved,[]); assert.deepEqual(M.toggle(a,'saved','post-1').saved,[]);
 assert.deepEqual(M.toggle(a,'joined','screen').joined,['screen']); assert.throws(()=>M.toggle(raw,'posts','x'));
 assert.deepEqual(M.updateDraft(raw,{body:'正文'}).draft,{title:'标题',body:'正文'}); assert.deepEqual(raw.draft,{title:'标题'});
});
test('all scene/relationship actions are specific; self never assumes a child', () => {
 for (const scene of ['screen','nursery','play','repeat','self']) {
  const data = M.SCENES[scene]; assert.equal(data.demo,true); assert.equal(data.support.length,3); assert.equal(data.branches.length,2);
  const actions = ['孩子','伴侣','父母','自己'].map(relationship => {
   assert.equal(data.phrases[relationship].length,2);
   const action = M.actionFor({scene,relationship}); for(const key of ['title','why','script','observe']) assert.ok(action[key]);
   if(relationship==='自己') assert.doesNotMatch(action.script,/孩子|宝宝|爸爸|妈妈/);
   return action.script;
  }); assert.equal(new Set(actions).size,4);
 }
 assert.ok(M.actionFor(null).title);
});
test('demo content is explicitly labelled with twelve readable posts and two stage checklists', () => {
 assert.equal(M.POSTS.length,12); assert.equal(new Set(M.POSTS.map(p=>p.id)).size,12);
 for (const post of M.POSTS) { assert.equal(post.demo,true); for(const key of ['title','body','author','stage','topic','group','attempt','result']) assert.ok(post[key]); assert.ok(['experience','method','news'].includes(post.kind)); }
 assert.equal(M.GROUPS.length,3); assert.equal(M.STAGES.length,2);
 for(const stage of M.STAGES) {assert.equal(stage.demo,true); assert.equal(stage.items.length,3);}
});
test('persisted form state validates feedback and reference types', () => {
 const raw = M.start({}, { id:'j', scene:'self' });
 const patch={phraseChoice:1,actionTitle:'先休息',actionScript:'坐一会儿',feedbackNote:'现在好多了',ended:true,cardType:'repair',feedback:'better',step:'done'};
 const out=M.patchJourney(raw,'j',patch); assert.equal(out.journeys[0].ended,true); assert.equal(out.journeys[0].phraseChoice,1);
 assert.throws(()=>M.patchJourney(raw,'j',{feedback:'invalid'}));
 assert.throws(()=>M.patchJourney(raw,'j',{actionId:{bad:true}}));
 assert.throws(()=>M.patchJourney(raw,'j',{phraseChoice:3}));
 assert.throws(()=>M.patchJourney(raw,'j',{ended:'yes'}));
 assert.throws(()=>M.patchJourney(raw,'j',{cardType:'unknown'}));
});
test('UMD exposes browser module and accepts valid empty draft updates', () => {
 const vm=require('node:vm'); const context={window:{}}; vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
 assert.equal(typeof context.window.QZLExperienceModel.start,'function');
 assert.deepEqual(M.updateDraft(null,null).draft,{});
 assert.deepEqual(M.normalize({journeys:[null,{id:'legacy'}],posts:false,comments:'bad',joined:[null,'play']}).joined,['play']);
 assert.throws(()=>M.savePost({}, {id:'p',title:'ok',body:'ok',group:'unknown'}));
 assert.throws(()=>M.toggle({},'saved',' '));
 assert.throws(()=>M.savePost({}, {id:'p',title:'x'.repeat(61),body:'ok'}));
});

test('community supports likes, image posts and immutable social state', () => {
 const raw=M.normalize();
 assert.deepEqual(raw.liked,[]);
 const liked=M.toggle(raw,'liked','p1');
 assert.deepEqual(liked.liked,['p1']);
 assert.deepEqual(raw.liked,[]);
 const posted=M.savePost(raw,{id:'photo-post',title:'入园前的小准备',body:'今天一起收拾了书包',group:'nursery',postType:'dynamic',stage:'入园期',topic:'入园准备',images:['data:image/png;base64,AAAA'],now:'2026-09-09'});
 assert.deepEqual(posted.posts[0].images,['data:image/png;base64,AAAA']);
 assert.equal(posted.posts[0].postType,'dynamic');
 assert.equal(posted.posts[0].stage,'入园期');
 assert.throws(()=>M.savePost(raw,{id:'bad-image',title:'标题',body:'正文',images:['javascript:alert(1)']}));
 assert.throws(()=>M.savePost(raw,{id:'too-many-bytes',title:'标题',body:'正文',images:Array(8).fill('data:image/png;base64,'+'A'.repeat(460000))}),/空间|图片/);
});

test('official news exposes verified source, dates, status and action steps', () => {
 assert.equal(M.OFFICIAL_NEWS.length,5);
 for(const item of M.OFFICIAL_NEWS){
  assert.match(item.sourceUrl,/^https:\/\/jyj\.gz\.gov\.cn\//);
  assert.equal(item.source,'广州市教育局');
  assert.ok(item.publishedAt);
  assert.ok(['已结束','结果可查询','长期有效'].includes(item.status));
  assert.ok(item.keyPoints.length>=2);
  assert.ok(item.timeline.length>=1);
 }
});
