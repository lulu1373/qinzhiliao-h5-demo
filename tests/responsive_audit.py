from pathlib import Path
import asyncio,json,datetime
from playwright.async_api import async_playwright
ROOT=Path('/mnt/data/qinzhiliao-h5-app-demo-v3.0');HTML=(ROOT/'dist/index.html').read_text(encoding='utf-8')
ROUTES=['home','growth','guides','assessments/report/emotion-cycle','archive','settings']
async def wait(page,r,t=5000): await page.wait_for_function("r=>document.querySelector('section.screen[data-route]')?.dataset.route===r",arg=r,timeout=t)
async def login(page):
 await page.set_content(HTML);await wait(page,'login');await page.locator('#loginConsent').check();await page.get_by_role('button',name='手机号登录').click();await wait(page,'login/phone');await page.locator('#phoneInput').fill('18500006488');await page.get_by_role('button',name='下一步').click();await wait(page,'login/code');b=page.locator('.code-box')
 for i,d in enumerate('123456'):await b.nth(i).fill(d);await page.wait_for_timeout(35)
 await wait(page,'home',6500)
async def run():
 rows=[];errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width in (360,375,390,430):
   page=await browser.new_page(viewport={'width':width,'height':844});page.on('pageerror',lambda e,w=width:errors.append({'width':w,'error':str(e)}));await login(page)
   for r in ROUTES:
    await page.evaluate("r=>location.hash='#/'+r",r);await wait(page,r);await page.wait_for_timeout(360)
    m=await page.evaluate("""()=>{const s=document.querySelector('section.screen[data-route]');return {scrollWidth:s.scrollWidth,clientWidth:s.clientWidth,rootScrollWidth:document.documentElement.scrollWidth,rootClientWidth:document.documentElement.clientWidth}}""")
    status='PASS' if m['scrollWidth']<=m['clientWidth']+2 and m['rootScrollWidth']<=m['rootClientWidth']+2 else 'FAIL'
    rows.append({'width':width,'route':r,'status':status,**m})
   await page.close()
  await browser.close()
 payload={'timestamp':datetime.datetime.now().isoformat(timespec='seconds'),'results':rows,'errors':errors,'summary':{'passed':sum(x['status']=='PASS' for x in rows),'total':len(rows),'browser_errors':len(errors)}}
 (ROOT/'tests/responsive_audit.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(payload['summary'],ensure_ascii=False))
 if payload['summary']['passed']!=len(rows) or errors: raise SystemExit(1)
asyncio.run(run())
