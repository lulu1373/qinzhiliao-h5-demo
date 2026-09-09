(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QZLGrowthView = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MODES = {day:'日',week:'周',month:'月'};
  const PERIODS = {day:'今天',week:'本周',month:'本月'};
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function button(action, label, data, className, extra) {
    const attrs = Object.entries(data || {}).map(([key,value]) => ` data-${key}="${esc(value)}"`).join('');
    return `<button type="button" class="${esc(className || 'gr-link')}" data-gr-action="${esc(action)}"${attrs}${extra || ''}>${label}</button>`;
  }
  function icon(name, deps) { return `<span class="gr-icon" aria-hidden="true">${(deps.icons || {})[name] || ''}</span>`; }
  function section(title, body, classes) { return `<section class="gr-section ${classes || ''}"><h2>${esc(title)}</h2>${body}</section>`; }
  function controls(report, ui) {
    const mode = ui.mode || report.mode || 'week', period = report.period || {};
    const segments = Object.entries(MODES).map(([value,label]) => button('mode',label,{value},`gr-tab${mode === value ? ' is-active' : ''}`,` aria-pressed="${mode === value}"`)).join('');
    const days = mode === 'day' ? `<div class="gr-days" aria-label="选择日期">${weekDays(ui.anchor || period.start).map(day => button('date',`<small>${esc(day.weekday)}</small><strong>${esc(day.label)}</strong>`,{date:day.date},`gr-day${day.date === ui.anchor ? ' is-active' : ''}`,` aria-label="${esc(day.date)}" aria-pressed="${day.date === ui.anchor}"`)).join('')}</div>` : '';
    return `<div class="gr-controls"><div class="gr-tabs" aria-label="报告周期">${segments}</div><div class="gr-period">${button('shift','‹',{delta:-1},'gr-arrow',' aria-label="上一个周期"')}<span>${esc(period.label)}</span>${button('shift','›',{delta:1},'gr-arrow',' aria-label="下一个周期"')}</div>${days}</div>`;
  }
  function sourceBar(report,ui) {
    const example = report.isExample || ui.source === 'example';
    return `<div class="gr-source-bar"><span class="gr-source-label${example ? ' is-example' : ''}">${example ? '示例报告 · 非你的真实记录' : '我的记录'}</span>${button('source', example ? '查看我的记录' : '看看示例',{value:example ? 'personal':'example'})}</div>`;
  }
  function emptyState(report,deps) {
    return `<section class="gr-empty">${icon('growth',deps)}<h2>这段时间还没有记录</h2><p>每一次聊聊、每一条行动反馈，<br>都可以成为回头看见自己的线索。</p>${button('source','查看完整示例',{value:'example'},'gr-primary')}<p class="gr-meta">示例仅展示报告样式，不计入你的成长记录。</p>${report.undatedCount ? `<p class="gr-meta">还有 ${esc(report.undatedCount)} 条旧记录缺少日期，暂未纳入本期。</p>` : ''}</section>`;
  }
  function render(report, ui, deps) {
    report = report || {}; ui = ui || {}; deps = deps || {};
    const empty = report.hasData === false || report.empty === true || (report.hasData == null && !(report.records || []).length && !(report.actions || []).length);
    return `<div class="gr-report">${controls(report,ui)}${sourceBar(report,ui)}${empty ? milestoneSummary(report,ui,deps) + emptyState(report,deps) : populatedReport(report,ui,deps)}</div>`;
  }
  function milestoneSummary(report,ui,deps) {
    return ['week','month'].includes(ui.mode || report.period?.mode) && deps.renderMilestones ? deps.renderMilestones(report) : '';
  }
  function recordRows(records,deps) {
    return records.map(record => `<article class="gr-record"><div class="gr-record-heading">${icon(record.kind === 'action' ? 'action' : 'chat',deps)}<div><span class="gr-meta">${esc(record.date || '日期待补充')}</span><h3>${esc(record.title || '一条记录')}</h3></div></div><p>${esc(record.excerpt || record.summary || record.text || record.body || '')}</p></article>`).join('');
  }
  function renderSources(records,deps) {
    return `<div class="gr-page gr-detail"><p class="gr-meta">以下是这段总结引用的记录，供你核对。</p>${(records || []).length ? recordRows(records,deps || {}) : '<p>暂时找不到这条来源记录。</p>'}</div>`;
  }
  function weekDays(anchor) {
    const selected = new Date(String(anchor).slice(0,10)+'T00:00:00Z');
    if (!Number.isFinite(selected.getTime())) return [];
    const offset = (selected.getUTCDay()+6)%7;
    return Array.from({length:7},(_,index)=> {
      const date=new Date(selected.getTime()+(index-offset)*86400000);
      return {date:date.toISOString().slice(0,10),label:String(date.getUTCDate()),weekday:['周一','周二','周三','周四','周五','周六','周日'][index]};
    });
  }
  function actionDates(action,period) {
    const validDate = value => {
      const text = typeof value === 'string' ? value.slice(0,10) : '';
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(text+'T00:00:00Z') : null;
      return parsed && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === text ? text : '';
    };
    const created = validDate(action.date);
    const feedback = ['better','same','worse'].includes(action.result) ? validDate(action.feedbackDate) || validDate(action.feedbackAt) : '';
    const inPeriod = date => date && date >= period.start && date <= period.end;
    return {created,feedback:inPeriod(feedback) ? feedback : '',events:[...new Set([created,feedback].filter(inPeriod))]};
  }
  function actionDateLabel(action,period) {
    const dates=actionDates(action,period);
    return `<div class="gr-record-date"><span>创建于 ${esc(dates.created || '日期待补充')}</span>${dates.feedback ? `<span>本期反馈：${esc(dates.feedback)}</span>` : ''}</div>`;
  }
  function recordCalendar(report,ui) {
    const period=report.period || {}, days=period.days || [], actions=report.actions || [];
    const first = days[0] && new Date(days[0].date+'T00:00:00Z'), offset=first ? (first.getUTCDay()+6)%7 : 0;
    const labels=['一','二','三','四','五','六','日'].map(label=>`<span class="gr-calendar-weekday">${label}</span>`).join('');
    const blanks=Array.from({length:offset},()=>'<span class="gr-calendar-blank"></span>').join('');
    const cells=days.map(day=>{
      const count=actions.filter(action=>actionDates(action,period).events.includes(day.date)).length;
      return button('record-date',`<span>${esc(day.label)}</span><i class="gr-calendar-dot${count ? ' has-record' : ''}" aria-hidden="true"></i>`,{date:day.date},`gr-calendar-day${ui.selectedDate===day.date ? ' is-active' : ''}`,` aria-label="${esc(day.date)}，${count} 个行动" aria-pressed="${ui.selectedDate===day.date}"`);
    }).join('');
    return `<div class="gr-panel gr-calendar"><div class="gr-calendar-grid">${labels}${blanks}${cells}</div><p class="gr-meta gr-calendar-legend"><i class="gr-calendar-dot has-record"></i> 当天创建行动或留下反馈</p></div>`;
  }
  function renderRecords(report,ui,deps) {
    report = report || {}; ui = ui || {}; deps = deps || {};
    const calendar=ui.recordView === 'calendar', period=report.period || {};
    const toggle = ['calendar','list'].map(value => button('record-view',value === 'calendar' ? '日历' : '列表',{value},`gr-tab${(ui.recordView || 'calendar') === value ? ' is-active' : ''}`,` aria-pressed="${(ui.recordView || 'calendar') === value}"`)).join('');
    const month=`<div class="gr-period">${button('shift','‹',{delta:-1},'gr-arrow',' aria-label="上个月"')}<span>${esc(period.label)}</span>${button('shift','›',{delta:1},'gr-arrow',' aria-label="下个月"')}</div>`;
    const actions=(report.actions || []).filter(action=>!calendar || !ui.selectedDate || actionDates(action,period).events.includes(ui.selectedDate));
    const list=actions.map(action=>`${actionDateLabel(action,period)}${actionRow(action,deps)}`).join('');
    const heading=calendar && ui.selectedDate ? ui.selectedDate+' 的行动' : '本月全部行动';
    return `<div class="gr-records">${button('report','‹ 返回成长总结',{},'gr-back')}${sourceBar(report,ui)}<div class="gr-tabs gr-record-tabs">${toggle}</div>${month}${calendar ? recordCalendar(report,ui) : ''}${section(heading,`<div class="gr-panel">${list || `<p class="gr-muted">${calendar && ui.selectedDate ? '这一天还没有行动' : '这个月还没有行动记录'}，暂时留白也没关系。</p>`}</div>`)}</div>`;
  }
  function sourceLink(sources) {
    return (sources || []).length ? button('source-detail','查看依据 <span aria-hidden="true">›</span>',{id:sources.join(',')},'gr-evidence') : '';
  }
  function summaryCard(report,ui,deps) {
    const summary = report.summary || {}, stats = report.stats || {};
    const mascot = deps.mascot ? `<img class="gr-mascot" src="${esc(deps.mascot)}" alt="小亲">` : icon('growth',deps);
    return `<section class="gr-summary"><div class="gr-summary-head">${mascot}<div><span class="gr-eyebrow">小亲的${MODES[ui.mode] || '周'}回顾</span>${report.ongoing ? '<span class="gr-badge">进行中</span>' : ''}</div></div><h2>${esc(summary.title)}</h2><p>${esc(summary.body)}</p><div class="gr-stats"><span><b>${esc(stats.conversations || 0)}</b> 次对话</span><span><b>${esc(stats.actions || 0)}</b> 个行动</span><span><b>${esc(stats.feedbacks || 0)}</b> 条反馈</span></div>${summary.corrected ? '<p class="gr-meta">已保留你的校正</p>' : ''}</section>`;
  }
  function daily(report,deps) {
    const records = report.records || [], methods = report.methods || [];
    const review = records.slice(-2).map(record => `<div class="gr-review-item"><span class="gr-eyebrow">沟通主题</span><h3>${esc(record.topic || record.title)}</h3><p class="gr-meta">${esc(record.concern ? '当时最困扰你的' : '你留下的记录')}</p><p>${esc(record.concern || record.excerpt || record.summary)}</p>${record.concern && (record.excerpt || record.summary) ? `<blockquote class="gr-excerpt">${esc(record.excerpt || record.summary)}</blockquote>` : ''}${sourceLink([record.id])}</div>`).join('');
    const methodCards = methods.map(method => `<article class="gr-method"><div class="gr-row"><h3>${esc(method.title)}</h3><span class="gr-badge">${esc(method.status || '了解过')}</span></div><p>${esc(method.summary)}</p>${button('method','查看方法与话术 <span aria-hidden="true">›</span>',{id:method.id},'gr-evidence')}</article>`).join('');
    return section('今日回顾',`<div class="gr-panel">${review || '<p class="gr-muted">今天还没有对话记录，先从行动记录回顾。</p>'}</div>`) + (methods.length ? section('今天了解的方法',methodCards) : '') + actionSection(report,'今天的尝试',deps);
  }
  function weekly(report,deps) {
    const highlights = report.highlights || {};
    const highlight = (subject,title) => `<article class="gr-panel gr-highlight gr-highlight-${subject}"><span class="gr-eyebrow">${esc(title)}</span>${subject === 'child' ? '<p class="gr-meta">根据你的记录，留下孩子当时的回应</p>' : ''}${(highlights[subject] || []).slice(-2).map(item => `<div class="gr-highlight-item"><p>${esc(item.text)}</p>${sourceLink(item.sources)}</div>`).join('') || `<p class="gr-muted">${subject === 'child' ? '还没有足够的孩子回应记录，先留一点观察的空间。' : '先从已有行动回看，更多具体片段可以慢慢补上。'}</p>`}</article>`;
    const practice = report.practice;
    const practicePanel = practice ? section(practice.title.startsWith('正在练习') ? practice.title : '正在练习：' + practice.title,`<div class="gr-panel gr-practice"><div><span class="gr-eyebrow">以前更容易这样</span><p>${esc(practice.before)}</p></div><div class="gr-new-response"><span class="gr-eyebrow">这周出现过的新回应</span><p>${esc(practice.after)}</p></div><div><span class="gr-eyebrow">还需要继续观察</span><p>${esc(practice.observe)}</p></div>${sourceLink(practice.sources)}</div>`) : '';
    return section('值得回看的片段',highlight('parent','你这边的尝试') + highlight('child','孩子这边的回应')) + practicePanel + actionSection(report,'练习与反馈',deps);
  }
  function monthly(report,ui,deps) {
    const emotions = section('情绪与相处',`<div class="gr-panel gr-emotion-empty">${icon('growth',deps)}<h3>情绪记录还不够</h3><p>先留下几次当时的感受，再一起看变化。没有记录的日子，我们留白。</p></div>`);
    const topics = (report.topics || []).map(topic => {
      const correction = (ui.corrections || {})[topic.id], value = typeof correction === 'string' ? correction : (correction || {}).value;
      const updated = typeof correction === 'object' && correction.text;
      return `<article class="gr-panel gr-topic"><div class="gr-row"><h3>${esc(topic.title)}</h3>${value === 'disagree' ? '<span class="gr-badge">待核验</span>' : ''}</div><p>${esc(updated || topic.body)}</p>${sourceLink(topic.sources)}<div class="gr-correction" aria-label="这段理解贴近吗？">${button('topic-correct','符合我的情况',{id:topic.id,value:'agree'},`gr-chip${value === 'agree' ? ' is-active' : ''}`,` aria-pressed="${value === 'agree'}"`)}${button('topic-correct','不太贴近',{id:topic.id,value:'disagree'},`gr-chip${value === 'disagree' ? ' is-active' : ''}`,` aria-pressed="${value === 'disagree'}"`)}</div>${updated ? '<p class="gr-meta">已保留你的补充，不会自动覆盖。</p>' : ''}</article>`;
    }).join('');
    const related = `<div class="gr-related">${button('route',icon('assessment',deps)+'<span>看看相关测评</span><span aria-hidden="true">›</span>',{route:'assessments'},'gr-related-link')}${button('route',icon('archive',deps)+'<span>回看家庭档案</span><span aria-hidden="true">›</span>',{route:'archive'},'gr-related-link')}</div>`;
    return emotions + (topics ? section('可以继续观察的课题',topics) : '') + section('成长时间线',timeline(report,ui)) + related;
  }
  function timeline(report,ui) {
    const subject = ui.subject || 'parent';
    const tabs = ['parent','child'].map(value=>button('subject',value === 'parent' ? '我' : '孩子',{value},`gr-chip${subject === value ? ' is-active' : ''}`,` aria-pressed="${subject === value}"`)).join('');
    const events = (report.timeline || []).filter(item=>item.subject === subject);
    return `<div class="gr-panel"><div class="gr-subject-tabs">${tabs}</div>${subject === 'child' ? '<p class="gr-meta">来自你的记录，不代表对孩子的直接观察。</p>' : ''}<div class="gr-timeline">${events.map(item=>`<article class="gr-timeline-item"><span class="gr-meta">${esc(item.date)}</span><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p>${sourceLink([item.sourceId])}</article>`).join('') || '<p class="gr-muted">这个周期还没有相关片段。</p>'}</div></div>`;
  }
  function actionSection(report,title,deps) {
    return section(title,`<div class="gr-panel">${(report.actions || []).slice(-3).map(action=>actionRow(action,deps)).join('') || '<p class="gr-muted">这段时间还没有行动记录。想尝试时，再选一件小事就好。</p>'}${button('records','查看行动记录 <span aria-hidden="true">›</span>',{},'gr-records-link')}</div>`);
  }
  function actionRow(action,deps) {
    const labels = {better:'顺一点',same:'没变化',worse:'更糟',pending:'待尝试'};
    const hasFeedback = !!action.result && action.result !== 'pending';
    const decision = action.decision === 'declined' ? '决定不做' : action.decision === 'not_tried' ? '还没有试' : '';
    return `<article class="gr-action"><div class="gr-row"><h3>${button('action',esc(action.title),{id:action.id},'gr-action-title')}</h3><span class="gr-status${hasFeedback ? ' is-recorded' : ''}">${esc(labels[action.result] || decision || (action.status === 'done' ? '待补反馈' : '待尝试'))}</span></div>${action.source ? `<p class="gr-meta">来自：${esc(action.source)}</p>` : ''}${action.feedbackNote ? `<p>${esc(action.feedbackNote)}</p>` : ''}<div class="gr-action-buttons">${button('feedback',hasFeedback ? '补充反馈' : decision ? '更新这次选择' : '试过了',{id:action.id},'gr-chip')}${!hasFeedback && !decision ? button('not-tried','还没试',{id:action.id},'gr-chip') : ''}${button('action','查看详情 <span aria-hidden="true">›</span>',{id:action.id},'gr-evidence')}</div></article>`;
  }
  function populatedReport(report,ui,deps) {
    const mode = ui.mode || (report.period || {}).mode || 'week';
    const content = mode === 'day' ? daily(report,deps) : mode === 'month' ? monthly(report,ui,deps) : weekly(report,deps);
    const reminder = `<aside class="gr-reminder">${icon('growth',deps)}<div><h3>小亲提醒</h3><p>先留意一次具体回应。顺一点、没变化，或暂时没试，都可以如实记下来。</p></div></aside>`;
    const note = `<div class="gr-report-notes">${report.updatedAt ? `<p class="gr-meta">记录更新于 ${esc(report.updatedAt.slice(0,10))} · 反馈补充后同步回顾</p>` : ''}${report.undatedCount ? `<p class="gr-meta">${esc(report.undatedCount)} 条旧记录缺少日期，未纳入本期统计。</p>` : ''}<p class="gr-meta">回顾来自留下的记录，不是对你或孩子的评分。</p></div>`;
    return summaryCard(report,{...ui,mode},deps) + milestoneSummary(report,{...ui,mode},deps) + content + reminder + button('recap',`和小亲复盘${PERIODS[mode]}`,{},'gr-primary gr-recap') + note;
  }
  function renderMethod(method,deps) {
    if (!method) return '<div class="gr-page gr-detail"><p>暂时找不到这个方法。</p></div>';
    return `<div class="gr-page gr-detail"><span class="gr-eyebrow">${esc(method.status || '了解过')}</span><h2>${esc(method.title)}</h2><p>${esc(method.summary)}</p>${section('核心原理',`<p>${esc(method.principle)}</p>`)}<div class="gr-practice"><div><span class="gr-eyebrow">原来的回应</span><p>${esc(method.before)}</p></div><div class="gr-new-response"><span class="gr-eyebrow">可以试的新回应</span><p>${esc(method.after)}</p></div></div>${section('具体步骤',`<ol class="gr-steps">${(method.steps || []).map(step=>`<li>${esc(step)}</li>`).join('')}</ol>`)}${section('可以试的一句话',`<blockquote class="gr-phrase">${esc(method.phrase)}</blockquote>`)}${sourceLink(method.sources)}</div>`;
  }
  return {render,renderRecords,renderSources,renderMethod};
}));
