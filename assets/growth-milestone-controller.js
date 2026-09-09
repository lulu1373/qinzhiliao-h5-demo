/* Injected into the H5 closure; shares existing navigation and local persistence. */
function installGrowthMilestones({settings,day,validDate,localDate,reportModel,display,refresh,deps}) {
  const model = window.QZLMilestoneModel, view = window.QZLMilestoneView;
  if (!model || !view) return null;
  let editor = null, removed = null;
  const now = () => new Date().toISOString();
  function config() {
    const gr = settings();
    if (!gr.familyId) gr.familyId = uid('family');
    if (!Array.isArray(gr.milestones)) gr.milestones = [];
    if (!Array.isArray(gr.exampleMilestones)) gr.exampleMilestones = JSON.parse(JSON.stringify(model.EXAMPLE_MILESTONES));
    return gr;
  }
  const bucket = source => source === 'example' ? 'exampleMilestones' : 'milestones';
  const owner = source => source === 'example' ? 'example-family' : config().familyId;
  function items(source = config().source, period) {
    const gr = config();
    return model.list(gr[bucket(source)],{familyId:owner(source),source,start:period?.start,end:period?.end});
  }
  function members() {
    return [{id:'self',label:'我',subject:'parent'},{id:'family',label:'我们一起',subject:'family'},
      ...(state.family?.children || []).map(member=>({id:`child:${member.id}`,label:member.name || '孩子',subject:'child'})),
      ...(state.family?.others || []).map(member=>({id:`other:${member.id}`,label:member.name || member.role || '家人',subject:'family'}))];
  }
  // Revisions contain no original text. Action generations disambiguate reused legacy IDs.
  function revision(value) {
    let hash = 2166136261;
    for (const char of JSON.stringify(value)) hash = Math.imul(hash ^ char.charCodeAt(0),16777619);
    return (hash >>> 0).toString(16);
  }
  function sourceList(provenance) {
    const gr = config(), example = provenance === 'example';
    const records = example ? reportModel.EXAMPLE_RECORDS : gr.records;
    const actions = example ? reportModel.EXAMPLE_ACTIONS.map(action=>({...action,...gr.exampleFeedback[action.id]})) :
      state.actions.map(action=>({...action,...gr.actionMeta[action.id]})).filter(action=>
        action.provenance !== 'example' && (action.provenance === 'personal' || !['a17','a23','a26'].includes(action.id)));
    return [...records.filter(record=>example || record.provenance !== 'example').map(record=>({
      id:String(record.id),kind:'conversation',title:record.title || '一次对话记录',date:record.date,
      excerpt:record.summary || record.excerpt || '',revision:revision([record.title,record.summary,record.updatedAt]),provenance
    })),...actions.filter(action=>['better','same','worse'].includes(action.result)).map(action=>({
      id:`${action.id}@${action.createdAt || 'legacy'}`,originalId:String(action.id),kind:'action',title:action.title,
      date:action.feedbackDate || localDate(action.feedbackAt) || action.date,
      excerpt:`这次尝试：${action.title || ''}\n反馈：${{better:'顺一点',same:'没变化',worse:'更糟'}[action.result]}${action.feedbackNote ? '\n' + action.feedbackNote : ''}`,
      revision:revision([action.title,action.result,action.resultText,action.feedbackNote,action.feedbackAt,action.feedbackDate]),provenance
    }))];
  }
  function reconcile() {
    let gr = config();
    for (const source of ['personal','example']) {
      const current = sourceList(source);
      gr = config();
      gr[bucket(source)] = model.reconcile(gr[bucket(source)],current);
      if (removed?.source === source) removed = {...removed,item:model.reconcile([removed.item],current)[0]};
    }
  }
  function renderNavigation() {
    const selected = config().section === 'milestones';
    return `<nav class="gm-module-tabs" aria-label="成长记录内容"><button data-gr-action="growth-review" aria-pressed="${!selected}" class="${selected ? '' : 'is-active'}">成长回顾</button><button data-gr-action="milestone-section" aria-pressed="${selected}" class="${selected ? 'is-active' : ''}">里程碑</button></nav>`;
  }
  function render() {
    reconcile();
    const gr = config();
    return view.render(items(),{source:gr.source,today:day(),undoAvailable:removed?.source === gr.source},deps);
  }
  function summary(report) { return view.renderSummary(items(report.source,report.period),deps); }
  function find(id, source = config().source) { return items(source).find(item=>item.id === id); }
  function detail(id) {
    reconcile();
    const item = find(id);
    if (!item) return toast('这条里程碑已不存在');
    const memberLabel = members().find(member=>member.id === item.memberId)?.label || '原记录对象';
    display(view.renderDetail(item,{source:config().source,memberLabel},deps),true);
  }
  function sourceButton(id, kind) {
    const source = sourceList(config().source).find(item=>item.kind === kind && (item.id === id || item.originalId === id));
    return source ? `<button class="gr-chip" data-gr-action="milestone-from-source" data-id="${esc(source.id)}" data-kind="${kind}">记为里程碑</button>` : '';
  }
  function openEditor(id, sourceId, kind) {
    const provenance = config().source;
    const source = sourceId ? sourceList(provenance).find(item=>item.id === sourceId && item.kind === kind) : null;
    if (sourceId && !source) return toast('这条来源已不可用');
    const existing = source && model.findBySource(items(provenance),source,{familyId:owner(provenance),provenance});
    if (existing) return detail(existing.id);
    const item = id ? find(id) : null;
    if (id && !item) return toast('这条里程碑已不存在');
    editor = {id:item?.id || null,source:source || item?.source || null,provenance};
    const draft = item || {title:(source?.title || '').trim().slice(0,80),
      date:validDate(source?.date) ? source.date : day(),category:'other',subject:'parent',memberId:'self',
      description:(source?.excerpt || '').trim().slice(0,1200),meaning:'',source};
    display(view.renderEditor(draft,{source:provenance,today:day(),editing:!!item,members:members()},deps),true);
  }
  function saveEditor() {
    if (!editor) return;
    const value = id => document.getElementById(id)?.value || '';
    const memberId = value('gmMember') || 'self', member = members().find(item=>item.id === memberId);
    const input = {title:value('gmTitle'),date:value('gmDate'),category:value('gmCategory'),
      description:value('gmDescription'),meaning:value('gmMeaning'),memberId,subject:member?.subject || 'parent'};
    try {
      if (!member) throw new Error('请选择记录对象');
      if (!input.description.trim()) throw new Error('请写下发生了什么');
      const previous = editor.id ? find(editor.id,editor.provenance) : null;
      if (editor.id && !previous) throw new Error('这条记录已不存在，请重新打开');
      const options = {id:uid('milestone'),now:now(),today:day(),familyId:owner(editor.provenance),provenance:editor.provenance,source:editor.source};
      const item = previous ? model.update(previous,input,options) : model.create(input,options);
      const gr = config(), key = bucket(editor.provenance);
      gr[key] = [...gr[key].filter(record=>record.id !== item.id),item];
      saveState(); editor = null; closeOverlay(); refresh(); toast(previous ? '里程碑已更新' : '这个时刻已经留下');
    } catch (error) {
      let notice = document.getElementById('gmError');
      if (!notice) {
        notice = document.createElement('p'); notice.id = 'gmError'; notice.setAttribute('role','alert');
        document.querySelector('[data-gr-action="milestone-save"]')?.before(notice);
      }
      notice.hidden = false; notice.textContent = error.message; notice.scrollIntoView({block:'nearest'});
    }
  }
  function showSource(id) {
    const item = find(id);
    const source = item?.source && sourceList(item.provenance).find(value=>value.id === item.source.id && value.kind === item.source.kind);
    if (!source || item.sourceDeleted) return toast('原始来源已删除');
    display(`<h2>原始${source.kind === 'action' ? '行动反馈' : '对话记录'}</h2><p class="gr-muted">${esc(source.date || '日期待补充')}</p><h3>${esc(source.title)}</h3><p class="gm-source-text">${esc(source.excerpt)}</p><button class="gr-chip" data-gr-action="milestone-detail" data-id="${esc(id)}">返回里程碑</button>`,true);
  }
  function remove(id) {
    const source = config().source, item = find(id);
    if (!item) return;
    showConfirm('移除这条里程碑？','只移除这条里程碑，原始对话和行动记录会保留。移除后可以撤销。',()=>{
      const gr = config(); gr[bucket(source)] = model.remove(gr[bucket(source)],id);
      removed = {item,source}; gr.section = 'milestones'; gr.screen = 'report';
      saveState(); refresh(); toast('已移除，可在里程碑列表撤销');
    });
  }
  function undo() {
    if (!removed || removed.source !== config().source) return;
    reconcile();
    const {item,source} = removed;
    const existing = item.source && model.findBySource(items(source),item.source,{familyId:owner(source),provenance:source});
    if (existing) { removed = null; refresh(); return detail(existing.id); }
    const gr = config(); gr[bucket(source)] = [...gr[bucket(source)].filter(value=>value.id !== item.id),item];
    removed = null; saveState(); refresh(); toast('已恢复这条里程碑');
  }
  function reviewed(id) {
    const item = find(id), current = item?.source && sourceList(item.provenance).find(source=>source.id === item.source.id && source.kind === item.source.kind);
    if (!item || !current || item.sourceDeleted) return;
    const gr = config(), key = bucket(item.provenance);
    gr[key] = gr[key].map(value=>value.id === id ? {...value,sourceChanged:false,source:{...value.source,revision:current.revision},updatedAt:now()} : value);
    saveState(); refresh(); detail(id);
  }
  function handle(data) {
    const action = data.grAction;
    if (action === 'milestone-new') openEditor();
    else if (action === 'milestone-from-source') openEditor(null,data.id,data.kind);
    else if (action === 'milestone-detail') detail(data.id);
    else if (action === 'milestone-edit') openEditor(data.id);
    else if (action === 'milestone-save') saveEditor();
    else if (action === 'milestone-source') showSource(data.id);
    else if (action === 'milestone-remove') remove(data.id);
    else if (action === 'milestone-undo') undo();
    else if (action === 'milestone-reviewed') reviewed(data.id);
    else if (['milestone-section','growth-review'].includes(action)) {
      const gr = config(); gr.section = action === 'milestone-section' ? 'milestones' : 'review'; gr.screen = 'report';
      saveState(); refresh({top:0});
    } else return false;
    return true;
  }
  function reset() { editor = null; removed = null; }
  config();
  return {renderNavigation,render,summary,sourceButton,handle,reconcile,reset};
}
