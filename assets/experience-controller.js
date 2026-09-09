/* One bridge between the existing H5 shell and the co-creation modules. */
function installExperience() {
  const model = window.QZLExperienceModel, view = window.QZLExperienceView;
  if (!model || !view) return;
  const date = () => new Date().toLocaleDateString('sv-SE');
  const now = () => new Date().toISOString();
  const read = () => model.normalize(state.experience);
  const getJourney = id => read().journeys.find(item => item.id === id);
  const value = id => document.getElementById(id)?.value || '';
  const scrolls = new Map();
  const originalRender = renderScreen;
  const originalRoute = renderRoute;
  let lastRoute = '', busy = false;

  function commit(data, patch = {}) {
    const previous = state;
    state = {...state,...patch,experience:data};
    try {
      // Probe before the legacy writer, which swallows storage errors.
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      saveState();
    } catch (error) {
      state = previous;
      throw new Error('这次没能保存，请保留输入后重试。浏览器存储空间可能不足。');
    }
  }
  state = {...state,experience:read()};
  const patchJourney = (id, patch) => commit(model.patchJourney(read(),id,patch));
  openExperienceFeedback = id => {
    if (!getJourney(id)) return false;
    patchJourney(id,{step:'feedback',ended:false});
    navigate('experience/journey/' + id);
    return true;
  };
  function refresh(top = 0) {
    originalRoute(currentRoute);
    const page = pageStack.querySelector('.xp-page');
    if (page) page.scrollTop = top;
  }
  function go(route) { navigate(route); }
  function start(scene, originId = '') {
    const id = uid('journey');
    let data = model.start(read(),{id,scene,originId,now:now()});
    const post = [...model.POSTS,...data.posts].find(item=>item.id===originId);
    if (post?.attempt) data = model.patchJourney(data,id,{actionTitle:post.attempt});
    commit(data);
    go('experience/journey/' + id);
  }
  function showError(error) {
    let notice = document.getElementById('xpError');
    if (!notice) {
      notice = document.createElement('p'); notice.id = 'xpError';
      notice.className = 'xp-error'; notice.setAttribute('role','alert');
      (pageStack.querySelector('.xp-body') || pageStack.querySelector('.xp-page') || overlayRoot).append(notice);
    }
    notice.textContent = error.message || '暂时没有完成，请再试一次。';
    notice.scrollIntoView({block:'nearest'});
  }
  renderScreen = function(route) {
    const base = routeBase(route);
    if (base.startsWith('treasure-box/card/')) {
      const saved = state.cards?.toolbox.find(item=>item.id===routeParts(route)[2]);
      if (saved?.source?.kind === 'practice') return originalRender(route)
        .replace('<span>来源</span><b>和小亲的对话</b>','<span>来源</span><b>由我填写的私人练习</b>')
        .replace(/<button class="primary-btn full-btn" data-action="treasure-back-chat"[^>]*>回到原对话<\/button>/,
          '<button class="primary-btn full-btn" data-xp-action="route" data-route="treasure-box" style="margin-top:14px">返回百宝箱</button>');
    }
    if (base === 'guides' || base.startsWith('experience/')) {
      const data = read(), effective = base === 'guides' ? 'experience/community' : base;
      if (effective.startsWith('experience/card/')) {
        const type = effective.split('/')[2];
        return window.QZLCardPractice?.render(type,data.cardDrafts?.[type] || {},esc) || originalRender('home');
      }
      return view.render(effective,{data,model,journey:getJourney(effective.split('/')[2]),esc,icons:svg});
    }
    return originalRender(route);
  };
  renderRoute = function(route) {
    const previous = pageStack.querySelector('.xp-page');
    if (previous && lastRoute) scrolls.set(lastRoute,previous.scrollTop);
    originalRoute(route);
    const next = pageStack.querySelector('.xp-page');
    if (next) next.scrollTop = scrolls.get(route) || 0;
    lastRoute = route;
  };

  function accept(id) {
    const journey = getJourney(id);
    if (!journey) throw new Error('这次记录已不存在，请重新开始。');
    const actionId = journey.actionId || 'xp-action-' + id;
    const base = model.actionFor(journey);
    const title = (value('xpActionTitle') || journey.actionTitle || base.title).trim();
    const script = (value('xpActionScript') || journey.actionScript || journey.phrase || base.script).trim();
    if (!title || !script || title.length > 160 || script.length > 1200) throw new Error('请填写一个简短行动和准备说的话。');
    const existing = state.actions.find(item => item.id === actionId);
    const action = existing ? {...existing,title,script} : {...base,id:actionId,journeyId:id,title,script,date:date(),
      source:'我的场景练习',createdAt:now(),provenance:'personal',status:'pending',result:null,resultText:'待尝试'};
    const data = model.patchJourney(read(),id,{actionId,actionTitle:title,actionScript:script,ended:false,step:'feedback'});
    commit(data,{actions:existing ? state.actions.map(item=>item.id===actionId ? action : item) : [...state.actions,action]});
    refresh();
  }
  function feedback(id, result) {
    if (!['better','same','worse','not_tried','declined'].includes(result)) return;
    const journey = getJourney(id);
    if (!journey?.actionId) throw new Error('请先确认准备尝试的行动。');
    const labels = {better:'顺一点',same:'没变化',worse:'更难了',not_tried:'还没试',declined:'决定不做'};
    const actual = ['better','same','worse'].includes(result), note = value('xpFeedbackNote').trim();
    const actions = state.actions.map(action => action.id !== journey.actionId ? action : {...action,
      status:actual ? 'done' : 'pending',result:actual ? result : null,resultText:labels[result],
      decision:result,feedbackNote:note,...(actual ? {feedbackAt:now(),feedbackDate:date()} : {})});
    const data = model.patchJourney(read(),id,{feedback:result,feedbackNote:note,ended:false,step:'done'});
    const gr = state.growthReports;
    const actionMeta = {...gr.actionMeta,[journey.actionId]:{...gr.actionMeta[journey.actionId],
      ...(actual ? {feedbackAt:now(),feedbackDate:date()} : {})}};
    commit(data,{actions,growthReports:{...gr,actionMeta}});
    refresh();
  }
  function saveDraft() {
    commit(model.updateDraft(read(),{title:value('xpTitle'),body:value('xpBody'),group:value('xpGroup')}));
  }
  function publish() {
    const data = read(), draft = data.draft;
    const id = draft.id || uid('post');
    let next = model.savePost(data,{...draft,id,now:now()});
    next = {...next,draft:{}};
    commit(next); go('experience/post/' + id);
  }
  function card(type, patch) {
    const data = read();
    commit({...data,cardDrafts:{...data.cardDrafts,[type]:{...data.cardDrafts?.[type],...patch}}});
  }
  function cardAction(action, type) {
    const practice = window.QZLCardPractice, draft = read().cardDrafts?.[type] || {};
    if (!practice?.types.includes(type)) return;
    if (action === 'card-new') card(type,{event:'',note:'',card:null,editId:null,editCreatedAt:null,flipped:false,saved:false});
    else if (action === 'card-prepare') {
      const event = value('xpCardEvent'), note = value('xpCardNote');
      const prepared = practice.prepare(type,{event,note},{id:draft.editId || uid('practice'),now:draft.editCreatedAt || now()});
      card(type,{event,note,card:prepared,flipped:false,saved:false});
    } else if (action === 'card-flip') card(type,{flipped:!draft.flipped});
    else if (action === 'card-edit') card(type,{editId:draft.card?.id,editCreatedAt:draft.card?.createdAt,card:null,flipped:false,saved:false});
    else if (action === 'card-save') {
      if (!draft.card || !draft.flipped) return;
      const exists = state.cards.toolbox.some(item => item.id === draft.card.id);
      const saved = {...draft.card,savedAt:now(),savedDate:date()};
      const data = read();
      commit({...data,cardDrafts:{...data.cardDrafts,[type]:{...draft,saved:true}}},
        {cards:{...state.cards,toolbox:exists ? state.cards.toolbox.map(item=>item.id===saved.id ? saved : item) : [...state.cards.toolbox,saved]}});
    }
    refresh();
  }
  function toolsSheet() {
    showBottomSheet(`<div class="xp-tools"><h2>这一刻，想用哪张卡？</h2><p>从一个具体片段开始，确认后再收藏。</p><div>${V90_CARD_TYPES.map(type =>
      `<button data-xp-action="open-card" data-type="${type}"><i>${V90_CARD_DEFS[type].icon()}</i><span>${esc(V90_CARD_DEFS[type].label)}</span></button>`).join('')}</div><button class="xp-tool-archive" data-action="route" data-route="treasure-box">${svg.treasureBox} 打开百宝箱</button><button data-overlay-action="close" class="xp-tool-close">关闭</button></div>`);
  }
  function context(id) {
    const description = value('xpDescription').trim();
    if (!description) throw new Error('先留下一句发生的事，也可以只写现在的感受。');
    patchJourney(id,{description,step:'support'}); refresh();
  }
  function handle(event) {
    const button = event.target.closest('[data-xp-action]');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (busy) return;
    busy = true;
    const {xpAction:action,id,scene,route,type,value:val,step} = button.dataset;
    try {
      if (action.startsWith('card-')) return cardAction(action,type);
      if (action === 'route') {
        if (route === 'growth') state.growthReports = {...state.growthReports,source:'personal',anchor:date(),screen:'report'};
        return go(route);
      }
      if (action === 'back') {
        const journey = getJourney(routeParts(currentRoute)[2]);
        if (routeBase(currentRoute).startsWith('experience/journey/') && journey?.step !== 'context') {
          const previous = {support:'context',phrase:'support',action:'phrase',feedback:'action',done:journey?.ended ? 'support' : 'feedback'};
          patchJourney(journey.id,{step:previous[journey.step] || 'context'}); return refresh();
        }
        return goBack('guides');
      }
      if (action === 'tools') return toolsSheet();
      if (action === 'open-card') {
        closeOverlay();
        if (type === 'interpretation') { navigate('home',{replace:true}); startQuickCardV90(type); }
        else go('experience/card/' + type);
        return;
      }
      if (action === 'journey-start') return start(scene);
      if (action === 'adopt') {
        const post = [...model.POSTS,...read().posts].find(item => item.id === id);
        return start(scene || post?.scene || (post?.group === 'nursery' ? 'nursery' : post?.group === 'play' ? 'play' : 'screen'),id);
      }
      if (action === 'journey-save-context') return context(id);
      if (action === 'relation') {
        const journey = getJourney(id);
        if (journey.relationship === val) return;
        const reset = {relationship:val,phrase:'',phraseChoice:0,actionTitle:'',actionScript:'',actionId:null,feedback:'',feedbackNote:'',ended:false};
        if (journey.actionId) {
          const newId = uid('journey');
          const data = model.start(read(),{id:newId,scene:journey.scene,originId:journey.originId,now:now()});
          commit(model.patchJourney(data,newId,{...reset,description:journey.description}));
          return navigate('experience/journey/' + newId,{replace:true});
        }
        patchJourney(id,reset); return refresh();
      }
      if (action === 'journey-next') {
        const patch = {step,ended:false};
        if (document.getElementById('xpPhrase')) patch.phrase = value('xpPhrase');
        patchJourney(id,patch); return refresh();
      }
      if (action === 'phrase-choice') { patchJourney(id,{phraseChoice:Number(val),phrase:'',actionScript:''}); return refresh(); }
      if (action === 'action-confirm') return accept(id);
      if (action === 'feedback') return feedback(id,val);
      if (action === 'journey-end') { patchJourney(id,{ended:true,step:'done'}); return refresh(); }
      if (action === 'record-milestone') {
        const journey = getJourney(id), a = state.actions.find(item => item.id === journey?.actionId);
        state.growthReports = {...state.growthReports,source:'personal',screen:'report',section:'milestones',anchor:date()};
        navigate('growth',{replace:true});
        if (a && ['better','same','worse'].includes(a.result)) openGrowthMilestoneFromExperience?.(`${a.id}@${a.createdAt || 'legacy'}`);
        else document.querySelector('[data-gr-action="milestone-new"]')?.click();
        return;
      }
      if (action === 'calm-toggle') {
        const page = button.closest('.xp-page');
        const active = page.classList.toggle('xp-calming');
        button.setAttribute('aria-pressed',String(active));
        button.textContent = active ? '暂停，按自己的节奏来' : '陪我停一小会儿';
        return;
      }
      if (action === 'compose') return go('experience/compose');
      if (action === 'draft-preview') {
        saveDraft();
        const data = read();
        model.savePost(data,{...data.draft,id:'validation-only',now:now()});
        return go('experience/preview');
      }
      if (action === 'draft-publish') return publish();
      if (action === 'save-post' || action === 'join') {
        commit(model.toggle(read(),action === 'join' ? 'joined' : 'saved',id));
        return refresh(button.closest('.xp-page')?.scrollTop || 0);
      }
      if (action === 'comment') {
        const next = model.addComment(read(),{id:uid('comment'),postId:id,body:value('xpComment'),now:now()});
        commit({...next,commentDrafts:{...next.commentDrafts,[id]:''}});
        return refresh(button.closest('.xp-page')?.scrollTop || 0);
      }
      const data = read();
      if (action === 'tab' || action === 'filter') {
        commit({...data,ui:{...data.ui,[action]:val}}); return refresh();
      }
      if (action === 'stage-toggle') {
        const checks = data.ui.stageChecks || {}, key = id + ':' + val;
        commit({...data,ui:{...data.ui,stageChecks:{...checks,[key]:!checks[key]}}});
        return refresh(button.closest('.xp-page')?.scrollTop || 0);
      }
    } catch (error) { showError(error); }
    finally { busy = false; }
  }
  document.addEventListener('click',handle,true);
  document.addEventListener('input',event => {
    const target = event.target;
    if (!target.id?.startsWith('xp')) return;
    try {
      const data = read(), route = routeParts(currentRoute), id = route[2];
      if (['xpTitle','xpBody','xpGroup'].includes(target.id)) return saveDraft();
      if (['xpCardEvent','xpCardNote'].includes(target.id)) return card(id,{event:value('xpCardEvent'),note:value('xpCardNote')});
      if (target.id === 'xpComment') return commit({...data,commentDrafts:{...data.commentDrafts,[id]:target.value}});
      const fields = {xpDescription:'description',xpPhrase:'phrase',xpActionTitle:'actionTitle',xpActionScript:'actionScript',xpFeedbackNote:'feedbackNote'};
      if (fields[target.id] && getJourney(id)) return patchJourney(id,{[fields[target.id]]:target.value,...(target.id === 'xpPhrase' ? {actionScript:''} : {})});
      if (target.id === 'xpSearch') {
        commit({...data,ui:{...data.ui,query:target.value}});
        const caret = target.selectionStart; refresh();
        const search = document.getElementById('xpSearch'); search?.focus(); search?.setSelectionRange(caret,caret);
      }
    } catch (error) { showError(error); }
  });
  installExperienceHome({read,toolsSheet});
}

