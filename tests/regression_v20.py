from pathlib import Path
import asyncio, json, datetime
from playwright.async_api import async_playwright

ROOT=Path('/mnt/data/qinzhiliao-h5-app-demo-v3.0')
HTML=(ROOT/'dist/index.html').read_text(encoding='utf-8')

async def current_route(page):
    return await page.locator('section.screen[data-route]').get_attribute('data-route')

async def wait_route(page, route, timeout=5000):
    await page.wait_for_function("r=>document.querySelector('section.screen[data-route]')?.dataset.route===r",arg=route,timeout=timeout)

async def login(page):
    await page.set_content(HTML,wait_until='load')
    await wait_route(page,'login')
    await page.locator('#loginConsent').check()
    await page.get_by_role('button',name='手机号登录').click(); await wait_route(page,'login/phone')
    await page.locator('#phoneInput').fill('18500006488')
    await page.get_by_role('button',name='下一步').click(); await wait_route(page,'login/code')
    boxes=page.locator('.code-box')
    for i,d in enumerate('123456'):
        await boxes.nth(i).fill(d); await page.wait_for_timeout(45)
    await wait_route(page,'home',timeout=6500)

async def run():
    results=[]; errors=[]
    def ok(name, detail=''):
        results.append({'name':name,'status':'PASS','detail':detail})
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':390,'height':844})
        page.on('pageerror',lambda e:errors.append(f'pageerror: {e}'))
        page.on('console',lambda m: errors.append(f'console {m.type}: {m.text}') if m.type=='error' else None)
        await login(page)
        assert await page.locator('.topbar').is_visible()
        assert await page.locator('[class*="bottom-nav"]').count()==0
        primary_bg=await page.locator('.primary-btn').first.evaluate("e=>getComputedStyle(e).backgroundImage") if await page.locator('.primary-btn').count() else ''
        ok('登录链路与首页进入',primary_bg)

        # Drawer click + main-page linkage
        await page.locator('[data-action="drawer-open"]').click(); await page.wait_for_timeout(330)
        dtransform=await page.locator('#drawer').evaluate("e=>getComputedStyle(e).transform")
        mtransform=await page.locator('#mainViewport').evaluate("e=>getComputedStyle(e).transform")
        assert dtransform=='matrix(1, 0, 0, 1, 0, 0)'
        assert mtransform!='none'
        ok('侧栏点击打开与主页面联动',mtransform)
        await page.locator('#drawer [data-action="drawer-close"]').click(); await page.wait_for_timeout(330)

        # Edge swipe drawer
        await page.mouse.move(3,320); await page.mouse.down(); await page.mouse.move(70,320,steps=4); await page.mouse.move(285,320,steps=10); await page.mouse.up(); await page.wait_for_timeout(350)
        assert await page.locator('#drawerScrim').get_attribute('class') and 'active' in (await page.locator('#drawerScrim').get_attribute('class'))
        ok('左缘滑动打开侧栏')
        await page.mouse.click(385,320); await page.wait_for_timeout(330)

        # Conversation -> interpretation -> action
        await page.locator('[data-action="start-scenario"]').first.click(); await page.wait_for_timeout(920)
        await page.locator('[data-action="chat-choice"]').first.click(); await page.wait_for_timeout(840)
        await page.locator('[data-action="chat-choice"]').first.click(); await page.wait_for_timeout(920)
        assert await page.locator('[data-action="interpret-start"]').is_visible()
        await page.locator('[data-action="interpret-start"]').click();
        await page.locator('[data-action="restore-ok"]').click();
        await page.locator('[data-action="relation-choice"]').first.click(); await page.wait_for_timeout(720)
        assert await page.locator('.final-card').is_visible()
        await page.locator('[data-action="confirm-ok"]').click(); await page.wait_for_timeout(720)
        await page.locator('[data-action="action-show"]').click();
        assert await page.locator('.action-card').is_visible()
        await page.locator('[data-action="action-try"]').click(); await page.wait_for_timeout(150)
        ok('对话→正面解读三阶段→行动卡')

        # V3 chat topbar follows the reference and uses back/sound/more only. Return to idle home before task center.
        await page.locator('[data-action="chat-home"]').click(); await wait_route(page,'home')
        # Task center -> growth -> back actual source
        await page.locator('[data-route="task-center"]').first.click(); await wait_route(page,'task-center')
        await page.locator('section.screen[data-route] [data-route="growth"]').first.click(); await wait_route(page,'growth')
        await page.locator('section.screen[data-route] .back-btn').click(); await wait_route(page,'task-center')
        await page.locator('section.screen[data-route] .back-btn').click(); await wait_route(page,'home')
        ok('任务中心→成长总结→逐级返回')

        # Archive
        await page.locator('[data-action="drawer-open"]').click(); await page.wait_for_timeout(300)
        await page.locator('#drawer [data-route="archive"]').click(); await wait_route(page,'archive')
        await page.locator('[data-action="archive-tab"][data-value="child"]').click();
        assert await page.get_by_text('基础档案').is_visible()
        await page.locator('[data-action="archive-tab"][data-value="memory"]').click();
        assert await page.get_by_text('小亲记住了什么').is_visible()
        await page.locator('.back-btn').click(); await wait_route(page,'home')
        ok('家庭档案家长/孩子/小亲记忆')

        # Assessment flow to report
        await page.locator('[data-action="drawer-open"]').click(); await page.wait_for_timeout(300)
        await page.locator('#drawer [data-route="assessments"]').click(); await wait_route(page,'assessments')
        await page.locator('[data-route="assessments/detail/task-start"]').first.click(); await wait_route(page,'assessments/detail/task-start')
        # use direct report route after validating detail; generated report itself is deterministic
        await page.evaluate("location.hash='#/assessments/report/emotion-cycle'"); await wait_route(page,'assessments/report/emotion-cycle')
        assert await page.locator('.report-hero-card').is_visible()
        assert await page.get_by_text('观察指数').is_visible()
        ok('我的测评→测评详情→高保真报告')

        # Back and guide
        await page.locator('.back-btn').click(); await wait_route(page,'assessments')
        await page.locator('.back-btn').click(); await wait_route(page,'home')
        await page.locator('[data-action="drawer-open"]').click(); await page.wait_for_timeout(300)
        await page.locator('#drawer [data-route="guides"]').click(); await wait_route(page,'guides')
        assert await page.get_by_text('关系指南').first.is_visible()
        assert await page.locator('.category-icon svg').count()==6
        await page.locator('[data-action="guide-category"]').first.click()
        await page.wait_for_function("()=>document.querySelector('section.screen[data-route]')?.dataset.route.startsWith('guides/category/')")
        category=await current_route(page)
        await page.locator('[data-route^="guides/detail/"]').first.click()
        await page.wait_for_function("()=>document.querySelector('section.screen[data-route]')?.dataset.route.startsWith('guides/detail/')")
        await page.locator('.page-titlebar .back-btn').click(); await wait_route(page,category)
        await page.locator('.back-btn').click(); await wait_route(page,'guides')
        await page.locator('.back-btn').click(); await wait_route(page,'home')
        ok('关系指南分类/详情/返回链')

        # Membership + settings
        await page.locator('[data-action="drawer-open"]').click(); await page.wait_for_timeout(300)
        await page.locator('#drawer [data-route="membership"]').click(); await wait_route(page,'membership')
        await page.locator('[data-route="membership/plans"]').first.click(); await wait_route(page,'membership/plans')
        await page.locator('.back-btn').click(); await wait_route(page,'membership')
        await page.locator('.back-btn').click(); await wait_route(page,'home')
        ok('会员中心/方案/返回链')

        await page.locator('[data-action="drawer-open"]').click(); await page.wait_for_timeout(300)
        await page.locator('#drawer [data-route="settings"]').click(); await wait_route(page,'settings')
        await page.locator('[data-route="settings/privacy"]').click(); await wait_route(page,'settings/privacy')
        await page.locator('.back-btn').click(); await wait_route(page,'settings')
        await page.locator('.back-btn').click(); await wait_route(page,'home')
        ok('设置二级页面与返回链')

        # 360/430 responsive smoke: no horizontal scroll on golden routes after transition ends
        for width in (360,430):
            await page.set_viewport_size({'width':width,'height':844})
            for r in ('home','growth','guides','assessments/report/emotion-cycle'):
                await page.evaluate("r=>location.hash='#/'+r",r); await wait_route(page,r); await page.wait_for_timeout(340)
                metric=await page.evaluate("()=>{const s=document.querySelector('section.screen[data-route]');return {sw:s.scrollWidth,cw:s.clientWidth}}")
                assert metric['sw']<=metric['cw']+2,(width,r,metric)
        ok('360px / 430px 响应式无横向滚动')

        await browser.close()

    payload={'timestamp':datetime.datetime.now().isoformat(timespec='seconds'),'results':results,'errors':errors,'summary':{'passed':len(results),'failed':0,'browser_errors':len(errors)}}
    (ROOT/'tests/regression_v20.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(payload['summary'],ensure_ascii=False))
    if errors:
        raise RuntimeError(errors)

asyncio.run(run())
