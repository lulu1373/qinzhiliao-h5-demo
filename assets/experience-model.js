(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QZLExperienceModel = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const RELATIONSHIPS = ['孩子', '伴侣', '父母', '自己'];
  const STEPS = ['context', 'support', 'phrase', 'action', 'feedback', 'done'];
  const GROUPS = [
    { id: 'screen', title: '屏幕与规则', description: '一起找能坚持、也能商量的边界', demo: true },
    { id: 'nursery', title: '入园适应', description: '给分离与新生活一点准备', demo: true },
    { id: 'play', title: '日常陪伴', description: '从一小段在一起的时间开始', demo: true }
  ];
  const STAGES = [
    { id: 'nursery', title: '入园准备', subtitle: '不用一次准备完，先选一件', demo: true, items: [
      { id: 'nursery-route', title: '走一遍上学的路', body: '看看门口和路上的树，不要求马上喜欢幼儿园。' },
      { id: 'nursery-goodbye', title: '约好一句告别的话', body: '说清楚由谁、在什么环节后来接，不偷偷离开。' },
      { id: 'nursery-contact', title: '了解园所的适应安排', body: '与老师核对作息、接送和需要及时联系的情况。' }
    ] },
    { id: 'teen', title: '青春期相处', subtitle: '保持连接，也给彼此空间', demo: true, items: [
      { id: 'teen-listen', title: '问问现在想怎么被听见', body: '先确认是想被听见，还是想一起找办法。' },
      { id: 'teen-space', title: '商量一条隐私边界', body: '讨论进房间、使用物品或分享照片前怎样征求同意。' },
      { id: 'teen-repair', title: '留一个重新开口的机会', body: '冲突后约定何时再谈，允许暂时说不出。' }
    ] }
  ];
  const SCENES = {
    screen: { title: '屏幕时间起了冲突', prompt: '刚才发生了什么？', context: '先把争执停下来，再把屏幕规则说清楚。', demo: true,
      phrases: { 孩子: ['我知道你还想看。我们先停一下，再一起说结束后做什么。', '刚才我声音太大了。这件事我们可以重新说。'], 伴侣: ['我们对屏幕时间的安排不太一样，能找个平静的时间商量吗？', '我想先听听你担心什么，再一起定一个双方都能执行的办法。'], 父母: ['我知道你想让大家轻松一点。屏幕这件事，我们能先对齐一个做法吗？', '谢谢你帮忙照顾。我们一起商量，怎样提醒更容易坚持？'], 自己: ['我现在有点停不下来，可以先把屏幕放远两分钟。', '我想看看，此刻我是需要休息，还是需要有人陪我说说话。'] },
      action: { title: '平静时约好一次结束提醒', why: '把结束方式提前说清，给转换留一点时间。', script: '下一次开始前，我们一起约好什么时候结束、怎么提醒。', observe: '记下提醒后发生了什么，不用只记录顺利的部分。' },
      support: ['刚才的争执可能已经让你很累了。', '先不用急着讲道理，可以松一松肩膀，给自己一点空间。', '等你愿意，我们再选一句现在说得出口的话。'], branches: ['如果对方说“我还没看完”：先承认没看完的遗憾，再重复已商量的边界。', '如果对方暂时不回应：留一点时间，避免连续追问。练习不保证真实反应。'] },
    nursery: { title: '面对入园有点不安', prompt: '最让你挂心的是什么？', context: '把眼前能准备的一件事，与暂时无法确定的事分开。', demo: true,
      phrases: { 孩子: ['第一次去新地方，舍不得是可以的。我会按约定来接你。', '你想先看看门口，还是先说说最担心什么？'], 伴侣: ['我对入园有些担心，想和你分一下准备和接送的事情。', '我们先核对园里的安排，再决定怎样陪着适应，好吗？'], 父母: ['入园这件事我们都有些牵挂，能一起了解老师的安排吗？', '我们尽量用一致的告别方式，遇到新情况再一起调整。'], 自己: ['面对新的安排，我有些不确定，这是我现在的感受。', '我不必今天解决所有担心，可以先核对一项信息。'] },
      action: { title: '一起走一遍上学的路', why: '先熟悉具体的地方，不急着要求喜欢。', script: '今天只去看看门口，回来可以告诉我你注意到了什么。', observe: '记录对方主动提到的一件事，也允许没有回应。' },
      support: ['要把熟悉的日子交给新的安排，担心很自然。', '你可以先说最挂心的一件事，不必马上做决定。', '准备能增加一点确定感，也可以边经历边调整。'], branches: ['如果对方说“不想去”：先听具体担心，不急着说“那里很好玩”。', '如果对方提问：只回答确认过的信息，不承诺不会哭或一定开心。'] },
    play: { title: '留一小段陪伴时间', prompt: '今天想怎样待在一起？', context: '一小段可以兑现的时间，就可以成为开始。', demo: true,
      phrases: { 孩子: ['我有十五分钟，想和你一起做件你选的小事。', '这会儿你想让我一起玩，还是坐在旁边看你玩？'], 伴侣: ['今晚能留十五分钟只聊聊彼此，不处理任务吗？', '我想听你说说今天，也可以只是一起坐一会儿。'], 父母: ['今天想陪你散一小会儿步，你愿意吗？', '我们聊聊你最近感兴趣的事，不急着讨论安排。'], 自己: ['我给自己留十五分钟，做一件没有任务的小事。', '这段时间可以只休息，不需要产出。'] },
      action: { title: '留十五分钟，让对方选活动', why: '一段能兑现的专注，比临时承诺很长的时间更容易开始。', script: '这十五分钟交给你选，我把手机先放在旁边。', observe: '记录你们做了什么，以及你注意到的一个细节。' },
      support: ['陪伴也可以从很普通的一刻开始。', '今天精力不多的话，五分钟也可以。', '不需要把这段时间安排成一次教育任务。'], branches: ['如果对方不想一起：尊重这次选择，问问改个时间是否合适。', '如果活动和预想不同：先看看对方的玩法，再决定是否加入。'] },
    repeat: { title: '同一个问题又出现了', prompt: '这次和上次有什么相同或不同？', context: '缩小到一个具体环节，观察下一次能改变什么。', demo: true,
      phrases: { 孩子: ['这件事又卡住了。你觉得最难的是哪一步？', '这次我们只试着调整一个地方，做完再看看。'], 伴侣: ['这个问题反复出现，我想和你一起看看约定哪里不好执行。', '我先说一件具体发生的事，也想听听你的困难。'], 父母: ['我们在这件事上常有不同看法，能先说清各自最在意的一点吗？', '先试一个双方都接受的小调整，之后再讨论。'], 自己: ['这个困难又出现了，我想看看是什么条件让它更难。', '我可以把目标缩小一点，先试一个做得到的步骤。'] },
      action: { title: '只调整一个容易卡住的环节', why: '把大问题缩小，才容易观察办法是否适合。', script: '我们先选最难的一步，这次只换一种提醒方式。', observe: '记下实际尝试的环节，以及有变化或没变化的地方。' },
      support: ['反复提醒还没有变化，可能会让人很挫败。', '可以先暂停“为什么总这样”的追问。', '下一步不必更用力，也可以试着把要求说得更具体。'], branches: ['如果对方说“做不到”：询问最难的一步，再共同缩小要求。', '如果对方不同意：先听分歧，保留这次没有形成约定的结果。'] },
    self: { title: '先照顾此刻的自己', prompt: '现在最想被听见的是什么？', context: '这段时间可以只属于你，不必立刻找到答案。', demo: true,
      phrases: { 孩子: ['我现在需要安静两分钟，等我缓一缓再听你说。', '刚才是我太着急了，不是你需要照顾我的情绪。'], 伴侣: ['我现在有点撑不住，能先听我说一会儿吗？暂时不用给建议。', '我需要一小段安静时间，之后再一起处理这件事。'], 父母: ['我有些累，现在先不讨论解决办法，想让你听我说说。', '这件事我需要自己想一想，准备好了再和你聊。'], 自己: ['我现在确实很难受，不用马上把自己劝好。', '我可以先照顾这一刻，再决定要不要处理那件事。'] },
      action: { title: '给自己两分钟缓冲', why: '先照顾当下的感受，再决定是否继续。', script: '我先坐稳，喝一口水，留意一下身体哪里绷紧了。', observe: '只记下此刻的感受；没有缓解也可以如实记录。' },
      support: ['你可以先把这段话说完，我会留在这个话题里。', '不需要马上积极起来，也不用证明自己已经尽力。', '你可以停在这里，或者选一句更接近心情的话。'], branches: ['如果暂时说不出来：可以停一会儿，或只写下一个感受词。', '如果不想继续：结束也是一个有效选择，不会要求完成行动。'] }
  };
  const postRows = [
    ['p1','先约好怎么结束，比再提醒一次更有用','screen','experience','学龄期','屏幕约定','看屏幕前，我们一起确认结束时间和提醒方式。第一次还是起了争执。','把提醒提前到开始之前。','第二次能谈下一个活动，但还需要继续调整。'],
    ['p2','争执后，我换了一句开场白','screen','experience','学龄期','关系修复','那天我先承认自己声音太大，再讨论规则。这是一个虚构练习故事。','先说清自己的责任，再谈具体事情。','对方没有马上回应，我没有继续追问。'],
    ['p3','一张双方看得懂的屏幕约定','screen','method','学龄期','规则方法','尝试写下什么时候开始、如何结束、意见不同时何时再谈。约定需要双方参与。','先商量一个可执行的细节。','适合与否要在实际生活里观察。'],
    ['p4','入园前，我们只去看了看门口','nursery','experience','入园期','入园准备','没有急着问喜不喜欢，只聊路上看见的树和门口的颜色。','把熟悉路线当成一次短散步。','回家后主动提起一棵树，仍然会说不想去。'],
    ['p5','告别没有变轻松，但有了约定','nursery','experience','入园期','分离适应','我们练习一句简短告别，并核对接回来的时间环节，没有承诺一定不哭。','每次离开前认真告别。','仍有舍不得，也更清楚何时见面。'],
    ['p6','入园前可向老师确认的三件事','nursery','news','入园期','准备清单','资讯栏目样例：作息安排、接送流程、需要联系家长的情况。具体以所在园所最新通知为准。','把不确定的问题列出来再联系园所。','此条为演示清单，不代表当地政策或园所通知。'],
    ['p7','十五分钟，由孩子决定怎么玩','play','experience','全年龄','日常陪伴','下班后留出十五分钟，先问想一起玩还是让我在旁边看。','收起手机，跟着对方选的活动走。','玩得没有特别热闹，但听到了一段学校里的小事。'],
    ['p8','陪伴也可以只是并排走一会儿','play','experience','青春期','轻松连接','我们没有一路提问，只散了一小段步。对方想说时我再接话。','把这段时间从任务里留出来。','有时聊几句，有时各自安静。'],
    ['p9','一句“你想被听见，还是想一起想办法”','play','method','全年龄','倾听方法','先征询对方需要怎样的回应，允许对方改变选择。','给建议前先问一句。','这是沟通练习，不保证对方会立即愿意说。'],
    ['p10','规则没执行，我们重新缩小了一步','screen','experience','学龄期','小步调整','发现原来的约定太复杂后，我们只保留一个最需要尝试的环节。','一次改一件事，过后一起看看。','这一回还是忘了；记录帮助我们看见卡在哪里。'],
    ['p11','大人也可以说“我需要缓一缓”','play','method','全年龄','自我照顾','表达自己的状态，同时避免让对方负责安抚。可以说明何时再继续谈。','说需要，而不是指责。','若仍不适合继续，保留暂停的空间。'],
    ['p12','一起核对接送安排，让准备更具体','nursery','method','入园期','共同照顾','把谁接送、临时变动联系谁、重要物品放哪写清，和共同照顾的人确认。','选一个安排先核对。','不同家庭可以有不同分工，没有统一标准答案。']
  ];
  const POSTS = postRows.map((r, i) => ({ id:r[0], title:r[1], group:r[2], kind:r[3], stage:r[4], topic:r[5], body:r[6], attempt:r[7], result:r[8], author:['小禾的笔记','慢慢来','一起试试'][i % 3] + ' · 示例', scene:r[2], demo:true }));
  function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function normalize(raw) {
    const data = object(raw);
    return { ...data, version:1, journeys:Array.isArray(data.journeys) ? data.journeys.filter(x=>x && typeof x==='object') : [], posts:Array.isArray(data.posts) ? data.posts.filter(x=>x && typeof x==='object') : [], comments:Array.isArray(data.comments) ? data.comments.filter(x=>x && typeof x==='object') : [], saved:Array.isArray(data.saved) ? data.saved.filter(x=>typeof x==='string') : [], joined:Array.isArray(data.joined) ? data.joined.filter(x=>typeof x==='string') : [], draft:{...object(data.draft)}, ui:{...object(data.ui)} };
  }
  function text(value, label, max, optional) {
    const result = typeof value === 'string' ? value.trim() : '';
    if (!result && !optional) throw new Error('请填写' + label);
    if (result.length > max) throw new Error(label + '请控制在' + max + '字以内');
    return result;
  }
  function start(raw, options) {
    const data = normalize(raw), input = object(options), id = text(input.id, '记录编号', 120);
    if (!Object.prototype.hasOwnProperty.call(SCENES, input.scene)) throw new Error('请选择一个演示场景');
    if (data.journeys.some(j=>j.id===id)) return data;
    const journey = { id, scene:input.scene, originId:text(input.originId,'来源',120,true), relationship:input.scene==='self'?'自己':'孩子', description:'', step:'context', actionId:null, createdAt:input.now || new Date().toISOString() };
    return {...data, journeys:[...data.journeys, journey]};
  }
  function patchJourney(raw, id, patch) {
    const data = normalize(raw), input = object(patch);
    if (!data.journeys.some(j=>j.id===id)) throw new Error('没有找到这次记录，请返回重新选择');
    const allowed = ['relationship','description','step','actionId','supportMode','phrase','feedback','phraseChoice','actionTitle','actionScript','feedbackNote','ended','cardType'];
    const changes = Object.fromEntries(Object.entries(input).filter(([key])=>allowed.includes(key)));
    if ('relationship' in changes && !RELATIONSHIPS.includes(changes.relationship)) throw new Error('请选择关系对象');
    if ('step' in changes && !STEPS.includes(changes.step)) throw new Error('无效的流程步骤');
    if ('feedback' in changes && !['better','same','worse','not_tried','declined',''].includes(changes.feedback)) throw new Error('请选择这次尝试的实际反馈');
    if ('actionId' in changes && changes.actionId !== null && (typeof changes.actionId !== 'string' || changes.actionId.length > 120)) throw new Error('无效的行动编号');
    if ('phraseChoice' in changes && ![0,1].includes(changes.phraseChoice)) throw new Error('请选择一句表达');
    if ('ended' in changes && typeof changes.ended !== 'boolean') throw new Error('无效的结束状态');
    if ('cardType' in changes && !['action','strength','mirror','repair','interpretation'].includes(changes.cardType)) throw new Error('无效的卡牌类型');
    const limited = Object.fromEntries(Object.entries(changes).map(([key,value])=>[key, ['description','phrase','actionTitle','actionScript','feedbackNote','supportMode','feedback'].includes(key) ? text(value,'内容',2000,true) : value]));
    return {...data, journeys:data.journeys.map(j=>j.id===id ? {...j,...limited} : j)};
  }
  function savePost(raw, options) {
    const data = normalize(raw), input = object(options), id = text(input.id,'帖子编号',120);
    if (data.posts.some(p=>p.id===id)) return data;
    const group = input.group || 'play';
    if (!GROUPS.some(g=>g.id===group)) throw new Error('请选择一个小组');
    const post = { id, title:text(input.title,'标题',60), body:text(input.body,'正文',2000), group, scene:group, author:'我的本机演示', kind:'experience', demo:true, local:true, createdAt:input.now || new Date().toISOString() };
    return {...data, posts:[post,...data.posts]};
  }
  function addComment(raw, options) {
    const data = normalize(raw), input = object(options), id = text(input.id,'评论编号',120);
    if (data.comments.some(c=>c.id===id)) return data;
    if (![...POSTS,...data.posts].some(p=>p.id===input.postId)) throw new Error('没有找到这条内容');
    const comment = { id, postId:input.postId, body:text(input.body,'评论',500), author:'我 · 本机演示', demo:true, createdAt:input.now || new Date().toISOString() };
    return {...data, comments:[...data.comments,comment]};
  }
  function toggle(raw, field, id) {
    if (!['saved','joined'].includes(field)) throw new Error('无效的收藏或小组操作');
    const data = normalize(raw), key = text(id,'编号',120);
    return {...data,[field]:data[field].includes(key) ? data[field].filter(item=>item!==key) : [...data[field],key]};
  }
  function updateDraft(raw, patch) { const data = normalize(raw); return {...data,draft:{...data.draft,...object(patch)}}; }
  function actionFor(journey) {
    const input = object(journey), scene = Object.prototype.hasOwnProperty.call(SCENES,input.scene) ? SCENES[input.scene] : SCENES.self;
    const relationship = RELATIONSHIPS.includes(input.relationship) ? input.relationship : '自己';
    if (relationship==='孩子') return {...scene.action};
    if (relationship==='自己') return { title:input.scene==='play'?'留十五分钟给自己':'先做一件照顾自己的小事', why:'让行动从自己能决定的范围开始，不要求立刻改变感受。', script:scene.phrases.自己[0], observe:'记录做了什么、当时什么感受，没做也可以如实写下。' };
    return { title:relationship==='伴侣'?'约一小段双方方便的时间':'先征询意愿，再谈一件具体的事', why:relationship==='伴侣'?'把分工和需要放到平等的讨论里。':'尊重彼此的经验和选择，先确认是否愿意讨论。', script:scene.phrases[relationship][0], observe:'记录双方是否愿意继续、共同确认了什么，也可以暂时没有共识。' };
  }
  return { normalize, start, patchJourney, savePost, addComment, toggle, updateDraft, actionFor, SCENES, POSTS, GROUPS, STAGES };
});
