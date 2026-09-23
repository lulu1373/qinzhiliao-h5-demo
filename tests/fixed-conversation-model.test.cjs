const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../assets/fixed-conversation-model.js');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const P = model.CONTENT.parents, A = model.CONTENT.assistant;
function run(flow, next, log) { log.push(...next.out); const {out, ...rest} = next; return rest; }

test('opening is the parent seed plus the reference invitation, with no progress bar yet', () => {
  const flow = model.createFlow();
  assert.equal(flow.stage, 'invite');
  assert.deepEqual(flow.out.map(m => m.text), [P[0], A[0]]);
  assert.equal(P[0], '小宝写作业怎么总是这么拖拉？明明题也不多，每次都弄到快十点。我催了好几次也没用，真是越看越来气。');
  assert.equal(model.progress(flow), null);
});

test('happy path reproduces the reference dialogue turn by turn', () => {
  const log = [];
  let flow = run(null, model.createFlow(), log);
  flow = run(flow, model.accept(flow), log);
  assert.equal(log.at(-2).text, '好，帮我看看吧。');
  assert.deepEqual(model.progress(flow).steps.map(s => s.state), ['current', 'todo', 'todo']);
  flow = run(flow, model.answer(flow, model.expected(flow)), log);
  flow = run(flow, model.answer(flow, model.expected(flow)), log);
  assert.equal(flow.stage, 'confirm');
  assert.match(log.at(-1).text, /我这样梳理，符合当时的实际情况吗？\n\n如果有不准确或遗漏的地方，你可以进行补充。$/);
  assert.equal(model.expected(flow), '', 'confirm stage has no example answer');
  flow = run(flow, model.confirm(flow), log);
  assert.equal(log.at(-2).text, '对，就是这样。');
  assert.deepEqual(model.progress(flow).steps.map(s => s.state), ['done', 'done', 'current']);
  flow = run(flow, model.answer(flow, model.expected(flow)), log);
  assert.equal(flow.stage, 'result');
  assert.deepEqual(log.map(m => m.role === 'user' ? m.text : null).filter(Boolean), P);
  assert.deepEqual(log.filter(m => m.role === 'ai').map(m => m.text), A);
  assert.equal(log.at(-1).result.markdown, model.CONTENT.result);
  assert.equal(model.progress(flow).title, '这次解读已整理好');
  assert.equal(model.claim(flow).stage, 'reveal_back');
});

test('decline branch and free talk follow the reference copy', () => {
  const log = [];
  let flow = run(null, model.createFlow(), log);
  flow = run(flow, model.decline(flow), log);
  assert.equal(flow.stage, 'free');
  assert.equal(log.at(-2).text, '我现在不想分析，就是很烦。');
  assert.match(log.at(-1).text, /^那咱们先不分析/);
  flow = run(flow, model.answer(flow, '今天真的很累'), log);
  assert.equal(flow.stage, 'free');
  assert.match(log.at(-1).text, /现在帮我看看/);
  flow = run(flow, model.answer(flow, '现在帮我看看'), log);
  assert.equal(flow.stage, 'scene');
});

test('hints and example drafts match each evidence stage', () => {
  let flow = model.accept(model.createFlow());
  assert.equal(model.expected(flow), P[2]);
  assert.deepEqual(model.hints(flow).questions, model.CONTENT.hints[0]);
  assert.equal(model.hints(model.pause(flow)), null);
});

test('early view gives a partial card and can resume where it left off', () => {
  let flow = model.answer(model.accept(model.createFlow()), P[2]);
  const early = model.early(flow);
  assert.equal(early.stage, 'result');
  assert.equal(early.result.partial, true);
  assert.equal(model.progress(early).title, '目前的理解 · 部分信息待补充');
  assert.equal(model.progress(early).current, 2);
  assert.equal(model.continuePartial(early).stage, 'interaction');
});

test('markdown renders headings, bold and nested list paragraphs', () => {
  const html = model.markdown(model.CONTENT.result);
  assert.match(html, /^<h1><strong>解读卡·亲子翻译<\/strong><\/h1><h3>① 这次发生了什么<\/h3><ul><li><p><strong>事件场景<\/strong>/);
  assert.match(model.markdown('<b>'), /&lt;b&gt;/);
});

test('controller renders reference turns, sticky stage bar and quick actions', () => {
  assert.match(index, /class="fx-ai-name"><img src="\$\{ASSETS\.logo\}" alt="">小亲/);
  assert.match(index, /data-action="fx-early">先看目前理解/);
  assert.match(index, /fixedButton\('对，就是这样','fx-confirm','primary'\)\}\$\{fixedButton\('补充或修改','fx-correct'\)\}/);
  assert.match(index, /用示例回答/);
  assert.match(index, /action\.startsWith\('fx-'\)/);
});

test('every /latest/ visit boots into the preset conversation from the first sentence', () => {
  assert.match(index, /if\(!presetEntry\)return false;state\.loggedIn=true;startFixedConversation\(\);/);
  assert.match(index, /if\(!bootstrapFixedDemo\(\)\)renderRoute\(normalizeRoute\(\)\)/);
});

test('claiming hands off to the existing full-screen card reveal', () => {
  assert.match(index, /openCardRevealOverlayV90\('back',run\.id\)/);
  assert.match(index, /state\.chat=\{\.\.\.state\.chat,fixedFlow:null,node:'card-reveal-back'/);
});
