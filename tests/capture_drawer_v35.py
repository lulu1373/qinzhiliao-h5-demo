"""Capture real DOM before/after screenshots separately from gesture tests."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageDraw,ImageFont
import json,sys
R=Path(__file__).resolve().parents[1];O=R/'tests/v35';O.mkdir(exist_ok=True)
BASE=Path(sys.argv[1]) if len(sys.argv)>1 else R.parent/'qzl_v35_work/baseline/qinzhiliao-h5-app-demo-v3.4/dist/index.html'
result={}
def rt(pg,r):pg.wait_for_function("r=>document.querySelector('.screen')?.dataset.route===r",arg=r)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for label,path in [('before',BASE),('after',R/'dist/index.html')]:
  pg=b.new_page(viewport={'width':390,'height':675},device_scale_factor=2);pg.set_default_timeout(4000)
  pg.set_content(path.read_text());pg.locator('#loginConsent').check();pg.get_by_role('button',name='微信登录',exact=True).click();pg.locator('[data-action="finish-login"]').click();rt(pg,'home')
  # Freeze decoration animations only; do not change drawer layout or hide layers.
  pg.add_style_tag(content='.v3-home-mascot,.v3-login-mascot{animation:none!important}')
  pg.locator('[data-action="drawer-open"]').click();pg.wait_for_timeout(500)
  pg.screenshot(path=str(O/f'{label}-drawer.png'),timeout=8000)
  if label=='before':
   result['before']=pg.evaluate("()=>({fixedTop:document.querySelector('.drawer-top').getBoundingClientRect().height,fixedBottom:document.querySelector('.drawer-bottom').getBoundingClientRect().height,scrollHeight:document.querySelector('.drawer-history').clientHeight})")
  else:
   result['after']=pg.evaluate("()=>({fixedTop:document.querySelector('.v35-account-bar').getBoundingClientRect().height,fixedBottom:0,scrollHeight:drawerScroll.clientHeight})")
   pg.locator('#drawerScroll').evaluate('e=>e.scrollTop=e.scrollHeight');pg.wait_for_timeout(100);pg.screenshot(path=str(O/'after-scrolled.png'),timeout=8000)
   pg.locator('#drawer [data-action="drawer-close"]').click();pg.wait_for_function("()=>drawer.dataset.state==='closed'");pg.wait_for_timeout(400)
   pg.screenshot(path=str(O/'closed-real.png'),timeout=8000)
   pg.locator('#drawer').evaluate("e=>e.style.display='none'");pg.screenshot(path=str(O/'closed-control.png'),timeout=8000)
   diff=ImageChops.difference(Image.open(O/'closed-real.png').convert('RGB'),Image.open(O/'closed-control.png').convert('RGB'))
   result['closed_pixel_difference_zero']=diff.getbbox() is None
   assert result['closed_pixel_difference_zero']
  pg.close()
 b.close()
(O/'layout-measurements.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(result)
# Small screenshot comparison board, labels added only outside the screenshots.
fontfile='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font=ImageFont.truetype(fontfile,22) if Path(fontfile).exists() else ImageFont.load_default()
imgs=[Image.open(O/f).convert('RGB') for f in ['before-drawer.png','after-drawer.png','after-scrolled.png']]
thumbs=[]
for img in imgs:img.thumbnail((390,675));thumbs.append(img)
board=Image.new('RGB',(1234,755),'#F4F1EB');d=ImageDraw.Draw(board)
labels=['V3.4：仅最近对话滚动','V3.5：上方精简，整体滚动','V3.5：向下浏览，顶部常驻']
for i,im in enumerate(thumbs):
 x=16+i*406;d.text((x,18),labels[i],font=font,fill='#394334');board.paste(im,(x,58))
board.save('/mnt/data/亲智聊-V3.5-侧栏改版对照.png')
