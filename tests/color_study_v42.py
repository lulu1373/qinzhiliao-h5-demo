import json, asyncio
from pathlib import Path
from playwright.async_api import async_playwright

URL='http://127.0.0.1:8878/index.html'
OUT=Path('/mnt/data/qinzhiliao-h5-app-demo-v4.2/tests/v42-color')
OUT.mkdir(parents=True, exist_ok=True)
KEY='qzl-h5-app-demo-v3-state'

def base_state():
    return {
      'consent': True, 'loggedIn': True, 'sound': True, 'quickConsent': True, 'codeExpireAt': 0,
      'user': {'name':'阳光妈妈','role':'母亲','phone':'13800000000','avatar':'','avatarImage':''},
      'family': {'children':[{'id':'child1','name':'小明','age':10,'gender':'男孩','grade':'小学四年级'}],'others':[]},
      'membership': {'active':False,'plan':None,'expireAt':None,'orders':[]},
      'chat': {'active':False,'scenario':None,'node':'idle','messages':[],'typing':False,'reviewResult':None,'freeTurns':0},
      'actions': [
        {'id':'a17','date':'2026-08-17','title':'睡前先听孩子说完，再回应','source':'孩子最近不愿意和我说话','result':'🙂','resultText':'比之前顺一点','status':'done'},
        {'id':'a23','date':'2026-08-23','title':'手机问题先不急着讲道理','source':'孩子一直玩手机','result':'😐','resultText':'好像没什么变化','status':'done'},
        {'id':'a26','date':'2026-08-26','title':'写作业时先减少一次催促','source':'写作业又吵起来了','result':'•','resultText':'待尝试','status':'pending'}
      ],
      'growth': {'selectedDate':'2026-08-26','month':'2026-08','actionFilter':'all'},
      'archive': {'tab':'parent','memories':[]},
      'assessments': {'tab':'recommended','currentId':None,'questionIndex':0,'answers':{},'reportReady':False,'progressById':{}},
      'guides': {'query':'','favorites':[]}, 'feedback':{'type':'','text':'','contact':'','image':True},
      'tasks': {'tab':'pending'}, 'messages': {'readIds':['assessment-resume']}, 'debug':False
    }

async def set_state(page, st, route='home'):
    await page.goto(URL, wait_until='load')
    await page.evaluate('(x)=>localStorage.setItem(x.k, JSON.stringify(x.s))', {'k':KEY,'s':st})
    await page.goto(URL+'#/'+route, wait_until='load')
    await page.wait_for_timeout(260)

async def shot(page, name):
    await page.screenshot(path=str(OUT/name), full_page=False)

async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=await browser.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append('console:'+m.text) if m.type=='error' else None)

    # 1 home
    st=base_state(); await set_state(page,st,'home'); await shot(page,'01-home.png')

    # 2 interpretation confirm
    st=base_state(); st['chat']={'active':True,'scenario':'homework','node':'confirm','messages':[
      {'role':'user','html':'刚刚又因为写作业吵架了，我不知道接下来怎么办。','time':'15:36'},
      {'role':'ai','html':'我在。先不急着判断谁对谁错。我们先把刚才发生的事情理清楚。','time':'15:36'}
    ],'typing':False,'reviewResult':None,'freeTurns':0}
    await set_state(page,st,'home');
    await page.evaluate("document.querySelector('#aiScroll').scrollTop=document.querySelector('#aiScroll').scrollHeight")
    await page.wait_for_timeout(100); await shot(page,'02-interpretation.png')

    # 3 action card, persist interpretation above
    st=base_state(); st['chat']={'active':True,'scenario':'homework','node':'action-card','messages':[
      {'role':'user','html':'刚刚又因为写作业吵架了。','time':'15:36'},
      {'role':'ai','html':'我先陪你把这件事看清楚。','time':'15:36'},
      {'kind':'interpret-confirmed','role':'ai','html':'','time':'15:37'}
    ],'typing':False,'reviewResult':None,'freeTurns':0}
    await set_state(page,st,'home');
    await page.evaluate("document.querySelector('#aiScroll').scrollTop=document.querySelector('#aiScroll').scrollHeight")
    await page.wait_for_timeout(100); await shot(page,'03-action.png')

    # 4 growth
    st=base_state(); await set_state(page,st,'growth'); await shot(page,'04-growth.png')

    # 5 assessment list
    st=base_state(); await set_state(page,st,'assessments'); await shot(page,'05-assessment.png')

    # 6 drawer
    st=base_state(); await set_state(page,st,'home');
    await page.click('[data-action="drawer-open"]'); await page.wait_for_timeout(320); await shot(page,'06-drawer.png')

    print('errors',errors)
    await browser.close()

asyncio.run(main())
