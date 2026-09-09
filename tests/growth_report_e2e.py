"""Growth report integration checks against the actual distributed H5."""
import functools
import json
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
KEY = 'qzl-h5-app-demo-v3-state'


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class GrowthReportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.runtime = sync_playwright().start()
        cls.browser = cls.runtime.chromium.launch(headless=True, channel='chrome')
        cls.url = f'http://127.0.0.1:{cls.server.server_port}/'

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.runtime.stop()
        cls.server.shutdown()

    def setUp(self):
        self.page = self.browser.new_page(viewport={'width': 390, 'height': 844})
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.goto(self.url, wait_until='networkidle')
        self.page.locator('#loginConsent').check()
        self.page.locator('[data-action="begin-login"][data-target="login/quick"]').click()
        self.page.locator('#quickConsent').check()
        self.page.locator('[data-action="quick-login"]').click()
        self.page.wait_for_selector('#chatInput')

    def tearDown(self):
        self.assertEqual(self.errors, [])
        self.page.close()

    def stored(self):
        return self.page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))', KEY)

    def open_growth(self):
        self.page.locator('button[data-route="growth"]:visible').first.click()
        self.page.wait_for_function("location.hash === '#/growth'")
        self.page.wait_for_selector('.secondary-page.growth-page')
        self.assertEqual(self.page.locator('.secondary-page.growth-page.gr-page').count(), 1, 'growth must render the new report shell')

    def click(self, action, extra=''):
        self.page.locator(f'[data-gr-action="{action}"]{extra}').first.click()

    def example(self):
        self.click('source', '[data-value="example"]')
        self.assertIn('示例报告', self.page.locator('#grContent').inner_text())

    def test_default_and_example_periods(self):
        self.open_growth()
        self.assertEqual(self.stored()['growthReports']['mode'], 'week')
        self.assertEqual(self.stored()['growthReports']['source'], 'personal')
        self.assertNotIn('连续留下', self.page.locator('#grContent').inner_text())
        self.example()
        self.assertIn('正在练习', self.page.locator('#grContent').inner_text())
        self.click('mode', '[data-value="day"]')
        self.assertIn('2026', self.page.locator('#grContent').inner_text())
        self.click('shift', '[data-delta="1"]')
        self.assertIn('没有', self.page.locator('#grContent').inner_text())
        self.assertNotIn('困难分解启动法', self.page.locator('#grContent').inner_text())
        for width in (360, 390, 430):
            self.page.set_viewport_size({'width': width, 'height': 844})
            for mode in ('day', 'week', 'month'):
                self.click('mode', f'[data-value="{mode}"]')
                self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))

    def test_example_feedback_isolated_and_records_return(self):
        self.open_growth()
        self.example()
        original_actions = self.stored()['actions']
        self.page.locator('.gr-page').evaluate('(el)=>el.scrollTop=250')
        top = self.page.locator('.gr-page').evaluate('(el)=>el.scrollTop')
        self.click('records')
        self.click('record-view', '[data-value="list"]')
        self.page.locator('[data-gr-action="feedback"]').first.click()
        self.click('feedback-save', '[data-value="better"]')
        self.assertEqual(self.stored()['actions'], original_actions)
        self.click('report')
        self.assertAlmostEqual(self.page.locator('.gr-page').evaluate('(el)=>el.scrollTop'), top, delta=3)

    def test_method_sources_and_correction_persist(self):
        self.open_growth()
        self.example()
        self.click('mode', '[data-value="day"]')
        self.click('method')
        self.assertIn('核心原理', self.page.locator('#overlayRoot').inner_text())
        self.click('close')
        self.click('source-detail')
        self.assertIn('2026', self.page.locator('#overlayRoot').inner_text())
        self.click('close')
        self.click('mode', '[data-value="month"]')
        self.click('topic-correct', '[data-value="disagree"]')
        self.page.locator('#grCorrection').fill('主要是晚上时间不够，并不是孩子不愿意。')
        self.click('correction-save')
        self.page.reload(wait_until='networkidle')
        self.assertIn('主要是晚上时间不够', self.page.locator('#grContent').inner_text())

    def test_recap_preserves_chat_and_draft(self):
        self.page.locator('[data-action="start-scenario"]').first.click()
        self.page.wait_for_timeout(600)
        self.page.locator('#chatInput').fill('这段草稿还没发出去')
        original = self.stored()['chat']['messages']
        self.open_growth()
        self.example()
        self.click('recap')
        self.page.wait_for_selector('#chatInput')
        self.assertEqual(self.page.locator('#chatInput').input_value(), '这段草稿还没发出去')
        messages = self.stored()['chat']['messages']
        self.assertEqual(messages[:len(original)], original)
        self.assertIn('示例', self.page.locator('#conversationSection').inner_text())
        self.page.wait_for_timeout(500)
        self.assertEqual(self.page.locator('#chatInput').input_value(), '这段草稿还没发出去')

    def test_personal_feedback_preserves_period_and_scroll(self):
        today = self.page.evaluate("new Date().toLocaleDateString('sv-SE')")
        state = self.stored()
        state['actions'].append({'id':'personal-test','date':today,'title':'先听完一句话',
                                'source':'我的对话','status':'pending','provenance':'personal'})
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.open_growth()
        self.click('feedback', '[data-id="personal-test"]')
        top = self.page.locator('.secondary-page.gr-page').evaluate('(el)=>el.scrollTop')
        self.click('feedback-save', '[data-value="same"]')
        updated = self.stored()
        action = next(a for a in updated['actions'] if a['id']=='personal-test')
        self.assertEqual(action['result'], 'same')
        self.assertEqual(updated['growthReports']['actionMeta']['personal-test']['feedbackDate'], today)
        self.assertEqual(updated['growthReports']['mode'], 'week')
        self.assertAlmostEqual(self.page.locator('.secondary-page.gr-page').evaluate('(el)=>el.scrollTop'), top, delta=3)
        self.page.reload(wait_until='networkidle')
        self.assertIn('没变化', self.page.locator('#grContent').inner_text())

    def test_upgrade_does_not_date_old_conversations_or_mix_sample_actions(self):
        state = self.stored()
        state['chat']['messages'] = [{'role':'user','html':'升级前没有日期的老对话','time':'09:41'}]
        state['chat']['active'] = True
        state.pop('growthReports', None)
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.open_growth()
        self.assertEqual(self.stored()['growthReports']['records'], [])
        self.assertNotIn('升级前没有日期的老对话', self.page.locator('#grContent').inner_text())
        self.assertEqual(self.stored()['actions'], state['actions'])

    def test_upgrade_preserves_feedback_on_legacy_example_actions(self):
        state = self.stored()
        state.pop('growthReports', None)
        action = next(a for a in state['actions'] if a['id']=='a26')
        action.update(status='done', result='worse', resultText='更糟')
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.open_growth()
        self.example()
        self.assertIn('更糟', self.page.locator('#grContent').inner_text())
        self.assertEqual(self.stored()['actions'], state['actions'])

    def test_accepting_legacy_action_makes_it_a_personal_record_today(self):
        state = self.stored()
        state['chat'].update(active=True, node='action-card', typing=False)
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.page.locator('[data-action="action-try"]').first.click()
        self.open_growth()
        self.assertIn('给孩子 5 分钟缓冲', self.page.locator('#grContent').inner_text())
        self.assertEqual(self.stored()['growthReports']['actionMeta']['a26']['provenance'], 'personal')

    def test_clear_chat_also_removes_report_conversation_sources(self):
        self.page.locator('#chatInput').fill('这句个人聊天也应在清除时删除')
        self.page.locator('#chatSendBtn').click()
        self.page.wait_for_timeout(600)
        self.assertTrue(self.stored()['growthReports']['records'])
        self.page.evaluate("location.hash='#/settings/privacy'")
        self.page.locator('[data-action="clear-chat"]').click()
        self.page.locator('[data-overlay-action="confirm-callback"]').click()
        state = self.stored()
        self.assertEqual(state['chat']['messages'], [])
        self.assertEqual(state['growthReports']['records'], [])
        self.page.locator('.page-titlebar .back-btn').click()
        self.page.wait_for_timeout(350)
        self.assertNotIn('这句个人聊天也应在清除时删除', self.page.locator('#screenHost').inner_text())

    def test_selection_persists_and_new_day_returns_to_current_period(self):
        self.open_growth()
        self.click('mode','[data-value="day"]')
        self.click('shift','[data-delta="-1"]')
        selected = self.stored()['growthReports']['anchor']
        self.page.reload(wait_until='networkidle')
        self.assertEqual(self.stored()['growthReports']['anchor'], selected)
        state = self.stored()
        state['growthReports']['lastOpened'] = '2026-01-01'
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.assertEqual(self.stored()['growthReports']['mode'], 'day')
        self.assertEqual(self.stored()['growthReports']['anchor'], self.page.evaluate("new Date().toLocaleDateString('sv-SE')"))

    def test_undated_legacy_action_is_not_treated_as_created_today(self):
        state = self.stored()
        state.pop('growthReports', None)
        state['actions'].append({'title':'缺日期的旧行动','status':'pending'})
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.open_growth()
        text = self.page.locator('#grContent').inner_text()
        self.assertIn('旧记录缺少日期', text)
        self.assertNotIn('缺日期的旧行动', text)

    def test_personal_conversation_is_dated_and_source_linked(self):
        self.page.locator('#chatInput').fill('今天我愿意先听孩子把话说完。')
        self.page.locator('#chatSendBtn').click()
        self.page.wait_for_timeout(600)
        self.open_growth()
        records = self.stored()['growthReports']['records']
        self.assertTrue(any('今天我愿意' in item['summary'] for item in records))
        self.assertTrue(all(item.get('date') and item.get('conversationId') for item in records))
        self.assertIn('今天我愿意', self.page.locator('#grContent').inner_text())


if __name__ == '__main__':
    unittest.main()
