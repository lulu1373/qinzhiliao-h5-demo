from pathlib import Path
import asyncio, json
from playwright.async_api import async_playwright

ROOT=Path('/mnt/data/qinzhiliao-h5-app-demo-v3.0')
HTML=(ROOT/'dist/index.html').read_text(encoding='utf-8')
OUT=ROOT/'tests/screens-v3'
OUT.mkdir(parents=True,exist_ok=True)

async def route(page):
    loc=page.locator('section.screen[data-route], .screen[data-route]').first
    return await loc.get_attribute('data-route') if await loc.count() else ''

async def wait_route(page,r,timeout=5000):
    await page.wait_for_function("r=>document.querySelector('[data-route].screen')?.dataset.route===r",arg=r,timeout=timeout)

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e:errors.append(f'pageerror: {e}'))
        page.on('console',lambda m: errors.append(f'console {m.type}: {m.text}') if m.type=='error' else None)
        await page.set_content(HTML,wait_until='load')
        await page.wait_for_timeout(250)
        assert await route(page)=='login',await route(page)
        await page.screenshot(path=str(OUT/'01-login.png'))

        await page.locator('#loginConsent').check()
        await page.get_by_role('button',name='手机号登录').click()
        await wait_route(page,'login/phone')
        await page.locator('#phoneInput').fill('18500006488')
        await page.get_by_role('button',name='下一步').click()
        await wait_route(page,'login/code')
        boxes=page.locator('.code-box')
        for i,d in enumerate('123456'):
            await boxes.nth(i).fill(d)
            await page.wait_for_timeout(45)
        await wait_route(page,'home',timeout=6000)
        await page.wait_for_timeout(250)
        await page.screenshot(path=str(OUT/'02-home.png'))

        await page.locator('[data-action="drawer-open"]').click()
        await page.wait_for_timeout(330)
        await page.screenshot(path=str(OUT/'03-drawer.png'))
        await page.locator('#drawer [data-action="drawer-close"]').click()
        await page.wait_for_timeout(300)

        # Chat to interpretation
        await page.locator('[data-action="start-scenario"]').first.click()
        await page.wait_for_timeout(950)
        await page.locator('[data-action="chat-choice"]').first.click()
        await page.wait_for_timeout(850)
        await page.locator('[data-action="chat-choice"]').first.click()
        await page.wait_for_timeout(950)
        await page.screenshot(path=str(OUT/'04-chat-invite.png'))
        await page.locator('[data-action="interpret-start"]').click()
        await page.wait_for_timeout(180)
        await page.screenshot(path=str(OUT/'05-interpret-restore.png'))
        await page.locator('[data-action="restore-ok"]').click()
        await page.wait_for_timeout(180)
        await page.locator('[data-action="relation-choice"]').first.click()
        await page.wait_for_timeout(780)
        await page.screenshot(path=str(OUT/'06-interpret-final.png'))
        await page.locator('[data-action="confirm-ok"]').click()
        await page.wait_for_timeout(700)
        await page.locator('[data-action="action-show"]').click()
        await page.wait_for_timeout(180)
        await page.screenshot(path=str(OUT/'07-action-card.png'))

        # Growth
        await page.locator('[data-route="growth"]').first.click() if await page.locator('[data-route="growth"]').count() else None
        if await route(page)!='growth':
            await page.evaluate("location.hash='#/growth'")
            await wait_route(page,'growth')
        await page.wait_for_timeout(200)
        await page.screenshot(path=str(OUT/'08-growth.png'))

        # Back home then guide
        await page.locator('.page-titlebar .back-btn').click()
        await wait_route(page,'home')
        await page.locator('[data-action="drawer-open"]').click(); await page.wait_for_timeout(300)
        await page.locator('#drawer [data-route="guides"]').click(); await wait_route(page,'guides')
        await page.wait_for_timeout(180)
        await page.screenshot(path=str(OUT/'09-guide.png'))

        # assessment report via direct route after logged in
        await page.evaluate("location.hash='#/assessments/report/emotion-cycle'")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT/'10-report.png'))

        # Validate all screenshots and key styles
        result={
            'route':await route(page),
            'errors':errors,
            'screens':len(list(OUT.glob('*.png'))),
            'primary_bg':await page.locator('.primary-btn').first.evaluate("e=>getComputedStyle(e).backgroundImage") if await page.locator('.primary-btn').count() else '',
        }
        (ROOT/'tests/ui_smoke_result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(result,ensure_ascii=False,indent=2))
        await browser.close()

asyncio.run(main())
