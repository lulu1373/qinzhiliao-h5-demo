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
test('community offers a Douban-inspired dynamic stream and three navigation tabs',()=>{const real=require('../assets/experience-model.js');const html=view.render('experience/community',ctx({model:real}));assert.match(html,/家长社区/);assert.match(html,/data-value="dynamic"/);assert.match(html,/data-value="groups"/);assert.match(html,/data-value="news"/);assert.match(html,/data-xp-action="like-post"/);assert.match(html,/data-xp-action="save-post"/);assert.match(html,/xp-story-media/);assert.match(html,/热门回复/); assert.match(html,/xp-social-label">点赞/); assert.match(html,/xp-social-label">回复/);});
test('post details preserve author story and provide adoption and local comments',()=>{const html=view.render('experience/post/p1',ctx());assert.match(html,/我家也遇到类似问题/);assert.match(html,/问小亲：这适合我家吗？/);assert.match(html,/data-xp-action="adopt"/);assert.match(html,/id="xpComment"/);});
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
 assert.match(list,/官方原文/); assert.match(list,/class="xp-news-action xp-news-original"/); assert.match(list,/target="_blank"/); assert.match(list,/rel="noopener noreferrer"/); assert.match(list,/href="https:\/\/jyj\.gz\.gov\.cn\//);
 const detail=view.render('experience/news/gz-primary-public-2026',ctx({model:real}));
 assert.match(detail,/关键时间/); assert.match(detail,/适用对象/); assert.match(detail,/打开官方原文/); assert.match(detail,/rel="noopener noreferrer"/);
});



test('education news list keeps official source links visible and hides them when unavailable',()=>{
 const item={id:'local-news',title:'测试资讯',summary:'摘要',source:'教育部门',publishedAt:'2026-09-11',status:'已结束',stage:'入学'};
 const modelWithNoUrl={OFFICIAL_NEWS:[item],POSTS:[],GROUPS:[]};
 const html=view.render('experience/community',ctx({model:modelWithNoUrl,data:{ui:{tab:'news'}},educationRegion:{city:'广州市',district:'天河区',confirmed:true}}));
 assert.match(html,/查看要点/); assert.doesNotMatch(html,/xp-news-original/);
});

