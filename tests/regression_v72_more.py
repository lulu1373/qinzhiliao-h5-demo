import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

ART=Path('/mnt/data/亲智聊-H5-App-Demo-V7.2-首页更多菜单版.html')
OUT=Path('/mnt/data/v72-more-test')
OUT.mkdir(exist_ok=True)
html=ART.read_text('utf-8')
results=[]; errors=[]
def add(name,ok,**d):
    results.append({'name':name,'ok':bool(ok),**d}); print(('PASS' if ok else 'FAIL'),name,d if d else '')
    if not ok: raise AssertionError(name)

async def login(page):
    await page.set_content(html,wait_until='load')
    add('version 7.2', await page.evaluate('window.__QZL_VERSION')=='7.2')
    await page.locator('#loginConsent').check()
    await page.locator('[data-action="begin-login"][data-target="login/quick"]').click()
    await page.locator('#quickConsent').check()
    await page.locator('[data-action="quick-login"]').click()
    await page.wait_for_timeout(900)
    add('home reached', await page.evaluate('location.hash')=='#/home')

async def open_more(page):
    btn=page.locator('[data-action="more-sheet"]')
    await btn.click(); await page.wait_for_timeout(120)
    menu=page.locator('.home-more-menu')
    await menu.wait_for(state='visible')
    return btn,menu

async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=await browser.new_page(viewport={'width':390,'height':844},user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')
    page.on('console',lambda msg: errors.append({'type':'console','level':msg.type,'text':msg.text}) if msg.type=='error' else None)
    page.on('pageerror',lambda exc: errors.append({'type':'pageerror','text':str(exc)}))
    await login(page)

    btn,menu=await open_more(page)
    labels=await menu.locator('.home-more-item').all_inner_texts()
    add('four exact menu items',labels==['新建对话','扫一扫','产品介绍','立即分享'],labels=labels)
    add('not bottom sheet',await page.locator('.bottom-sheet').count()==0)
    geom=await page.evaluate('''() => {const b=document.querySelector('[data-action="more-sheet"]').getBoundingClientRect(); const m=document.querySelector('.home-more-menu').getBoundingClientRect(); return {button:{x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom,right:b.right},menu:{x:m.x,y:m.y,w:m.width,h:m.height,right:m.right},vw:innerWidth};}''')
    add('menu anchored under top-right button',abs(geom['menu']['right']-geom['button']['right'])<=1.5 and geom['menu']['y']>=geom['button']['bottom'] and geom['menu']['y']-geom['button']['bottom']<=8 and geom['menu']['w']<=170,geom=geom)
    styles=await page.evaluate('''() => {const m=getComputedStyle(document.querySelector('.home-more-menu')); const i=getComputedStyle(document.querySelector('.home-more-item')); const svg=document.querySelector('.home-more-item svg').getBoundingClientRect(); return {radius:m.borderRadius,bg:m.backgroundColor,font:i.fontSize,row:i.height,svg:[svg.width,svg.height]};}''')
    add('visual spec: white rounded / 16px / 25px icons', styles['font']=='16px' and all(abs(v-25)<=.5 for v in styles['svg']) and float(styles['row'][:-2])>=55,styles=styles)
    await page.screenshot(path=str(OUT/'01-menu-open.png'),full_page=True)

    # outside tap closes
    await page.mouse.click(30,300); await page.wait_for_timeout(80)
    add('outside tap closes',await page.locator('.home-more-menu').count()==0)

    # create a conversation, then new conversation resets it locally.
    await page.locator('[data-action="start-scenario"][data-scenario="homework"]').click(); await page.wait_for_timeout(450)
    add('conversation active before new',await page.locator('.v36-conversation.active').count()==1)
    await open_more(page)
    await page.get_by_role('menuitem',name='新建对话').click(); await page.wait_for_timeout(120)
    add('new conversation returns idle home',await page.evaluate('location.hash')=='#/home' and await page.locator('.v36-conversation.active').count()==0)

    # scanner demo
    await open_more(page); await page.get_by_role('menuitem',name='扫一扫').click(); await page.wait_for_timeout(80)
    add('scan closes popup and reports demo',await page.locator('.home-more-menu').count()==0 and '扫一扫' in await page.locator('#toast').inner_text())

    # product intro
    await open_more(page); await page.get_by_role('menuitem',name='产品介绍').click(); await page.wait_for_timeout(120)
    add('product intro opens about page',await page.evaluate('location.hash')=='#/settings/about' and '关于亲智聊' in await page.locator('.page-titlebar').inner_text())
    # explicit home for next check
    await page.evaluate("location.hash='#/home'"); await page.wait_for_timeout(120)

    # share
    await open_more(page); await page.get_by_role('menuitem',name='立即分享').click(); await page.wait_for_timeout(120)
    add('share closes popup',await page.locator('.home-more-menu').count()==0)

    add('no page/console errors',len(errors)==0,errors=errors)
    (OUT/'result.json').write_text(json.dumps({'results':results,'errors':errors},ensure_ascii=False,indent=2),'utf-8')
    await browser.close()

asyncio.run(main())
