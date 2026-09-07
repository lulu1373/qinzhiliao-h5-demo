from pathlib import Path
from playwright.sync_api import sync_playwright
from hashlib import sha256
from PIL import Image, ImageChops
import json,sys,time

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/index.html').read_text(encoding='utf-8')
OUT=ROOT/'tests/drawer-v34'
OUT.mkdir(exist_ok=True)
RESULT={'version':'V3.4','environment':'Chromium headless; browser mobile-size rendering, not physical iOS/Android devices','cases':[],'page_errors':[],'console_errors':[]}

SNAPSHOT='''() => {
 const d=document.getElementById('drawer'),m=document.getElementById('mainViewport'),f=document.getElementById('appFrame'),s=document.getElementById('drawerScrim');
 const ds=getComputedStyle(d), ms=getComputedStyle(m),r=d.getBoundingClientRect(),mr=m.getBoundingClientRect();
 return {route:document.querySelector('section.screen[data-route]')?.dataset.route,width:innerWidth,
 drawer:{width:r.width,x:r.x,right:r.right,transform:ds.transform,phase:d.dataset.state,visibility:ds.visibility,pointerEvents:ds.pointerEvents,shadow:ds.boxShadow,radius:ds.borderRadius,inert:d.hasAttribute('inert')},
 main:{x:mr.x,right:mr.right,radius:ms.borderRadius,transform:ms.transform},
 scrim:{opacity:getComputedStyle(s).opacity,active:s.classList.contains('active')},
 drawerHitAtLeft:[1,4,7,10,16].some(x=>document.elementsFromPoint(x,Math.min(400,innerHeight-10)).some(e=>e===d||d.contains(e)))};
}'''