test('community V2 exposes family context, social proof and chip-based publishing',()=>{
 const real=require('../assets/experience-model.js');
 const feed=view.render('experience/community',ctx({model:real,data:{ui:{tab:'dynamic'}}}));
 assert.match(feed,/小禾妈妈/); assert.match(feed,/广州 · 10岁男孩 · 四年级/); assert.match(feed,/xp-social-label">点赞<\/span><span class="xp-social-count">86/);
 const groups=view.render('experience/community',ctx({model:real,data:{ui:{tab:'groups'}}}));
 assert.match(groups,/1,286 位家长/); assert.match(groups,/今天 23 条新讨论/); assert.match(groups,/最近在聊/);
 const compose=view.render('experience/compose',ctx({model:real,data:{draft:{postType:'question'}}}));
 assert.match(compose,/data-xp-action="post-type"/); assert.match(compose,/>经历<\/button>/); assert.match(compose,/>求助<\/button>/); assert.match(compose,/>方法<\/button>/);
 assert.match(compose,/id="xpStage"/); assert.match(compose,/小学高年级/);
});

test('publishing uses a community transaction and returns to its origin feed',()=>{
 const controller=fs.readFileSync(path.join(__dirname,'../assets/experience-controller.js'),'utf8');
 assert.match(controller,/communityBackTarget/); assert.match(controller,/returnToOrigin\(origin\)/);
 assert.match(controller,/experience\/preview\?origin=/); assert.doesNotMatch(controller,/navigate\('experience\/post\/' \+ id/);
 const preview=view.render('experience/preview?origin=guides',ctx({data:{draft:{title:'返回测试',body:'验证返回社区'}}}));
 assert.match(preview,/data-xp-action="edit-draft"/);
});

test('my community manages posts, saves, responses and likes in one page',()=>{
 const real=require('../assets/experience-model.js');
 const minePost=real.savePost({}, {id:'mine-1',title:'我的帖子',body:'这是我发布的内容',group:'screen',stage:'小学高年级'}).posts[0];
 const data={posts:[minePost],saved:['p1'],liked:['p4'],comments:[{id:'c1',postId:'p1',body:'我的回应'}],joined:['screen'],draft:{title:'还没发'},ui:{mineTab:'published'}};
 const html=view.render('experience/mine',ctx({model:real,data}));
 assert.match(html,/我的社区/); assert.match(html,/我的发布/); assert.match(html,/收藏/); assert.match(html,/回复/); assert.match(html,/点赞/);
 assert.match(html,/我的帖子/); assert.match(html,/data-xp-action="edit-post"/); assert.match(html,/data-xp-action="delete-post"/); assert.match(html,/草稿箱/);
 const comments=view.render('experience/mine',ctx({model:real,data:{...data,ui:{mineTab:'comments'}}}));
 assert.match(comments,/我回复了/); assert.match(comments,/data-xp-action="delete-comment"/); assert.match(comments,/from=mine/);
 assert.match(html,/data-route="experience\/mine\/groups"/); assert.match(html,/data-route="experience\/mine\/drafts"/);
 const groups=view.render('experience/mine/groups',ctx({model:real,data}));
 assert.match(groups,/我加入的小组/); assert.match(groups,/屏幕与规则/); assert.match(groups,/from=mine-groups/);
 const drafts=view.render('experience/mine/drafts',ctx({model:real,data}));
 assert.match(drafts,/草稿箱/); assert.match(drafts,/还没发/); assert.match(drafts,/data-xp-action="resume-draft"/); assert.match(drafts,/data-xp-action="clear-draft"/);
 const emptyDraft=view.render('experience/mine/drafts',ctx({model:real,data:{...data,draft:{}}}));
 assert.match(emptyDraft,/暂无草稿/); assert.match(emptyDraft,/data-xp-action="compose"/);
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

test('community reply action enters focused reply mode and uses send language',()=>{
  const real=require('../assets/experience-model.js');
  const feed=view.render('experience/community',ctx({model:real}));
  assert.match(feed,/data-route="experience\/post\/p1\?from=community&amp;reply=1"/);
  const detail=view.render('experience/post/p1',ctx({model:real}));
  assert.match(detail,/class="xp-reply-send"/);
  assert.match(detail,/>发送<\/button>/);
  assert.match(detail,/回复 <small>12<\/small>/);
  assert.doesNotMatch(detail,/保存回应/); assert.match(detail,/data-xp-action="focus-reply"/); assert.match(detail,/xp-social-label">收藏/);
});

test('clean home keeps core chat starters and the card quickbar above the composer',()=>{
  const controller=fs.readFileSync(path.join(__dirname,'../assets/experience-controller.js'),'utf8');
  assert.match(controller,/function startLightChat\(/);
  assert.match(controller,/data-xp-action="chat-start" data-scene="emotion"/);
  assert.match(controller,/data-xp-action="chat-start" data-scene="repeat"/);
  assert.doesNotMatch(controller,/xp-home-light/);
  assert.match(controller,/return startLightChat\('post',post\)/);
  assert.match(controller,/renderCardQuickBarV90\(\)/);
  assert.doesNotMatch(controller,/整理成一个小行动/);
  assert.doesNotMatch(controller,/xp-tool-button/);
});


test('community social actions use explicit icons and visible active states',()=>{
  const real=require('../assets/experience-model.js');
  const data={posts:[],comments:[],saved:['p1'],liked:['p1'],joined:[],draft:{},ui:{tab:'dynamic'}};
  const feed=view.render('experience/community',ctx({model:real,data}));
  assert.match(feed,/xp-social-label">点赞/);
  assert.match(feed,/xp-social-label">回复/);
  assert.match(feed,/xp-social-label">已收藏/);
  assert.match(feed,/fill="currentColor"/);
  assert.match(feed,/class="xp-header-icon-action"[^>]*aria-label="发布"|aria-label="发布"[^>]*class="xp-header-icon-action"/);
  assert.doesNotMatch(feed,/xp-compose-fab/);
});


test('education news follows education region and never fills another city policy',()=>{
  const real=require('../assets/experience-model.js');
  const guangzhou=view.render('experience/community',ctx({model:real,data:{ui:{tab:'news'}},educationRegion:{city:'广州市',district:'天河区',confirmed:true}}));
  assert.match(guangzhou,/教育资讯/); assert.match(guangzhou,/教育地区/); assert.match(guangzhou,/广州市 · 天河区/); assert.match(guangzhou,/广州市教育局/);
  const shenzhen=view.render('experience/community',ctx({model:real,data:{ui:{tab:'news'}},educationRegion:{city:'深圳市',district:'南山区',confirmed:true}}));
  assert.match(shenzhen,/深圳市 · 南山区/); assert.match(shenzhen,/暂未接入 Demo 资讯/); assert.match(shenzhen,/data-xp-action="education-region"/); assert.doesNotMatch(shenzhen,/广州市教育局/);
  assert.ok(real.OFFICIAL_NEWS.every(item=>item.regionCity==='广州市'));
});


test('card intros use the clean mascot without changing the chat avatar',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/mascotCard:'assets\/mascot-clean-v90\.png'/);
  const introStart=html.indexOf("function renderCardIntroV90(type='interpretation')");
  const introEnd=html.indexOf('function renderCardInviteV90',introStart);
  const intro=html.slice(introStart,introEnd);
  assert.match(intro,/class="v105-card-mascot" src="\${ASSETS\.mascotCard}"/);
  assert.doesNotMatch(intro,/ASSETS\.mascotAvatar/);
  assert.match(html,/class="ai-avatar"><img src="\${ASSETS\.mascotAvatar}"/);
  assert.match(html,/\.v90-card-intro-visual img\.v105-card-mascot\{[^}]*filter:none!important/);
});
