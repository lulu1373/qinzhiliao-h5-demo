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
  function encodeOrigin(origin){return encodeURIComponent(origin||'guides');}
  function composeOrigin(route=currentRoute){
    const base=routeBase(route), q=getQuery(route);
    if(base.startsWith('experience/group/')) return base+(q.from==='mine-groups'?'?from=mine-groups':'');
    if(base.startsWith('experience/mine')) return base;
    if(base.startsWith('experience/post/')){
      if(q.from==='group'&&q.group) return 'experience/group/'+q.group+(q.groupFrom==='mine-groups'?'?from=mine-groups':'');
      if(q.from==='mine') return 'experience/mine';
    }
    return 'guides';
  }
  function communityBackTarget(route){
    const base=routeBase(route), q=getQuery(route);
    if(base==='guides'||base==='experience/community') return 'home';
    if(base==='experience/mine') return 'guides';
    if(base.startsWith('experience/mine/')) return 'experience/mine';
    if(base.startsWith('experience/group/')) return q.from==='mine-groups'?'experience/mine/groups':'guides';
    if(base.startsWith('experience/news/')) return 'guides';
    if(base.startsWith('experience/post/')){
      if(q.from==='group'&&q.group) return 'experience/group/'+q.group+(q.groupFrom==='mine-groups'?'?from=mine-groups':'');
      if(q.from==='mine') return 'experience/mine';
      return 'guides';
    }
    if(base==='experience/compose') return q.origin||'guides';
    if(base==='experience/preview') return 'experience/compose?origin='+encodeOrigin(q.origin||'guides');
    return '';
  }
  function returnToOrigin(origin){
    const target=origin||'guides';
    if(routeStack.length&&routeStack[routeStack.length-1]===target&&history.length>1){history.back();return;}
    navigate(target,{replace:true});
  }
  function start(scene, originId = '') {
    const id = uid('journey');
    let data = model.start(read(),{id,scene,originId,now:now()});
    const post = [...model.POSTS,...data.posts].find(item=>item.id===originId);
    if (post?.attempt) data = model.patchJourney(data,id,{actionTitle:post.attempt});
    commit(data);
    go('experience/journey/' + id);
  }
  function childContext() {
    const child=state.family?.children?.[0]||{};
    return [child.age?child.age+'岁':'',child.gender||'',child.grade||''].filter(Boolean).join(' · ');
  }
  function startLightChat(kind, post=null) {
    const profile=childContext();
    const sourceScene=post?.scene||post?.group||({emotion:'self',repeat:'repeat',play:'play'}[kind]||'self');
    let seed='',reply='';
    if(kind==='post'&&post){
      const method=String(post.attempt||post.result||post.body||'').trim();
      seed='我想问问，这条经验适不适合我家。';
      reply=`我看到你是从社区这条经验过来的：<b>「${esc(post.title||'这条经验')}」</b>。${method?`<br>它的重点是：${esc(method)}`:''}${profile?`<br>结合你家目前的情况（${esc(profile)}），`: '<br>'}这套做法不用照搬。你们最近最接近的是哪一种情况？你直接说发生了什么就好，我会围绕你家的实际情况一起看。`;
    }else if(kind==='play'){
      seed='我现在想陪孩子一小段时间。';
      reply=`可以，不用把这段时间安排成一次“教育任务”。${profile?`结合 ${esc(profile)} 的阶段，`:''}如果现在只有 10～15 分钟，可以先让孩子选一件他正在做、也愿意让你参与的小事。你先跟着，不教、不纠正。<br><br>如果你告诉我孩子现在在做什么，我可以直接给你一个更贴近当下的陪伴建议。`;
    }else if(kind==='emotion'){
      seed='我现在有点情绪卡住了，想先聊聊。';
      reply='好，我们先不做练习，也不急着解决孩子的问题。你把最难受的那一小段说给我听就行，我先陪你把这一刻理清楚。';
    }else{
      seed='这个问题总是反复，我想先聊聊。';
      reply='可以，我们先不进入步骤。就从最近一次说起：它是从哪个瞬间开始变得不对劲的？先把这一小段讲清楚就够了。';
    }
    state.chat={active:true,scenario:kind,node:'done',messages:[{role:'user',html:esc(seed),time:todayTime()},{role:'ai',html:reply,time:todayTime()}],typing:false,reviewResult:null,freeTurns:0,conversationId:uid('conv'),mode:'light',sourceScene,sourcePostId:post?.id||''};
    pendingConversationStart=true;saveState();navigate('home');
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
      const data = read(), effective = base === 'guides' ? 'experience/community' : route;
      if (effective.startsWith('experience/card/')) {
        const type = effective.split('/')[2];
        return window.QZLCardPractice?.render(type,data.cardDrafts?.[type] || {},esc) || originalRender('home');
      }
      return view.render(effective,{data,model,journey:getJourney(effective.split('/')[2]),esc,icons:svg,educationRegion:educationContext().educationRegion});
    }
    return originalRender(route);
  };
  renderRoute = function(route) {
    const previous = pageStack.querySelector('.xp-page');
    if (previous && lastRoute) scrolls.set(lastRoute,previous.scrollTop);
    const focusReply = getQuery(route).reply === '1' && route !== lastRoute;
    originalRoute(route);
    const next = pageStack.querySelector('.xp-page');
    if (next) next.scrollTop = scrolls.get(route) || 0;
    lastRoute = route;
    if (focusReply) requestAnimationFrame(()=>{
      const input=document.getElementById('xpComment');
      if(!input)return;
      input.scrollIntoView({block:'center',behavior:'smooth'});
      setTimeout(()=>input.focus({preventScroll:true}),120);
    });
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
    const current = read().draft || {};
    commit(model.updateDraft(read(),{
      ...current,
      title:value('xpTitle'),
      body:value('xpBody'),
      group:value('xpGroup'),
      postType:value('xpPostType'),
      stage:value('xpStage'),
      topic:value('xpTopic')
    }));
  }
  function publish() {
    const data = read(), draft = data.draft, editing=!!draft.id;
    const id = draft.id || uid('post'), origin=getQuery(currentRoute).origin||'guides';
    let next = editing ? model.updatePost(data,id,{...draft,now:now()}) : model.savePost(data,{...draft,id,now:now()});
    const ui={...next.ui};
    let target=origin;
    if(origin==='guides'){ui.tab='dynamic';ui.filter='all';ui.query='';}
    if(origin==='experience/mine/drafts'){ui.mineTab='published';target='experience/mine';}
    next = {...next,draft:{},ui};
    commit(next); toast(editing?'修改已保存':'发布成功'); returnToOrigin(target);
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
    showBottomSheet(`<div class="xp-tools"><h2>选择一张卡</h2><p>五张卡会一直放在输入框上方，这里只保留备用入口。</p><div>${V90_CARD_TYPES.map(type =>
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
        const target=communityBackTarget(currentRoute);
        if(target){
          const q=getQuery(currentRoute);
          if(routeBase(currentRoute).startsWith('experience/post/')&&q.from==='mine'&&q.tab){const data=read();commit({...data,ui:{...data.ui,mineTab:q.tab}});}
          if(routeBase(currentRoute)==='experience/compose') return returnToOrigin(target);
          return navigate(target,{replace:true});
        }
        return goBack('home');
      }
      if (action === 'tools') return toolsSheet();
      if (action === 'education-region') { showEducationRegionSelector(); return; }
      if (action === 'open-card') {
        closeOverlay();
        if (type === 'interpretation') { navigate('home',{replace:true}); startQuickCardV90(type); }
        else go('experience/card/' + type);
        return;
      }
      if (action === 'journey-start') return start(scene,state.chat?.sourcePostId||'');
      if (action === 'chat-start') return startLightChat(scene);
      if (action === 'adopt') {
        const post = [...model.POSTS,...read().posts].find(item => item.id === id);
        if(!post) throw new Error('没有找到这条经验');
        return startLightChat('post',post);
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
        if (a && ['better','same','worse'].includes(a.result)) openGrowthMilestoneFromExperience?.(a.id);
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
      if (action === 'post-type') {
        const data = read();
        commit(model.updateDraft(data,{postType:val}));
        return refresh(button.closest('.xp-page')?.scrollTop || 0);
      }
      if (action === 'compose') {const origin=composeOrigin();return go('experience/compose?origin='+encodeOrigin(origin));}
      if (action === 'edit-draft') {const origin=getQuery(currentRoute).origin||'guides';return navigate('experience/compose?origin='+encodeOrigin(origin),{replace:true});}
      if (action === 'resume-draft') return go('experience/compose?origin='+encodeOrigin(routeBase(currentRoute)==='experience/mine/drafts'?'experience/mine/drafts':'experience/mine'));
      if (action === 'clear-draft') {showConfirm('删除这条草稿？','删除后无法恢复。',()=>{const data=read();commit({...data,draft:{}});toast('草稿已删除');refresh();});return;}
      if (action === 'draft-preview') {
        saveDraft();
        const data = read();
        model.savePost(data,{...data.draft,id:'validation-only',now:now()});
        const origin=getQuery(currentRoute).origin||'guides'; return navigate('experience/preview?origin='+encodeOrigin(origin),{replace:true});
      }
      if (action === 'draft-publish') return publish();
      if (action === 'mine-tab') {const data=read();commit({...data,ui:{...data.ui,mineTab:val}});return refresh();}
      if (action === 'edit-post') {
        const data=read(), post=data.posts.find(p=>p.id===id&&(p.local||p.authorId==='self'));
        if(!post) throw new Error('没有找到可编辑的帖子');
        const origin=composeOrigin();
        commit({...data,draft:{id:post.id,title:post.title,body:post.body,group:post.group,postType:post.postType||'dynamic',stage:post.stage||'',topic:post.topic||'',images:[...(post.images||[])]}});
        return navigate('experience/compose?origin='+encodeOrigin(origin),{replace:true});
      }
      if (action === 'delete-post') {
        const origin=composeOrigin();
        showConfirm('删除这条帖子？','删除后，这条帖子和你在其中留下的本机回应都会移除。',()=>{try{commit(model.deletePost(read(),id));toast('帖子已删除');navigate(origin,{replace:true});}catch(error){showError(error);}});return;
      }
      if (action === 'delete-comment') {
        showConfirm('删除这条回复？','删除后无法恢复。',()=>{try{commit(model.deleteComment(read(),id));toast('回复已删除');refresh();}catch(error){showError(error);}});return;
      }
      if (action === 'save-post' || action === 'like-post' || action === 'join') {
        const field = action === 'join' ? 'joined' : action === 'like-post' ? 'liked' : 'saved';
        const before=read(), wasOn=Array.isArray(before[field])&&before[field].includes(id);
        commit(model.toggle(before,field,id));
        const top=button.closest('.xp-page')?.scrollTop || 0; refresh(top);
        if(action==='like-post'&&!wasOn){
          requestAnimationFrame(()=>{
            const target=[...document.querySelectorAll('[data-xp-action=\"like-post\"]')].find(el=>el.dataset.id===id);
            if(target){target.classList.add('is-just-activated');setTimeout(()=>target.classList.remove('is-just-activated'),360);}
          });
        }
        if(action==='save-post') toast(wasOn?'已取消收藏':'已收藏');
        else if(action==='join') toast(wasOn?'已退出小组':'已加入小组');
        return;
      }
      if (action === 'remove-image') {
        saveDraft();
        const data = read(), images = Array.isArray(data.draft.images) ? data.draft.images : [];
        commit(model.updateDraft(data,{images:images.filter((_,index)=>index!==Number(val))}));
        return refresh(button.closest('.xp-page')?.scrollTop || 0);
      }
      if (action === 'focus-reply') {
        const input=document.getElementById('xpComment');
        input?.scrollIntoView({behavior:'smooth',block:'center'});
        setTimeout(()=>input?.focus({preventScroll:true}),180);
        return;
      }
      if (action === 'comment') {
        const body=value('xpComment').trim();
        if(!body){document.getElementById('xpComment')?.focus();return;}
        const commentId=uid('comment'),top=button.closest('.xp-page')?.scrollTop||0;
        const next = model.addComment(read(),{id:commentId,postId:id,body,now:now()});
        commit({...next,commentDrafts:{...next.commentDrafts,[id]:''}});
        toast('回复已发送'); refresh(top);
        requestAnimationFrame(()=>setTimeout(()=>{
          const node=document.querySelector(`[data-comment-id="${commentId}"]`);
          node?.scrollIntoView({block:'center',behavior:'smooth'});
          node?.classList.add('is-new');
          setTimeout(()=>node?.classList.remove('is-new'),900);
        },20));
        return;
      }
      const data = read();
      if (action === 'tab' || action === 'filter') {
        commit({...data,ui:{...data.ui,[action]:val}}); refresh();
        if(action==='tab'&&val==='news')requestAnimationFrame(()=>maybePromptEducationRegion());
        return;
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
      if (['xpTitle','xpBody','xpGroup','xpPostType','xpStage','xpTopic'].includes(target.id)) return saveDraft();
      if (['xpCardEvent','xpCardNote'].includes(target.id)) return card(id,{event:value('xpCardEvent'),note:value('xpCardNote')});
      if (target.id === 'xpComment') {
        commit({...data,commentDrafts:{...data.commentDrafts,[id]:target.value}});
        target.style.height='auto';target.style.height=Math.min(target.scrollHeight,120)+'px';
        const send=document.querySelector('.xp-reply-send');if(send)send.disabled=!target.value.trim();
        return;
      }
      const fields = {xpDescription:'description',xpPhrase:'phrase',xpActionTitle:'actionTitle',xpActionScript:'actionScript',xpFeedbackNote:'feedbackNote'};
      if (fields[target.id] && getJourney(id)) return patchJourney(id,{[fields[target.id]]:target.value,...(target.id === 'xpPhrase' ? {actionScript:''} : {})});
      if (target.id === 'xpSearch') {
        commit({...data,ui:{...data.ui,query:target.value}});
        const caret = target.selectionStart; refresh();
        const search = document.getElementById('xpSearch'); search?.focus(); search?.setSelectionRange(caret,caret);
      }
    } catch (error) { showError(error); }
  });
  document.addEventListener('change',async event => {
    const input = event.target;
    if (input.id !== 'xpImages' || !input.files?.length) return;
    try {
      saveDraft();
      const data = read(), existing = Array.isArray(data.draft.images) ? data.draft.images : [];
      const files = [...input.files];
      if (existing.length + files.length > 9) throw new Error('一条动态最多选择9张图片');
      const added = [];
      for (const file of files) added.push(await prepareCommunityImage(file));
      const publishedBytes = data.posts.reduce((total,item)=>total+(Array.isArray(item.images)?item.images.reduce((sum,image)=>sum+(typeof image==='string'?image.length:0),0):0),0);
      if (publishedBytes + [...existing,...added].reduce((total,image)=>total+image.length,0) > 3600000) throw new Error('本机图片空间已满，请减少图片后再试');
      commit(model.updateDraft(read(),{images:[...existing,...added]}));
      refresh(input.closest('.xp-page')?.scrollTop || 0);
    } catch (error) { showError(error); }
    finally { input.value = ''; }
  });
  installExperienceHome({read,toolsSheet});
}

function prepareCommunityImage(file) {
  if (!/^image\/(?:png|jpeg|webp)$/i.test(file.type)) return Promise.reject(new Error('请选择 JPG、PNG 或 WebP 图片'));
  if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error('单张图片请控制在8MB以内'));
  const read = blob => new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('图片读取失败，请重新选择'));
    reader.readAsDataURL(blob);
  });
  return read(file).then(source => new Promise((resolve,reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1,1080/Math.max(image.width,image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1,Math.round(image.width*scale));
      canvas.height = Math.max(1,Math.round(image.height*scale));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      const result = canvas.toDataURL('image/webp',.72);
      if (result.length > 520000) reject(new Error('图片压缩后仍然较大，请换一张再试'));
      else resolve(result);
    };
    image.onerror = () => reject(new Error('图片格式无法识别，请换一张再试'));
    image.src = source;
  }));
}

function installExperienceHome({read}) {
  renderHomeIdle = function() {
    const inlineComposer=state.chat.active?'':renderComposer();
    return `<div class="xp-home${state.chat.active?' is-chatting':''}"><section class="xp-home-hero"><div><h1>今天想先说点什么？</h1><p>不用想好怎么说，从现在的感受开始就好。</p></div><img src="${ASSETS.mascotHome}" alt="小亲"></section>
      ${inlineComposer?`<section class="xp-home-chat-start" aria-label="开始和小亲对话">${inlineComposer}<p>直接说一句就好，比如“刚刚又因为作业吵起来了”。</p></section>`:''}
      <section class="xp-home-starter-section"><div class="xp-home-section-title"><b>不知道怎么开口？</b><span>选一个也可以</span></div><div class="xp-home-starters"><button data-action="start-scenario" data-scenario="homework"><i>${svg.conflict}</i><span><b>刚刚发生了一件事</b><small>从一件具体的事聊起</small></span>${svg.back}</button><button data-xp-action="chat-start" data-scene="emotion"><i>${svg.heart}</i><span><b>我现在有点情绪</b><small>先聊聊，不急着解决</small></span>${svg.back}</button><button data-xp-action="chat-start" data-scene="repeat"><i>${svg.repeat}</i><span><b>这个问题总在重复</b><small>先从最近一次聊起</small></span>${svg.back}</button></div></section>
      <section class="xp-home-space"><div class="xp-home-section-title"><b>我的空间</b></div><nav class="xp-home-primary" aria-label="我的空间"><button data-action="route" data-route="growth"><span><b>成长记录</b><small>看看最近的变化</small></span>${svg.back}</button><button data-action="route" data-route="guides"><span><b>家长社区</b><small>听经历，也找方法</small></span>${svg.back}</button></nav></section>
      <div class="xp-home-light"><button data-xp-action="chat-start" data-scene="play">${svg.sprout} 陪孩子一小段时间</button><button data-xp-action="route" data-route="experience/stages">${svg.guide} 阶段准备</button></div>
      <section class="xp-home-card-tools"><div class="xp-home-section-title"><b>辅助工具</b><span>需要时再用</span></div>${renderCardQuickBarV90()}</section>
      <div class="xp-home-utilities"><button data-action="route" data-route="assessments">我的测评</button><span>·</span><button data-action="route" data-route="archive">家庭档案</button><span>·</span><button data-action="route" data-route="treasure-box">百宝箱</button></div></div>`;
  };
  renderComposer = function() {
    const quickbar=state.chat.active?renderCardQuickBarV90():'';
    return `<div class="composer xp-composer">${quickbar}<div class="composer-row"><button class="composer-btn" data-action="voice-start" aria-label="语音输入">${svg.mic}</button><div class="composer-input"><textarea id="chatInput" rows="1" placeholder="${state.chat.active ? '继续和小亲说…' : '和小亲说说现在发生的事…'}"></textarea></div><button class="composer-btn" data-action="attachment-sheet" aria-label="添加附件">${svg.plus}</button><button class="composer-btn" id="chatSendBtn" data-action="chat-send" aria-label="发送">${svg.send}</button></div></div>`;
  };
}
installExperience();
