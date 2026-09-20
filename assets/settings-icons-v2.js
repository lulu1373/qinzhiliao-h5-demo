(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.QZLSettingsIconsV2=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  let seq=0;
  const palettes={
    account:['#B9D5FF','#7EA8F2','#587FD5'],
    notification:['#FFE190','#F7B844','#DF9226'],
    location:['#B6E69A','#79C76D','#4C9D54'],
    privacy:['#A8E19E','#68BF70','#439653'],
    help:['#B9D8FF','#7BAAF0','#587ED5'],
    about:['#D3C1FF','#A58BEA','#785FD1']
  };
  const defs=(id,p)=>`<defs>
    <linearGradient id="${id}a" x1="8" y1="7" x2="55" y2="57"><stop stop-color="${p[0]}"/><stop offset=".55" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>
    <filter id="${id}s" x="-35%" y="-35%" width="170%" height="185%"><feDropShadow dx="0" dy="3" stdDeviation="2.1" flood-color="#504338" flood-opacity=".15"/></filter>
  </defs>`;
  const shapes={
    account:id=>`
      <circle cx="32" cy="23" r="11" fill="url(#${id}a)"/>
      <circle cx="32" cy="23" r="6.4" fill="#F7FBFF" opacity=".95"/>
      <path d="M14 53c1-15 8-22 18-22s17 7 18 22Z" fill="url(#${id}a)"/>
      <path d="M20 43c6-6 18-6 24 0" fill="none" stroke="#fff" stroke-opacity=".58" stroke-width="2.2" stroke-linecap="round"/>`,
    notification:id=>`
      <path d="M32 10c-9 0-15 7-15 16v10c0 5-2 8-6 12h42c-4-4-6-7-6-12V26c0-9-6-16-15-16Z" fill="url(#${id}a)"/>
      <path d="M19 24c2-6 6-9 12-10" fill="none" stroke="#FFF8C9" stroke-width="2.3" stroke-linecap="round" opacity=".88"/>
      <path d="M13 48h38" stroke="#E39B27" stroke-width="3" stroke-linecap="round"/>
      <path d="M26 50c1 4 3 6 6 6s5-2 6-6Z" fill="#E29925"/>
      <circle cx="48" cy="18" r="6" fill="#FF8D69"/><circle cx="46" cy="16" r="1.8" fill="#FFD6C9"/>`,
    location:id=>`
      <path d="M32 8c-11 0-20 8-20 19 0 14 20 29 20 29s20-15 20-29C52 16 43 8 32 8Z" fill="url(#${id}a)"/>
      <circle cx="32" cy="27" r="9" fill="#F7FFF3"/>
      <circle cx="32" cy="27" r="4.5" fill="#5FAE5C"/>
      <path d="M19 20c3-5 8-8 13-8" fill="none" stroke="#F2FFE9" stroke-width="2.2" stroke-linecap="round" opacity=".78"/>`,
    privacy:id=>`
      <path d="M32 8 51 15v15c0 13-8 22-19 27C21 52 13 43 13 30V15Z" fill="url(#${id}a)"/>
      <path d="M20 19c7-4 15-5 24-1" fill="none" stroke="#EEFFE8" stroke-width="2.2" stroke-linecap="round" opacity=".72"/>
      <path d="m23 32 6 6 13-15" fill="none" stroke="#F8FFF6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    help:id=>`
      <circle cx="32" cy="32" r="23" fill="url(#${id}a)"/>
      <circle cx="32" cy="32" r="16" fill="#F8FBFF" opacity=".96"/>
      <g transform="translate(32 33) scale(.82) translate(-32 -33)">
        <path d="M25 26c1-5 4-8 9-8 5 0 9 3 9 8 0 4-2 6-6 8-3 2-4 3-4 7" fill="none" stroke="#6796E1" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="33" cy="47" r="2.3" fill="#6796E1"/>
      </g>
      <path d="M19 21c4-6 10-9 17-8" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>`,
    about:id=>`
      <circle cx="32" cy="32" r="23" fill="url(#${id}a)"/>
      <circle cx="32" cy="32" r="16" fill="#FAF7FF" opacity=".96"/>
      <g transform="translate(32 34) scale(.8) translate(-32 -34)">
        <circle cx="32" cy="22" r="2.8" fill="#8A70D7"/>
        <path d="M32 29v18" stroke="#8A70D7" stroke-width="4" stroke-linecap="round"/>
      </g>
      <path d="M19 21c4-6 10-9 17-8" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>`
  };
  function render(name,extra=''){
    const key=shapes[name]?name:'about';
    const id='st'+(++seq);
    return `<svg class="settings-soft3d-icon ${extra}" viewBox="0 0 64 64" aria-hidden="true">${defs(id,palettes[key])}<g filter="url(#${id}s)">${shapes[key](id)}</g></svg>`;
  }
  return {render,names:Object.freeze(Object.keys(shapes))};
});
