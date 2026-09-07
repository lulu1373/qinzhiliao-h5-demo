import asyncio, json, math, time
from pathlib import Path
from playwright.async_api import async_playwright

ARTIFACT=Path('/mnt/data/亲智聊-H5-App-Demo-V7.3-正文可读性P0版.html')
OUT=Path('/mnt/data/v73-core-test')
OUT.mkdir(exist_ok=True)
html=ARTIFACT.read_text('utf-8')
results=[]
errors=[]

def add(name, ok, **details):
    results.append({'step':name,'ok':bool(ok),**details})
    print(('PASS' if ok else 'FAIL'), name, details if details else '')

def expect(name, cond, **details):
    add(name, cond, **details)
    if not cond:
        raise AssertionError(f'{name}: {details}')

async def get_scroll(page):
    loc=page.locator('.v70-growth-page')
    return await loc.evaluate('(el)=>el.scrollTop')

async def prepare(page, selector, nth=0, block='center'):
    loc=page.locator(selector).nth(nth)
    await loc.wait_for(state='visible')
    await loc.evaluate(f"(el)=>el.scrollIntoView({{behavior:'auto',block:'{block}'}})")
    await page.wait_for_timeout(80)
    return loc

async def local_click_preserves(page, step, selector, nth=0, post_wait=140):
    loc=await prepare(page,selector,nth)
    before=await get_scroll(page)
    h0=await page.evaluate('location.hash')
    await loc.click()
    await page.wait_for_timeout(post_wait)
    after=await get_scroll(page)
    h1=await page.evaluate('location.hash')
    ok=(h1=='#/growth' and h0=='#/growth' and abs(after-before)<=1.5)
    add(step,ok,scroll_before=before,scroll_after=after,delta=after-before,url_before=h0,url_after=h1)
    if not ok: raise AssertionError(step)
    return before,after

