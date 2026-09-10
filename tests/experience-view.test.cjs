const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const view = require('../assets/experience-view.js');
const post = {id:'p1',title:'我把催促换成一次约定',body:'先听他说完。',result:'第二天我们愿意再试一次',author:'一位妈妈',group:'screen',scene:'screen'};
const model = {POSTS:[post],GROUPS:[{id:'screen',title:'屏幕与约定',description:'把冲突变成可以一起商量的事'}],STAGES:[{id:'nursery',title:'入园准备',items:['熟悉接送路线']}],SCENES:{screen:{title:'屏幕时间的争执',phrases:['我们一起定个结束时间。','我想先听听你还想玩什么。']}},actionFor:()=>({title:'少提醒一次',script:'一起约好结束时间'})};
const ctx = (extra={}) => ({model,data:{posts:[],comments:[],saved:[],joined:[],draft:{},ui:{}},...extra});
test('community back button keeps its 44px touch target without a persistent circular background',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../assets/experience.css'),'utf8');
  assert.match(css,/\.xp-back,\.xp-header-spacer\{width:44px;height:44px/);
  assert.match(css,/\.xp-back:hover\{background:transparent\}/);
});
test('community offers a Douban-inspired dynamic stream and three navigation tabs',()=>{const real=require('../assets/experience-model.js');const html=view.render('experience/community',ctx({model:real}));assert.match(html,/家长社区/);assert.match(html,/data-value="dynamic"/);assert.match(html,/data-value="groups"/);assert.match(html,/data-value="news"/);assert.match(html,/data-xp-action="like-post"/);assert.match(html,/data-xp-action="save-post"/);assert.match(html,/xp-story-media/);assert.match(html,/热门回应/);});
test('post details preserve author story and provide adoption and local comments',()=>{const html=view.render('experience/post/p1',ctx());assert.match(html,/我家也遇到类似问题/);assert.match(html,/结合我家情况问小亲/);assert.match(html,/data-xp-action="adopt"/);assert.match(html,/id="xpComment"/);});
test('user supplied draft and comments cannot inject markup',()=>{const data={posts:[],comments:[{postId:'p1',body:'<img onerror="bad()">'}],saved:[],joined:[],draft:{title:'<script>bad()</script>',body:'<img src=x>'},ui:{}};assert.doesNotMatch(view.render('experience/preview',ctx({data})),/<script>/);assert.doesNotMatch(view.render('experience/post/p1',ctx({data})),/<img onerror/);});
test('all journey steps render deliberate next steps and exits',()=>{for(const step of ['context','support','phrase','action','feedback','done']){const html=view.render('experience/journey/j1',ctx({journey:{id:'j1',scene:'screen',step,description:'昨晚吵了一架'}}));assert.match(html,/data-xp-action=/);assert.ok(html.length>400,step);assert.doesNotMatch(html,/undefined|null/);}});
test('feedback includes negative and no-action outcomes',()=>{const html=view.render('experience/journey/j1',ctx({journey:{id:'j1',scene:'screen',step:'feedback'}}));for(const value of ['better','same','worse','not_tried','declined'])assert.match(html,new RegExp('data-value="'+value+'"'));});
test('missing content has useful fallback instead of errors',()=>{assert.match(view.render('experience/post/missing',ctx()),/暂时找不到/);assert.match(view.render('experience/journey/missing',ctx()),/暂时找不到/);});
test('compose and stage pages expose accessible labeled controls',()=>{assert.match(view.render('experience/compose',ctx()),/for="xpTitle"/);assert.match(view.render('experience/stage/nursery',ctx()),/data-xp-action="stage-toggle"/);});
test('real model relationship-specific phrases and stage detail remain usable',()=>{const real=require('../assets/experience-model.js');const html=view.render('experience/journey/j1',ctx({model:real,journey:{id:'j1',scene:'screen',step:'phrase',relationship:'伴侣'}}));assert.match(html,/双方都能执行/);const stage=view.render('experience/stage/nursery',ctx({model:real}));assert.match(stage,/不要求马上喜欢幼儿园/);assert.match(view.render('experience/journey/j1',ctx({model:real,journey:{id:'j1',scene:'screen',step:'context',relationship:'孩子'}})),/data-value="孩子"/);});
test('filters and query combine, stage state and incomplete outcomes are explicit',()=>{const data={ui:{query:'我把',filter:'不存在',stageChecks:{'nursery:0':true}}};assert.doesNotMatch(view.render('experience/community',ctx({data})),/<h3>我把催促/);assert.match(view.render('experience/stage/nursery',ctx({data})),/aria-pressed="true"/);const html=view.render('experience/journey/j1',ctx({journey:{id:'j1',scene:'screen',step:'done',ended:true}}));assert.match(html,/今天先到这里/);assert.doesNotMatch(html,/一点点看见自己的变化/);});
test('community separates official news from family methods and attempts',()=>{const real=require('../assets/experience-model.js');const news=view.render('experience/community',ctx({model:real,data:{ui:{tab:'news'}}}));assert.match(news,/广州市教育局/);assert.match(news,/experience\/news\/gz-primary-public-2026/);const feed=view.render('experience/community',ctx({model:real,data:{ui:{tab:'dynamic'}}}));assert.doesNotMatch(feed,/experience\/post\/p6/);assert.match(feed,/方法练习/);const detail=view.render('experience/post/p1',ctx({model:real}));assert.match(detail,/把提醒提前到开始之前/);});
test('latest action edits take precedence over earlier phrase choice',()=>{const html=view.render('experience/journey/j1',ctx({journey:{id:'j1',scene:'screen',step:'action',phrase:'之前的表达',actionScript:'后来修改的行动'}}));assert.match(html,/id="xpActionScript"[^>]*>后来修改的行动/);});
test('comment drafts, adopted source and personal context survive navigation',()=>{assert.match(view.render('experience/post/p1',ctx({data:{commentDrafts:{p1:'暂时写到这里'}}})),/>暂时写到这里<\/textarea>/);const context=view.render('experience/journey/j1',ctx({journey:{id:'j1',scene:'screen',step:'context',originId:'p1'}}));assert.match(context,/experience\/post\/p1/);assert.match(context,/我把催促换成一次约定/);const support=view.render('experience/journey/j1',ctx({journey:{id:'j1',scene:'screen',step:'support',description:'<img>这是我的处境'}}));assert.match(support,/&lt;img&gt;这是我的处境/);});
test('personal history shows only real journey records with resume links',()=>{const history=view.render('experience/history',ctx({data:{journeys:[{id:'j1',scene:'screen',step:'phrase',description:'我想重新聊一聊',createdAt:'2026-09-09T10:00:00Z'}]}}));assert.match(history,/experience\/journey\/j1/);assert.match(history,/2026-09-09/);assert.match(history,/我想重新聊一聊/);const empty=view.render('experience/history',ctx());assert.match(empty,/还没有练习记录/);assert.doesNotMatch(empty,/我把催促/);});

