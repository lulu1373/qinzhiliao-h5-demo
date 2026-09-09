/* Confirmed, family-owned events. Source changes never rewrite a user's memory. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QZLMilestoneModel = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CATEGORIES = Object.freeze({'see-self':'看见自己','try-change':'尝试改变',reconnect:'重新靠近',other:'其他'});
  const clone = value => JSON.parse(JSON.stringify(value));
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(value + 'T00:00:00Z').getTime()) && new Date(value + 'T00:00:00Z').toISOString().slice(0,10) === value;
  function text(value, label, limit, required = false) {
    if (value !== undefined && value !== null && typeof value !== 'string') throw new TypeError(`${label}请填写文字`);
    const result = (value || '').trim();
    if (required && !result) throw new TypeError(`请填写${label}`);
    if (result.length > limit) throw new TypeError(`${label}最多 ${limit} 字`);
    return result;
  }
  function fields(input, today) {
    if (!validDate(input.date) || !validDate(today) || input.date > today) throw new TypeError('请选择有效日期，不能晚于今天');
    if (!Object.hasOwn(CATEGORIES,input.category)) throw new TypeError('请选择有效分类');
    if (!['parent','child','family'].includes(input.subject || 'parent')) throw new TypeError('请选择有效记录对象');
    return {
      title:text(input.title,'标题',80,true), date:input.date, category:input.category,
      description:text(input.description,'经过',1200), meaning:text(input.meaning,'意义',800),
      subject:input.subject || 'parent', memberId:text(input.memberId || 'self','记录对象标识',100,true)
    };
  }
  function sourceSnapshot(source) {
    if (!source) return null;
    if (!['conversation','action'].includes(source.kind) || !['personal','example'].includes(source.provenance)) throw new TypeError('记录来源无效');
    const title=text(source.title,'来源标题',10000).slice(0,80);
    const excerpt=text(source.excerpt,'来源内容',20000).slice(0,1200);
    return {
      id:text(source.id,'来源标识',300,true),kind:source.kind,provenance:source.provenance,
      date:validDate(source.date) ? source.date : '',title,excerpt,
      revision:text(source.revision,'来源版本',300),autofill:{title,description:excerpt}
    };
  }
  function create(input, options) {
    const source=sourceSnapshot(options.source);
    const value=fields(input,options.today);
    return {
      id:text(options.id,'记录标识',300,true),familyId:text(options.familyId,'家庭标识',300,true),
      provenance:source ? source.provenance : (options.provenance === 'example' ? 'example' : 'personal'),
      status:'confirmed',createdAt:options.now,confirmedAt:options.now,updatedAt:options.now,
      ...value,source,sourceChanged:false,sourceDeleted:false
    };
  }
  function update(item, input, options) {
    const value=fields({...item,...input},options.today);
    return {...clone(item),...value,updatedAt:options.now};
  }
  const confirmed = item => item && item.status === 'confirmed' && typeof item.confirmedAt === 'string' && Boolean(item.confirmedAt) && validDate(item.date);
  function list(items, options) {
    const {familyId,source='personal',start,end}=options;
    if ((start && !validDate(start)) || (end && !validDate(end))) throw new TypeError('筛选日期无效');
    if (start && end && start > end) throw new TypeError('筛选日期范围无效');
    const selected=items.filter(item=>confirmed(item) && item.familyId === familyId && item.provenance === source && (!start || item.date >= start) && (!end || item.date <= end));
    const unique=[...new Map(selected.map(item=>[item.id,item])).values()];
    return unique.map(clone).sort((a,b)=>b.date.localeCompare(a.date) || b.confirmedAt.localeCompare(a.confirmedAt) || a.id.localeCompare(b.id));
  }
  const sameSource = (a,b) => a && b && a.id === b.id && a.kind === b.kind && a.provenance === b.provenance;
  function findBySource(items, source, options) {
    const found=items.find(item=>confirmed(item) && item.familyId === options.familyId && item.provenance === options.provenance && sameSource(item.source,source));
    return found ? clone(found) : null;
  }
  function scrubQuotes(value, quotes) {
    const original=typeof value === 'string' ? value : '';
    const result=quotes.reduce((content,quote)=>{
      if (content.trim() === quote) return '';
      // Tiny fragments such as “我” can belong to independently authored words.
      // Strip them only as complete lines; longer known quotes can be embedded.
      const embedded=Array.from(quote).length >= (/[^\x00-\x7f]/.test(quote) ? 4 : 8);
      return embedded ? content.split(quote).join('') : content.split('\n').filter(line=>line.trim() !== quote).join('\n');
    },original);
    return result === original ? original : result.replace(/^[\s：:，,。；;、]+/g,'').trim();
  }
  function deletedSource(item) {
    const snapshot=item.source;
    const autofill=snapshot.autofill || {title:snapshot.title,description:snapshot.excerpt};
    const quotes=[...new Set([snapshot.title,snapshot.excerpt,autofill.title,autofill.description].filter(value=>typeof value === 'string' && value.trim()).map(value=>value.trim()))].sort((a,b)=>b.length-a.length);
    return {
      ...clone(item),
      title:scrubQuotes(item.title,quotes) || '一个值得留下的时刻',
      description:scrubQuotes(item.description,quotes),
      meaning:scrubQuotes(item.meaning,quotes),
      source:{id:snapshot.id,kind:snapshot.kind,provenance:snapshot.provenance},
      sourceDeleted:true,sourceChanged:false
    };
  }
  function reconcile(items, sources) {
    return items.map(item=>{
      if (!item.source || item.sourceDeleted) return clone(item);
      const current=sources.find(source=>sameSource(item.source,source));
      if (!current) return deletedSource(item);
      return {...clone(item),sourceChanged:Boolean(item.sourceChanged || current.revision !== item.source.revision)};
    });
  }
  function remove(items, id) { return items.filter(item=>item.id !== id).map(clone); }
  const EXAMPLE_MILESTONES=Object.freeze([
    Object.freeze(create({title:'争执后，我重新开口',date:'2026-08-24',category:'reconnect',description:'我说了刚才声音太大，问孩子愿不愿意重新说一次。',meaning:'这一次，我给重新交谈留了一个机会。',subject:'parent'}, {id:'ex-m24',familyId:'example-family',provenance:'example',now:'2026-08-24T13:00:00Z',today:'2026-08-26'})),
    Object.freeze(create({title:'先听到担心，再谈下一步',date:'2026-08-25',category:'try-change',description:'孩子说怕做错。我先复述了他的担心，再问他想从哪一题开始。',meaning:'留下这次具体尝试，之后可以回来看看。',subject:'parent'}, {id:'ex-m25',familyId:'example-family',provenance:'example',now:'2026-08-25T13:00:00Z',today:'2026-08-26'}))
  ]);
  return {CATEGORIES,EXAMPLE_MILESTONES,create,update,list,findBySource,reconcile,remove};
}));
