/* Calendar-bound summaries. Example observations never enter personal reports. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QZLGrowthModel = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MODES = ['day', 'week', 'month'];
  const DAY = 86400000;
  const EXAMPLE_ANCHOR = '2026-08-26';
  const LEGACY_IDS = ['a17', 'a23', 'a26'];
  const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const iso = date => date.toISOString().slice(0, 10);
  function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError('Invalid date');
    const date = new Date(value + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || iso(date) !== value) throw new TypeError('Invalid date');
    return date;
  }
  function dateOf(value) {
    if (typeof value !== 'string') return '';
    const date = value.slice(0, 10);
    try { parseDate(date); return date; } catch (_) { return ''; }
  }
  function checkMode(mode) {
    if (!MODES.includes(mode)) throw new TypeError('Invalid mode');
  }
  function shift(mode, anchor, delta) {
    checkMode(mode);
    if (!Number.isInteger(delta)) throw new TypeError('Invalid delta');
    const date = parseDate(anchor);
    if (mode !== 'month') return iso(new Date(date.getTime() + delta * DAY * (mode === 'week' ? 7 : 1)));
    const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
    const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    return iso(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(date.getUTCDate(), last))));
  }
  function period(mode, anchor) {
    checkMode(mode);
    const date = parseDate(anchor);
    const start = mode === 'week' ? shift('day', anchor, -((date.getUTCDay() + 6) % 7)) : mode === 'month' ? anchor.slice(0, 7) + '-01' : anchor;
    const end = mode === 'week' ? shift('day', start, 6) : mode === 'month' ? shift('day', shift('month', start, 1), -1) : anchor;
    const days = Array.from({length: (parseDate(end) - parseDate(start)) / DAY + 1}, (_, i) => {
      const day = shift('day', start, i);
      return {date: day, label: String(Number(day.slice(8))), weekday: WEEKDAYS[parseDate(day).getUTCDay()]};
    });
    const fullLabel = (value, year = true) => `${year ? value.slice(0,4) + '年' : ''}${Number(value.slice(5,7))}月${Number(value.slice(8))}日`;
    const label = mode === 'month' ? `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月` : mode === 'day' ? fullLabel(anchor) : `${fullLabel(start)}—${fullLabel(end,start.slice(0,4) !== end.slice(0,4))}`;
    return {mode, start, end, label, previous: shift(mode, start, -1), next: shift(mode, start, 1), days};
  }
  const EXAMPLE_RECORDS = [
    {id:'ex-r17',date:'2026-08-17',conversationId:'ex-c17',title:'睡前，先听孩子说完',summary:'孩子说学校的事时，我忍住了马上给建议，先听他把话说完。',parentObservation:'把“马上解决”换成了“先听完”。',childObservation:'这次孩子多讲了一件学校里的小事。',methodId:'listen'},
    {id:'ex-r20',date:'2026-08-20',conversationId:'ex-c20',title:'提醒之后，也给彼此留一点空隙',summary:'我还是忍不住催了两遍，后来停下来，问他是不是卡在某一步。',parentObservation:'催促后发现自己着急，重新问了一个具体问题。',methodId:'pause'},
    {id:'ex-r23',date:'2026-08-23',conversationId:'ex-c23',title:'手机约定，试过但还没有变化',summary:'先问孩子为什么不想停，孩子仍不愿放下手机。这次尝试没有立刻让事情变顺。',parentObservation:'记录了“没有变化”，没有把一次结果当成失败。',methodId:'listen'},
    {id:'ex-r24',date:'2026-08-24',conversationId:'ex-c24',title:'一次争执后的重新开口',summary:'我说了刚才声音太大，也问孩子愿不愿意重新说一次。孩子点了点头。',parentObservation:'争执后，尝试由自己先重新开口。',childObservation:'这一次，孩子用点头回应了重新谈谈的邀请。',methodId:'repair'},
    {id:'ex-r25',date:'2026-08-25',conversationId:'ex-c25',title:'先听到担心，再谈任务',summary:'孩子说怕做错。我先复述他的担心，再问他愿意从哪一题开始。',parentObservation:'先复述担心，再讨论下一步。',childObservation:'孩子说出了“怕做错”，这是一条具体线索。',methodId:'listen'},
    {id:'ex-r26',date:'2026-08-26',conversationId:'ex-c26',title:'写作业时，先减少一次催促',summary:'写作业又卡住了。我发现自己想连续催促，决定先问清楚他卡在哪里；这个尝试还没有反馈。',parentObservation:'注意到自己想催促，准备先问一个具体问题。',methodId:'pause'}
  ].map(record => Object.freeze({...record, kind:'conversation', provenance:'example'}));
  const EXAMPLE_ACTIONS = [
    {id:'a17',date:'2026-08-17',title:'睡前先听孩子说完，再回应',source:'孩子最近不愿意和我说话',why:'先听完，让孩子有机会把想说的话讲清楚。',script:'你先说完，我暂时不急着给建议。',observe:'孩子是否愿意多说一点。',status:'done',result:'better',resultText:'顺一点'},
    {id:'a23',date:'2026-08-23',title:'手机问题先不急着讲道理',source:'孩子一直玩手机',why:'先听听不愿意停下的原因，再讨论约定。',script:'我想先听听你为什么还不想停。',observe:'是否能谈到一个具体约定。',status:'done',result:'same',resultText:'没变化'},
    {id:'a26',date:'2026-08-26',title:'写作业时先减少一次催促',source:'写作业又吵起来了',why:'先问清楚具体卡点，给双方留一点回应的余地。',script:'你是还没准备好，还是不知道先从哪里开始？',observe:'孩子是否愿意告诉你真正卡在哪里。',status:'pending',result:null,resultText:'待尝试'}
  ].map(action => Object.freeze({...action, provenance:'example'}));
  const METHODS = {
    listen:{id:'listen',title:'先听完，再回应',summary:'先确认自己听到的意思，再决定要不要给建议。',principle:'复述是一次核对：让对方有机会补充或纠正你的理解。它不保证对方马上配合。',before:'别想那么多，先去做。',after:'你担心会做错，是这样吗？',steps:['把建议先放一放，听对方把话说完。','用一句话复述你听到的感受或难处。','问问理解是否准确，再一起商量下一步。'],phrase:'我听到你有点担心，我理解得对吗？',status:'可以继续观察'},
    pause:{id:'pause',title:'少催一次，先问卡在哪里',summary:'把下一句催促换成一个具体问题。',principle:'孩子停下来可能有不同原因。先核对卡点，能帮助下一步更具体；这次记录尚不能说明方法已经有效。',before:'快一点，我说了多少遍了！',after:'你是还没准备好，还是不知道从哪里开始？',steps:['发现自己又想催促时，先停一个呼吸。','只问一个具体问题，留时间听答案。','一起选一个很小的起点，稍后记录发生了什么。'],phrase:'我们先不急着做完，先看看卡在哪一步。',status:'待尝试后反馈'},
    repair:{id:'repair',title:'争执后，给一次重新开口的机会',summary:'说清自己的行为，再邀请对方重新谈谈。',principle:'承认自己刚才的行为，能让修复从一个具体动作开始。对方暂时不想说，也可以等一等。',before:'还不是因为你不听话！',after:'刚才我声音大了。你愿意的话，我们重新说一次。',steps:['用一句话承认刚才自己的行为。','不在道歉后加上责怪。','邀请重新交谈，允许对方晚一点回应。'],phrase:'刚才我的声音太大了。等你准备好，我们再聊。',status:'记录过一次尝试'}
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const personal = item => item && item.provenance !== 'example' && (!LEGACY_IDS.includes(item.id) || item.provenance === 'personal');
  function collect(input, key, example, source, range, dateKey) {
    if (input[key] !== undefined && !Array.isArray(input[key])) throw new TypeError(`Invalid ${key}`);
    const supplied = source === 'example' ? example : (input[key] || []).filter(personal);
    const valid = supplied.filter(item => item && typeof item === 'object');
    const entryDate = item => key === 'cards' ? savedDate(item) : item[dateKey];
    return {items: valid.filter(item => inPeriod(entryDate(item),range) || (key === 'actions' && hasFeedback(item) && inPeriod(feedbackDate(item),range))).map(clone), undated: valid.filter(item => !dateOf(entryDate(item))).length};
  }
  function makeSummary(mode, stats, hasData, example, records) {
    if (!hasData) return {title:'这段时间，先留一个空白',body:example?'这个周期还没有示例记录。可以回到示例日期，看看一份报告如何展开。':'这段时间还没有可归入报告的记录。一次对话或一次行动反馈，都可以成为回顾的起点。'};
    if (!example) return {title:'从留下的记录开始回顾',body:`本期记录了 ${stats.conversations} 次对话、新增 ${stats.actions} 个行动，并留下 ${stats.feedbacks} 条行动反馈。这些记录可以帮你回看发生了什么，还不足以据此判断能力或关系的变化。`};
    if (!records.length) return {title:'这次补充，留下了一条新线索',body:`本期有 ${stats.feedbacks} 条行动结果反馈，没有新增对话记录。可以从行动记录里查看具体经过。`};
    if (mode === 'day') return {title:records[0].title,body:records[0].summary};
    if (mode === 'week') return {title:'这一周，从具体的回应看起',body:`本周留下了 ${records.length} 条对话记录。最近一次是“${records[records.length-1].title}”。${records[records.length-1].parentObservation}这些是当时的片段，还需要更多反馈来判断变化。`};
    return {title:'把反复遇到的难处，看得更具体一点',body:'在睡前聊天、手机和作业这些不同场景里，“先听完，再回应”多次出现。每一次尝试后的实际感受，都可以在行动反馈里继续补充。这个月值得留下的是具体尝试和真实反馈，而不是一条必须向上的曲线。'};
  }
  function observations(records, source) {
    if (source === 'personal') return {parent:records.filter(r=>r.summary || r.title).slice(-3).map(r=>({text:r.summary || r.title,sources:[r.id]})),child:[]};
    const side = key => records.filter(r=>r[key]).slice(-3).map(r=>({text:r[key],sources:[r.id]}));
    return {parent:side('parentObservation'),child:side('childObservation')};
  }
  function exampleDetails(records, mode) {
    const sources = records.map(r=>r.id);
    const methods = [...new Set(records.map(r=>r.methodId))].filter(id=>METHODS[id]).map(id=>({...clone(METHODS[id]),sources:records.filter(r=>r.methodId===id).map(r=>r.id)}));
    const practice = records.length ? {title:'正在练习：先理解，再回应',before:METHODS[records[records.length-1].methodId].before,after:records[records.length-1].parentObservation,observe:'接下来留意：问过之后发生了什么？没变化时，也把当时的难处记下来。',sources} : null;
    const topics = mode === 'month' && records.length > 1 ? [{id:'listen-pattern',title:'“先听完”出现在不同场景',body:'睡前聊天、手机约定和作业都有记录。结果并不一致，可以继续观察哪些时机更容易让彼此说下去。',sources}] : [];
    return {methods,practice,topics};
  }
  function latestUpdate(items, correction) {
    const values = items.flatMap(item=>[item.updatedAt,item.feedbackAt,item.savedAt,item.date]).concat(correction && correction.updatedAt).filter(value=>dateOf(value));
    return values.sort((a,b)=>Date.parse(a)-Date.parse(b)).at(-1) || '';
  }
  const hasFeedback = action => ['better','same','worse'].includes(action.result);
  const feedbackDate = action => dateOf(action.feedbackDate) || action.feedbackAt || action.date;
  const savedDate = card => dateOf(card.savedDate) || card.savedAt;
  function inPeriod(value, range) {
    const date = dateOf(value);
    return Boolean(date && date >= range.start && date <= range.end);
  }
  function exampleActions(feedback) {
    return EXAMPLE_ACTIONS.map(action => {
      const patch = feedback && feedback[action.id];
      if (!patch || !hasFeedback(patch)) return {...action};
      return {...action,status:'done',result:patch.result,resultText:{better:'顺一点',same:'没变化',worse:'更难了'}[patch.result],...(dateOf(patch.feedbackAt) ? {feedbackAt:patch.feedbackAt} : {}),...(dateOf(patch.feedbackDate) ? {feedbackDate:patch.feedbackDate} : {})};
    });
  }
  function build(input) {
    const {mode,anchor,source='personal',now=iso(new Date()),corrections={}} = input;
    if (!['example','personal'].includes(source)) throw new TypeError('Invalid source');
    parseDate(now);
    const range = period(mode,anchor);
    const actionSet = collect(input,'actions',exampleActions(input.exampleFeedback),source,range,'date');
    const recordSet = collect(input,'records',EXAMPLE_RECORDS,source,range,'date');
    const cardSet = collect(input,'cards',[],source,range,'savedAt');
    const actions = actionSet.items, records = recordSet.items, cards = cardSet.items;
    const items = [...records,...actions,...cards];
    const eventDates = [...records.map(r=>r.date),...cards.map(savedDate),...actions.flatMap(a=>[a.date,hasFeedback(a) ? feedbackDate(a) : ''])].filter(value=>inPeriod(value,range)).map(dateOf);
    const stats = {conversations:new Set(records.filter(r=>r.kind === 'conversation' || r.conversationId).map(r=>r.conversationId || r.id)).size,actions:actions.filter(a=>inPeriod(a.date,range)).length,feedbacks:actions.filter(a=>hasFeedback(a) && inPeriod(feedbackDate(a),range)).length,recordDays:new Set(eventDates).size};
    const hasData = items.length > 0, isExample = source === 'example';
    const correction = corrections && corrections[`${source}:${mode}:${range.start}`];
    const summary = correction && typeof correction.text === 'string' && correction.text.trim() ? {title:'你校正后的回顾',body:correction.text.trim(),corrected:true} : makeSummary(mode,stats,hasData,isExample,records);
    const details = isExample ? exampleDetails(records,mode) : {methods:[],practice:null,topics:[]};
    const timeline = records.flatMap(record=>[{date:record.date,title:record.title || '一次记录',body:record.summary || '',subject:'parent',sourceId:record.id},...(isExample && record.childObservation ? [{date:record.date,title:'这一次，孩子的回应',body:record.childObservation,subject:'child',sourceId:record.id}] : [])]).sort((a,b)=>a.date.localeCompare(b.date));
    return {period:range,source,isExample,ongoing:now>=range.start && now<=range.end,summary,stats,highlights:observations(records,source),...details,actions,records,timeline,emotions:[],cards,updatedAt:latestUpdate(items,correction),hasData,insufficient:records.length<3,undatedCount:actionSet.undated+recordSet.undated+cardSet.undated};
  }
  return {period,shift,build,EXAMPLE_ANCHOR,EXAMPLE_ACTIONS:Object.freeze(EXAMPLE_ACTIONS),EXAMPLE_RECORDS:Object.freeze(EXAMPLE_RECORDS)};
}));
