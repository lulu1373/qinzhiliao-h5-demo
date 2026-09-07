from pathlib import Path
from playwright.sync_api import sync_playwright
from hashlib import sha256
import json,time

SOURCE=Path('/mnt/data/亲智聊-H5-App-Demo-V3.2-无边缘残影版.html')
OUT=Path('/mnt/data/qzl_drawer_diagnosis')
HTML=SOURCE.read_text(encoding='utf-8')
RESULT={'source':str(SOURCE),'source_sha256_before':sha256(SOURCE.read_bytes()).hexdigest(),'measurements':[],'errors':[],'method':'Read original V3.2, real login, computed-style/bounds measurement and temporary DevTools layer isolation. No product files modified.'}

MEASURE='''() => {
 const ids=['appFrame','mainViewport','screenHost','drawer','drawerScrim','edgeHandle'];
 const data={viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth},route:document.querySelector('section.screen[data-route]')?.dataset.route};
 for(const id of ids){
   const e=document.getElementById(id); if(!e)continue;
   const r=e.getBoundingClientRect(),s=getComputedStyle(e);
   data[id]={x:r.x,right:r.right,y:r.y,width:r.width,height:r.height,offsetWidth:e.offsetWidth,transform:s.transform,boxShadow:s.boxShadow,borderRadius:s.borderRadius,zIndex:s.zIndex,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,boxSizing:s.boxSizing,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage};
 }
 data.leftEdgeHits=[1,4,7,8,10,15,30,60].map(x=>({x,elements:document.elementsFromPoint(x,400).slice(0,6).map(e=>e.id||e.className||e.tagName)}));
 return data;
}'''

def measure(page,label):
 data=page.evaluate(MEASURE);data['label']=label;RESULT['measurements'].append(data);(OUT/'measurements.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2),encoding='utf-8');return data

def shot(page,name):
 page.screenshot(path=str(OUT/(name+'.png')),animations='disabled')

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
 page.set_default_timeout(6000)
 page.on('pageerror',lambda e:RESULT['errors'].append(str(e)))
 page.set_content(HTML,wait_until='load')
 page.wait_for_timeout(450)
 measure(page,'login-original-closed')
 page.locator('#loginConsent').check()
 page.get_by_role('button',name='微信登录',exact=True).click()
 page.locator('[data-action="finish-login"]').click()
 page.wait_for_function("()=>document.querySelector('section.screen[data-route]')?.dataset.route==='home'",timeout=10000)
 page.wait_for_timeout(500)
 measure(page,'home-original-closed-before-any-drawer-use')
 shot(page,'01-original-closed')
 # Freeze decorative animations for pixel-level A/B checks; no source file writes.
 page.add_style_tag(content='* { animation:none !important; transition:none !important; }')
 # 1. Remove only shadow: does the pale strip itself remain?
 page.evaluate("document.getElementById('drawer').style.setProperty('box-shadow','none','important')")
 measure(page,'home-drawer-shadow-only-hidden')
 shot(page,'02-shadow-removed-only')
 page.evaluate("document.getElementById('drawer').style.removeProperty('box-shadow')")
 # 2. Hide only drawer: if whole strip disappears it is attributable to drawer.
 page.evaluate("document.getElementById('drawer').style.setProperty('visibility','hidden','important')")
 measure(page,'home-drawer-only-hidden')
 shot(page,'03-drawer-hidden-only')
 page.evaluate("document.getElementById('drawer').style.removeProperty('visibility')")
 # 3. Move by its own width, while keeping original shadow.
 page.evaluate("document.getElementById('drawer').style.setProperty('transform','translate3d(-100%,0,0)','important')")
 measure(page,'home-transform-by-own-width-shadow-retained')
 shot(page,'04-self-width-shadow-retained')
 # 4. Alignment + no shadow: a diagnostic, not a release edit.
 page.evaluate("document.getElementById('drawer').style.setProperty('box-shadow','none','important')")
 measure(page,'home-transform-by-own-width-no-shadow')
 shot(page,'05-self-width-no-shadow')
 # Restore all three temporary inline overrides and let the app reapply original behavior.
 page.evaluate("const d=document.getElementById('drawer'); d.style.removeProperty('box-shadow');d.style.removeProperty('transform');d.style.removeProperty('visibility')")
 page.locator('[data-action="drawer-open"]').click()
 measure(page,'drawer-open-original')
 shot(page,'06-drawer-open')
 page.locator('#drawer [data-action="drawer-close"]').click()
 measure(page,'home-after-original-open-close')
 shot(page,'07-original-after-close')
 # Geometry diagnostics at varying widths: invoke real handlers programmatically,
 # because after resize a stale closed drawer may intercept the menu's pointer hit.
 for w in [320,360,375,390,430,440,441,450,517,768]:
  page.set_viewport_size({'width':w,'height':844})
  page.locator('[data-action="drawer-open"]').evaluate('(e)=>e.click()')
  page.locator('#drawer [data-action="drawer-close"]').evaluate('(e)=>e.click()')
  measure(page,f'width-{w}-after-original-open-close')
 # After an orientation change without any opening/closing, inline offset can be stale.
 page.set_viewport_size({'width':390,'height':844})
 page.locator('[data-action="drawer-open"]').evaluate('(e)=>e.click()')
 page.locator('#drawer [data-action="drawer-close"]').evaluate('(e)=>e.click()')
 page.set_viewport_size({'width':768,'height':844})
 measure(page,'resized-390-to-768-without-drawer-recompute')
 # Return to 390 and recalc before testing a second-level page.
 page.set_viewport_size({'width':390,'height':844})
 page.locator('[data-action="drawer-open"]').evaluate('(e)=>e.click()');page.locator('#drawer [data-action="drawer-close"]').evaluate('(e)=>e.click()')
 page.locator('#mainViewport [data-route="task-center"]').first.click()
 page.wait_for_function("()=>document.querySelector('section.screen[data-route]')?.dataset.route==='task-center'")
 measure(page,'task-center-original-closed')
 shot(page,'08-task-center-original')
 browser.close()

RESULT['source_sha256_after']=sha256(SOURCE.read_bytes()).hexdigest()
RESULT['source_unchanged']=RESULT['source_sha256_before']==RESULT['source_sha256_after']
(OUT/'measurements.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2),encoding='utf-8')
for r in RESULT['measurements']:
 print(r['label'], 'viewport',r['viewport']['width'],'drawerW',r['drawer']['width'],'drawerX',r['drawer']['x'],'drawerRight',r['drawer']['right'],'mainX',r['mainViewport']['x'])
print('ERRORS',RESULT['errors'])
print('SOURCE UNCHANGED',RESULT['source_unchanged'])
