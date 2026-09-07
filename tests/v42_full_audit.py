from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]
HTML=(R/'dist/index.html').read_text(encoding='utf-8')
OUT=R/'tests/v42';OUT.mkdir(parents=True,exist_ok=True)

def base_state():
    return {
      'consent':True,'loggedIn':True,'sound':True,'quickConsent':True,'codeExpireAt':0,
      'user':{'name':'阳光妈妈','role':'母亲','phone':'13800000000','avatar':'','avatarImage':''},
      'family':{'children':[{'id':'child1','name':'小明','age':10,'gender':'男孩','grade':'小学四年级'}],'others':[]},
      'membership':{'active':False,'plan':None,'expireAt':None,'orders':[]},
      'chat':{'active':True,'scenario':'free','node':'done','messages':[({'role':'user','html':f'用户消息{i}：这是测试内容。','time':'16:00'} if i%2==0 else {'role':'ai','html':f'小亲回复{i}：继续聊下去。','time':'16:01'}) for i in range(12)],'typing':False,'reviewResult':None,'freeTurns':0},
      'actions':[{'id':'a17','date':'2026-08-17','title':'睡前先听孩子说完，再回应','source':'孩子最近不愿意和我说话','result':'🙂','resultText':'比之前顺一点','status':'done'},{'id':'a23','date':'2026-08-23','title':'手机问题先不急着讲道理','source':'孩子一直玩手机','result':'😐','resultText':'好像没什么变化','status':'done'},{'id':'a26','date':'2026-08-26','title':'写作业时先减少一次催促','source':'写作业又吵起来了','result':'•','resultText':'待尝试','status':'pending'}],
      'growth':{'selectedDate':'2026-08-26','month':'2026-08','actionFilter':'all'},
      'archive':{'tab':'parent','memories':[]},
      'assessments':{'tab':'recommended','currentId':None,'questionIndex':0,'answers':{},'reportReady':True,'progressById':{}},
      'guides':{'query':'','favorites':[]},'feedback':{'type':'','text':'','contact':'','image':True},
      'tasks':{'tab':'pending'},'messages':{'readIds':['assessment-resume']},'debug':False}

def doc(st=None):
    if st is None:return HTML
    return HTML.replace('let state=loadState();','let state='+json.dumps(st,ensure_ascii=False)+';',1)

routes=[
 'home','growth','growth/weekly','growth/actions','growth/action/a17','archive','archive/memories','archive/members','archive/basic/%E5%81%A5%E5%BA%B7%E7%8A%B6%E5%86%B5','assessments','assessments/detail/task-start','assessments/questions/task-start','assessments/report/task-start','guides','guides/category/%E4%BD%9C%E4%B8%9A%E5%AD%A6%E4%B9%A0','guides/detail/g1','membership','membership/plans','membership/orders','task-center','messages','profile','settings','settings/account','settings/notifications','settings/privacy','settings/help','settings/about','feedback','demo-tools']

res={'routes':[],'checks':[],'errors':[]}
with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=b.new_page(viewport={'width':390,'height':844})
  page.on('pageerror',lambda e:res['errors'].append(str(e)))
  page.on('console',lambda m:res['errors'].append('console:'+m.text) if m.type=='error' else None)
  st=base_state();page.set_content(doc(st),wait_until='load');page.wait_for_timeout(120)
  for r in routes:
    page.evaluate("r=>location.hash='#/'+r",r);page.wait_for_timeout(100)
    route=page.evaluate("()=>document.querySelector('#pageStack [data-route]')?.dataset.route || document.querySelector('#screenHost .screen[data-route]')?.dataset.route || null")
    notfound=page.locator('text=页面不存在').count()>0
    overflow=page.evaluate("()=>document.documentElement.scrollWidth>document.documentElement.clientWidth")
    ok=(route==r and not notfound and not overflow)
    res['routes'].append({'route':r,'status':'PASS' if ok else 'FAIL','actual':route,'notfound':notfound,'overflow':overflow})
    if not ok:raise AssertionError(res['routes'][-1])
  res['checks'].append({'name':'30 个主要路由可渲染且无横向溢出','status':'PASS','count':len(routes)})

  # Persistent Home + Drawer + PageStack state preservation
  page.evaluate("()=>location.hash='#/home'");page.wait_for_timeout(100)
  page.locator('#chatInput').fill('未发送草稿保留测试')
  page.evaluate("()=>{const a=document.getElementById('aiScroll');a.style.scrollBehavior='auto';a.scrollTop=Math.max(0,a.scrollHeight-a.clientHeight-160);a.style.scrollBehavior='';}")
  before=page.evaluate("()=>({top:document.getElementById('aiScroll').scrollTop,draft:document.getElementById('chatInput').value})")
  page.locator('[data-action="drawer-open"]').click();page.wait_for_timeout(280)
  page.locator('#drawer [data-route="task-center"]').click();page.wait_for_timeout(120)
  page.locator('.page-stack .back-btn, section.screen[data-route="task-center"] .back-btn').first.click();page.wait_for_timeout(280)
  after=page.evaluate("()=>({top:document.getElementById('aiScroll').scrollTop,draft:document.getElementById('chatInput').value,drawer:document.getElementById('drawer').dataset.state})")
  assert before['draft']==after['draft'],(before,after)
  assert abs(before['top']-after['top'])<1,(before,after)
  assert after['drawer']=='open',after
  res['checks'].append({'name':'从功能页返回保持聊天草稿、阅读位置和侧栏状态','status':'PASS','detail':after})

  # Responsive key routes
  for w in (360,390,430):
    page.set_viewport_size({'width':w,'height':844})
    for r in ('home','growth','assessments','guides','archive','membership','settings'):
      page.evaluate("r=>location.hash='#/'+r",r);page.wait_for_timeout(50)
      assert not page.evaluate("()=>document.documentElement.scrollWidth>document.documentElement.clientWidth"),(w,r)
  res['checks'].append({'name':'360/390/430 × 7 核心页面无横向溢出','status':'PASS','count':21})
  b.close()

(R/'tests/TEST_REPORT_V4.2.json').write_text(json.dumps(res,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'routes_passed':sum(x['status']=='PASS' for x in res['routes']),'routes_total':len(res['routes']),'checks':len(res['checks']),'errors':len(res['errors'])},ensure_ascii=False,indent=2))
if res['errors']:raise SystemExit(1)
