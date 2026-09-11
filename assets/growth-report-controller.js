/* Injected inside the existing H5 closure by tools/build_growth_reports.py. */
let openGrowthMilestoneFromExperience = null;
let openExperienceFeedback = null;
function installGrowthReports() {
  const model = window.QZLGrowthModel;
  const view = window.QZLGrowthView;
  if (!model || !view) return;
  let milestones = null;
  const day = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const validDate = value => {
    try { model.period('day', value); return true; } catch (_) { return false; }
  };
  const localDate = value => {
    if (validDate(value)) return value;
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}` : '';
  };
  const deps = {esc, mascot:ASSETS.mascotHome, icons:{growth:svg.growthLeaf,
    chat:svg.chat || svg.relation, action:svg.sprout, guide:svg.guide,
    calendar:svg.calendar, archive:svg.family, assessment:svg.assessment,
    treasure:svg.treasureBox}};
  function settings() {
    const old = state.growthReports || {};
    const legacyFeedback = old.version ? {} : Object.fromEntries((state.actions || [])
      .filter(action => ['a17','a23','a26'].includes(action.id) && action.provenance !== 'personal' && action.status === 'done' && ['better','same','worse'].includes(action.result))
      .map(action => [action.id,{status:'done',result:action.result,resultText:action.resultText}]));
    state.growthReports = {...old, version:1,
      mode:['day','week','month'].includes(old.mode) ? old.mode : 'week',
      source:old.source === 'example' ? 'example' : 'personal',
      anchor:validDate(old.anchor) ? old.anchor : day(),
      screen:old.screen === 'records' ? 'records' : 'report',
      recordView:old.recordView === 'list' ? 'list' : 'calendar',
      records:Array.isArray(old.records) ? old.records : [],
      corrections:old.corrections || {}, exampleFeedback:{...legacyFeedback,...old.exampleFeedback},
      actionMeta:old.actionMeta || {}};
    return state.growthReports;
  }
  settings();
  // Preserve unknown historical dates before the legacy normalizer fills defaults.
  state.actions = state.actions.map(action => ({...action,id:action.id || uid('action')}));
  const initialSettings = settings();
  initialSettings.actionMeta = {...initialSettings.actionMeta,...Object.fromEntries(state.actions
    .filter(action => !validDate(action.date) && !initialSettings.actionMeta[action.id])
    .map(action => [action.id,{date:'',dateUnknown:true}]))};
  // Do not invent a date for messages that existed before this upgrade.
  const knownMessages = new WeakSet(state.chat.messages || []);
  const knownActions = new Set((state.actions || []).map(action => action.id));
  const originalSave = saveState;
  const plain = value => {
    const element = document.createElement('div');
    element.innerHTML = String(value || '');
    return element.textContent || '';
  };
  function captureRecords() {
    const gr = settings();
    const messages = state.chat.messages || [];
    const fresh = messages.filter(message => !knownMessages.has(message) && message.role === 'user');
    messages.forEach(message => knownMessages.add(message));
    if (fresh.length) {
      const conversationId = state.chat.conversationId || uid('conv');
      state.chat = {...state.chat, conversationId};
      const date = day(), id = `${conversationId}:${date}`;
      const previous = gr.records.find(record => record.id === id);
      const additions = fresh.map(message => plain(message.html)).filter(Boolean);
      const summary = [previous?.summary, ...additions].filter(Boolean).join('\n').slice(-2400);
      const record = {id, date, conversationId, kind:'conversation', provenance:'personal',
        title:previous?.title || additions[0]?.slice(0, 48) || '一次对话记录',
        summary, updatedAt:new Date().toISOString()};
      gr.records = [...gr.records.filter(item => item.id !== id), record];
    }
    const newActions = state.actions.filter(action => !knownActions.has(action.id));
    newActions.forEach(action => knownActions.add(action.id));
    if (newActions.length) gr.actionMeta = {...gr.actionMeta,
      ...Object.fromEntries(newActions.map(action => [action.id,
        {date:day(), provenance:'personal', createdAt:new Date().toISOString()}]))};
  }
  saveState = function () { captureRecords(); milestones?.reconcile(); originalSave(); };
  const originalReset = resetDemo;
  resetDemo = function () { milestones?.reset(); originalReset(); settings(); };
  const originalAcceptAction = acceptAction;
  acceptAction = function (alternative) {
    originalAcceptAction(alternative);
    const gr = settings();
    gr.actionMeta = {...gr.actionMeta,a26:{date:day(),provenance:'personal',createdAt:new Date().toISOString()}};
    saveState();
  };
  const originalResult = recordActionResult;
  recordActionResult = function (id, result, text) {
    const gr = settings();
    gr.actionMeta = {...gr.actionMeta, [id]:{...gr.actionMeta[id], feedbackAt:new Date().toISOString(), feedbackDate:day()}};
    originalResult(id, result, text);
  };
  let reportScroll = 0;
  let activeFeedback = null;
  let activeCorrection = null;
  let activeReport = null;
  function correctionKey(report) { return `${report.source}:${report.period.mode}:${report.period.start}`; }
  function build(recordsView = false) {
    const gr = settings();
    const anchor = recordsView && validDate(gr.recordAnchor) ? gr.recordAnchor : gr.anchor;
    const report = model.build({mode:recordsView ? 'month' : gr.mode, anchor,
      source:gr.source, now:day(), records:gr.records,
      actions:state.actions.map(action => ({...action, ...gr.actionMeta[action.id]})),
      cards:(state.cards?.toolbox || []).map(card => ({...card,savedDate:card.savedDate || localDate(card.savedAt)})), corrections:gr.corrections,
      exampleFeedback:gr.exampleFeedback});
    const prefix = correctionKey(report);
    const corrections = Object.fromEntries(Object.entries(gr.corrections)
      .filter(([key]) => key.startsWith(prefix + ':topic:'))
      .map(([key,value]) => [key.slice((prefix + ':topic:').length), value]));
    return {report, ui:{...gr, corrections, selectedDate:gr.recordDate, subject:gr.subject || 'parent'}};
  }
  function content() {
    const recordsView = settings().screen === 'records';
    const {report,ui} = build(recordsView);
    activeReport = report;
    if (recordsView) return view.renderRecords(report,ui,deps);
    return ui.section === 'milestones' && milestones ? milestones.render() :
      view.render(report,ui,{...deps,renderMilestones:report=>milestones?.summary(report) || ''});
  }
  function shell() {
    const gr = settings();
    if (gr.source === 'personal' && gr.lastOpened !== day()) gr.anchor = day();
    gr.lastOpened = day();
    return `<div class="secondary-page growth-page gr-page qzl-stacked-page ${gr.screen === 'records' ? 'is-records' : ''}">${titleBar('成长记录',{back:'home',right:{label:'行动记录',action:'growth-records'}})}
      <div class="qzl-page-subnav qzl-growth-subnav" id="grSubnav" ${gr.screen === 'records' ? 'hidden' : ''}>${gr.screen === 'records' ? '' : (milestones?.renderNavigation() || '')}</div>
      <div class="qzl-page-scroll qzl-growth-scroll"><div class="xp-growth-entry" id="grUtilityEntry" ${gr.screen === 'records' ? 'hidden' : ''}><button data-xp-action="route" data-route="experience/history">我的练习 <span aria-hidden="true">›</span></button><button data-xp-action="route" data-route="experience/stages">阶段准备 <span aria-hidden="true">›</span></button><button data-gr-action="milestone-new">记一笔 <span aria-hidden="true">＋</span></button></div>
      <div id="grContent" aria-live="polite">${content()}</div></div></div>`;
  }
  renderGrowth = shell;
  // Existing weekly links remain useful entry points into the report.
  renderWeeklySummary = shell;
  function refresh(options = {}) {
    const slot = document.getElementById('grContent');
    if (!slot) return;
    const page = slot.closest('.gr-page'), scroller = slot.closest('.qzl-page-scroll') || page, top = scroller.scrollTop;
    const focus = document.activeElement?.dataset;
    slot.innerHTML = content();
    const subnav=document.getElementById('grSubnav');
    if(subnav){subnav.hidden=settings().screen === 'records';subnav.innerHTML=subnav.hidden?'':(milestones?.renderNavigation() || '');}
    const utility=document.getElementById('grUtilityEntry');if(utility)utility.hidden=settings().screen === 'records';
    page.classList.toggle('is-records',settings().screen === 'records');
    const right=page.querySelector('.right-action[data-action="growth-records"]');if(right)right.hidden=settings().screen === 'records';
    scroller.scrollTop = options.top !== undefined ? options.top : top;
    if (focus?.grAction && options.focus) {
      const matching = [...slot.querySelectorAll('[data-gr-action]')].find(item =>
        item.dataset.grAction === focus.grAction && item.dataset.value === focus.value);
      matching?.focus({preventScroll:true});
    }
  }
  const oldRefresh = refreshGrowthLocal;
  refreshGrowthLocal = function (options) {
    if (document.getElementById('grContent')) refresh();
    else oldRefresh(options);
  };
  function display(contentHtml, full = false) {
    const close = `<button class="gr-close" data-gr-action="close" aria-label="关闭">${svg.close}</button>`;
    if (full) showOverlay(`<div class="gr-page gr-full-detail">${close}${contentHtml}</div>`);
    else showBottomSheet(`<div class="gr-page gr-sheet">${close}${contentHtml}</div>`);
  }
  function findAction(id) {
    return activeReport?.actions.find(action => String(action.id) === id) ||
      (settings().source === 'example' ? model.EXAMPLE_ACTIONS : state.actions).find(action => String(action.id) === id);
  }
  function actionDetail(id) {
    const action = findAction(id);
    if (!action) return toast('这条记录已不存在');
    display(`<h2>${esc(action.title)}</h2><p class="gr-muted">${esc(action.date)} · ${settings().source === 'example' ? '示例行动' : '行动记录'}</p>
      ${[['来源',action.source],['为什么这样做',action.why],['可以怎么说',action.script],['观察什么',action.observe],['反馈结果',action.resultText || '待尝试']]
        .map(([label,text]) => `<section><h3>${label}</h3><p>${esc(text || '还没有记录')}</p></section>`).join('')}
      <button class="gr-primary" data-gr-action="feedback" data-id="${esc(id)}">${action.status === 'done' ? '修改反馈' : '记录这次尝试'}</button>
      ${milestones?.sourceButton(id,'action') || ''}`);
  }
  function feedback(id) {
    const action = findAction(id);
    if (!action) return toast('这条记录已不存在');
    if (action.journeyId && openExperienceFeedback?.(action.journeyId)) return;
    activeFeedback = {id, source:settings().source};
    display(`<h2>记录这次尝试</h2><p class="gr-muted">${esc(action.title)}</p>
      ${activeFeedback.source === 'example' ? '<p class="gr-demo-note">这是示例操作，不会写入你的行动记录。</p>' : ''}
      ${[['better','顺一点','有一点变化，值得继续观察'],['same','没变化','暂时看不出差别，也是一条重要记录'],['worse','更糟','记下这次的难处，再一起复盘']].map(([key,label,description]) =>
        `<button class="gr-feedback-option" data-gr-action="feedback-save" data-value="${key}"><b>${label}</b><span>${description}</span></button>`).join('')}`);
  }
  function saveFeedback(value) {
    if (!activeFeedback || !['better','same','worse'].includes(value)) return;
    const {id,source} = activeFeedback;
    const resultText = {better:'顺一点',same:'没变化',worse:'更糟'}[value];
    if (source === 'example') {
      const gr = settings();
      gr.exampleFeedback = {...gr.exampleFeedback, [id]:{status:'done',result:value,resultText,feedbackAt:new Date().toISOString(),feedbackDate:day()}};
      saveState(); closeOverlay(); refresh(); toast('示例反馈已更新');
    } else recordActionResult(id,value,resultText);
    activeFeedback = null;
  }
  function sources(ids) {
    const report = activeReport;
    if (!report) return;
    const all = [...report.records, ...report.actions.map(action => ({...action,summary:action.source})),
      ...report.cards.map(card => ({...card,date:card.savedDate || localDate(card.savedAt),summary:(card.summary || []).join?.(' ') || card.summary}))];
    const selected = ids.split(',').map(id => all.find(item => String(item.id) === id)).filter(Boolean);
    if (!selected.length) return toast('这条来源暂时不可用');
    display(selected.map(record=>view.renderSources([record],deps) + (milestones?.sourceButton(String(record.id),report.actions.some(action=>action.id === record.id) ? 'action' : 'conversation') || '')).join(''));
  }
  function correctTopic(id, value) {
    const report = activeReport;
    const topic = report?.topics.find(item => item.id === id);
    if (!topic) return;
    const gr = settings(), key = `${correctionKey(report)}:topic:${id}`;
    if (value === 'agree') {
      gr.corrections = {...gr.corrections,[key]:{value:'agree',updatedAt:new Date().toISOString()}};
      saveState(); refresh(); return;
    }
    activeCorrection = key;
    display(`<h2>按你的理解修改</h2><p>${esc(topic.title)}</p>
      <label for="grCorrection">哪些地方需要调整？</label><textarea id="grCorrection" maxlength="800" placeholder="写下更贴近实际情况的理解">${esc(gr.corrections[key]?.text || '')}</textarea>
      <p class="gr-muted">只更新这份报告的观察，不会自动写进家庭档案。</p>
      <button class="gr-primary" data-gr-action="correction-save">保存我的理解</button>`);
  }
  function saveCorrection() {
    const text = document.getElementById('grCorrection')?.value.trim();
    if (!text || !activeCorrection) return toast('先写下需要调整的地方');
    const gr = settings();
    gr.corrections = {...gr.corrections,[activeCorrection]:{value:'disagree',text,updatedAt:new Date().toISOString()}};
    saveState(); closeOverlay(); refresh(); activeCorrection = null;
  }
  const oldConversationItem = renderConversationItem;
  renderConversationItem = function (message, ...args) {
    if (message.kind === 'growth-context') return `<div class="gr-page gr-chat-context"><small>${esc(message.reportContext?.source === 'example' ? '示例报告 · 复盘上下文' : '成长总结 · 复盘上下文')}</small><b>${esc(message.reportContext?.period || '')}</b><p>${esc(message.reportContext?.summary || '')}</p><span>记录已带到这里，可以接着说说你的想法。</span></div>`;
    return oldConversationItem(message,...args);
  };
  function recap() {
    const report = activeReport;
    if (!report) return;
    const snapshot = captureInputSnapshot();
    const context = {source:report.source,period:report.period.label,
      start:report.period.start,end:report.period.end,summary:report.summary.body,
      recordIds:report.records.map(record => record.id)};
    state.chat = {...state.chat,active:true,node:state.chat.active ? state.chat.node : 'done',
      messages:[...state.chat.messages,{role:'system',kind:'growth-context',html:'',time:'',reportContext:context}]};
    // Render the destination synchronously so a later hashchange cannot erase the draft.
    saveState(); closeOverlay(); navigate('home',{replace:true});
    refreshConversation({scroll:'latest'});restoreInputSnapshot(snapshot);
  }
  function handle(event) {
    if (event.target.closest('[data-action="clear-chat"]')) {
      event.preventDefault();event.stopImmediatePropagation();
      showConfirm('清除对话数据','将删除聊天内容、回顾中的对话片段，以及里程碑引用的对话原文。保留你另写的里程碑内容、行动记录和家庭档案。',() => {
        clearTimers();state.chat=cloneDefault().chat;
        if (state.experience) state.experience = {...state.experience,journeys:[]};
        const gr=settings();gr.records=[];
        gr.corrections=Object.fromEntries(Object.entries(gr.corrections).filter(([key]) => key.startsWith('example:')));
        saveState();
        // Settings keeps Home mounted underneath; remove its cached conversation too.
        screenHost.innerHTML=`<section class="screen" data-route="home">${renderHome()}</section>`;
        bindScreen('home');toast('对话数据已清除');
      });
      return;
    }
    const button = event.target.closest('[data-gr-action],[data-action="growth-records"]');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const gr = settings(), data = button.dataset;
    const action = data.grAction || (data.action === 'growth-records' ? 'records' : '');
    if (milestones?.handle(data)) return;
    if (action === 'close') return closeOverlay();
    if (action === 'action') return actionDetail(data.id);
    if (action === 'feedback') return feedback(data.id);
    if (action === 'feedback-save') return saveFeedback(data.value);
    if (action === 'source-detail') return sources(data.id || '');
    if (action === 'method') {
      const method = activeReport?.methods.find(item => item.id === data.id);
      if (method) display(view.renderMethod(method,deps), true);
      return;
    }
    if (action === 'topic-correct') return correctTopic(data.id,data.value);
    if (action === 'correction-save') return saveCorrection();
    if (action === 'recap') return recap();
    if (action === 'route' && ['assessments','archive','treasure-box'].includes(data.route)) return navigate(data.route);
    if (action === 'not-tried') return toast('仍保留为待尝试，不用急着完成');
    if (action === 'records') {
      reportScroll = document.querySelector('.qzl-growth-scroll')?.scrollTop || 0;
      gr.screen = 'records'; gr.recordAnchor = gr.anchor; gr.recordDate = null;
    } else if (action === 'report') gr.screen = 'report';
    else if (action === 'mode' && ['day','week','month'].includes(data.value)) gr.mode = data.value;
    else if (action === 'source' && ['personal','example'].includes(data.value)) {
      gr.source = data.value; gr.anchor = gr.source === 'example' ? model.EXAMPLE_ANCHOR : day();
      gr.recordAnchor = gr.anchor; gr.recordDate = null;
    } else if (action === 'shift' && [-1,1].includes(Number(data.delta))) {
      const field = gr.screen === 'records' ? 'recordAnchor' : 'anchor';
      gr[field] = model.shift(gr.screen === 'records' ? 'month' : gr.mode,gr[field] || gr.anchor,Number(data.delta));
      gr.recordDate = null;
    } else if (action === 'date' && validDate(data.date)) gr.anchor = data.date;
    else if (action === 'record-date' && validDate(data.date)) gr.recordDate = gr.recordDate === data.date ? null : data.date;
    else if (action === 'record-view' && ['calendar','list'].includes(data.value)) gr.recordView = data.value;
    else if (action === 'subject' && ['parent','child'].includes(data.value)) gr.subject = data.value;
    else return;
    saveState(); refresh({top:action === 'report' ? reportScroll : ['subject','record-date','record-view'].includes(action) ? undefined : 0,focus:true});
  }
  milestones = installGrowthMilestones({settings,day,validDate,localDate,reportModel:model,display,refresh,deps});
  openGrowthMilestoneFromExperience = id => milestones?.handle({grAction:'milestone-from-source',id,kind:'action'});
  milestones?.reconcile();
  document.addEventListener('click',handle,true);
}
installGrowthReports();
