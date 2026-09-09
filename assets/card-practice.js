(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QZLCardPractice = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const types = Object.freeze(['action', 'strength', 'mirror', 'repair']);
  const copy = {
    action: {name:'行动卡',title:'只做一件，你能决定的小事',intro:'把想改变的事缩小一点，留下一步可以尝试的行动。',event:'想在哪件事上试试不同的做法',note:'这次，我准备具体做什么',placeholder:'例如：下次想催促时，我先问一句“你还需要多久？”',card:'我的一步小行动',labels:['想尝试的情境','我准备做的一步'],close:'试过之后再看结果。还没试、决定不做，也都可以如实记录。',path:'M8 39h12V29h12V19h12M35 10h13v13'},
    strength: {name:'优势卡',title:'看见你确实做过的那一点',intro:'不用给自己打分。写下一次具体行动，看看当时是什么支撑了你。',event:'回想一个具体发生过的时刻',note:'当时，我实际做了什么',placeholder:'例如：我虽然着急，还是等孩子把那句话说完了。',card:'我做过的一个具体行动',labels:['发生过的时刻','我写下的具体行为'],close:'只留住你描述的行为。这张卡不据此判断你或孩子的性格、能力。',path:'M13 39C6 19 22 8 43 12c1 19-11 32-28 27M14 39l20-19'},
    mirror: {name:'镜子卡',title:'回到自己，也听听自己的需要',intro:'看见当时的反应，给感受和期待各留一点空间。没有标准答案。',event:'哪一个瞬间让你很在意',note:'我当时的感受，以及我在意的是什么',placeholder:'例如：我有点委屈。我希望自己的辛苦能被听见。',card:'这一刻，我看见了自己',labels:['让我在意的瞬间','我写下的感受与需要'],close:'这是此刻的自我观察，不是对你或对方的心理判断。以后有不同理解，可以再修改。',path:'M17 29a14 14 0 1 1 22 0M21 34h14M24 39h8M28 43v5'},
    repair: {name:'修复卡',title:'重新开口，从我能承担的部分开始',intro:'修复可以很小：承认自己的行为，留出空间，不急着让对方回应。',event:'这次发生了什么，我做了什么',note:'我想承担哪一部分，准备怎样重新开口',placeholder:'例如：刚才我提高声音了，对不起。我会先停下来。你想说时，我愿意听。',card:'一次不催促回应的修复',labels:['需要回看的这件事','我愿意承担与表达的部分'],close:'对方不需要立即谅解、拥抱或回应。你可以先做好自己承担的部分，再给彼此一点时间。',path:'M9 28c8-13 13-13 19 0s11 13 19 0M9 28c8 13 13 13 19 0s11-13 19 0'}
  };
  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function prepare(type, input, options) {
    if (!types.includes(type)) throw new Error('暂时找不到这种卡牌。');
    input = input || {}; options = options || {};
    const fields = ['event','note'].map(key => typeof input[key] === 'string' ? input[key].trim() : '');
    if (fields.some(value => !value || value.length > 1200)) throw new Error('请写下具体的事情和你的想法，每项不超过 1200 字。');
    if (typeof options.id !== 'string' || !options.id.trim() || !options.now || !Number.isFinite(new Date(options.now).getTime())) throw new Error('保存信息暂时不完整，请重新尝试。');
    const c = copy[type];
    return {id:options.id,type,title:c.card,summary:[c.labels[0]+'：'+fields[0],c.labels[1]+'：'+fields[1],c.close],createdAt:options.now,source:{kind:'practice'},provenance:'personal'};
  }
  function mark(c) {
    return `<svg class="cp-mark" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${c.path}"/></svg>`;
  }
  function button(action,label,type,cls) {
    return `<button type="button" class="${cls || 'cp-link'}" data-xp-action="${action}" data-type="${type}">${label}</button>`;
  }
  function editor(type, draft, e) {
    const c = copy[type];
    return `<div class="cp-intro">${mark(c)}<h2>${c.title}</h2><p>${c.intro}</p></div><div class="cp-form"><label for="xpCardEvent">${c.event}</label><textarea id="xpCardEvent" rows="3" maxlength="1200" required placeholder="写一件具体的事，按你记得的样子就好。">${e(draft.event || '')}</textarea><label for="xpCardNote">${c.note}</label><textarea id="xpCardNote" rows="4" maxlength="1200" required placeholder="${c.placeholder}">${e(draft.note || '')}</textarea><p class="cp-caption">内容由你填写，按卡牌提示整理；不会替你判断对方的内心。</p>${button('card-prepare','整理成我的卡片',type,'cp-primary')}</div>`;
  }
  function result(type, draft, e) {
    const c = copy[type];
    if (!draft.flipped) return `<div class="cp-intro"><h2>给刚刚写下的，留一点空间</h2><p>准备好了，再翻开看看。</p></div><button type="button" class="cp-card cp-card-back" data-xp-action="card-flip" data-type="${type}" aria-label="翻开${c.name}"><span class="cp-card-frame">${mark(c)}<strong>${c.name}</strong><span>我的一次练习</span><span class="cp-flip-hint">轻点翻开</span></span></button>${button('card-edit','先改一改',type,'cp-link cp-centered')}`;
    const card = draft.card;
    return `<article class="cp-card cp-card-front"><div class="cp-card-meta">${mark(c)}<span>${c.name} · 由我写下</span></div><h2>${e(card.title || c.card)}</h2>${(Array.isArray(card.summary) ? card.summary : []).map(line=>`<p>${e(line)}</p>`).join('')}</article><div class="cp-result-actions">${draft.saved ? '<p class="cp-saved" role="status">已存入百宝箱</p>' : button('card-save','确认存入百宝箱',type,'cp-primary')}${draft.saved ? button('card-new','再记一张',type,'cp-primary') : ''}${button('card-edit','修改这张卡',type)}<button type="button" class="cp-link" data-xp-action="route" data-route="treasure-box">去百宝箱看看</button></div>`;
  }
  function render(type, draft, esc) {
    const e = typeof esc === 'function' ? esc : escape;
    if (!types.includes(type)) return '<div class="xp-page secondary-page cp-page"><h1>暂时找不到这张卡</h1><button type="button" class="cp-link" data-xp-action="back">返回上一页</button></div>';
    draft = draft || {};
    return `<div class="xp-page secondary-page cp-page cp-${type}"><header class="cp-header"><button type="button" class="cp-back" data-xp-action="back" aria-label="返回上一页"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><h1>${copy[type].name}</h1><span></span></header>${draft.card ? result(type,draft,e) : editor(type,draft,e)}<p class="cp-private">私人练习 · 仅保存在本机<br>确认保存后才进入百宝箱，不会发布到社区。</p></div>`;
  }
  return {types,prepare,render};
}));
