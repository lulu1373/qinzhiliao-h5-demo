(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.QZLMemberBenefitIcons=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  let seq=0;
  const palettes={
    relation:['#C8B4FF','#9D82EE','#7358CF'],
    report:['#B7E1FF','#72B8F5','#4F8EDD'],
    guide:['#FFD5A0','#F1A36A','#D97945'],
    growth:['#B8F199','#73D46A','#3DA74E'],
    family:['#A8DFFF','#70BDF0','#4A91D8'],
    agent:['#D3B6FF','#A27BE9','#7255C9']
  };
  const defs=(id,p)=>`<defs>
    <linearGradient id="${id}a" x1="7" y1="7" x2="55" y2="57"><stop stop-color="${p[0]}"/><stop offset=".54" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>
    <filter id="${id}s" x="-35%" y="-35%" width="170%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#504338" flood-opacity=".15"/></filter>
  </defs>`;
  const shapes={
    relation:id=>`
      <path d="M15 22c0-5 4-9 9-9h6c5 0 9 4 9 9s-4 9-9 9h-5" fill="none" stroke="url(#${id}a)" stroke-width="7" stroke-linecap="round"/>
      <path d="M49 42c0 5-4 9-9 9h-6c-5 0-9-4-9-9s4-9 9-9h5" fill="none" stroke="url(#${id}a)" stroke-width="7" stroke-linecap="round"/>
      <path d="M20 18c4-3 8-3 12-1M44 46c-4 3-8 3-12 1" fill="none" stroke="#fff" stroke-opacity=".58" stroke-width="2.2" stroke-linecap="round"/>`,
    report:id=>`
      <rect x="13" y="9" width="38" height="47" rx="11" fill="url(#${id}a)"/>
      <rect x="18" y="15" width="28" height="35" rx="7" fill="#F9FCFF"/>
      <path d="M23 26h17M23 32h10" stroke="#83B8E8" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M24 43v-6M31 43V32M38 43V27" stroke="#5799DF" stroke-width="4" stroke-linecap="round"/>
      <path d="M16 13c8-2 22-2 32 0" fill="none" stroke="#fff" stroke-opacity=".58" stroke-width="2" stroke-linecap="round"/>`,
    guide:id=>`
      <path d="M11 15c8-2 15-1 21 4v35c-7-5-14-6-21-3Z" fill="url(#${id}a)"/>
      <path d="M53 15c-8-2-15-1-21 4v35c7-5 14-6 21-3Z" fill="#F7BE83"/>
      <path d="M32 19v35" stroke="#C97949" stroke-width="2.1"/>
      <path d="M16 25c4-.6 8 0 11 2M48 25c-4-.6-8 0-11 2M16 33c4-.6 8 0 11 2M48 33c-4-.6-8 0-11 2" fill="none" stroke="#FFF8F0" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>`,
    growth:id=>`
      <ellipse cx="32" cy="51" rx="19" ry="7" fill="#EBC57A"/>
      <ellipse cx="32" cy="49" rx="15" ry="4.8" fill="#D9A956"/>
      <path d="M32 48V28" stroke="#47A94D" stroke-width="4" stroke-linecap="round"/>
      <path d="M30 32c-10 0-16-5-17-14 10-1 17 4 17 14Z" fill="url(#${id}a)"/>
      <path d="M34 29c1-9 7-14 17-13 0 9-6 14-17 13Z" fill="#7ED96F"/>
      <path d="M17 21c4 1 7 4 10 8M48 19c-4 1-8 4-11 7" fill="none" stroke="#F0FFE9" stroke-opacity=".75" stroke-width="1.8" stroke-linecap="round"/>`,
    family:id=>`
      <rect x="9" y="15" width="46" height="38" rx="11" fill="url(#${id}a)"/>
      <path d="M12 20c10-3 28-3 40 0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
      <rect x="15" y="23" width="34" height="25" rx="8" fill="#F7FBFF"/>
      <circle cx="26" cy="32" r="5.2" fill="#73B6F1"/>
      <circle cx="39" cy="32" r="5.2" fill="#F3A56E"/>
      <path d="M18 44c1-7 4-10 8-10s7 3 8 10ZM31 44c1-7 4-10 8-10s7 3 8 10Z" fill="#8DC9F5" opacity=".95"/>`,
    agent:id=>`
      <circle cx="32" cy="32" r="22" fill="url(#${id}a)"/>
      <circle cx="32" cy="32" r="15" fill="#F8F2FF" opacity=".95"/>
      <path d="m32 20 2.8 6.5 7.2.7-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.7 7.2-.7Z" fill="#A57BE8"/>
      <circle cx="46.5" cy="18" r="5" fill="#FFD868"/>
      <path d="M45 16.5h3M46.5 15v3" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>`
  };
  function render(name,extra=''){
    const key=shapes[name]?name:'agent';
    const id='mb'+(++seq);
    return `<svg class="member-benefit-art ${extra}" viewBox="0 0 64 64" aria-hidden="true">${defs(id,palettes[key])}<g filter="url(#${id}s)">${shapes[key](id)}</g></svg>`;
  }
  return {render,names:Object.freeze(Object.keys(shapes))};
});
