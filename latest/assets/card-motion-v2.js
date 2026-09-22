(function(root){
'use strict';
const QUALITY={
  ultra:{duration:1320,tilt:4,particles:8,idle:true,foil:true},
  normal:{duration:1140,tilt:3,particles:5,idle:true,foil:true},
  lite:{duration:820,tilt:1.5,particles:0,idle:false,foil:false},
  reduced:{duration:180,tilt:0,particles:0,idle:false,foil:false}
};
function detectQuality(){
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return 'reduced';
  const mem=Number(navigator.deviceMemory||0),cores=Number(navigator.hardwareConcurrency||0);
  if((mem&&mem<=4)||(cores&&cores<=4))return 'lite';
  return 'ultra';
}
let quality=detectQuality();
document.body?.setAttribute('data-card-motion-quality',quality);
function q(){return QUALITY[quality]||QUALITY.ultra}
function setQuality(next){
  quality=QUALITY[next]?next:detectQuality();
  document.body?.setAttribute('data-card-motion-quality',quality);
  return quality;
}
function resetTilt(scene){scene?.style.setProperty('--tilt-x','0deg');scene?.style.setProperty('--tilt-y','0deg')}
function applyTilt(scene,e){
  const max=q().tilt;if(!scene||!max||scene.dataset.busy==='1')return;
  const r=scene.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
  scene.style.setProperty('--tilt-y',(px*max*2).toFixed(2)+'deg');
  scene.style.setProperty('--tilt-x',(-py*max*2).toFixed(2)+'deg');
}
let activeScene=null,activePointer=null;
document.addEventListener('pointerdown',e=>{
  const scene=e.target.closest?.('.motion-card-scene[data-motion-interactive="1"]');if(!scene)return;
  activeScene=scene;activePointer=e.pointerId;scene.classList.add('is-pressed');applyTilt(scene,e);
});
document.addEventListener('pointermove',e=>{if(activeScene&&e.pointerId===activePointer)applyTilt(activeScene,e)});
function endPointer(e){
  if(!activeScene||e.pointerId!==activePointer)return;
  activeScene.classList.remove('is-pressed');resetTilt(activeScene);activeScene=null;activePointer=null;
}
document.addEventListener('pointerup',endPointer);document.addEventListener('pointercancel',endPointer);
function resetScene(scene){
  scene.getAnimations({subtree:true}).forEach(a=>{
    if(typeof CSSAnimation!=='undefined'&&a instanceof CSSAnimation)return;
    a.cancel();
  });
  scene.dataset.busy='0';scene.classList.remove('flipped','revealed','is-lifted','idle-glint','past-midpoint');resetTilt(scene);
  scene.querySelectorAll('.star-particle').forEach(x=>x.remove());
  scene.querySelectorAll('.reveal-item').forEach(x=>{x.style.opacity='';x.style.transform=''});
}
function replay(scene){resetScene(scene);setTimeout(()=>flip(scene),110)}
function animateTurnLighting(scene,dur){
  const shadow=scene.querySelector('.turn-ground-shadow');
  const rim=scene.querySelector('.edge-flash');
  const flipper=scene.querySelector('.motion-card-flipper');
  shadow?.animate(
    [
      {opacity:.20,transform:'translateY(0) scaleX(1)',offset:0},
      {opacity:.15,transform:'translateY(5px) scaleX(.76)',offset:.28},
      {opacity:.075,transform:'translateY(10px) scaleX(.42)',offset:.52},
      {opacity:.14,transform:'translateY(6px) scaleX(.72)',offset:.72},
      {opacity:.19,transform:'translateY(1px) scaleX(.98)',offset:1}
    ],
    {duration:dur,easing:'linear'}
  );
  rim?.animate(
    [
      {opacity:0,transform:'translateX(-50%) scaleY(.88)',offset:0},
      {opacity:0,offset:.36},
      {opacity:.28,offset:.42},
      {opacity:1,transform:'translateX(-50%) scaleY(1)',offset:.52},
      {opacity:.34,offset:.58},
      {opacity:0,transform:'translateX(-50%) scaleY(.92)',offset:.67},
      {opacity:0,offset:1}
    ],
    {duration:dur,easing:'linear'}
  );
  // Keep filters off the 3D flipper: filters can flatten the preserve-3d tree
  // and expose the opposite face as mirrored text on some WebKit/Blink paths.
}
function frontLightSweep(scene){
  const bloom=scene.querySelector('.reveal-bloom');
  const sheen=scene.querySelector('.reveal-sheen');
  if(quality!=='lite'){
    bloom?.animate(
      [
        {opacity:0,transform:'scale(.90)',offset:0},
        {opacity:.58,transform:'scale(.98)',offset:.22},
        {opacity:.34,transform:'scale(1.035)',offset:.58},
        {opacity:0,transform:'scale(1.08)',offset:1}
      ],
      {duration:640,easing:'cubic-bezier(.18,.68,.22,1)'}
    );
  }
  sheen?.animate(
    [
      {opacity:0,transform:'translateX(-18%) rotate(8deg)',offset:0},
      {opacity:.18,offset:.16},
      {opacity:.86,transform:'translateX(72%) rotate(8deg)',offset:.48},
      {opacity:.24,offset:.72},
      {opacity:0,transform:'translateX(164%) rotate(8deg)',offset:1}
    ],
    {duration:700,easing:'cubic-bezier(.18,.72,.18,1)'}
  );
}
function flip(scene){
  if(scene.dataset.busy==='1')return;
  const cfg=q(),stageDur=scene.closest('.card-reveal-layer')?600:cfg.duration,dur=stageDur,flipper=scene.querySelector('.motion-card-flipper'),tiltEl=scene.querySelector('.motion-card-tilt');
  scene.dataset.stageTiming=scene.closest('.card-reveal-layer')?'600':'engine';
  scene.dataset.busy='1';scene.classList.add('is-lifted');
  if(quality==='reduced'){
    setTimeout(()=>{scene.classList.add('flipped','revealed','past-midpoint');scene.classList.remove('is-lifted');scene.dataset.busy='0'},30);return;
  }

  scene.classList.add('flipped');
  flipper.animate(
    [
      {transform:'rotateY(0deg)',offset:0,easing:'cubic-bezier(.24,.55,.25,1)'},
      {transform:'rotateY(58deg)',offset:.32,easing:'cubic-bezier(.35,.15,.35,1)'},
      {transform:'rotateY(90deg)',offset:.52,easing:'cubic-bezier(.42,0,.25,1)'},
      {transform:'rotateY(118deg)',offset:.66,easing:'cubic-bezier(.20,.60,.20,1)'},
      {transform:'rotateY(158deg)',offset:.84,easing:'cubic-bezier(.20,.70,.18,1)'},
      {transform:'rotateY(180deg)',offset:1}
    ],
    {duration:dur,easing:'linear',fill:'both'}
  );
  tiltEl?.animate(
    [
      {transform:'translateY(-7px) translateZ(0) scale(1.022)',offset:0},
      {transform:'translateY(-10px) translateZ(10px) scale(1.032)',offset:.28},
      {transform:'translateY(-12px) translateZ(20px) scale(1.045)',offset:.50},
      {transform:'translateY(-8px) translateZ(8px) scale(1.028)',offset:.74},
      {transform:'translateY(-4px) translateZ(0) scale(1.010)',offset:1}
    ],
    {duration:dur,easing:'cubic-bezier(.2,.62,.22,1)',fill:'both'}
  );
  animateTurnLighting(scene,dur);

  setTimeout(()=>scene.classList.add('past-midpoint'),Math.round(dur*.515));
  setTimeout(()=>scene.classList.add('revealed'),Math.round(dur*.64));
  setTimeout(()=>frontLightSweep(scene),Math.round(dur*.70));
  const signatureDelay=quality==='ultra'?dur+300:quality==='normal'?dur+260:dur+180;
  setTimeout(()=>signature(scene,dur),signatureDelay);

  setTimeout(()=>{
    scene.classList.remove('is-lifted');
    tiltEl?.animate(
      [
        {transform:'translateY(-4px) translateZ(0) scale(1.010)'},
        {transform:'translateY(1px) translateZ(0) scale(.996)',offset:.56},
        {transform:'translateY(0) translateZ(0) scale(1)'}
      ],
      {duration:340,easing:'cubic-bezier(.2,.8,.2,1)'}
    );
    setTimeout(()=>{scene.dataset.busy='0'},340);
  },dur);
}
function signature(scene,dur){
  const type=scene.dataset.type;
  if(type==='interpretation')scanFx(scene,dur);
  if(type==='action')trailFx(scene,dur);
  if(type==='strength')starFx(scene,dur);
  if(type==='mirror')mirrorFx(scene,dur);
  if(type==='repair')repairFx(scene,dur);
}
function scanFx(scene,dur){
  scene.querySelector('.sig-scan').animate(
    [
      {opacity:0,transform:'translateY(-28px) scaleX(.72)'},
      {opacity:1,transform:'translateY(18px) scaleX(1)',offset:.18},
      {opacity:1,transform:'translateY(158px) scaleX(1)',offset:.72},
      {opacity:0,transform:'translateY(250px) scaleX(.86)'}
    ],
    {duration:900,easing:'cubic-bezier(.18,.72,.2,1)'}
  );
  ringFx(scene,'rgba(130,175,255,.68)',2);
}
function trailFx(scene,dur){
  scene.querySelector('.sig-trail').animate(
    [
      {opacity:0,transform:'translate(-35px,30px) rotate(-27deg) scaleX(.24)'},
      {opacity:1,offset:.20},
      {opacity:1,offset:.68},
      {opacity:0,transform:'translate(170px,-98px) rotate(-27deg) scaleX(1.4)'}
    ],
    {duration:820,easing:'cubic-bezier(.12,.74,.18,1)'}
  );
  scene.querySelector('.front-icon').animate(
    [{transform:'scale(.78)'},{transform:'scale(1.16)',offset:.55},{transform:'scale(1)'}],
    {duration:680,easing:'cubic-bezier(.2,.78,.2,1)'}
  );
}
function starFx(scene,dur){
  const n=q().particles;if(!n)return;
  const layer=scene.querySelector('.signature-layer'),angles=[-90,-55,-22,12,48,82,120,155,195,235,278,322];
  for(let i=0;i<n;i++){
    const s=document.createElement('i');s.className='star-particle';layer.appendChild(s);
    const a=angles[i%angles.length]*Math.PI/180,r=30+(i%4)*9,dx=Math.cos(a)*r,dy=Math.sin(a)*r;
    s.animate(
      [{opacity:0,transform:'translate(0,0) rotate(45deg) scale(.2)'},{opacity:1,offset:.18},{opacity:.82,offset:.55},{opacity:0,transform:'translate('+dx+'px,'+dy+'px) rotate(135deg) scale(1.15)'}],
      {duration:760+(i%3)*90,delay:i*28,easing:'cubic-bezier(.16,.74,.22,1)'}
    ).onfinish=()=>s.remove();
  }
  scene.querySelector('.front-icon').animate(
    [
      {filter:'drop-shadow(0 0 0 rgba(210,175,255,0))',transform:'scale(.94)'},
      {filter:'drop-shadow(0 0 24px rgba(210,175,255,.88))',transform:'scale(1.10)',offset:.46},
      {filter:'drop-shadow(0 0 0 rgba(210,175,255,0))',transform:'scale(1)'}
    ],
    {duration:940,easing:'ease-out'}
  );
}
function mirrorFx(scene,dur){
  scene.querySelector('.sig-caustic').animate(
    [
      {opacity:0,transform:'translateX(-78%) rotate(4deg) scaleX(.86)'},
      {opacity:1,offset:.28},
      {opacity:.92,offset:.70},
      {opacity:0,transform:'translateX(78%) rotate(4deg) scaleX(1.08)'}
    ],
    {duration:980,easing:'cubic-bezier(.22,.62,.22,1)'}
  );
  ringFx(scene,'rgba(128,205,255,.64)',2);
}
function repairFx(scene,dur){
  scene.querySelector('.sig-mend').animate(
    [
      {opacity:0,transform:'scaleY(1.45)'},
      {opacity:1,transform:'scaleY(1)',offset:.24},
      {opacity:1,transform:'scaleY(.54)',offset:.72},
      {opacity:0,transform:'scaleY(.04)'}
    ],
    {duration:980,easing:'cubic-bezier(.25,.7,.2,1)'}
  );
  scene.querySelector('.front-icon').animate(
    [{transform:'scale(.84)'},{transform:'scale(1.13)',offset:.58},{transform:'scale(1)'}],
    {duration:760,easing:'cubic-bezier(.2,.78,.2,1)'}
  );
}
function ringFx(scene,color,count=2){
  if(quality==='lite')return;
  [...scene.querySelectorAll('.ring')].slice(0,count).forEach((r,i)=>{
    r.style.borderColor=color;
    r.animate(
      [{opacity:0,transform:'scale(.48)'},{opacity:.58,offset:.24},{opacity:.28,offset:.64},{opacity:0,transform:'scale('+(1.45+i*.30)+')'}],
      {duration:760+i*120,delay:i*90,easing:'cubic-bezier(.2,.7,.2,1)'}
    );
  });
}

function flipAsync(scene){
  if(!scene)return Promise.resolve();
  flip(scene);
  const delay=quality==='reduced'?200:(scene.closest('.card-reveal-layer')?600:q().duration)+390;
  return new Promise(resolve=>setTimeout(resolve,delay));
}
function staticFront(scene){
  if(!scene)return;
  scene.dataset.busy='0';
  scene.classList.add('flipped','revealed','past-midpoint');
  scene.removeAttribute('data-motion-interactive');
}
function practiceOut(el,type){
  if(!el||quality==='reduced')return Promise.resolve();
  const host=el.closest('.cp-motion-host')||el;
  const d=Math.max(360,Math.round(q().duration*.52));
  const shadow=host.querySelector('.cp-practice-shadow');
  shadow?.animate([{opacity:.18,transform:'scaleX(1)'},{opacity:.07,transform:'scaleX(.42)'}],{duration:d,easing:'ease-out',fill:'forwards'});
  const a=el.animate([
    {transform:'perspective(1100px) rotateY(0deg) translateY(0) scale(1)',opacity:1},
    {transform:'perspective(1100px) rotateY(58deg) translateY(-7px) scale(1.025)',opacity:1,offset:.62},
    {transform:'perspective(1100px) rotateY(90deg) translateY(-9px) scale(1.035)',opacity:.96}
  ],{duration:d,easing:'cubic-bezier(.22,.62,.22,1)',fill:'forwards'});
  return a.finished.catch(()=>{});
}
function practiceIn(el,type){
  if(!el)return;
  if(quality==='reduced'){el.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});return;}
  const host=el.closest('.cp-motion-host')||el.parentElement;
  const light=document.createElement('i');light.className='cp-practice-reveal-light '+(type||'');host?.appendChild(light);
  el.animate([
    {transform:'perspective(1100px) rotateY(-90deg) translateY(-9px) scale(1.035)',opacity:.96},
    {transform:'perspective(1100px) rotateY(-28deg) translateY(-5px) scale(1.018)',opacity:1,offset:.48},
    {transform:'perspective(1100px) rotateY(0deg) translateY(0) scale(1)',opacity:1}
  ],{duration:520,easing:'cubic-bezier(.18,.72,.18,1)'});
  light.animate([
    {opacity:0,transform:'translateX(-45%) rotate(8deg)'},
    {opacity:.75,offset:.34},
    {opacity:.32,offset:.65},
    {opacity:0,transform:'translateX(145%) rotate(8deg)'}
  ],{duration:650,easing:'cubic-bezier(.18,.72,.18,1)'}).finished.finally(()=>light.remove());
}
root.QZLCardMotion={flip:flipAsync,reset:resetScene,staticFront,practiceOut,practiceIn,setQuality,getQuality:()=>quality};
})(typeof globalThis!=='undefined'?globalThis:this);
