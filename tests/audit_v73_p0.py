import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
ART=Path('/mnt/data/亲智聊-H5-App-Demo-V7.3-正文可读性P0版.html')
html=ART.read_text('utf-8')
OUT=Path('/mnt/data/v73-readability-audit'); OUT.mkdir(exist_ok=True)
res={}; errors=[]
async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=await browser.new_page(viewport={'width':390,'height':844}, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')
    page.on('console', lambda m: errors.append({'type':'console','level':m.type,'text':m.text}) if m.type=='error' else None)
    page.on('pageerror', lambda e: errors.append({'type':'pageerror','text':str(e)}))
    await page.set_content(html, wait_until='load')
    await page.locator('#loginConsent').check(); await page.locator('[data-action="begin-login"][data-target="login/quick"]').click(); await page.locator('#quickConsent').check(); await page.locator('[data-action="quick-login"]').click(); await page.wait_for_timeout(900)
    # Reach action card via real clicks.
    await page.locator('[data-action="start-scenario"][data-scenario="homework"]').click(); await page.wait_for_timeout(500)
    await page.locator('[data-action="chat-choice"]').first.click(); await page.wait_for_timeout(500)
    await page.locator('[data-action="chat-choice"]').first.click(); await page.wait_for_timeout(500)
    await page.locator('[data-action="interpret-start"]').click(); await page.locator('[data-action="restore-ok"]').click(); await page.wait_for_timeout(500)
    await page.locator('[data-action="relation-choice"]').first.click(); await page.wait_for_timeout(500)
    await page.locator('[data-action="confirm-ok"]').click(); await page.wait_for_timeout(500)
    await page.locator('[data-action="action-show"]').click(); await page.wait_for_timeout(120)
    await page.locator('.action-card').scroll_into_view_if_needed(); await page.wait_for_timeout(80)
    res['action']=await page.evaluate('''() => {const f=s=>{const e=document.querySelector(s);return e?parseFloat(getComputedStyle(e).fontSize):null}; const card=document.querySelector('.action-card').getBoundingClientRect(); return {kicker:f('.action-head small'),summary:f('.action-summary'),quoteLabel:f('.quote-label'),quote:f('.phrase-box blockquote'),fallback:f('.phrase-fallback'),reason:f('.action-reason p'),button:f('.action-buttons button'),height:card.height};}''')
    await page.screenshot(path=str(OUT/'action-before.png'),full_page=True)
    async def goto(route, wait=120):
      await page.evaluate(f"location.hash='#/{route}'"); await page.wait_for_timeout(wait)
    await goto('archive/memories')
    res['memory']=await page.evaluate('''() => {const e=document.querySelector('.memory-main p'); return {font:parseFloat(getComputedStyle(e).fontSize),height:e.closest('.memory-item').getBoundingClientRect().height};}''')
    await goto('messages')
    res['messages']=await page.evaluate('''() => {const e=document.querySelector('.message-main p'); return {font:parseFloat(getComputedStyle(e).fontSize),row:e.closest('.message-row').getBoundingClientRect().height};}''')
    await goto('growth/weekly')
    # capture all visible full-ish p under weekly page
    res['weekly']=await page.evaluate('''() => [...document.querySelectorAll('.secondary-page p')].filter(e=>e.offsetParent!==null).slice(0,8).map(e=>({text:e.innerText.slice(0,60),font:parseFloat(getComputedStyle(e).fontSize),cls:e.className}))''')
    await goto('task-center')
    res['taskPlan']=await page.evaluate('''() => {const e=document.querySelector('.task-page .latest-action p'); return e?{font:parseFloat(getComputedStyle(e).fontSize),height:e.closest('.latest-action').getBoundingClientRect().height}:null;}''')
    await goto('assessments/report/task-start')
    res['reportLocked']=await page.evaluate('''() => {const e=document.querySelector('.assessment-report-page .latest-action p'); return e?{font:parseFloat(getComputedStyle(e).fontSize),height:e.closest('.latest-action').getBoundingClientRect().height}:null;}''')
    await goto('profile')
    res['profile']=await page.evaluate('''() => {const e=document.querySelector('.profile-footnote'); return {font:parseFloat(getComputedStyle(e).fontSize),height:e.getBoundingClientRect().height};}''')
    await goto('agreement/service')
    res['agreement']=await page.evaluate('''() => {const e=document.querySelector('.doc-body p'); return {font:parseFloat(getComputedStyle(e).fontSize),pheight:e.getBoundingClientRect().height,scrollHeight:document.querySelector('.doc-page').scrollHeight,clientHeight:document.querySelector('.doc-page').clientHeight};}''')
    res['errors']=errors
    (OUT/'audit.json').write_text(json.dumps(res,ensure_ascii=False,indent=2),'utf-8')
    print(json.dumps(res,ensure_ascii=False,indent=2))
    await browser.close()
asyncio.run(main())
