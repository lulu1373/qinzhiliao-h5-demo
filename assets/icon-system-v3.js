(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.QZLIconSystemV3=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  let seq=0;
  const palettes={
    classroom:['#B9DEFF','#77B4F1','#527ED5'],
    learning:['#D8C2FF','#A689EF','#7458D2'],
    assessment:['#BEE6FF','#78BFF2','#4F8ED9'],
    community:['#FFD49A','#F1A569','#DB7847'],
    growth:['#B9F29B','#76D469','#3EA64D'],
    treasure:['#D8C4FF','#AA8DEB','#775FC8'],
    task:['#FFC596','#F39A61','#DD7043'],
    notification:['#FFE59A','#F7BE4C','#DF9428'],
    archive:['#BCE8C0','#7ACD83','#4BA65B'],
    membership:['#FFE09A','#F5BB4B','#D99A2D'],
    help:['#C5DEFF','#84B2F0','#5D81D5']
  };
  const defs=(id,p)=>`<defs>
    <linearGradient id="${id}a" x1="8" y1="7" x2="56" y2="58"><stop stop-color="${p[0]}"/><stop offset=".54" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>
    <filter id="${id}s" x="-35%" y="-35%" width="170%" height="185%"><feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#504338" flood-opacity=".15"/></filter>
  </defs>`;
  const shapes={
    classroom:id=>`
      <path d="M8 22c7-3 14-2 22 2v28c-8-4-15-4-22-1Z" fill="url(#${id}a)"/>
      <path d="M56 22c-7-3-14-2-22 2v28c8-4 15-4 22-1Z" fill="#8FC8F5"/>
      <path d="M12 18c6-1 12 0 18 3v25c-6-3-12-3-18-1Z" fill="#FAFCFF"/>
      <path d="M52 18c-6-1-12 0-18 3v25c6-3 12-3 18-1Z" fill="#F4F8FF"/>
      <path d="M32 21v30" stroke="#4E7BCB" stroke-width="2.2"/>
      <path d="M40 28c2-8 7-12 15-12-1 8-6 13-15 14Z" fill="#69D36A"/>
      <path d="M42 27c4-4 8-6 11-8" stroke="#EFFFF0" stroke-width="1.5" stroke-linecap="round"/>`,
    learning:id=>`
      <rect x="17" y="11" width="30" height="13" rx="6" fill="#B294EF"/>
      <rect x="10" y="18" width="44" height="35" rx="10" fill="url(#${id}a)"/>
      <circle cx="32" cy="35" r="12" fill="#6C58C9" opacity=".28"/>
      <path d="M27 27c0-1.5 1.6-2.4 2.9-1.6l13 8.2c1.2.8 1.2 2.5 0 3.2l-13 8.2c-1.3.8-2.9-.1-2.9-1.6Z" fill="#FAF9FF"/>
      <circle cx="51" cy="49" r="9" fill="#57C865"/><path d="m47 49 3 3 6-7" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    assessment:id=>`
      <rect x="13" y="12" width="38" height="44" rx="11" fill="url(#${id}a)"/>
      <rect x="18" y="18" width="28" height="32" rx="7" fill="#F9FCFF"/>
      <path d="M23 27h16M23 33h9" stroke="#84B9E7" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M24 44v-6M31 44V34M38 44V29" stroke="#5797DC" stroke-width="4" stroke-linecap="round"/>`,
    community:id=>`
      <circle cx="21" cy="25" r="8" fill="#F0A36A"/><circle cx="42" cy="24" r="9" fill="url(#${id}a)"/>
      <path d="M9 52c1-11 6-17 13-17s12 6 13 17Z" fill="#F1B17F"/>
      <path d="M28 52c1-12 6-18 14-18s13 6 14 18Z" fill="url(#${id}a)"/>
      <path d="M16 21c3-2 7-2 10 0M36 20c4-2 8-2 12 0" stroke="#FFF8F0" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    growth:id=>`
      <ellipse cx="32" cy="51" rx="19" ry="7" fill="#EBC47A"/><ellipse cx="32" cy="49" rx="15" ry="4.8" fill="#D6A654"/>
      <path d="M32 48V28" stroke="#45A54B" stroke-width="4" stroke-linecap="round"/>
      <path d="M30 32c-10 0-16-5-17-14 10-1 17 4 17 14Z" fill="url(#${id}a)"/>
      <path d="M34 29c1-9 7-14 17-13 0 9-6 14-17 13Z" fill="#7ED96F"/>
      <path d="M17 21c4 1 7 4 10 8M48 19c-4 1-8 4-11 7" stroke="#F0FFE9" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    treasure:id=>`
      <rect x="15" y="17" width="34" height="24" rx="8" fill="#E5D8FA"/>
      <path d="M18 13c8-4 20-4 28 0l3 11H15Z" fill="#F4EDFF"/>
      <path d="M11 30h42v22a7 7 0 0 1-7 7H18a7 7 0 0 1-7-7Z" fill="url(#${id}a)"/>
      <rect x="26" y="39" width="12" height="9" rx="3" fill="#FFF1BF"/><path d="M29 43.5h6" stroke="#B88B39" stroke-width="1.8" stroke-linecap="round"/>
      <path d="m32 16 2 4 4.4.6-3.2 3 1 4.3-4.2-2.1-4.2 2.1 1-4.3-3.2-3 4.4-.6Z" fill="#FFD25C"/>`,
    task:id=>`
      <rect x="13" y="15" width="38" height="42" rx="10" fill="url(#${id}a)"/>
      <rect x="18" y="22" width="28" height="29" rx="6" fill="#FFF8F2"/>
      <rect x="24" y="9" width="16" height="11" rx="5" fill="#F4B47E"/>
      <path d="m23 33 4 4 7-8M23 43l4 4 7-8M37 33h5M37 43h5" stroke="#EE8550" stroke-width="2.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    notification:id=>`
      <path d="M32 10c-9 0-15 7-15 16v10c0 5-2 8-6 12h42c-4-4-6-7-6-12V26c0-9-6-16-15-16Z" fill="url(#${id}a)"/>
      <path d="M19 24c2-6 6-9 12-10" stroke="#FFF8C9" stroke-width="2.3" fill="none" stroke-linecap="round"/>
      <path d="M13 48h38" stroke="#E39B27" stroke-width="3" stroke-linecap="round"/>
      <path d="M26 50c1 4 3 6 6 6s5-2 6-6Z" fill="#E29925"/>
      <circle cx="49" cy="18" r="6" fill="#FF8D69"/>`,
    archive:id=>`
      <path d="M10 25 32 10l22 15v28a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6Z" fill="url(#${id}a)"/>
      <rect x="18" y="31" width="28" height="22" rx="7" fill="#F7FFF5"/>
      <circle cx="28" cy="39" r="5" fill="#75BFEF"/><circle cx="38" cy="39" r="4.5" fill="#F2A76F"/>
      <path d="M20 51c1-7 4-10 8-10s7 3 8 10M32 51c1-6 3-9 6-9s5 3 6 9" fill="#93D6A2"/>`,
    membership:id=>`
      <path d="M10 48 15 24l10 8 7-17 7 17 10-8 5 24Z" fill="url(#${id}a)"/>
      <rect x="12" y="45" width="40" height="10" rx="5" fill="#F5B94A"/>
      <circle cx="15" cy="21" r="4" fill="#FFD55E"/><circle cx="32" cy="12" r="4" fill="#FFD55E"/><circle cx="49" cy="21" r="4" fill="#FFD55E"/>
      <path d="M18 42c9-4 19-4 28 0" stroke="#FFF0B5" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    help:id=>`
      <path d="M11 15h42v30H31L19 53v-8h-8Z" fill="url(#${id}a)"/>
      <circle cx="32" cy="30" r="10" fill="#F8FBFF"/>
      <path d="M27 27c1-4 3-6 7-6 4 0 7 2 7 6 0 3-2 5-5 6-2 1-3 3-3 5" stroke="#6B93DD" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <circle cx="33" cy="42" r="2" fill="#6B93DD"/>`
  };
  function render(name,extra=''){
    const key=shapes[name]?name:'help';
    const id='iv3'+(++seq);
    return `<svg class="app-feature-icon-v3 app-feature-icon-${key} ${extra}" viewBox="0 0 64 64" aria-hidden="true">${defs(id,palettes[key])}<g filter="url(#${id}s)">${shapes[key](id)}</g></svg>`;
  }
  return {render,names:Object.freeze(Object.keys(shapes))};
});
