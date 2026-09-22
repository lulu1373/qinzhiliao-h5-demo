(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.QZLFixedConversationModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const STAGES = ['scene', 'interaction', 'expectation', 'result'];
  const LABELS = {scene:'找准片段', interaction:'看清互动', expectation:'厘清期待', result:'形成理解'};
  const PROMPTS = {
    scene: '最近一次具体发生了什么？你可以只说一个片段：当时在什么情境里，孩子做了什么？',
    interaction: '谢谢你把片段说清楚了。接下来我想了解过程：你当时怎么回应，孩子又怎么回应？最后停在了哪里？',
    expectation: '我大概看见这段互动的轮廓了。对这件事，你最担心什么，又希望以后出现什么小变化？'
  };
  const EXAMPLES = {
    scene: '比如：昨晚八点，他坐在书桌前，翻了几页练习册还没有开始写。',
    interaction: '比如：我问他准备好了吗，他说等一下；我又提醒了一次，后来两个人都有点急。',
    expectation: '比如：我担心每天都要靠我催，希望他能慢慢学会自己开始。'
  };
  function createFlow(seed = '') {
    return {stage:'scene', seed:String(seed || ''), answers:{scene:'',interaction:'',expectation:''}, prompt:PROMPTS.scene, result:null, confirmed:false};
  }
  function resultFor(flow) {
    const scene = flow.answers.scene, interaction = flow.answers.interaction, expectation = flow.answers.expectation;
    return {title:'从一次具体片段，看见你们怎样卡住又怎样靠近', modules:[
      {title:'这次发生了什么',tone:'blue',body:scene || '这次片段还没有补充完整。',evidence:'来自你刚才描述的片段'},
      {title:'孩子行为背后的信息',tone:'violet',body:'在这个片段里，孩子的行为可能不只是“不愿意”，也可能是在当下压力里寻找一个更容易开始的入口。',evidence:'这是基于片段的可能理解，不是确定判断'},
      {title:'你们怎样互相影响',tone:'peach',body:interaction || '你们之间的回应过程还可以继续补充。',evidence:'来自你描述的互动过程'},
      {title:'换个角度看这件事',tone:'green',body:expectation ? `你在意的不只是这一次完成没有，而是希望孩子逐渐拥有自己开始的空间。下一步可以先从一个更小、压力更低的开始点试试。` : '先把期待说清楚，再决定下一步会更稳。',evidence:'结合你的担心与期待整理'}
    ]};
  }
  function answer(flow, text) {
    const value = String(text || '').trim();
    if (!value || !STAGES.includes(flow.stage) || flow.stage === 'result') return flow;
    const answers = {...flow.answers, [flow.stage]:value};
    const nextStage = flow.stage === 'scene' ? 'interaction' : flow.stage === 'interaction' ? 'expectation' : 'result';
    return {...flow, answers, stage:nextStage, prompt:nextStage === 'result' ? '' : PROMPTS[nextStage], result:nextStage === 'result' ? resultFor({...flow,answers}) : null, confirmed:false};
  }
  function exampleDraft(stage) { return {stage, text:EXAMPLES[stage] || '', submitted:false}; }
  return {STAGES, LABELS, PROMPTS, EXAMPLES, createFlow, answer, exampleDraft, resultFor};
});
