const test = require('node:test');
const assert = require('node:assert/strict');
const view = require('../assets/growth-milestone-view.js');
const item = {id:'m-1', date:'2026-09-09', title:'把提醒换成了询问', category:'try-change', description:'先问了孩子的打算。', meaning:'给彼此留一点空间。', subject:'parent', confirmedAt:'2026-09-09T01:00:00Z'};

test('personal empty timeline offers a deliberate creation action without invented events', () => {
  const html = view.render([], {source:'personal'});
  assert.match(html, /有些变化很小，却值得留下。可以从一次停下来、一次尝试，或一次重新开口开始。/);
  assert.match(html, /data-gr-action="milestone-new"/);
  assert.match(html, /记下一个时刻/);
  assert.doesNotMatch(html, /data-gr-action="milestone-detail"/);
});
test('timeline preserves model order and only displays confirmed items', () => {
  const html = view.render([item, {...item,id:'m-2',title:'另一件事'}, {...item,id:'draft',title:'未确认',confirmedAt:null}]);
  assert.ok(html.indexOf('m-1') < html.indexOf('m-2'));
  assert.doesNotMatch(html,/未确认|data-id="draft"/);
  assert.match(html,/尝试改变/);
  assert.match(html,/由你记录/);
});
test('example timeline identifies its isolation and toggle target', () => {
  const html = view.render([item],{source:'example',undoAvailable:true});
  assert.match(html,/示例里程碑 · 非你的真实记录/);
  assert.match(html,/data-gr-action="source" data-value="personal"/);
  assert.match(html,/data-gr-action="milestone-undo"/);
});
test('editor fields have labels, required data, limits and explicit confirmation', () => {
  const html = view.renderEditor(item,{today:'2026-09-09'});
  for(const id of ['gmTitle','gmDate','gmCategory','gmDescription','gmMeaning','gmSubject']) {
    assert.match(html,new RegExp(`for="${id}"`));
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/type="date"[^>]*max="2026-09-09"/);
  for(const limit of [80,1200,800]) assert.match(html,new RegExp(`maxlength="${limit}"`));
  assert.match(html,/data-gr-action="milestone-save"/);
  assert.match(html,/确认留下/);
  assert.match(html,/确认后才会进入你的里程碑/);
});
test('member selector uses actual member ids with current selection', () => {
  const html=view.renderEditor({...item,memberId:'child-1'},{editing:true,members:[{id:'self',label:'我',subject:'parent'},{id:'child-1',label:'小麦',subject:'child'}]});
  assert.match(html,/for="gmMember"/);
  assert.match(html,/value="child-1" selected/);
  assert.doesNotMatch(html,/id="gmSubject"/);
  assert.match(html,/保存修改/);
});
test('detail presents content, member, provenance and available actions', () => {
  const html=view.renderDetail({...item,subject:'child',source:{id:'r-1',kind:'conversation',title:'那天的聊天',excerpt:'孩子愿意告诉我了。'}},{memberLabel:'小麦'});
  for(const text of ['发生了什么','为什么想留下','给彼此留一点空间。','根据你的记录','小麦','孩子愿意告诉我了。']) assert.ok(html.includes(text));
  for(const action of ['milestone-source','milestone-edit','milestone-remove']) assert.ok(html.includes(`data-gr-action="${action}"`));
});
test('changed or deleted source never renders a stale excerpt', () => {
  for(const flag of ['sourceChanged','sourceDeleted']) {
    const input={...item,[flag]:true,source:{id:'r-1',title:'旧标题',excerpt:'旧来源私密内容'}};
    for(const html of [view.renderDetail(input),view.renderEditor(input)]) {
      assert.doesNotMatch(html,/旧来源私密内容/);
      assert.match(html,flag==='sourceChanged' ? /来源已更新/ : /来源已删除/);
    }
    if(flag==='sourceDeleted') assert.doesNotMatch(view.renderDetail(input),/data-gr-action="milestone-source"/);
  }
});
test('period summary has no phantom events and at most two confirmed cards', () => {
  const empty=view.renderSummary([{...item,confirmedAt:null}]);
  assert.match(empty,/gm-summary/);
  assert.match(empty,/本期还没有确认的里程碑/);
  assert.match(empty,/data-gr-action="milestone-section"/);
  const html=view.renderSummary([item,{...item,id:'m-2'},{...item,id:'m-3'}]);
  assert.equal((html.match(/data-gr-action="milestone-detail"/g)||[]).length,2);
  assert.doesNotMatch(html,/data-id="m-3"/);
});
test('all user content and ids are escaped in timeline, editor, detail and summary', () => {
  const bad='<img src=x onerror="alert(1)">';
  const input={...item,id:bad,title:bad,description:bad,meaning:bad,date:bad,source:{id:bad,title:bad,excerpt:bad}};
  const ui={today:bad,memberLabel:bad,members:[{id:bad,label:bad}]};
  for(const html of [view.render([input],ui),view.renderEditor(input,ui),view.renderDetail(input,ui),view.renderSummary([input])]) {
    assert.doesNotMatch(html,/<img|<script/);
    assert.match(html,/&lt;img/);
    assert.doesNotMatch(html,/="<img/);
  }
});
test('changed source can be explicitly acknowledged after reviewing',()=>{
  assert.match(view.renderDetail({...item,sourceChanged:true,source:{id:'r'}}),/data-gr-action="milestone-reviewed" data-id="m-1"/);
  assert.doesNotMatch(view.renderDetail({...item,sourceChanged:true,sourceDeleted:true,source:{id:'r'}}),/data-gr-action="milestone-reviewed"/);
});
test('saved source preview is explicitly a confirmation-time snapshot', () => {
  const html = view.renderDetail({id:'m',date:'2026-08-25',title:'时刻',confirmedAt:'2026-08-25T00:00:00Z',source:{title:'旧标题',excerpt:'确认时文字'}}, {}, {});
  assert.match(html, /确认时的来源摘录/);
});
