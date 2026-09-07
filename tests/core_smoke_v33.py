from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]
res={'checks':[],'errors':[]}
def rt(page,name):page.wait_for_function("r=>document.querySelector('section.screen[data-route]')?.dataset.route===r",arg=name)
def mark(name):res['checks'].append(name)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844})
 page.set_default_timeout(6000)
 page.on('pageerror',lambda e:res['errors'].append(str(e)))
 page.set_content((R/'dist/index.html').read_text())
 page.locator('#loginConsent').check();page.get_by_role('button',name='微信登录',exact=True).click()
 page.locator('[data-action="finish-login"]').click();rt(page,'home');mark('演示登录→首页')
 page.locator('[data-action="start-scenario"]').first.click()
 page.locator('[data-action="chat-choice"]').first.click()
 page.locator('[data-action="chat-choice"]').first.click()
 page.locator('[data-action="interpret-start"]').click();mark('普通对话→正面解读邀请')
 page.locator('[data-action="restore-ok"]').click()
 page.locator('[data-action="relation-choice"]').first.click()
 page.locator('[data-action="confirm-ok"]').click()
 page.locator('[data-action="action-show"]').click();mark('三阶段理解→行动卡')
 # Return to idle before using the drawer; do not alter the flow semantics.
 page.locator('[data-action="chat-home"]').click()
 page.locator('[data-route="growth"]').first.click();rt(page,'growth');mark('成长总结')
 page.locator('.page-titlebar .back-btn').click();rt(page,'home')
 page.locator('[data-action="drawer-open"]').click()
 page.locator('#drawer [data-route="archive"]').click();rt(page,'archive');mark('抽屉→家庭档案')
 page.locator('.page-titlebar .back-btn').click();rt(page,'home')
 page.locator('[data-action="drawer-open"]').click()
 page.locator('#drawer [data-route="guides"]').click();rt(page,'guides');mark('抽屉→关系指南')
 page.locator('.page-titlebar .back-btn').click();rt(page,'home')
 page.locator('[data-action="drawer-open"]').click()
 page.locator('#drawer [data-route="assessments"]').click();rt(page,'assessments');mark('抽屉→我的测评')
 page.locator('.page-titlebar .back-btn').click();rt(page,'home')
 assert page.locator('#drawer').get_attribute('data-state')=='closed'
 assert page.locator('#drawer').evaluate("e=>getComputedStyle(e).visibility")=='hidden'
 mark('各模块返回首页后抽屉保持隐藏')
 b.close()
(R/'tests/core-smoke-v33.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
print(json.dumps(res,ensure_ascii=False))
assert not res['errors']
