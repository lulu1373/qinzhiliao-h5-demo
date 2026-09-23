const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../assets/fixed-conversation-model.js');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('fixed flow starts with an open question and does not invent scene facts', () => {
  const flow = model.createFlow('孩子写作业很困难，我不知道该怎么帮他。');
  assert.equal(flow.stage, 'invite');
  assert.equal(flow.answers.scene, '');
  assert.match(flow.prompt, /愿意|最近一次|解读/);
  assert.doesNotMatch(flow.prompt, /应用题|不知道先算|口算/);
  assert.equal(model.answer(flow, '首页灰字示例').stage, 'invite');
});

test('fixed flow advances only after parent supplies each requested detail', () => {
  let flow = model.accept(model.createFlow('孩子写作业很困难，我不知道该怎么帮他。'));
  flow = model.answer(flow, '昨晚八点，他坐在书桌前一直没有动笔。');
  assert.equal(flow.stage, 'interaction');
  assert.equal(flow.answers.scene, '昨晚八点，他坐在书桌前一直没有动笔。');
  flow = model.answer(flow, '我提醒了两次，他说等一下，后来我提高了声音。');
  assert.equal(flow.stage, 'confirm');
  flow = model.confirm(flow, '对，就是这样。');
  assert.equal(flow.stage, 'expectation');
  flow = model.answer(flow, '我最担心他越来越依赖我催，也希望他能自己开始。');
  assert.equal(flow.stage, 'result');
  assert.deepEqual(flow.result.modules.map(item => item.title), [
    '这次发生了什么', '孩子行为背后的信息', '你们怎样互相影响', '换个角度看这件事'
  ]);
  assert.match(flow.result.modules[1].body, /可能还没找到做题的第一步/);
  assert.match(flow.result.modules[3].body, /能够表达困难、借助帮助继续/);
});

test('demo preset follows the approved 小宝 math-homework evidence chain', () => {
  const flow = model.presetFlow();
  assert.equal(flow.seed, '小宝写作业怎么总是这么拖拉？明明题也不多，每次都弄到快十点。我催了好几次也没用，真是越看越来气。');
  assert.match(flow.presets.scene, /七点半开始写数学/);
  assert.match(flow.presets.scene, /口算挺快/);
  assert.match(flow.presets.interaction, /不知道先算什么/);
  assert.match(flow.presets.expectation, /怕他养成拖拉的习惯/);
  assert.equal(flow.summary.title, '解读卡·亲子翻译');
  assert.deepEqual(flow.summary.items.map(item => item.title), ['本次片段','值得记住的理解','你的担心与期待','下次可以试试']);
});

test('demo composer starts from the approved seed', () => {
  assert.equal(model.exampleDraft('seed').text, model.PRESET.seed);
  assert.match(index, /fixedDraft\('seed'\)/);
  assert.match(index, /exampleDraft\('seed'\)\.text/);
});

test('every /latest/ visit boots into the approved preset conversation from the first sentence', () => {
  assert.match(index, /if\(!presetEntry\)return false;state\.loggedIn=true;/);
  assert.match(index, /state\.loggedIn=true;startFixedConversation\('homework',QZLFixedConversationModel\.PRESET\.seed\)/);
  assert.match(index, /if\(!bootstrapFixedDemo\(\)\)renderRoute\(normalizeRoute\(\)\)/);
});

test('demo stages advance by sending the prefilled composer draft, not an inline card', () => {
  assert.doesNotMatch(index, /data-action="fixed-demo-next">继续演示/);
  assert.match(index, /function fixedSyncDraft\(\)/);
  assert.match(index, /QZLFixedConversationModel\.composerDraft\(fixedFlow\(\)\)/);
  assert.match(index, /action==='fixed-later'/);
});

test('conversation text follows the approved reference dialogue', () => {
  assert.equal(model.REPLIES.accept, '好，帮我看看吧。');
  assert.equal(model.REPLIES.confirm, '对，就是这样。');
  assert.match(model.INVITE, /^催了好几次，还是拖到快十点/);
  assert.match(model.PROMPTS.confirm, /1\. \*\*场景\*\*/);
  assert.match(model.PROMPTS.confirm, /我这样梳理，符合当时的实际情况吗？\n\n如果有不准确或遗漏的地方，你可以进行补充。$/);
  assert.match(model.PROMPTS.expectation, /\*\*这件事最让你在意或担心的是什么？\*\*/);
  assert.match(model.RESULT_INTRO, /接下来，我将为你生成《解读卡》/);
});

