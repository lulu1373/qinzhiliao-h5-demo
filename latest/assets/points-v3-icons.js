(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.QZLPointsV3Icons=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  let seq=0;
  const defs=(id,a,b,c)=>`<defs>
    <linearGradient id="${id}a" x1="8" y1="7" x2="54" y2="56"><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
    <linearGradient id="${id}b" x1="10" y1="8" x2="48" y2="48"><stop stop-color="#fff" stop-opacity=".92"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
    <filter id="${id}s" x="-35%" y="-35%" width="170%" height="185%"><feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#554737" flood-opacity=".16"/></filter>
  </defs>`;
  const shell=(name,body,a,b,c)=>{
    const id='p3'+(++seq);
    return `<svg class="pv3-icon pv3-icon-${name}" viewBox="0 0 64 64" aria-hidden="true">${defs(id,a,b,c)}<g filter="url(#${id}s)">${body(id)}</g></svg>`;
  };
  const icons={
    checkin:id=>`
      <rect x="10" y="13" width="44" height="41" rx="12" fill="url(#${id}a)"/>
      <rect x="15" y="22" width="34" height="27" rx="8" fill="#fff7e7"/>
      <rect x="18" y="8" width="8" height="17" rx="4" fill="#ffd77b"/>
      <rect x="38" y="8" width="8" height="17" rx="4" fill="#ffd77b"/>
      <path d="m23 36 6 6 13-15" fill="none" stroke="#f09a2a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 17c9-3 28-3 36 0" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>`,
    task:id=>`
      <rect x="13" y="15" width="38" height="40" rx="11" fill="url(#${id}a)"/>
      <rect x="19" y="22" width="26" height="27" rx="6" fill="#fff8f1"/>
      <rect x="23" y="9" width="18" height="12" rx="6" fill="#f8bd8a"/>
      <circle cx="32" cy="14.5" r="2" fill="#fff3e8"/>
      <path d="m23 33 4 4 7-8M23 43l4 4 7-8M37 33h5M37 43h5" fill="none" stroke="#ee8550" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 18c8-2 24-2 32 0" fill="none" stroke="#fff" stroke-opacity=".48" stroke-width="2" stroke-linecap="round"/>`,
    chat:id=>`
      <path d="M11 15h42v30H31L19 53v-8h-8Z" fill="url(#${id}a)"/>
      <circle cx="24" cy="30" r="3" fill="#f8f5ff"/><circle cx="32" cy="30" r="3" fill="#f8f5ff"/><circle cx="40" cy="30" r="3" fill="#f8f5ff"/>
      <path d="M15 19c8-2 25-2 34 0" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>`,
    card:id=>`
      <rect x="14" y="10" width="37" height="45" rx="10" fill="url(#${id}a)"/>
      <rect x="19" y="16" width="27" height="33" rx="7" fill="#fff8ee"/>
      <path d="M24 24h17M24 31h11" fill="none" stroke="#ef9451" stroke-width="2.4" stroke-linecap="round"/>
      <path d="m33 35 2.2 4.5 5 .8-3.6 3.4.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.4 5-.8Z" fill="#ffd55f"/>
      <path d="M18 14c8-2 21-2 29 0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`,
    action:id=>`
      <path d="M14 18h36v34a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6Z" fill="url(#${id}a)"/>
      <path d="M14 26h36" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
      <path d="M22 11v13M42 11v13" stroke="#8f70db" stroke-width="5" stroke-linecap="round"/>
      <path d="m23 40 6 6 13-15" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    course:id=>`
      <path d="M10 15c8-2 15-1 22 4v35c-7-5-14-6-22-3Z" fill="url(#${id}a)"/>
      <path d="M54 15c-8-2-15-1-22 4v35c7-5 14-6 22-3Z" fill="#8ec8ff"/>
      <path d="M32 19v35" stroke="#4f84dc" stroke-width="2.2"/>
      <path d="M15 23c4-.6 8 0 12 2M49 23c-4-.6-8 0-12 2M15 31c4-.6 8 0 12 2M49 31c-4-.6-8 0-12 2" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="2" stroke-linecap="round"/>`,
    community:id=>`
      <circle cx="21" cy="24" r="9" fill="#65c47b"/>
      <circle cx="43" cy="24" r="9" fill="url(#${id}a)"/>
      <path d="M8 53c1-12 6-18 14-18s13 6 14 18Z" fill="#72cf86"/>
      <path d="M28 53c1-12 6-18 14-18s13 6 14 18Z" fill="url(#${id}a)"/>
      <path d="M15 20c3-2 8-2 11 0M37 20c3-2 8-2 11 0" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>`,
    gift:id=>`
      <rect x="11" y="25" width="42" height="31" rx="9" fill="url(#${id}a)"/>
      <rect x="8" y="19" width="48" height="12" rx="6" fill="#ffd98a"/>
      <rect x="28" y="19" width="8" height="37" rx="4" fill="#fff3c6"/>
      <path d="M32 19c-8-13-20-8-15-1 3 4 9 2 15 1Zm0 0c8-13 20-8 15-1-3 4-9 2-15 1Z" fill="#ffcf64"/>
      <path d="M13 28c9-2 28-2 38 0" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>`,
    wallet:id=>`
      <rect x="9" y="15" width="46" height="37" rx="11" fill="url(#${id}a)"/>
      <path d="M12 22c9-3 27-4 38-2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
      <rect x="35" y="26" width="22" height="17" rx="7" fill="#fff1bd"/>
      <circle cx="45" cy="34.5" r="3" fill="#d89b27"/>`,
    medal:id=>`
      <path d="M22 9h20l-4 20H26Z" fill="#9bcf73"/>
      <circle cx="32" cy="37" r="17" fill="url(#${id}a)"/>
      <circle cx="32" cy="37" r="11" fill="#fff1bb"/>
      <path d="m32 28 2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6-4.3-4.2 6-.9Z" fill="#e2a72c"/>
      <path d="M26 13c4-1 8-1 12 0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`,
    history:id=>`
      <circle cx="32" cy="32" r="22" fill="url(#${id}a)"/>
      <circle cx="32" cy="32" r="16" fill="#f7fbff"/>
      <path d="M32 21v12l9 6" fill="none" stroke="#5e9ce2" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 20v-8M13 12h8" fill="none" stroke="#79b7f0" stroke-width="3" stroke-linecap="round"/>`
  };
  const palette={
    checkin:['#ffd66f','#f6ae3f','#ed8f2d'],
    task:['#ffbd89','#f58a55','#df6841'],
    chat:['#b89cff','#8b75e7','#6b58cb'],
    card:['#ffc48e','#f29762','#de704a'],
    action:['#c0a6ff','#9377e6','#6f58c6'],
    course:['#9bdcff','#68b8f4','#4f8cde'],
    community:['#8de0a0','#62c37c','#43a45d'],
    gift:['#ffd984','#f6b445','#e49b2d'],
    wallet:['#ffe28b','#f2ba48','#d99a27'],
    medal:['#ffd874','#f5b13c','#de9325'],
    history:['#b6ddff','#7fb9ef','#5e96d8']
  };
  function render(name){
    const body=icons[name]||icons.wallet;
    const p=palette[name]||palette.wallet;
    return shell(name,body,p[0],p[1],p[2]);
  }
  return {render};
});