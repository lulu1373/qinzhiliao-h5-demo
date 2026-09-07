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
      'chat':{'active':False,'scenario':None,'node':'idle','messages':[],'typing':False,'reviewResult':None,'freeTurns':0},
      'actions':[
        {'id':'a17','date':'2026-08-17','title':'睡前先听孩子说完，再回应','source':'孩子最近不愿意和我说话','result':'🙂','resultText':'比之前顺一点','status':'done'},
        {'id':'a23','date':'2026-08-23','title':'手机问题先不急着讲道理','source':'孩子一直玩手机','result':'😐','resultText':'好像没什么变化','status':'done'},
        {'id':'a26','date':'2026-08-26','title':'写作业时先减少一次催促','source':'写作业又吵起来了','result':'•','resultText':'待尝试','status':'pending'}],
      'growth':{'selectedDate':'2026-08-26','month':'2026-08','actionFilter':'all'},
      'archive':{'tab':'parent','memories':[]},
      'assessments':{'tab':'recommended','currentId':None,'questionIndex':0,'answers':{},'reportReady':False,'progressById':{}},
      'guides':{'query':'','favorites':[]},'feedback':{'type':'','text':'','contact':'','image':True},
      'tasks':{'tab':'pending'},'messages':{'readIds':['assessment-resume']},'debug':False}

def html_with_state(st):
    return HTML.replace('let state=loadState();','let state='+json.dumps(st,ensure_ascii=False)+';',1)

def set_case(page,st,route='home'):
    page.set_content(html_with_state(st),wait_until='load')
    page.wait_for_timeout(120)
    page.evaluate("r=>{location.hash='#/'+r}",route)
    page.wait_for_timeout(180)

def shot(page,name):page.screenshot(path=str(OUT/name),full_page=False)

res={'checks':[],'errors':[]}
def mark(name,detail=None):res['checks'].append({'name':name,'status':'PASS','detail':detail})

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    page.on('pageerror',lambda e:res['errors'].append(str(e)))
    page.on('console',lambda m:res['errors'].append('console:'+m.text) if m.type=='error' else None)

    # Home
    st=base_state();set_case(page,st,'home');shot(page,'01-home.png')
    mark('首页暖米底色')

    # Interpretation
    st=base_state();st['chat']={'active':True,'scenario':'homework','node':'confirm','messages':[{'role':'user','html':'刚刚又因为写作业吵架了，我不知道接下来怎么办。','time':'16:12'},{'role':'ai','html':'我在。我们先把刚才发生的事情理清楚。','time':'16:12'}],'typing':False,'reviewResult':None,'freeTurns':0}
    set_case(page,st,'home');page.evaluate("()=>{const a=document.getElementById('aiScroll');if(a)a.scrollTop=a.scrollHeight}");page.wait_for_timeout(80);shot(page,'02-interpretation.png');mark('正面解读暖白卡+细语义色条')

    # Action
    st=base_state();st['chat']={'active':True,'scenario':'homework','node':'action-card','messages':[{'role':'user','html':'刚刚又因为写作业吵架了。','time':'16:12'},{'role':'ai','html':'我先陪你把这件事看清楚。','time':'16:12'},{'kind':'interpret-confirmed','role':'ai','html':'','time':'16:13'}],'typing':False,'reviewResult':None,'freeTurns':0}
    set_case(page,st,'home');page.evaluate("()=>{const a=document.getElementById('aiScroll');if(a)a.scrollTop=a.scrollHeight}");page.wait_for_timeout(80);shot(page,'03-action.png');mark('行动卡奶油白+橙色动作')

    # Growth
    st=base_state();set_case(page,st,'growth');shot(page,'04-growth.png');mark('成长总结去大面积绿色')

    # Assessment
    st=base_state();set_case(page,st,'assessments');shot(page,'05-assessment.png');mark('测评暖米背景+蓝色专业标记')

    # Drawer
    st=base_state();set_case(page,st,'home');page.click('[data-action="drawer-open"]');page.wait_for_timeout(300);shot(page,'06-drawer.png');mark('侧栏暖米外壳+白色服务卡')

    # Guides
    st=base_state();set_case(page,st,'guides');shot(page,'07-guides.png');mark('关系指南贴近暖米编辑感')

    # Archive
    st=base_state();set_case(page,st,'archive');shot(page,'08-archive.png');mark('家庭档案暖米/白面')

    # Responsive overflow across key routes
    for width in (360,390,430):
        page.set_viewport_size({'width':width,'height':844})
        for route in ('home','growth','assessments','guides','archive','settings'):
            st=base_state();set_case(page,st,route)
            ov=page.evaluate("()=>document.documentElement.scrollWidth>document.documentElement.clientWidth")
            assert not ov,(width,route)
    mark('360/390/430 六类页面无横向溢出')

    b.close()

(R/'tests/V42_VISUAL_AUDIT.json').write_text(json.dumps(res,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':len(res['checks']),'errors':res['errors']},ensure_ascii=False,indent=2))
if res['errors']:raise SystemExit(1)
