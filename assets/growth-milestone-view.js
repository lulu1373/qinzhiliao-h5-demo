(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QZLMilestoneView = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CATEGORIES = {'see-self':'看见自己','try-change':'尝试改变',reconnect:'重新靠近',other:'其他'};
  const SUBJECTS = {parent:'我',child:'孩子',family:'我们一家'};
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function button(action, label, data, className) {
    const attrs = Object.entries(data || {}).map(([key,value]) => ` data-${key}="${esc(value)}"`).join('');
    return `<button type="button" class="${esc(className || 'gr-link')}" data-gr-action="${esc(action)}"${attrs}>${label}</button>`;
  }
  function confirmed(items) { return (items || []).filter(item => item && item.confirmedAt && !item.removedAt); }
  function origin(item) {
    return item.subject === 'child' ? '根据你的记录' : item.source ? '由你确认留下' : '由你记录';
  }
  function sourceNotice(item) {
    if (item.sourceDeleted) return '<p class="gm-source-note">来源已删除，原文摘录已移除。你自己写下的内容仍可保留。</p>';
    if (item.sourceChanged) return '<p class="gm-source-note">来源已更新，请回看核对。已确认的内容不会自动改写。</p>';
    return '';
  }
  function sourcePanel(item) {
    if (item.sourceDeleted || item.sourceChanged) return sourceNotice(item);
    if (!item.source) return '<p class="gr-meta">由你记录</p>';
    return `<aside class="gm-source-preview"><span class="gr-eyebrow">确认时的来源摘录</span><p>${esc(item.source.title || '一条记录')}</p>${item.source.excerpt ? `<blockquote>${esc(item.source.excerpt)}</blockquote>` : ''}</aside>`;
  }
  function card(item, compact) {
    return `<article class="gm-card${compact ? ' gm-card-compact' : ''}"><div class="gm-card-meta"><time datetime="${esc(item.date)}">${esc(item.date)}</time><span class="gm-tag">${esc(CATEGORIES[item.category] || CATEGORIES.other)}</span></div><h3>${button('milestone-detail',esc(item.title || '一个值得留下的时刻'),{id:item.id},'gm-card-title')}</h3>${!compact && item.description ? `<p class="gm-card-description">${esc(item.description)}</p>` : ''}<div class="gm-card-footer"><span class="gr-meta">${esc(origin(item))}</span>${compact ? '' : button('milestone-detail','回看这个时刻 <span aria-hidden="true">›</span>',{id:item.id},'gr-evidence')}</div>${sourceNotice(item)}</article>`;
  }
  function render(items, ui, deps) {
    ui = ui || {};
    const example = ui.source === 'example', records = confirmed(items);
    const sourceBar = `<div class="gr-source-bar"><span class="gr-source-label${example ? ' is-example' : ''}">${example ? '示例里程碑 · 非你的真实记录' : '我的里程碑'}</span>${button('source',example ? '查看我的记录' : '看看示例',{value:example ? 'personal' : 'example'})}</div>`;
    const undo = ui.undoAvailable ? `<div class="gm-undo" role="status"><span>已移除这条里程碑</span>${button('milestone-undo','撤销')}</div>` : '';
    const body = records.length ? `<div class="gm-intro"><p>把想记住的变化，留给以后的自己。</p>${button('milestone-new','记下一个时刻',{},'gr-primary')}</div><div class="gm-timeline">${records.map(item=>card(item,false)).join('')}</div>` : `<section class="gm-empty"><div class="gm-empty-mark" aria-hidden="true">✦</div><h2>留下一点真实的变化</h2><p>有些变化很小，却值得留下。可以从一次停下来、一次尝试，或一次重新开口开始。</p>${button('milestone-new','记下一个时刻',{},'gr-primary')}</section>`;
    return `<div class="gm-page">${sourceBar}${undo}${body}<p class="gr-meta gm-bottom-note">只留下你确认过的时刻，按事情发生的日期排列。</p></div>`;
  }
  function options(values, selected) {
    return Object.entries(values).map(([value,label])=>`<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(label)}</option>`).join('');
  }
  function memberField(item,ui) {
    if (!(ui.members || []).length) return `<div class="gm-field"><label for="gmSubject">这个时刻关于谁</label><select id="gmSubject">${options(SUBJECTS,item.subject || 'parent')}</select></div>`;
    return `<div class="gm-field"><label for="gmMember">这个时刻关于谁</label><select id="gmMember">${ui.members.map(member=>`<option value="${esc(member.id)}"${member.id === (item.memberId || 'self') ? ' selected' : ''}>${esc(member.label)}</option>`).join('')}</select></div>`;
  }
  function renderEditor(item,ui,deps) {
    item = item || {}; ui = ui || {};
    const intro = ui.editing ? '可以补充当时的感受，也可以调整这条记录。' : '确认后才会进入你的里程碑。先看看这些内容，是否是你想留下的。';
    return `<div class="gm-editor"><h2>${ui.editing ? '编辑这个时刻' : '记下一个时刻'}</h2><p class="gr-meta gm-editor-intro">${intro}</p>${ui.source === 'example' ? '<p class="gm-source-note">示例里程碑 · 非你的真实记录，修改仅保留在示例中。</p>' : ''}${sourcePanel(item)}<div class="gm-field"><label for="gmTitle">给这个时刻起个名字 <span>必填</span></label><input id="gmTitle" type="text" value="${esc(item.title || '')}" maxlength="80" required placeholder="例如：着急时，我先停了一下"></div><div class="gm-field-row"><div class="gm-field"><label for="gmDate">发生日期 <span>必填</span></label><input id="gmDate" type="date" value="${esc(item.date || ui.today || '')}" max="${esc(ui.today || '')}" required></div><div class="gm-field"><label for="gmCategory">属于哪种变化</label><select id="gmCategory">${options(CATEGORIES,item.category || 'other')}</select></div></div>${memberField(item,ui)}<div class="gm-field"><label for="gmDescription">发生了什么 <span>必填</span></label><textarea id="gmDescription" rows="4" maxlength="1200" required placeholder="记一件具体的小事，当时你做了什么，发生了什么。">${esc(item.description || '')}</textarea></div><div class="gm-field"><label for="gmMeaning">为什么想留下 <span>选填</span></label><textarea id="gmMeaning" rows="3" maxlength="800" placeholder="这个时刻，对你意味着什么？">${esc(item.meaning || '')}</textarea></div><p class="gr-meta">记录孩子的回应时，写下你当时看到、听到的内容就好。</p><p id="gmError" class="gm-error" role="alert" hidden></p>${button('milestone-save',ui.editing ? '保存修改' : '确认留下',{id:item.id || ''},'gr-primary gm-save')}</div>`;
  }
  function renderDetail(item,ui,deps) {
    ui = ui || {};
    if (!item) return '<div class="gm-detail"><h2>暂时找不到这个时刻</h2><p class="gr-meta">它可能已经被移除了。</p></div>';
    const sourceAction = item.source && !item.sourceDeleted ? button('milestone-source','查看来源 <span aria-hidden="true">›</span>',{id:item.id},'gr-evidence') : '';
    return `<article class="gm-detail"><div class="gm-card-meta"><time datetime="${esc(item.date)}">${esc(item.date)}</time><span class="gm-tag">${esc(CATEGORIES[item.category] || CATEGORIES.other)}</span></div><h2>${esc(item.title)}</h2><p class="gr-meta">${esc(ui.memberLabel || SUBJECTS[item.subject] || SUBJECTS.parent)} · ${esc(origin(item))}</p><section><h3>发生了什么</h3><p>${esc(item.description || '这条记录的原文内容已移除，可以编辑补充你自己的话。')}</p></section><section><h3>为什么想留下</h3><p>${esc(item.meaning || '暂时没有补充，想好后可以再写。')}</p></section>${sourcePanel(item)}${sourceAction}${item.sourceChanged && !item.sourceDeleted ? button('milestone-reviewed','已核对，保留这条记录',{id:item.id},'gr-chip gm-reviewed') : ''}<div class="gm-detail-actions">${button('milestone-edit','编辑这个时刻',{id:item.id},'gr-chip')}${button('milestone-remove','移除里程碑',{id:item.id},'gr-link gm-remove')}</div></article>`;
  }
  function renderSummary(items,deps) {
    const records = confirmed(items).slice(0,2);
    return `<section class="gr-section gm-summary"><div class="gm-summary-heading"><h2>本期里程碑</h2>${button('milestone-section','查看全部 <span aria-hidden="true">›</span>',{},'gr-evidence')}</div>${records.length ? records.map(item=>card(item,true)).join('') : `<div class="gr-panel gm-summary-empty"><p>本期还没有确认的里程碑</p><p class="gr-meta">遇到想记住的时刻，再慢慢留下。</p>${button('milestone-new','记下一个时刻',{},'gr-evidence')}</div>`}</section>`;
  }
  return {render,renderEditor,renderDetail,renderSummary};
}));