def closed(page,label):
 page.wait_for_function("()=>document.getElementById('drawer').dataset.state==='closed'",timeout=1800)
 v=page.evaluate(SNAPSHOT)
 d,m=v['drawer'],v['main']
 assert abs(d['right'])<0.06,(label,'drawer right',d)
 assert d['visibility']=='hidden' and d['pointerEvents']=='none' and d['shadow']=='none' and d['inert'],(label,d)
 assert abs(m['x'])<0.06 and abs(m['right']-v['width'])<0.06 and m['radius']=='0px',(label,m)
 assert float(v['scrim']['opacity'])==0 and not v['scrim']['active'] and not v['drawerHitAtLeft'],(label,v)
 RESULT['cases'].append({'name':label,'result':'PASS','measurements':v})
 (OUT/'result.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2),encoding='utf-8')
 return v

def opened(page):
 page.wait_for_function("()=>['open','opening'].includes(document.getElementById('drawer').dataset.state)")
 page.wait_for_timeout(300)
 v=page.evaluate(SNAPSHOT)
 assert abs(v['drawer']['x'])<.1 and v['drawer']['visibility']=='visible' and v['drawer']['pointerEvents']=='auto',v
 assert not v['drawer']['inert'] and v['main']['x']>0 and float(v['scrim']['opacity'])>.2,v


def route(page,name):
 page.wait_for_function("r=>document.querySelector('section.screen[data-route]')?.dataset.route===r",arg=name,timeout=6000)

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
 page.set_default_timeout(5000)
 page.on('pageerror',lambda e:RESULT['page_errors'].append(str(e)))
 page.on('console',lambda m:RESULT['console_errors'].append(m.text) if m.type=='error' else None)
 page.set_content(HTML,wait_until='load')
 closed(page,'登录首屏，抽屉未使用')
 page.locator('#loginConsent').check()
 page.get_by_role('button',name='微信登录',exact=True).click()
 page.locator('[data-action="finish-login"]').click()
 route(page,'home')
 page.wait_for_timeout(420)
 closed(page,'首页首屏，抽屉未使用')
 page.screenshot(path=str(OUT/'01-home-closed.png'),animations='disabled')
 page.locator('[data-action="drawer-open"]').click();opened(page)
 page.screenshot(path=str(OUT/'02-drawer-open.png'),animations='disabled')
 page.locator('#drawer [data-action="drawer-close"]').click();closed(page,'点击关闭后')
 page.locator('[data-action="drawer-open"]').click();opened(page)
 page.mouse.click(382,420);closed(page,'点击遮罩关闭后')
 page.locator('[data-action="drawer-open"]').click();opened(page)
 page.keyboard.press('Escape');closed(page,'Esc 关闭后')
 # Real pointer drag open/close.
 page.mouse.move(2,410);page.mouse.down()
 for x in [30,65,100,140,185,230,270]:
  page.mouse.move(x,410);page.wait_for_timeout(25)
 page.mouse.up();opened(page)
 page.mouse.move(280,410);page.mouse.down()
 for x in [235,190,145,100,55,5]:
  page.mouse.move(x,410);page.wait_for_timeout(25)
 page.mouse.up();closed(page,'左缘打开→左拖关闭')
 # Short, slow drag does not reach open threshold.
 page.mouse.move(2,410);page.mouse.down()
 for x in [10,20,30,40,50,60,70]:
  page.mouse.move(x,410);page.wait_for_timeout(50)
 page.mouse.up();closed(page,'短距离拖拽松手回收')
 # Resizing with no open/close recomputation, which exposed an extra bug in V3.2.
 for w in [320,360,375,390,430,440,441,450,517,768]:
  page.set_viewport_size({'width':w,'height':844})
  closed(page,f'关闭时直接调整视口到 {w}px')
  page.locator('[data-action="drawer-open"]').click();opened(page)
  page.locator('#drawer [data-action="drawer-close"]').click()
  closed(page,f'{w}px 打开再关闭')
 page.set_viewport_size({'width':390,'height':844})
 # Route change through a drawer must not keep its shadow/layer alive.
 page.locator('[data-action="drawer-open"]').click();opened(page)
 page.locator('#drawer [data-route="task-center"]').click();route(page,'task-center')
 closed(page,'抽屉进入任务中心后')
 page.screenshot(path=str(OUT/'03-task-center-closed.png'),animations='disabled')
 page.locator('.page-titlebar .back-btn').click(position={'x':3,'y':24});route(page,'home')
 closed(page,'任务中心左缘返回按钮→首页')
 # Rapid handler alternation intentionally exercises transition/timer races, not human tap accuracy.
 page.evaluate('''async()=>{for(let i=0;i<8;i++){
 document.querySelector('[data-action="drawer-open"]').click();await new Promise(r=>setTimeout(r,35));
 document.querySelector('#drawer [data-action="drawer-close"]').click();await new Promise(r=>setTimeout(r,35));
 }}''')
 closed(page,'8 轮快速开关后，不被旧计时器或 RAF 重画')
 # Pixel comparison: actual closed state vs DevTools forced drawer invisibility.
 page.add_style_tag(content='*{animation:none!important;transition:none!important}')
 page.screenshot(path=str(OUT/'04-closed-control.png'))
 page.evaluate("document.getElementById('drawer').style.setProperty('display','none','important')")
 page.screenshot(path=str(OUT/'05-drawer-display-none-control.png'))
 a=Image.open(OUT/'04-closed-control.png').convert('RGB')
 b=Image.open(OUT/'05-drawer-display-none-control.png').convert('RGB')
 diff=ImageChops.difference(a,b)
 # Compare full screenshot, not only frame geometry.
 RESULT['pixel_isolation']={'bbox':diff.getbbox(),'identical':diff.getbbox() is None,'scope':'full viewport, closed drawer vs display:none'}
 assert diff.getbbox() is None,RESULT['pixel_isolation']
 page.evaluate("document.getElementById('drawer').style.removeProperty('display')")
 # Reduced motion must also settle without waiting for a missing transitionend.
 page.emulate_media(reduced_motion='reduce')
 page.locator('[data-action="drawer-open"]').click()
 page.locator('#drawer [data-action="drawer-close"]').click()
 closed(page,'减少动态效果模式关闭')
 browser.close()
assert not RESULT['page_errors'] and not RESULT['console_errors'],RESULT
RESULT['passed']=len(RESULT['cases'])
(OUT/'result.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':RESULT['passed'],'pixel_identical':RESULT['pixel_isolation']['identical'],'page_errors':RESULT['page_errors'],'console_errors':RESULT['console_errors']},ensure_ascii=False))
