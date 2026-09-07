"""Drawer V3.5: native CDP touch, wheel, routing and screenshots.
Chromium emulation only. No physical iOS/Android validation is implied.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from PIL import Image,ImageChops
import json
R=Path(__file__).resolve().parents[1];OUT=R/'tests/v35';OUT.mkdir(exist_ok=True)
res={'version':'V3.5','environment':'Chromium headless, standalone set_content, native CDP touch and wheel; not physical devices','checks':[],'viewports':[],'errors':[],'console_errors':[]}
def save(): (OUT/'drawer-scroll-audit.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
def mark(name,**details): res['checks'].append({'name':name,'result':'PASS',**details});save();print(name,flush=True)
def rt(pg,r):pg.wait_for_function("r=>document.querySelector('.screen')?.dataset.route===r",arg=r)
def opened(pg):
 if pg.locator('#drawer').get_attribute('data-state')=='closed':
  if pg.locator('[data-action="drawer-open"]').count():pg.locator('[data-action="drawer-open"]').click()
  else:
   pg.mouse.move(2,300);pg.mouse.down()
   for x in [30,70,110,150,190,230,270]:pg.mouse.move(x,300);pg.wait_for_timeout(25)
   pg.mouse.up()
 pg.wait_for_timeout(330);assert pg.locator('#drawer').get_attribute('data-state')=='open'
def close(pg):
 if pg.locator('#drawer').get_attribute('data-state')!='closed':pg.locator('#drawer [data-action="drawer-close"]').click()
 pg.wait_for_function("()=>drawer.dataset.state==='closed'")
def pos(pg):return pg.locator('#drawerScroll').evaluate('e=>e.scrollTop')
def top(pg):pg.locator('#drawerScroll').evaluate('e=>e.scrollTop=0');pg.wait_for_timeout(80)
def assert_closed(pg):
 pg.wait_for_function("()=>drawer.dataset.state==='closed'")
 d=pg.evaluate('''()=>{const r=drawer.getBoundingClientRect(),s=getComputedStyle(drawer),m=mainViewport.getBoundingClientRect();return {right:r.right,visible:s.visibility,shadow:s.boxShadow,pointer:s.pointerEvents,inert:drawer.inert,x:m.x,mRight:m.right,width:innerWidth,radius:getComputedStyle(mainViewport).borderRadius}}''')
 assert abs(d['right'])<.1 and d['visible']=='hidden' and d['shadow']=='none' and d['pointer']=='none' and d['inert'],d
 assert abs(d['x'])<.1 and abs(d['mRight']-d['width'])<.1 and d['radius']=='0px',d
 return d
def single(pg):
 a=pg.locator('#drawer').evaluate("d=>[...d.querySelectorAll('*')].filter(e=>['auto','scroll'].includes(getComputedStyle(e).overflowY)).map(e=>e.id||e.className)")
 assert a==['drawerScroll'],a
def swipe(pg,cdp,x,y,dx,dy):
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
 for i in range(1,17):
  cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx*i/16,'y':y+dy*i/16,'id':1}]});pg.wait_for_timeout(20)
 pg.wait_for_timeout(100);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});pg.wait_for_timeout(430)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':568},is_mobile=True,has_touch=True,device_scale_factor=2)
 pg=ctx.new_page();pg.set_default_timeout(5000);pg.on('pageerror',lambda e:res['errors'].append(str(e)));pg.on('console',lambda m:res['console_errors'].append(m.text) if m.type=='error' else None)
 pg.set_content((R/'dist/index.html').read_text());pg.locator('#loginConsent').check();pg.get_by_role('button',name='微信登录',exact=True).click();pg.locator('[data-action="finish-login"]').click();rt(pg,'home');pg.wait_for_timeout(380)
 assert_closed(pg);opened(pg);single(pg)
 assert pg.locator('.drawer-history,.drawer-bottom,.v3-drawer-shortcuts,.v3-vip-card').count()==0
 assert pg.locator('.v35-account-bar').evaluate('e=>e.getBoundingClientRect().height')==76
 mark('单一原生滚动容器，76px固定账号栏；旧固定会员、大快捷卡和底栏移除')
 cdp=ctx.new_cdp_session(pg)
 for sel,label in [('.v35-membership','会员条'),('.v35-services button','功能入口'),('.v35-history-row','对话记录')]:
  top(pg);box=pg.locator(sel).first.bounding_box();h=pg.locator('.v35-account-bar').bounding_box()['y'];y0=pg.locator('.v35-membership').bounding_box()['y'];bg=pg.locator('#aiScroll').evaluate('e=>e.scrollTop')
  y=box['y']+box['height']/2;swipe(pg,cdp,box['x']+box['width']/2,y,0,-min(118,y-80))
  delta=pos(pg);assert delta>8,(label,delta);rt(pg,'home');assert pg.locator('#drawer').get_attribute('data-state')=='open'
  assert abs(pg.locator('.v35-account-bar').bounding_box()['y']-h)<.1
  assert abs(pg.locator('.v35-membership').bounding_box()['y']-y0+delta)<1
  assert pg.locator('#aiScroll').evaluate('e=>e.scrollTop')==bg
  mark(label+'起手原生上滑：统一滚动、头部不动、不误跳转、不带动首页',delta=delta)
 top(pg);swipe(pg,cdp,200,340,15,-150);assert pos(pg)>30 and pg.locator('#drawer').get_attribute('data-state')=='open';mark('轻斜向上滑不误触关闭')
 before=pos(pg);swipe(pg,cdp,200,310,0,115);assert pos(pg)<before;mark('向下原生滚动可回到上部内容')
 top(pg);pg.mouse.move(110,206);pg.mouse.wheel(0,180);pg.wait_for_timeout(400);assert pos(pg)>30;rt(pg,'home');mark('功能卡区域鼠标滚轮滚动同一内容区')
 pg.locator('#drawerScroll').evaluate('e=>e.scrollTop=e.scrollHeight');pg.wait_for_timeout(100);bg=pg.locator('#aiScroll').evaluate('e=>e.scrollTop');swipe(pg,cdp,160,410,0,-100)
 assert bg==pg.locator('#aiScroll').evaluate('e=>e.scrollTop');rt(pg,'home');mark('滚动到底继续上滑不传递给首页')
 pg.locator('#drawer [data-action="feedback"]').scroll_into_view_if_needed();before=pos(pg)
 pg.locator('#drawer [data-action="feedback"]').click();rt(pg,'feedback');assert_closed(pg);pg.locator('#screenHost .back-btn').click();rt(pg,'home');opened(pg);assert abs(pos(pg)-before)<1
 mark('联系客服在滚动末端可达；返回恢复原展开状态和滚动位置',saved=before,restored=pos(pg))
 for route in ['task-center','messages','profile','settings','membership','archive','assessments','guides']:
  top(pg);pg.locator(f'#drawer [data-route="{route}"]').first.click();rt(pg,route);assert_closed(pg)
  if route=='settings':
   pg.locator('#screenHost [data-route="settings/account"]').click();rt(pg,'settings/account');pg.locator('#screenHost .back-btn').click();rt(pg,'settings');assert_closed(pg)
  pg.locator('#screenHost .back-btn').first.click();rt(pg,'home');opened(pg);assert pos(pg)<1
 mark('8类入口和设置三级页返回来源侧栏；停留在内页时抽屉隐藏')
 pg.locator('#drawer [data-route="guides"]').click();rt(pg,'guides');pg.locator('[data-action="guide-category"]').first.click();pg.wait_for_function("()=>document.querySelector('.screen').dataset.route.startsWith('guides/category/')")
 category=pg.locator('.screen').get_attribute('data-route');pg.locator('#screenHost [data-route^="guides/detail/"]').first.click();pg.wait_for_function("()=>document.querySelector('.screen').dataset.route.startsWith('guides/detail/')")
 pg.locator('#screenHost .page-titlebar .back-btn').click();rt(pg,category);assert_closed(pg);pg.locator('#screenHost .back-btn').click();rt(pg,'guides');pg.locator('#screenHost .back-btn').click();rt(pg,'home');opened(pg)
 mark('指南分类和文章按真实层级返回，仅回到来源首页时恢复侧栏')
 pg.locator('.v35-history-row[data-index="1"]').click();rt(pg,'home');assert_closed(pg);expect(pg.locator('.chat-message').last).to_contain_text('孩子一直玩手机');opened(pg)
 assert pg.locator('.v35-history-row[aria-current="true"]').count()==1 and pg.locator('.v35-history-row[aria-current="true"]').get_attribute('data-index')=='1'
 mark('历史记录直接进入聊天、当前项高亮，没有装饰点和日期分组')
 close(pg);pg.locator('[data-action="chat-home"]').click();pg.locator('#aiScroll').evaluate('e=>e.scrollTop=140');pg.locator('#chatInput').fill('尚未发送的草稿');bg=pg.locator('#aiScroll').evaluate('e=>e.scrollTop')
 opened(pg);top(pg);pg.locator('#drawer [data-route="archive"]').click();rt(pg,'archive');pg.locator('#screenHost .back-btn').click();rt(pg,'home');opened(pg);pg.wait_for_timeout(100)
 assert pg.locator('#chatInput').input_value()=='尚未发送的草稿' and abs(pg.locator('#aiScroll').evaluate('e=>e.scrollTop')-bg)<1
 mark('从侧栏往返保留首页滚动位置及未发送草稿')
 swipe(pg,cdp,290,315,-250,0);assert_closed(pg);swipe(pg,cdp,3,310,250,0);opened(pg);close(pg);swipe(pg,cdp,3,310,50,0);assert_closed(pg)
 mark('原生触摸横滑关闭、左缘打开、短拖回收；无残余白边')
 for w,h in [(320,568),(360,640),(375,667),(390,675),(390,844),(430,932),(517,675),(768,675),(390,425)]:
  close(pg);pg.set_viewport_size({'width':w,'height':h});assert_closed(pg);opened(pg);top(pg);single(pg)
  v=pg.evaluate('''()=>{let d=drawer.getBoundingClientRect(),s=drawerScroll,h=document.querySelector('.v35-account-bar');return {width:innerWidth,height:innerHeight,drawerWidth:d.width,headerHeight:h.getBoundingClientRect().height,scrollHeight:s.scrollHeight,clientHeight:s.clientHeight,horizontalOverflow:s.scrollWidth>s.clientWidth,headerOverflow:h.scrollWidth>d.width}}''')
  assert not v['horizontalOverflow'] and not v['headerOverflow'],v
  assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
  pg.locator('#drawerScroll').evaluate('e=>e.scrollTop=e.scrollHeight');r=pg.locator('#drawer [data-action="feedback"]').bounding_box();assert r['y']>=76 and r['y']+r['height']<=h+1,(v,r)
  res['viewports'].append(v);save()
 mark('9组宽高：无横向溢出、紧凑头部不挤出、末端客服始终可达')
 close(pg);pg.set_viewport_size({'width':390,'height':675});pg.add_style_tag(content=':root{--safe-top:47px;--safe-bottom:34px;}');opened(pg);top(pg)
 assert pg.locator('.v35-account-bar').evaluate('e=>e.getBoundingClientRect().height')==123
 pg.locator('#drawerScroll').evaluate('e=>e.scrollTop=e.scrollHeight');r=pg.locator('#drawer [data-action="feedback"]').bounding_box();assert r['y']+r['height']<=641
 mark('47px顶部与34px底部安全区模拟无遮挡（非实机测试）')
 pg.add_style_tag(content=':root{--safe-top:0px;--safe-bottom:0px;}');close(pg)
 # Race test intentionally dispatches overlapping handler calls, not real taps.
 pg.evaluate("""async()=>{for(let i=0;i<8;i++){document.querySelector('[data-action="drawer-open"]').click();await new Promise(r=>setTimeout(r,35));document.querySelector('#drawer [data-action="drawer-close"]').click();await new Promise(r=>setTimeout(r,35));}}""")
 assert_closed(pg);mark('8次快速开合后隐藏状态与几何保持正确')
 pg.emulate_media(reduced_motion='reduce');opened(pg);close(pg);assert_closed(pg);mark('减少动态效果模式下开合正常')
 assert not res['errors'] and not res['console_errors'],res
 b.close()
res['passed']=len(res['checks']);save();print(json.dumps({'passed':res['passed'],'viewports':len(res['viewports']),'errors':res['errors'],'console_errors':res['console_errors']},ensure_ascii=False))