test('progress bar appears after the parent opts in and tracks three steps', () => {
  let flow = model.createFlow(model.PRESET.seed);
  assert.equal(model.progress(flow), null);
  flow = model.accept(flow);
  assert.deepEqual(model.progress(flow).steps.map(s => s.state), ['current','todo','todo']);
  assert.equal(model.progress(flow).title, '一起看懂这次发生的事');
  flow = model.answer(flow, model.PRESET.scene);
  assert.deepEqual(model.progress(flow).steps.map(s => s.state), ['done','current','todo']);
  flow = model.answer(flow, model.PRESET.interaction);
  assert.equal(flow.stage, 'confirm');
  assert.deepEqual(model.progress(flow).steps.map(s => s.state), ['done','current','todo']);
  flow = model.confirm(flow);
  assert.deepEqual(model.progress(flow).steps.map(s => s.state), ['done','done','current']);
  flow = model.answer(flow, model.PRESET.expectation);
  assert.equal(model.progress(flow).title, '这次解读已整理好');
  assert.deepEqual(model.progress(flow).steps.map(s => s.state), ['done','done','done']);
  assert.deepEqual(model.STEPS, ['当时情况','双方回应','你的想法']);
});

test('confirm stage offers quick replies and leaves the composer empty', () => {
  let flow = model.accept(model.createFlow(model.PRESET.seed));
  flow = model.answer(flow, model.PRESET.scene);
  assert.equal(model.composerDraft(flow), model.PRESET.interaction);
  flow = model.answer(flow, model.PRESET.interaction);
  assert.equal(model.composerDraft(flow), '');
  assert.match(index, /data-action="fixed-confirm">对，就是这样<\/button><button class="fixed-secondary" data-action="fixed-supplement">补充修改/);
  assert.equal(model.composerDraft(model.confirm(flow)), model.PRESET.expectation);
});

test('example answer is a draft and never submitted by the model', () => {
  const flow = model.accept(model.createFlow('孩子写作业很困难，我不知道该怎么帮他。'));
  const draft = model.exampleDraft(flow.stage);
  assert.equal(draft.submitted, false);
  assert.ok(draft.text.length > 0);
  assert.equal(flow.answers.scene, '');
});

test('fixed result hands off to the existing full-screen card reveal effect', () => {
  assert.match(index, /function beginFixedCardReveal\(flow\)/);
  assert.match(index, /openCardRevealOverlayV90\('back',run\.id\)/);
  assert.match(index, /state\.chat=\{\.\.\.state\.chat,fixedFlow:null,node:'card-reveal-back'/);
});

test('result stays in the conversation until the parent claims the card', () => {
  let flow = model.accept(model.createFlow(model.PRESET.seed));
  flow = model.answer(flow, model.PRESET.scene);
  flow = model.answer(flow, model.PRESET.interaction);
  flow = model.confirm(flow);
  flow = model.answer(flow, model.PRESET.expectation);
  assert.equal(flow.stage, 'result');
  assert.equal(flow.claimed, false);
  const claimed = model.claim(flow);
  assert.equal(claimed.stage, 'reveal_back');
  assert.equal(claimed.claimed, true);
});

test('result UI exposes claim and does not render the card face inline', () => {
  assert.match(index, /data-action="fixed-claim">领取本次解读卡/);
  assert.match(index, /function fixedClaim\(\)/);
  assert.doesNotMatch(index, /if\(flow\.stage==='result'\)[\s\S]*fixed-card-scene \$\{flow\.confirmed/);
});

test('an in-progress fixed flow can pause and resume without changing its stage', () => {
  const flow = model.accept(model.createFlow('seed'));
  const paused = model.pause(flow);
  assert.equal(paused.paused, true);
  assert.equal(paused.stage, 'scene');
  const resumed = model.resume(paused);
  assert.equal(resumed.paused, false);
  assert.equal(resumed.stage, 'scene');
});

test('result stage shows the full reference report above the claim button', () => {
  const html = model.markdown(model.RESULT_MARKDOWN);
  assert.match(html, /<h1><strong>解读卡·亲子翻译<\/strong><\/h1><h3>① 这次发生了什么<\/h3>/);
  for (const h of ['② 孩子行为背后的信息','③ 你们怎样互相影响','④ 换个角度看这件事']) assert.ok(html.includes(h), h);
  assert.match(model.markdown('<b>'), /&lt;b&gt;/);
  assert.match(index, /class="fixed-report" data-result="true"[\s\S]*?data-action="fixed-claim">领取本次解读卡/);
});
