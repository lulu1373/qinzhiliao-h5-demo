const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../assets/fixed-conversation-model.js');

test('fixed flow starts with an open question and does not invent scene facts', () => {
  const flow = model.createFlow('孩子写作业很困难，我不知道该怎么帮他。');
  assert.equal(flow.stage, 'scene');
  assert.equal(flow.answers.scene, '');
  assert.match(flow.prompt, /最近一次|具体/);
  assert.doesNotMatch(flow.prompt, /没有开始|顶嘴|发火|作业太难/);
});

test('fixed flow advances only after parent supplies each requested detail', () => {
  let flow = model.createFlow('孩子写作业很困难，我不知道该怎么帮他。');
  flow = model.answer(flow, '昨晚八点，他坐在书桌前一直没有动笔。');
  assert.equal(flow.stage, 'interaction');
  assert.equal(flow.answers.scene, '昨晚八点，他坐在书桌前一直没有动笔。');
  flow = model.answer(flow, '我提醒了两次，他说等一下，后来我提高了声音。');
  assert.equal(flow.stage, 'expectation');
  flow = model.answer(flow, '我最担心他越来越依赖我催，也希望他能自己开始。');
  assert.equal(flow.stage, 'result');
  assert.deepEqual(flow.result.modules.map(item => item.title), [
    '这次发生了什么', '孩子行为背后的信息', '你们怎样互相影响', '换个角度看这件事'
  ]);
});

test('example answer is a draft and never submitted by the model', () => {
  const flow = model.createFlow('孩子写作业很困难，我不知道该怎么帮他。');
  const draft = model.exampleDraft(flow.stage);
  assert.equal(draft.submitted, false);
  assert.ok(draft.text.length > 0);
  assert.equal(flow.answers.scene, '');
});
