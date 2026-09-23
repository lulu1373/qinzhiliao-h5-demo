(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.QZLFixedConversationModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const LABELS = {invite:'自然邀请',scene:'当时情况',interaction:'双方回应',confirm:'双方回应',expectation:'你的想法',result:'形成解读'};
  const STEPS = ['当时情况','双方回应','你的想法'];
  const REPLIES = {accept:"好，帮我看看吧。",confirm:"对，就是这样。"};
  const INVITE = "催了好几次，还是拖到快十点，难怪你又急又气。\n\n你愿意的话，我们可以挑最近一次一起看看：他在哪儿慢下来了，你提醒之后又发生了什么。我帮你把这些线索整理成一份解读。要是这会儿还气着，不想分析，也没关系，咱们可以先聊聊。";
  const RESULT_INTRO = "你担心的不只是昨晚写得晚，而是这样拖下去会养成习惯，以后题多了更写不完。你希望先看到的变化也很具体：会做的接着写，不用你反复催；不会的早点说卡在哪里。\n\n现在我已经搜集到了足够的信息。接下来，我将为你生成《解读卡》，帮助你梳理这次事件。";
  const PROMPTS = {
    scene:"好，我们先挑最近一次，不用你把整个晚上重新讲一遍。\n\n最近那次，他是从一开始就慢，还是写到某一部分才明显慢下来？\n\n当时你看到他具体在做什么？\n\n比如反复擦写、摆弄文具，或盯着题没动笔，说你记得的一两个动作就好。",
    interaction:"这个区别很有用：前面的口算能往下做，停顿主要出现在应用题。现在我们看的是一个具体卡住的片段，不只是笼统的「写作业慢」。\n\n看到他停着，你当时是怎么回应的？\n\n从你回应之后到这次作业结束，他的表现有怎样的变化？\n\n不必记住每句话，讲你记得的几个节点就好：比如仍然停着、说出了困难，或者后来继续写了。",
    confirm:"从你说的经过看，有个变化值得留意：几次催促后，他仍停着；你陪他读题后，他才继续往下写。\n\n我把这一次的经过串起来，你看看有没有哪里没说准：\n\n1. **场景**：昨晚七点半开始写数学作业，前面的口算比较顺，到了应用题明显慢下来。\n2. **过程**：他反复擦写、摆弄橡皮；你催了几次「快点写」，他还是没往下写，后来告诉你「不知道先算什么，写错了又要擦」。你随后坐下来，陪他读了一遍题。\n3. **结果**：一起读题后，他继续写了，作业最终完成，但已经接近十点。\n\n我这样梳理，符合当时的实际情况吗？\n\n如果有不准确或遗漏的地方，你可以进行补充。",
    expectation:"好，那我们就按这个经过往下看。你刚才说越看越来气，最后我也想听听你这边。\n\n**这件事最让你在意或担心的是什么？**\n\n- 每天拖到很晚，怕影响睡觉和休息。\n- 怕拖拉变成习惯，以后事情更多时更应付不过来。\n- 每天都得陪着、催着，自己的时间和精力被耗住了。\n\n**你最希望先看到哪一点变化？**\n\n- 会做的能接着写，不用反复催。\n- 不会的早点说卡在哪里，不要一直停着。\n- 作业早点结束，不再每天拖到那么晚。\n\n这些只是例子，挑贴近你的说就好，也可以自己说，不用逐项回答。"
  };
  const PRESET = {
    seed:"小宝写作业怎么总是这么拖拉？明明题也不多，每次都弄到快十点。我催了好几次也没用，真是越看越来气。",
    scene:"昨晚七点半开始写数学，前面的口算挺快。翻到应用题后就一直擦了写、写了擦，还拿橡皮在桌上摆弄，半天没往下写。",
    interaction:"我催了几次「快点写」，他还是没往下写，后来就说「你别一直催，我不知道先算什么，写错了又要擦」。我坐下来陪他读了一遍题，他才接着写，写完还是快十点了。",
    expectation:"我最怕他养成拖拉的习惯，现在题少都这样，以后题多更写不完。我希望会做的能接着写，不用我一直催；不会的就早点说卡在哪里。"
  };
  const SUMMARY = [
    {title:'本次片段',body:'昨晚口算较顺，到了应用题，小宝反复擦写、停着没往下做，最终接近十点才完成。'},
    {title:'值得记住的理解',body:'这次的慢，可能与找不到做题的第一步有关，不宜直接等同于“不自觉”。他说“不知道先算什么”，也在一起读题后继续了。'},
    {title:'你的担心与期待',body:'你担心拖拉养成习惯，以后题多更写不完；希望他会做的接着写，不会的早点说，不用反复催。'},
    {title:'下次可以试试',body:'再停住时，先把“快点写”换成了解具体卡点：“这道题，你卡在哪一步？”'}
  ];
  function createFlow(seed = '') { return {stage:'invite',seed:String(seed || ''),answers:{scene:'',interaction:'',expectation:''},prompt:INVITE,result:null,confirmed:false,claimed:false,paused:false,presets:{...PRESET}}; }
  function presetFlow() { const flow=createFlow(PRESET.seed); return {...flow,presets:{...PRESET},summary:{title:'解读卡·亲子翻译',items:SUMMARY.map(item=>({...item}))}}; }
  function accept(flow) { return {...flow,stage:'scene',prompt:PROMPTS.scene}; }
  function resultFor(flow) { return {title:'解读卡·亲子翻译',modules:[
    {title:'这次发生了什么',tone:'blue',body:'事件场景：昨晚七点半，小宝开始写数学作业，前面的口算进行得比较顺利。主要冲突：你希望作业继续推进，但几次提醒“快点写”后，他仍停着。后来你陪他读题，他才继续，最终完成时已接近十点。孩子客观的表现：到了应用题，他反复擦写、摆弄橡皮，没有继续往下写，并说：“你别一直催，我不知道先算什么，写错了又要擦。”家长期待的结果：你担心拖拉形成习惯，以后题多了更写不完。你希望会做的题能接着写，不用反复催；不会的时候，能早点说出卡在哪里。',evidence:'基于已确认的场景、过程与结果'},
    {title:'孩子行为背后的信息',tone:'violet',body:'能力卡点：可能还没找到做题的第一步。前面的口算较顺，停顿主要出现在应用题，加上他明确说“不知道先算什么”，这次更值得先看的是：他能否理清题意、确定第一步。因此，“写得慢”不宜直接等同于“不自觉”。不过，这些线索还不能说明他每次拖拉都出于同一个原因。关系信号：他在回应催促，也在表达自己的困难。“你别一直催”表达了他不希望持续被催；紧接着的“不知道先算什么”，又提供了具体困难的信息。至于他是否感到紧张、担心被批评，目前还不能确定。',evidence:'保留“可能”和当前不能判断的部分'},
    {title:'你们怎样互相影响',tone:'peach',body:'看到互动模式：这次前半段出现了“他停着不写——你提醒快一点—他仍停着——你再次提醒”的来回。催促在推动速度，但还没有解决他表达的“下一步怎么做”的困难。后来你改为陪他读题，他继续往下写，这段互动让事件出现了转折。如果这种互动反复延续，具体的做题困难可能迟迟没有得到处理。同类问题反复出现时，你们也容易把注意力放在“为什么还不快点”，而不是弄清“究竟卡在哪里”。',evidence:'来自本次互动顺序，不推断长期模式'},
    {title:'换个角度看这件事',tone:'green',body:'正面重述：原本的说法：“他写作业怎么总是这么拖拉？”可以尝试的新说法：“这次他在应用题上卡住了，但他已经能说出自己不知道先算什么，也在一起读题后继续往下做。能够表达困难、借助帮助继续，是可以支持他往前走的起点。”这个理解保留了需要改善的地方，也看见了孩子已经做到的部分；并不意味着作业拖到很晚就不需要处理。小亲提醒：1. 先辨认一个具体卡点。下次再次停住时，可以先了解他卡在哪一步，把注意力从单纯提醒速度，转向眼前的困难。2. 留意帮助后能否自己继续。一起弄清卡点后，给他尝试下一步的空间；如果仍停着，再了解剩下的困难，不必马上接管整份作业。',evidence:'结合事实与家长已表达的担心和期待'}
  ]}; }
  function answer(flow,text) { const value=String(text||'').trim(); if(!value||!['scene','interaction','expectation'].includes(flow.stage))return flow; const answers={...flow.answers,[flow.stage]:value}; const stage=flow.stage==='scene'?'interaction':flow.stage==='interaction'?'confirm':'result'; return {...flow,answers,stage,prompt:stage==='result'?'':stage==='confirm'?PROMPTS.confirm:PROMPTS[stage],result:stage==='result'?resultFor({...flow,answers}):null,confirmed:false}; }
  function confirm(flow) { if(flow.stage!=='confirm')return flow; return {...flow,stage:'expectation',prompt:PROMPTS.expectation,confirmed:true}; }
  function claim(flow) { if(flow.stage!=='result'||!flow.result)return flow; return {...flow,stage:'reveal_back',claimed:true}; }
  function pause(flow) { if(!flow||flow.stage==='result'||flow.stage==='reveal_back'||flow.stage==='done')return flow; return {...flow,paused:true}; }
  function resume(flow) { if(!flow)return flow; return {...flow,paused:false}; }
  function exampleDraft(stage) { return {stage,text:stage==='seed'?PRESET.seed:stage==='scene'?PRESET.scene:stage==='interaction'?PRESET.interaction:PRESET.expectation,submitted:false}; }
  function progress(flow) {
    if (!flow || ['invite','reveal_back','done'].includes(flow.stage)) return null;
    const complete = flow.stage === 'result';
    const current = {scene:1,interaction:2,confirm:2,expectation:3,result:3}[flow.stage] || 1;
    const title = flow.paused ? '解读已暂停' : complete ? '这次解读已整理好' : '一起看懂这次发生的事';
    return {title,complete,current,steps:STEPS.map((label,i)=>({label,index:i+1,state:complete||i+1<current?'done':i+1===current?'current':'todo'}))};
  }
  function composerDraft(flow) { return flow && ['scene','interaction','expectation'].includes(flow.stage) && !flow.paused ? PRESET[flow.stage] : ''; }
  // Full 解读卡 report shown in the chat before the parent claims the card (verbatim from the reference H5).
  const RESULT_MARKDOWN = "# **解读卡·亲子翻译**\n\n### ① 这次发生了什么\n\n- **事件场景**：昨晚七点半，小宝开始写数学作业，前面的口算进行得比较顺利。\n\n- **主要冲突**：你希望作业继续推进，但几次提醒“快点写”后，他仍停着。后来你陪他读题，他才继续，最终完成时已接近十点。\n\n- **孩子客观的表现**：到了应用题，他反复擦写、摆弄橡皮，没有继续往下写，并说：“你别一直催，我不知道先算什么，写错了又要擦。”\n\n- **家长期待的结果**：你担心拖拉形成习惯，以后题多了更写不完。你希望会做的题能接着写，不用反复催；不会的时候，能早点说出卡在哪里。\n\n### ② 孩子行为背后的信息\n\n1. **能力卡点：可能还没找到做题的第一步**\n\n   前面的口算较顺，停顿主要出现在应用题，加上他明确说“不知道先算什么”，这次更值得先看的是：他能否理清题意、确定第一步。\n\n   因此，“写得慢”不宜直接等同于“不自觉”。不过，这些线索还不能说明他每次拖拉都出于同一个原因。\n\n2. **关系信号：他在回应催促，也在表达自己的困难**\n\n   “你别一直催”表达了他不希望持续被催；紧接着的“不知道先算什么”，又提供了具体困难的信息。\n\n   这句话不只有拒绝的意味，也包含一个可以继续了解他的入口。至于他是否感到紧张、担心被批评，目前还不能确定。\n\n### ③ 你们怎样互相影响\n\n1. **看到互动模式**\n\n   这次前半段出现了“他停着不写——你提醒快一点—他仍停着——你再次提醒”的来回。催促在推动速度，但还没有解决他表达的“下一步怎么做”的困难。\n\n   后来你改为陪他读题，他继续往下写，这段互动让事件出现了转折。\n\n2. **如果这种互动反复延续**\n\n   如果以后遇到类似情况，仍主要依靠反复催促，具体的做题困难可能迟迟没有得到处理。同类问题反复出现时，你们也容易把注意力放在“为什么还不快点”，而不是弄清“究竟卡在哪里”。\n\n\n### ④ 换个角度看这件事\n\n**正面重述**\n\n- **原本的说法**：“他写作业怎么总是这么拖拉？”\n\n- **可以尝试的新说法**：“这次他在应用题上卡住了，但他已经能说出自己不知道先算什么，也在一起读题后继续往下做。能够表达困难、借助帮助继续，是可以支持他往前走的起点。”\n\n这个理解保留了需要改善的地方，也看见了孩子已经做到的部分；并不意味着作业拖到很晚就不需要处理。\n\n**小亲提醒**\n\n1. **先辨认一个具体卡点。** 下次再次停住时，可以先了解他卡在哪一步，把注意力从单纯提醒速度，转向眼前的困难。\n\n2. **留意帮助后能否自己继续。** 一起弄清卡点后，给他尝试下一步的空间；如果仍停着，再了解剩下的困难，不必马上接管整份作业。";
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  function markdown(source){
    const lines=String(source).split('\n');let i=0,out='';
    while(i<lines.length){
      if(!lines[i].trim()){i++;continue;}
      const heading=lines[i].match(/^(#{1,3}) (.*)/);
      if(heading){out+=`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;i++;continue;}
      const list=lines[i].match(/^(\d+\.|-) (.*)/);
      if(list){const ordered=list[1]!=='-',tag=ordered?'ol':'ul';out+=`<${tag}>`;
        while(i<lines.length){const item=lines[i].match(/^(\d+\.|-) (.*)/);if(!item||(item[1]!=='-')!==ordered)break;const buf=[item[2]];i++;
          while(i<lines.length){if(/^\s{2,}\S/.test(lines[i])){buf.push(lines[i].trimStart());i++;}else if(!lines[i].trim()){let j=i+1;while(j<lines.length&&!lines[j].trim())j++;if(/^\s{2,}\S/.test(lines[j]||'')){buf.push('');i=j;}else{i=j;break;}}else break;}
          out+=`<li>${markdown(buf.join('\n'))}</li>`;
        }out+=`</${tag}>`;continue;
      }
      const para=[];while(i<lines.length&&lines[i].trim()&&!/^(#{1,3} |\d+\. |- )/.test(lines[i]))para.push(lines[i++]);out+=`<p>${inline(para.join('\n')).replace(/\n/g,'<br>')}</p>`;
    }return out;
  }
  return {RESULT_MARKDOWN,markdown,STEPS,REPLIES,INVITE,RESULT_INTRO,progress,composerDraft,LABELS,PROMPTS,PRESET,SUMMARY,createFlow,presetFlow,accept,answer,confirm,claim,pause,resume,exampleDraft,resultFor};
});