test('news tab renders official utility cards and a sourced detail page',()=>{
 const real=require('../assets/experience-model.js');
 const list=view.render('experience/community',ctx({model:real,data:{ui:{tab:'news'}}}));
 assert.match(list,/官方信息/); assert.match(list,/广州市教育局/); assert.doesNotMatch(list,/xp-compose-fab/); assert.match(list,/报名|编班/); assert.match(list,/data-route="experience\/news\//);
 const detail=view.render('experience/news/gz-primary-public-2026',ctx({model:real}));
 assert.match(detail,/关键时间/); assert.match(detail,/适用对象/); assert.match(detail,/打开官方原文/); assert.match(detail,/rel="noopener noreferrer"/);
});


test('community V2 exposes family context, social proof and chip-based publishing',()=>{
 const real=require('../assets/experience-model.js');
 const feed=view.render('experience/community',ctx({model:real,data:{ui:{tab:'dynamic'}}}));
 assert.match(feed,/小禾妈妈/); assert.match(feed,/广州 · 10岁男孩 · 四年级/); assert.match(feed,/同感 <span>86<\/span>/);
 const groups=view.render('experience/community',ctx({model:real,data:{ui:{tab:'groups'}}}));
 assert.match(groups,/1,286 位家长/); assert.match(groups,/今天 23 条新讨论/); assert.match(groups,/最近在聊/);
 const compose=view.render('experience/compose',ctx({model:real,data:{draft:{postType:'question'}}}));
 assert.match(compose,/data-xp-action="post-type"/); assert.match(compose,/>经历<\/button>/); assert.match(compose,/>求助<\/button>/); assert.match(compose,/>方法<\/button>/);
 assert.match(compose,/id="xpStage"/); assert.match(compose,/小学高年级/);
});

test('publishing treats compose preview as transient so Back returns to community',()=>{
 const controller=fs.readFileSync(path.join(__dirname,'../assets/experience-controller.js'),'utf8');
 assert.match(controller,/navigate\('experience\/preview',\{replace:true\}\)/);
 assert.match(controller,/navigate\('experience\/post\/' \+ id,\{replace:true\}\)/);
 const preview=view.render('experience/preview',ctx({data:{draft:{title:'返回测试',body:'验证返回社区'}}}));
 assert.match(preview,/data-xp-action="edit-draft"/);
 assert.doesNotMatch(preview,/data-route="experience\/compose"/);
});

test('composer supports local image selection, preview and removal',()=>{
 const html=view.render('experience/compose',ctx({data:{draft:{images:['data:image/png;base64,AAAA']}}}));
 assert.match(html,/id="xpImages"[^>]*multiple/); assert.match(html,/accept="image\/\*"/);
 assert.match(html,/xp-compose-media/); assert.match(html,/data-xp-action="remove-image"/);
 const preview=view.render('experience/preview',ctx({data:{draft:{title:'图文记录',body:'正文',images:['data:image/png;base64,AAAA']}}}));
 assert.match(preview,/xp-story-media/);
});

test('build sync includes generated community media assets',()=>{
 const script=fs.readFileSync(path.join(__dirname,'../tools/build_growth_reports.py'),'utf8');
 for(const name of ['community-screen-time.webp','community-school-ready.webp','community-family-walk.webp']) assert.match(script,new RegExp(name));
});

test('community search follows the active tab and legacy demo news stays out of groups',()=>{
 const real=require('../assets/experience-model.js');
 const groups=view.render('experience/community',ctx({model:real,data:{ui:{tab:'groups',query:'入园'}}}));
 assert.match(groups,/入园适应/); assert.doesNotMatch(groups,/屏幕与规则/);
 const news=view.render('experience/community',ctx({model:real,data:{ui:{tab:'news',query:'编班'}}}));
 assert.match(news,/编班结果/); assert.doesNotMatch(news,/公办小学招生/);
 assert.doesNotMatch(view.render('experience/group/nursery',ctx({model:real})),/入园前可向老师确认的三件事/);
});
