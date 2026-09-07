from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops
import json, numpy as np
R=Path(__file__).resolve().parents[1]
HTML=(R/'dist/index.html').read_text(encoding='utf-8')
OUT=R/'tests/v37';OUT.mkdir(exist_ok=True)
STATE={
  'loggedIn':True,'consent':True,
  'user':{'name':'阳光妈妈','role':'母亲','phone':'13800000000','avatarImage':''},
  'chat':{'active':True,'scenario':'free','node':'done','typing':False,'reviewResult':None,'freeTurns':0,
          'messages':[({'role':'user','html':f'用户消息{i}：这是测试内容。','time':'14:00'} if i%2==0 else {'role':'ai','html':f'小亲回复{i}：继续聊下去。','time':'14:01'}) for i in range(18)]}
}
html=HTML.replace('let state=loadState();','let state=deepMerge(loadState(),'+json.dumps(STATE,ensure_ascii=False)+');',1)
res={'checks':[],'errors':[]}
def mark(name,detail=None):res['checks'].append({'name':name,'status':'PASS','detail':detail})
with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=b.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda e:res['errors'].append(str(e)));page.on('console',lambda m:res['errors'].append(m.text) if m.type=='error' else None)
  page.set_content(html);page.wait_for_timeout(120)
  # Profile
  page.evaluate("location.hash='#/profile'");page.wait_for_timeout(120)
  page.screenshot(path=str(OUT/'01-profile.png'))
  page.locator('[data-action="profile-role"]').click();assert page.locator('.bottom-sheet h2').inner_text()=='选择家庭身份'
  page.locator('[data-overlay-action="profile-role-select"][data-role="父亲"]').click();assert page.locator('[data-action="profile-role"] strong').inner_text()=='爸爸';mark('家庭身份改为固定选择')
  page.locator('[data-action="profile-avatar"]').click();assert page.locator('.bottom-sheet h2').inner_text()=='更换头像'
  with page.expect_file_chooser() as fc: page.locator('[data-overlay-action="profile-avatar-album"]').click()
  fc.value.set_files('/mnt/data/a3fd8209-e5cb-4611-a3be-518f4c84421b.png');page.wait_for_timeout(450)
  assert page.locator('.profile-avatar-img').get_attribute('src').startswith('data:image/jpeg');mark('头像更换界面与本地图片预览')
  page.screenshot(path=str(OUT/'02-profile-avatar-updated.png'))
  # Growth bottom
  page.evaluate("location.hash='#/growth'");page.wait_for_timeout(120);rows=page.locator('.action-record');assert rows.count()==3
  widths=[round(rows.nth(i).bounding_box()['width'],2) for i in range(rows.count())];assert max(widths)-min(widths)<.5,widths
  for i in range(rows.count()):
    st=rows.nth(i).evaluate("e=>getComputedStyle(e)") if False else rows.nth(i).evaluate("e=>({l:getComputedStyle(e).borderLeftWidth,r:getComputedStyle(e).borderRightWidth,t:getComputedStyle(e).borderTopWidth})")
    assert st=={'l':'0px','r':'0px','t':'0px'},st
  page.locator('.secondary-page').evaluate('e=>e.scrollTop=e.scrollHeight');page.wait_for_timeout(80);page.screenshot(path=str(OUT/'03-growth-bottom.png'));mark('成长记录三行等宽、无系统按钮边框',widths)
  # Drawer return visual stability
  page.evaluate("location.hash='#/home'");page.wait_for_timeout(120)
  page.locator('#chatInput').fill('草稿测试')
  page.evaluate("()=>{const a=document.getElementById('aiScroll');a.style.scrollBehavior='auto';a.scrollTop=a.scrollHeight;a.style.scrollBehavior='';}")
  page.locator('[data-action="drawer-open"]').click();page.wait_for_timeout(300);page.screenshot(path=str(OUT/'04-drawer-before.png'))
  before=page.evaluate("()=>({top:document.getElementById('aiScroll').scrollTop,draft:document.getElementById('chatInput').value})")
  page.locator('#drawer [data-route="task-center"]').click();page.wait_for_timeout(120);page.locator('.back-btn').click();page.wait_for_timeout(320);page.screenshot(path=str(OUT/'05-drawer-after.png'))
  after=page.evaluate("()=>({top:document.getElementById('aiScroll').scrollTop,draft:document.getElementById('chatInput').value,drawer:document.getElementById('drawer').dataset.state,cls:document.querySelector('.screen').className})")
  assert before['top']==after['top'],(before,after);assert before['draft']==after['draft'];assert after['drawer']=='open';assert 'page-enter' not in after['cls'];
  im1=Image.open(OUT/'04-drawer-before.png').convert('RGB');im2=Image.open(OUT/'05-drawer-after.png').convert('RGB');a=np.array(ImageChops.difference(im1.crop((345,0,390,844)),im2.crop((345,0,390,844))))
  assert int(a.max())==0,(a.mean(),a.max());mark('从功能页返回侧栏时，背后的聊天区域像素级不跳动',{'scrollTop':before['top'],'right_sliver_diff':0})
  b.close()
(R/'tests/v37_focus_result.json').write_text(json.dumps(res,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':len(res['checks']),'errors':len(res['errors']),'checks':res['checks']},ensure_ascii=False,indent=2))
if res['errors']:raise SystemExit(1)