function installExperienceHome({read}) {
  renderHomeIdle = function() {
    return `<div class="xp-home"><section class="xp-home-hero"><div><small>小亲在这里</small><h1>今天想和我<br>聊聊吗？</h1><p>不用想好怎么说，<br>从此刻的感受开始就好。</p></div><img src="${ASSETS.mascotHome}" alt="小亲"></section>
      <nav class="xp-home-primary" aria-label="常用功能"><button data-action="route" data-route="growth"><b>成长记录</b><small>看看最近的变化</small>${svg.back}</button><button data-action="route" data-route="guides"><b>家长社区</b><small>听经历，也找方法</small>${svg.back}</button></nav>
      <div class="xp-home-starters"><button data-action="start-scenario" data-scenario="homework"><i>${svg.conflict}</i><span><b>刚刚发生什么了？</b><small>从一件具体的事聊起</small></span>${svg.back}</button><button data-xp-action="journey-start" data-scene="self"><i>${svg.heart}</i><span><b>我有点情绪卡住了</b><small>先照顾此刻的自己</small></span>${svg.back}</button><button data-xp-action="journey-start" data-scene="repeat"><i>${svg.repeat}</i><span><b>这个问题总是反复</b><small>试着换一种回应</small></span>${svg.back}</button></div>
      <div class="xp-home-light"><button data-xp-action="journey-start" data-scene="play">${svg.sprout} 今天怎么陪伴</button><button data-xp-action="route" data-route="experience/stages">${svg.guide} 阶段准备</button></div>
      <div class="xp-home-utilities"><button data-action="route" data-route="assessments">我的测评</button><span>·</span><button data-action="route" data-route="archive">家庭档案</button><span>·</span><button data-action="route" data-route="treasure-box">百宝箱</button></div></div>`;
  };
  renderComposer = function() {
    return `<div class="composer xp-composer"><div class="composer-row"><button class="composer-btn" data-action="voice-start" aria-label="语音输入">${svg.mic}</button><div class="composer-input"><textarea id="chatInput" rows="1" placeholder="${state.chat.active ? '继续和小亲说…' : '和小亲说说…'}"></textarea></div><button class="composer-btn xp-tool-button" data-xp-action="tools" aria-label="打开亲子卡牌">${svg.sparkle}</button><button class="composer-btn" data-action="attachment-sheet" aria-label="添加附件">${svg.plus}</button><button class="composer-btn" id="chatSendBtn" data-action="chat-send" aria-label="发送">${svg.send}</button></div></div>`;
  };
}
installExperience();
