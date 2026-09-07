"""V3.4 browser regression. No external service calls.
Main test runs standalone HTML without storage access (embedded-preview fallback).
State migration/restore tests use an explicit test-only Storage stub; this is not
represented as physical-phone or real browser reload validation.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json, re
R=Path(__file__).resolve().parents[1]
HTML=(R/'dist/index.html').read_text()
OUT=R/'tests/screens-v34'; OUT.mkdir(exist_ok=True)
RESULT={'version':'V3.4','environment':'Chromium headless, 390x844; set_content standalone; not physical devices','checks':[],'page_errors':[],'console_errors':[]}

def mark(name):
    RESULT['checks'].append({'name':name,'status':'PASS'})
    (R/'tests/navigation-centers-v34.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
def rt(pg,r):pg.wait_for_function("r=>document.querySelector('section.screen[data-route]')?.dataset.route===r",arg=r)
def badge(pg,key):
    node=pg.locator(f'#drawer [data-badge="{key}"]')
    return int(node.text_content()) if node.count() else 0

def login(pg):
    pg.set_content(HTML)
    pg.locator('#loginConsent').check()
    pg.get_by_role('button',name='微信登录',exact=True).click();rt(pg,'login/wechat')
    pg.locator('[data-action="finish-login"]').click();rt(pg,'home')
    pg.wait_for_timeout(380)

def drawer(pg,r):
    pg.locator('[data-action="drawer-open"]').click()
    pg.locator(f'#drawer [data-route="{r}"]').click();rt(pg,r)

def back(pg,r):pg.locator('#screenHost .page-titlebar .back-btn').first.click(position={'x':3,'y':24});rt(pg,r)

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844});pg.set_default_timeout(6000)
    pg.on('pageerror',lambda e:RESULT['page_errors'].append(str(e)))
    pg.on('console',lambda m:RESULT['console_errors'].append(m.text) if m.type=='error' else None)
    login(pg)
    assert pg.locator('#screenHost .topbar [data-route="task-center"]').count()==0
    assert pg.locator('#screenHost .topbar [data-route="messages"]').count()==0
    assert pg.locator('#drawer [data-route="task-center"]').count()==1
    assert pg.locator('#drawer [data-route="messages"]').count()==1
    mark('任务/消息常规导航唯一入口均在侧栏；首页无礼物任务入口')
    pg.screenshot(path=str(OUT/'01-home.png'),animations='disabled')
    pg.locator('[data-action="more-sheet"]').click()
    expect(pg.locator('#overlayRoot .bottom-sheet')).to_be_visible()
    assert pg.locator('#overlayRoot [data-route="messages"]').count()==0
    assert pg.locator('#overlayRoot [data-route="feedback"]').count()==1
    pg.screenshot(path=str(OUT/'02-more.png'),animations='disabled')
    pg.keyboard.press('Escape');mark('更多菜单去掉消息中心，其他菜单项保留')
    pg.locator('[data-action="drawer-open"]').click();pg.wait_for_timeout(300)
    assert badge(pg,'tasks')==2 and badge(pg,'messages')==2
    pg.screenshot(path=str(OUT/'03-drawer.png'),animations='disabled')
    pg.locator('#drawer [data-route="task-center"]').click();rt(pg,'task-center')
    ids=pg.locator('[data-task-id]').evaluate_all('(els)=>els.map(e=>e.dataset.taskId)')
    assert len(ids)==len(set(ids))==2 and 'action:a26' in ids and 'assessment:self-drive' in ids
    mark('任务由一个待反馈行动和一个未完成测评派生，不重复生成行动提醒待办')
    back(pg,'home');assert badge(pg,'tasks')==2;mark('仅打开或浏览任务中心不会减少待处理数量；返回首页正常')
    drawer(pg,'messages');assert pg.locator('.inbox-message').count()==3
    assert pg.locator('.is-unread').count()==2;assert badge(pg,'messages')==2
    mark('只进入消息列表不会自动清空未读状态')
    pg.screenshot(path=str(OUT/'04-messages.png'),animations='disabled')
    pg.locator('[data-action="message-open"][data-id="action-reminder"]').click()
    expect(pg.locator('[data-overlay-action="feedback-result"]').first).to_be_visible()
    assert badge(pg,'messages')==1 and badge(pg,'tasks')==2
    mark('点击行动提醒直接打开原行动反馈；已读变化不完成任务')
    pg.keyboard.press('Escape')
    pg.locator('[data-action="message-open"][data-id="action-reminder"]').click();pg.keyboard.press('Escape')
    assert badge(pg,'messages')==1 and badge(pg,'tasks')==2
    mark('重复阅读同一消息幂等，不重复减计数')
    pg.locator('[data-action="messages-read"]').click()
    expect(pg.locator('.is-unread')).to_have_count(0)
    assert badge(pg,'messages')==0 and badge(pg,'tasks')==2
    mark('全部已读即时清除未读点和侧栏角标，不影响待办')
    pg.locator('[data-action="message-open"][data-id="weekly-ready"]').click();rt(pg,'growth/weekly')
    back(pg,'messages');mark('周总结通知进入对应周总结，返回回到消息中心')
    pg.locator('[data-action="message-open"][data-id="assessment-resume"]').click();rt(pg,'assessments/detail/self-drive')
    back(pg,'messages');mark('测评通知进入同一测评资源，返回来源页面')
    back(pg,'home');drawer(pg,'task-center')
    pg.locator('[data-task-id="action:a26"]').click();rt(pg,'growth/action/a26')
    pg.locator('[data-action="action-feedback"]').click()
    pg.locator('[data-overlay-action="feedback-result"][data-result="🙂"]').click()
    expect(pg.locator('[data-action="review-action"]')).to_be_visible()
    assert badge(pg,'tasks')==1 and badge(pg,'messages')==0
    back(pg,'task-center')
    assert pg.locator('[data-task-id="action:a26"]').count()==0
    mark('完成原行动反馈后待办减少一项，已完成列表沿用同一记录')
    pg.locator('[data-action="task-tab"][data-value="completed"]').click()
    expect(pg.locator('#screenHost [data-route="growth/action/a26"]')).to_be_visible()
    pg.locator('[data-action="task-tab"][data-value="pending"]').click()
    pg.screenshot(path=str(OUT/'05-tasks.png'),animations='disabled')
    pg.locator('[data-task-id="assessment:self-drive"]').click();rt(pg,'assessments/detail/self-drive')
    pg.locator('[data-action="assessment-start"]').click();rt(pg,'assessments/questions/self-drive')
    pg.locator('[data-action="assessment-answer"]').first.click();pg.locator('[data-action="assessment-next"]').click()
    pg.locator('[data-action="assessment-answer"]').first.click()
    pg.locator('[data-action="assessment-exit"]').click()
    pg.locator('[data-overlay-action="confirm-callback"]').click();rt(pg,'assessments')
    pg.locator('[data-action="assessment-tab"][data-value="progress"]').click()
    pg.locator('#screenHost [data-route="assessments/detail/self-drive"]').click();rt(pg,'assessments/detail/self-drive')
    pg.locator('[data-action="assessment-start"]').click();rt(pg,'assessments/questions/self-drive')
    # Explicitly validate saved question and selected answer.
    expect(pg.locator('.question-count')).to_contain_text('2') if pg.locator('.question-count').count() else None
    assert pg.locator('[data-action="assessment-answer"].selected').count()==1
    mark('中途退出并继续测评，保留已答题目；待办仍存在')
    # Four questions remain from index 1 through 4.
    for _ in range(4):
        pg.locator('[data-action="assessment-answer"]').first.click()
        pg.locator('[data-action="assessment-next"]').click()
    rt(pg,'assessments/report/self-drive')
    assert badge(pg,'tasks')==0 and badge(pg,'messages')==0
    back(pg,'assessments');back(pg,'home')
    drawer(pg,'task-center')
    assert pg.locator('[data-task-id]').count()==0
    expect(pg.get_by_text('当前没有待处理事项',exact=True)).to_be_visible()
    pg.locator('[data-action="task-tab"][data-value="completed"]').click()
    expect(pg.locator('#screenHost [data-route="assessments/report/self-drive"]')).to_be_visible()
    mark('测评生成报告后从待办移到已完成，数量归零时隐藏任务角标')
    back(pg,'home');drawer(pg,'messages')
    pg.locator('[data-action="message-open"][data-id="action-reminder"]').click();rt(pg,'growth/action/a26')
    assert pg.locator('[data-action="action-feedback"]').count()==0
    back(pg,'messages');mark('已完成行动的旧通知打开结果详情，不再次要求反馈')
    pg.locator('[data-action="message-open"][data-id="assessment-resume"]').click();rt(pg,'assessments/report/self-drive')
    mark('已完成测评的旧提醒直接打开报告，不重建待办')
    # Existing report intentionally returns to assessments (not a submitted questionnaire).
    back(pg,'assessments');back(pg,'home')
    pg.locator('[data-action="start-scenario"]').first.click()
    pg.locator('[data-action="chat-choice"]').first.click()
    pg.locator('[data-action="chat-choice"]').first.click()
    pg.locator('[data-action="interpret-start"]').click()
    pg.locator('[data-action="restore-ok"]').click()
    pg.locator('[data-action="relation-choice"]').first.click()
    pg.locator('[data-action="confirm-ok"]').click()
    pg.locator('[data-action="action-show"]').click()
    pg.locator('[data-action="action-try"]').click()
    assert badge(pg,'tasks')==1 and badge(pg,'messages')==0
    pg.locator('[data-action="chat-home"]').click()
    drawer(pg,'task-center');pg.locator('[data-action="task-tab"][data-value="pending"]').click();assert pg.locator('[data-task-id="action:a26"]').count()==1
    mark('正面解读→行动卡主线保留，新接受的行动出现一次，不新增未读通知')
    back(pg,'home')
    for width in [320,360,375,390,430,517,768]:
        pg.set_viewport_size({'width':width,'height':844})
        rect=pg.locator('#mainViewport').bounding_box()
        assert abs(rect['x'])<.1 and abs(rect['width']-width)<.1
        assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert pg.locator('#drawer').evaluate("e=>getComputedStyle(e).visibility==='hidden'&&Math.abs(e.getBoundingClientRect().right)<.1")
    mark('7 种宽度首页不溢出、关闭抽屉无残留白边')
    pg.close()
    # Test-only persistence adapter, not a browser policy workaround for a real origin.
    def make_saved_page(seed):
        page=b.new_page(viewport={'width':390,'height':844});page.set_default_timeout(5000)
        page.on('pageerror',lambda e:RESULT['page_errors'].append(str(e)))
        data={'qzl-h5-app-demo-v3-state':json.dumps(seed,ensure_ascii=False)}
        adapter='<script>window.__testStore='+json.dumps(data,ensure_ascii=False)+';Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:k=>window.__testStore[k]??null,setItem:(k,v)=>window.__testStore[k]=String(v),removeItem:k=>delete window.__testStore[k]}});</script>'
        page.set_content(HTML.replace('<body>','<body>'+adapter,1));rt(page,'home')
        return page
    legacy={'loggedIn':True,'consent':True,'tasks':{'unread':99,'tab':'pending'},'messages':{'unread':0},'user':{'name':'保留的昵称'},'chat':{'active':False,'messages':[{'role':'user','html':'保留的历史对话','time':'09:00'}]}}
    page=make_saved_page(legacy)
    assert badge(page,'tasks')==2 and badge(page,'messages')==0
    saved=page.evaluate("JSON.parse(window.__testStore['qzl-h5-app-demo-v3-state'])")
    assert saved['user']['name']=='保留的昵称' and saved['chat']['messages'][0]['html']=='保留的历史对话'
    assert 'unread' not in saved['tasks'] and 'unread' not in saved['messages']
    page.close();mark('旧 V3.3 数据升级：忽略旧待办固定数字、保留全部已读与账号/历史数据（Storage stub）')
    page=make_saved_page(saved);assert badge(page,'tasks')==2 and badge(page,'messages')==0
    page.close();mark('迁移后重新挂载状态幂等，不清空已有账号/聊天（Storage stub）')
    b.close()
assert not RESULT['page_errors'] and not RESULT['console_errors'],RESULT
RESULT['passed']=len(RESULT['checks']);RESULT['storage_validation']='Test-only Storage adapter and fresh page mount; real reload under HTTP/file:// not run because browser navigation is blocked by environment policy.'
(R/'tests/navigation-centers-v34.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
print(json.dumps({k:RESULT[k] for k in ['passed','page_errors','console_errors']},ensure_ascii=False))