async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=await browser.new_page(viewport={'width':390,'height':844}, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')
    page.on('console', lambda msg: errors.append({'type':'console','level':msg.type,'text':msg.text}) if msg.type=='error' else None)
    page.on('pageerror', lambda exc: errors.append({'type':'pageerror','text':str(exc)}))

    # Exact distributed bytes are loaded into a real Chromium document.
    await page.set_content(html, wait_until='load')
    expect('V7.3 版本标记', await page.evaluate('window.__QZL_VERSION')=='7.3', version=await page.evaluate('window.__QZL_VERSION'))

    # Login using the actual UI, no state injection in this primary regression.
    expect('登录页初始可用', await page.locator('#loginConsent').count()==1)
    await page.locator('#loginConsent').check()
    await page.locator('[data-action="begin-login"][data-target="login/quick"]').click()
    await page.locator('#quickConsent').wait_for(state='visible')
    await page.locator('#quickConsent').check()
    await page.locator('[data-action="quick-login"]').click()
    await page.wait_for_timeout(900)
    expect('真实登录流程进入首页', await page.evaluate('location.hash')=='#/home', hash=await page.evaluate('location.hash'))

    growth_entry=page.locator('button[data-route="growth"]:visible').first
    await growth_entry.wait_for(state='visible')
    await growth_entry.click()
    await page.locator('.v70-growth-page').wait_for(state='visible')
    await page.wait_for_timeout(180)
    expect('成长总结保持单一路由', await page.evaluate('location.hash')=='#/growth', hash=await page.evaluate('location.hash'))
    expect('首次进入即为V7.1新布局', await page.locator('.v71-growth-hero').count()==1 and await page.locator('.v63-growth-poster').count()==0)

    # Core layout/content audit.
    txt=await page.locator('.v70-growth-page').inner_text()
    for label in ['周','月','全部','本周亮点','2026 年 8 月','写作业时先减少一次催促','手机问题先不急着讲道理','睡前先听孩子说完，再回应']:
        expect('布局文本：'+label, label in txt)
    expect('初始统计 7/3/2/3', all(x in txt for x in ['7 次聊过','3 个行动','2 次反馈','已连续留下 3 天记录']))

    # Typography: computed values from real browser.
    typography = await page.evaluate('''() => {
      const q=s=>document.querySelector(s); const fs=s=>parseFloat(getComputedStyle(q(s)).fontSize);
      return {
        pageTitle:fs('.v70-growth-page .page-titlebar b'),heroTitle:fs('.v71-growth-hero h1'),heroBody:fs('.v71-growth-hero>p'),
        sectionTitle:fs('.v70-section-head h2'),highlightTitle:fs('.v70-highlight b'),highlightBody:fs('.v70-highlight p'),
        month:fs('.v70-calendar-card .calendar-top b'),weekday:fs('.v70-calendar-card .week'),day:fs('.v70-calendar-card .day'),
        actionTitle:fs('.v70-action-main b'),source:fs('.v70-action-main p'),status:fs('.v70-record-status'),button:fs('.v70-inline-actions button')
      };
    }''')
    rules={'pageTitle':22,'heroTitle':24,'heroBody':15,'sectionTitle':20,'highlightTitle':16,'highlightBody':14,'month':17,'weekday':12,'day':14,'actionTitle':16,'source':13,'status':13,'button':15}
    expect('成长总结字号规范', all(typography[k]>=v for k,v in rules.items()), values=typography)
    min_text=await page.evaluate('''() => {
      const root=document.querySelector('.v70-growth-page'); let min=999, bad=[];
      root.querySelectorAll('*').forEach(el=>{
        if(getComputedStyle(el).display==='none'||getComputedStyle(el).visibility==='hidden')return;
        const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); if(!own)return;
        const px=parseFloat(getComputedStyle(el).fontSize); if(px<min)min=px; if(px<12)bad.push({tag:el.tagName,cls:el.className,text:el.textContent.trim().slice(0,40),px});
      }); return {min,bad};
    }''')
    expect('成长总结无 10/10.5/11px 正文', len(min_text['bad'])==0, min_font=min_text['min'], bad=min_text['bad'])

    # Icon grid and calendar dot-only audit.
    icons=await page.evaluate('''() => {
      const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.width,r.height]};
      return {hero:box('.v71-hero-icon'),heroSvg:box('.v71-hero-icon svg'),highlight:box('.v70-highlight i'),highlightSvg:box('.v70-highlight i svg'),current:box('.v70-action-icon'),currentSvg:box('.v70-action-icon svg'),recent:box('.v70-record-icon'),recentSvg:box('.v70-record-icon svg'),calendarSvg:document.querySelectorAll('#growthCalendarSlot svg').length,dots:[...document.querySelectorAll('#growthCalendarSlot .v70-day-dot')].map(x=>box('#growthCalendarSlot .v70-day-dot'))};
    }''')
    expect('Hero Icon 44/24', all(abs(v-t)<=0.6 for v,t in zip(icons['hero']+icons['heroSvg'],[44,44,24,24])), values=icons)
    expect('亮点 Icon 40/22', all(abs(v-t)<=0.6 for v,t in zip(icons['highlight']+icons['highlightSvg'],[40,40,22,22])), values=icons)
    expect('当前行动 Icon 40/22', all(abs(v-t)<=0.6 for v,t in zip(icons['current']+icons['currentSvg'],[40,40,22,22])), values=icons)
    expect('最近行动 Icon 32/18', all(abs(v-t)<=0.6 for v,t in zip(icons['recent']+icons['recentSvg'],[32,32,18,18])), values=icons)
    expect('Calendar 仅状态点无 SVG', icons['calendarSvg']==0, calendar_svg_count=icons['calendarSvg'])

    # Tab interactions: local route only.
    month_tab=await prepare(page,'.v70-growth-tabs [data-value="month"]')
    await month_tab.click(); await page.wait_for_timeout(120)
    expect('月 Tab 原地切换', await page.evaluate('location.hash')=='#/growth' and await page.locator('.v70-growth-tabs [data-value="month"]').evaluate('(e)=>e.classList.contains("active")'))
    week_tab=await prepare(page,'.v70-growth-tabs [data-value="week"]')
    await week_tab.click(); await page.wait_for_timeout(120)
    expect('周 Tab 原地切回', await page.evaluate('location.hash')=='#/growth' and await page.locator('.v70-growth-tabs [data-value="week"]').evaluate('(e)=>e.classList.contains("active")'))

    # Required date click sequence; clicks happen after target is manually placed in viewport.
    action_expect={
      '2026-08-17':'睡前先听孩子说完，再回应',
      '2026-08-23':'手机问题先不急着讲道理',
      '2026-08-26':'写作业时先减少一次催促',
    }
    for date,title in action_expect.items():
        await local_click_preserves(page,'日期 '+date+' 局部选中',f'[data-action="select-date"][data-date="{date}"]')
        card=await page.locator('#growthActionSlot').inner_text()
        expect('日期 '+date+' 行动匹配', title in card and all((other==title or other not in card) for other in action_expect.values()), card=card[:220])

    await local_click_preserves(page,'空日期 2026-08-25 局部选中','[data-action="select-date"][data-date="2026-08-25"]')
    empty=await page.locator('#growthActionSlot').inner_text()
    expect('空日期是真空状态', '这一天没有行动记录' in empty and not any(t in empty for t in action_expect.values()), card=empty)

    # Month switch: local, preserve scroll, clear selection and do not fallback.
    await local_click_preserves(page,'切到 7 月不跳页','.month-switch [data-action="month-prev"]')
    cal_text=await page.locator('#growthCalendarSlot').inner_text(); card=await page.locator('#growthActionSlot').inner_text()
    expect('7 月 selectedDate 已清空', '2026 年 7 月' in cal_text and await page.locator('#growthCalendarSlot .day.selected').count()==0 and '先从日历选择一个日期' in card, calendar=cal_text[:80],card=card)
    await local_click_preserves(page,'切回 8 月不跳页','.month-switch [data-action="month-next"]')
    cal_text=await page.locator('#growthCalendarSlot').inner_text(); card=await page.locator('#growthActionSlot').inner_text()
    expect('回 8 月仍不保留旧选中行动', '2026 年 8 月' in cal_text and await page.locator('#growthCalendarSlot .day.selected').count()==0 and '先从日历选择一个日期' in card)

    # Re-select 8/26 to make recent list deterministic: [8/23, 8/17].
    await local_click_preserves(page,'重新选择 8 月 26 日','[data-action="select-date"][data-date="2026-08-26"]')

    # Recent action 1 -> a23, controlled scroll to current action, hash unchanged.
    recent1=await prepare(page,'.v70-record',0)
    before=await get_scroll(page); await recent1.click(); await page.wait_for_timeout(650); after=await get_scroll(page)
    card=await page.locator('#growthActionSlot').inner_text()
    expect('最近行动第一条原地定位', await page.evaluate('location.hash')=='#/growth' and '手机问题先不急着讲道理' in card,scroll_before=before,scroll_after=after,controlled_scroll=True)

    # Recent list has been recalculated; second row is a17.
    recent2=await prepare(page,'.v70-record',1)
    before=await get_scroll(page); await recent2.click(); await page.wait_for_timeout(650); after=await get_scroll(page)
    card=await page.locator('#growthActionSlot').inner_text()
    expect('最近行动第二条原地定位', await page.evaluate('location.hash')=='#/growth' and '睡前先听孩子说完，再回应' in card,scroll_before=before,scroll_after=after,controlled_scroll=True)

    # Detail mapping check for all 3 independent action models.
    detail_expect={
      '2026-08-17':('睡前先听孩子说完，再回应','你先说完'),
      '2026-08-23':('手机问题先不急着讲道理','我们先不讨论玩多久'),
      '2026-08-26':('写作业时先减少一次催促','你是还没准备好'),
    }
    for date,(title,script_piece) in detail_expect.items():
        await local_click_preserves(page,'详情前选择 '+date,f'[data-action="select-date"][data-date="{date}"]')
        detail_btn=await prepare(page,'#growthActionSlot [data-action="growth-action-detail"]')
        scroll0=await get_scroll(page); await detail_btn.click(); await page.wait_for_timeout(120)
        sheet=page.locator('.v71-detail-sheet'); await sheet.wait_for(state='visible')
        detail_text=await sheet.inner_text()
        expect('详情独立匹配 '+date, title in detail_text and script_piece in detail_text and await page.evaluate('location.hash')=='#/growth', detail=detail_text[:360])
        await page.locator('.v71-sheet-close').click(); await page.wait_for_timeout(100)
        scroll1=await get_scroll(page)
        expect('关闭详情 Sheet 不跳顶部 '+date, await page.locator('.v71-detail-sheet').count()==0 and abs(scroll1-scroll0)<=1.5 and await page.evaluate('location.hash')=='#/growth',scroll_before=scroll0,scroll_after=scroll1)

    # Back to pending a26 for feedback flow.
    await local_click_preserves(page,'反馈前选择 8 月 26 日','[data-action="select-date"][data-date="2026-08-26"]')
    # Not tried is a no-op/local toast.
    await local_click_preserves(page,'还没试保持原地','#growthActionSlot [data-action="not-tried"]')
    expect('还没试不改变待尝试状态','待尝试' in await page.locator('#growthActionSlot').inner_text())

    # Feedback SVG grid + three semantic states. First action is the required "试过了".
    feedback_states=[('顺一点','better'),('没变化','same'),('更糟','worse')]
    for idx,(label,key) in enumerate(feedback_states):
        trigger_text='试过了' if idx==0 else '修改反馈'
        trig=page.get_by_role('button',name=trigger_text,exact=True).filter(has=page.locator('xpath=ancestor::*[@id="growthActionSlot"]')) if False else None
        trig=await prepare(page,f'#growthActionSlot [data-action="action-feedback"]')
        scroll0=await get_scroll(page); await trig.click(); await page.wait_for_timeout(100)
        sheet=page.locator('.v71-growth-sheet').last; await sheet.wait_for(state='visible')
        feedback_icon=await page.locator(f'.v70-feedback-icon.{key}').evaluate('(e)=>{const r=e.getBoundingClientRect(),s=e.querySelector("svg").getBoundingClientRect();return [r.width,r.height,s.width,s.height]}')
        expect('Feedback Icon 40/22 '+label, all(abs(v-t)<=0.6 for v,t in zip(feedback_icon,[40,40,22,22])),values=feedback_icon)
        option=page.locator(f'[data-overlay-action="feedback-result"][data-result="{key}"]')
        await option.click(); await page.wait_for_timeout(160)
        scroll1=await get_scroll(page); card=await page.locator('#growthActionSlot').inner_text()
        dot=page.locator('[data-date="2026-08-26"] .v70-day-dot')
        dot_cls=await dot.get_attribute('class') if await dot.count() else ''
        expect('反馈 '+label+' 原地保存', await page.evaluate('location.hash')=='#/growth' and label in card and key in (dot_cls or '') and abs(scroll1-scroll0)<=1.5,scroll_before=scroll0,scroll_after=scroll1,dot_class=dot_cls,card=card[:180])

    # Stats updated in place: a26 is now the third feedback.
    expect('反馈后统计原地更新为 3 次反馈','3 次反馈' in await page.locator('#growthStatsSlot').inner_text())

    # Required detail bottom sheet + explicit close after final feedback.
    detail_btn=await prepare(page,'#growthActionSlot [data-action="growth-action-detail"]')
    scroll0=await get_scroll(page); await detail_btn.click(); await page.wait_for_timeout(100)
    expect('行动详情 Bottom Sheet 打开', await page.locator('.v71-detail-sheet').count()==1 and await page.evaluate('location.hash')=='#/growth')
    detail_text=await page.locator('.v71-detail-sheet').inner_text()
    expect('当前详情仍为写作业行动', '写作业时先减少一次催促' in detail_text and '你是还没准备好' in detail_text and '手机规则' not in detail_text)
    await page.locator('.v71-sheet-close').click(); await page.wait_for_timeout(100)
    scroll1=await get_scroll(page)
    expect('关闭 Sheet 保持 scrollTop', await page.locator('.v71-detail-sheet').count()==0 and abs(scroll1-scroll0)<=1.5,scroll_before=scroll0,scroll_after=scroll1)

    # View all -> local all tab, then local return.
    more=await prepare(page,'.v70-more')
    await more.click(); await page.wait_for_timeout(120)
    expect('查看全部行动仍在 #/growth', await page.evaluate('location.hash')=='#/growth' and await page.locator('.v70-growth-tabs [data-value="all"]').evaluate('(e)=>e.classList.contains("active")') and await page.locator('.v70-record').count()==3,records=await page.locator('.v70-record').count())
    back=await prepare(page,'.v71-all-back')
    await back.click(); await page.wait_for_timeout(120)
    expect('返回成长总结为局部返回', await page.evaluate('location.hash')=='#/growth' and await page.locator('.v70-growth-tabs [data-value="week"]').evaluate('(e)=>e.classList.contains("active")'))

    # After local return selected a26 remains. Only review leaves growth for continuous home AI.
    review=await prepare(page,'#growthActionSlot [data-action="review-action"]')
    await review.click(); await page.wait_for_timeout(220)
    home_hash=await page.evaluate('location.hash')
    home_text=await page.locator('body').inner_text()
    expect('和小亲复盘才回首页 AI 连续聊天', home_hash=='#/home' and '复盘 / 督导' in home_text,hash=home_hash)

    # Final source / runtime safety checks.
    expect('系统反馈 Emoji 已从源码删除', all(ch not in html for ch in ['🙂','😐','🙁']))
    expect('Page Error / Console Error = 0', len(errors)==0, errors=errors)

    await page.screenshot(path=str(OUT/'final-home-review.png'), full_page=True)
    await browser.close()

    payload={'artifact':ARTIFACT.name,'version':'7.1','viewport':'390x844','engine':'Chromium via Playwright','results':results,'errors':errors,'passed':sum(r['ok'] for r in results),'total':len(results),'all_passed':all(r['ok'] for r in results)}
    (OUT/'regression_v71.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),'utf-8')
    print('SUMMARY',payload['passed'],'/',payload['total'],'all=',payload['all_passed'])

asyncio.run(main())
