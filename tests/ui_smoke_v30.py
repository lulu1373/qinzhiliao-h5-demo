from pathlib import Path
import asyncio, json, traceback
from playwright.async_api import async_playwright

ROOT=Path('/mnt/data/qinzhiliao-h5-app-demo-v3.0')
HTML=(ROOT/'dist/index.html').read_text(encoding='utf-8')
OUT=ROOT/'tests/screens-v3'
OUT.mkdir(parents=True,exist_ok=True)

async def route(page):
    loc=page.locator('section.screen[data-route], .screen[data-route]').first
    return await loc.get_attribute('data-route') if await loc.count() else ''

async def wait_route(page,r,timeout=8000):
    await page.wait_for_function("r=>document.querySelector('[data-route].screen')?.dataset.route===r",arg=r,timeout=timeout)

async def shot(page,name):
    await page.screenshot(path=str(OUT/name))

async def main():
  result={'steps':[],'errors':[],'screens':0}
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    page.on('pageerror',lambda e:result['errors'].append(f'pageerror: {e}'))
    page.on('console',lambda m:result['errors'].append(f'console {m.type}: {m.text}') if m.type=='error' else None)
    try:
      await page.set_content(HTML,wait_until='load')
      await page.wait_for_timeout(250)
      assert await route(page)=='login'
      await shot(page,'01-login.png'); result['steps'].append('login')

      await page.locator('#loginConsent').check()
      await page.get_by_role('button',name='手机号登录').click(); await wait_route(page,'login/phone')
      await page.locator('#phoneInput').fill('18500006488')
      await page.get_by_role('button',name='下一步').click(); await wait_route(page,'login/code')
      boxes=page.locator('.code-box')
      for i,d in enumerate('123456'):
        await boxes.nth(i).fill(d); await page.wait_for_timeout(55)
      await wait_route(page,'home',timeout=10000)
      await page.wait_for_timeout(250)
      await shot(page,'02-home.png'); result['steps'].append('home')

      await page.locator('[data-action="drawer-open"]').click(); await page.wait_for_timeout(350)
      await shot(page,'03-drawer.png'); result['steps'].append('drawer')
      await page.locator('#drawer [data-action="drawer-close"]').click(); await page.wait_for_timeout(300)

      await page.locator('[data-action="start-scenario"]').first.click(); await page.wait_for_timeout(950)
      await page.locator('[data-action="chat-choice"]').first.click(); await page.wait_for_timeout(850)
      await page.locator('[data-action="chat-choice"]').first.click(); await page.wait_for_timeout(950)
      await shot(page,'04-chat-invite.png'); result['steps'].append('chat-invite')

      await page.locator('[data-action="interpret-start"]').click(); await page.wait_for_timeout(220)
      await shot(page,'05-interpret-restore.png'); result['steps'].append('interpret-restore')
      await page.locator('[data-action="restore-ok"]').click(); await page.wait_for_timeout(220)
      await page.locator('[data-action="relation-choice"]').first.click(); await page.wait_for_timeout(820)
      await shot(page,'06-interpret-final.png'); result['steps'].append('interpret-final')
      await page.locator('[data-action="confirm-ok"]').click(); await page.wait_for_timeout(720)
      await page.locator('[data-action="action-show"]').click(); await page.wait_for_timeout(220)
      await shot(page,'07-action-card.png'); result['steps'].append('action-card')

      # Go home idle first, then growth via direct route button after clicking chat back.
      await page.locator('[data-action="chat-home"]').click(); await page.wait_for_timeout(150)
      await page.locator('[data-route="growth"]').first.click(); await wait_route(page,'growth')
      await page.wait_for_timeout(220); await shot(page,'08-growth.png'); result['steps'].append('growth')

      await page.locator('.page-titlebar .back-btn').click(); await wait_route(page,'home')
      await page.locator('[data-action="drawer-open"]').click(); await page.wait_for_timeout(300)
      await page.locator('#drawer [data-route="guides"]').click(); await wait_route(page,'guides')
      await page.wait_for_timeout(180); await shot(page,'09-guide.png'); result['steps'].append('guide')

      await page.evaluate("location.hash='#/assessments/report/emotion-cycle'")
      await wait_route(page,'assessments/report/emotion-cycle')
      await page.wait_for_timeout(280); await shot(page,'10-report.png'); result['steps'].append('report')
    except Exception as exc:
      result['errors'].append(f'exception: {exc}')
      result['traceback']=traceback.format_exc()
    result['screens']=len(list(OUT.glob('*.png')))
    await browser.close()
  (ROOT/'tests/ui_smoke_v30_result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
  print(json.dumps(result,ensure_ascii=False,indent=2))
  if result['errors']:
    raise SystemExit(1)

asyncio.run(main())
