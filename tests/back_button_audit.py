from pathlib import Path
import asyncio,json,datetime
from playwright.async_api import async_playwright
ROOT=Path('/mnt/data/qinzhiliao-h5-app-demo-v3.0');HTML=(ROOT/'dist/index.html').read_text(encoding='utf-8')
ROUTES=['growth','growth/weekly','growth/action/a17','archive','archive/memories','archive/members','archive/basic/%E5%81%A5%E5%BA%B7%E7%8A%B6%E5%86%B5','assessments','assessments/detail/task-start','assessments/report/emotion-cycle','guides','guides/category/%E4%BD%9C%E4%B8%9A%E5%AD%A6%E4%B9%A0','guides/detail/g1','membership','membership/plans','membership/orders','task-center','messages','profile','settings','settings/account','settings/notifications','settings/privacy','settings/help','settings/about','demo-tools','feedback']
async def wait(page,r,t=4000):await page.wait_for_function("r=>document.querySelector('section.screen[data-route]')?.dataset.route===r",arg=r,timeout=t)
async def login(page):
 await page.set_content(HTML);await wait(page,'login');await page.locator('#loginConsent').check();await page.get_by_role('button',name='手机号登录').click();await wait(page,'login/phone');await page.locator('#phoneInput').fill('18500006488');await page.get_by_role('button',name='下一步').click();await wait(page,'login/code');b=page.locator('.code-box')
 for i,d in enumerate('123456'):await b.nth(i).fill(d);await page.wait_for_timeout(35)
 await wait(page,'home',6500)
async def run():
 rows=[];errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=await browser.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda e:errors.append(str(e)));await login(page)
  fallback_overrides={'assessments/report/emotion-cycle':'assessments'}
  for r in ROUTES:
   expected=fallback_overrides.get(r,'home')
   await page.evaluate("()=>location.hash='#/home'");await wait(page,'home');await page.wait_for_timeout(300)
   await page.evaluate("r=>location.hash='#/'+r",r);await wait(page,r);await page.wait_for_timeout(300)
   btn=page.locator('section.screen[data-route] .back-btn').first
   if not await btn.count():rows.append({'route':r,'status':'NO_BUTTON'});continue
   box=await btn.bounding_box();await btn.click();
   try:await wait(page,expected);status='PASS'
   except:status='FAIL'
   rows.append({'route':r,'status':status,'hitbox':box})
  await browser.close()
 payload={'timestamp':datetime.datetime.now().isoformat(timespec='seconds'),'results':rows,'errors':errors,'summary':{'passed':sum(x['status']=='PASS' for x in rows),'total':len(rows),'errors':len(errors)}}
 (ROOT/'tests/back_button_audit.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(payload['summary'],ensure_ascii=False))
 if payload['summary']['passed']!=len(rows) or errors:raise SystemExit(1)
asyncio.run(run())
