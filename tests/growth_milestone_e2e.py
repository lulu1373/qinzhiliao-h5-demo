"""Milestone flows against the distributed H5, using isolated browser storage."""
import unittest
from growth_report_e2e import GrowthReportTests, KEY


class MilestoneTests(unittest.TestCase):
    setUpClass = classmethod(GrowthReportTests.setUpClass.__func__)
    tearDownClass = classmethod(GrowthReportTests.tearDownClass.__func__)
    setUp = GrowthReportTests.setUp
    tearDown = GrowthReportTests.tearDown
    stored = GrowthReportTests.stored
    open_growth = GrowthReportTests.open_growth
    click = GrowthReportTests.click

    def seed(self, records=None, actions=None):
        state = self.stored()
        if records is not None:
            state['growthReports']['records'] = records
        if actions:
            state['actions'].extend(actions)
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')

    def milestones(self):
        self.assertGreaterEqual(self.page.locator('[data-gr-action="milestone-section"]').count(), 1,
                         'growth page must expose the milestone module')
        self.click('milestone-section')

    def fill_milestone(self, title, date=None, description='我停下来，听完了孩子的话。'):
        self.page.locator('#gmTitle').fill(title)
        self.page.locator('#gmDescription').fill(description)
        self.page.locator('#gmMeaning').fill('愿意给自己一点时间。')
        if date:
            self.page.locator('#gmDate').fill(date)

    def test_manual_confirm_edit_remove_undo_and_reload(self):
        self.open_growth()
        self.milestones()
        self.assertIn('有些变化很小', self.page.locator('#grContent').inner_text())
        self.click('milestone-new')
        self.fill_milestone('停下来的一分钟')
        self.assertEqual(self.stored()['growthReports'].get('milestones', []), [])
        self.click('milestone-save')
        saved = self.stored()['growthReports']['milestones']
        self.assertEqual(len(saved), 1)
        original_id = saved[0]['id']
        self.page.reload(wait_until='networkidle')
        self.assertIn('停下来的一分钟', self.page.locator('#grContent').inner_text())
        self.click('milestone-detail')
        self.click('milestone-edit')
        self.page.locator('#gmTitle').fill('我给了自己一分钟')
        self.click('milestone-save')
        self.assertEqual(self.stored()['growthReports']['milestones'][0]['id'], original_id)
        self.click('milestone-detail')
        self.click('milestone-remove')
        self.page.locator('[data-overlay-action="confirm-callback"]').click()
        self.assertEqual(self.stored()['growthReports']['milestones'], [])
        self.click('milestone-undo')
        self.assertEqual(self.stored()['growthReports']['milestones'][0]['id'], original_id)
        for width in (360, 390, 430):
            self.page.set_viewport_size({'width':width, 'height':844})
            self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))

    def test_source_confirmation_dedup_and_clear_chat_scrubs_original(self):
        today = self.page.evaluate("new Date().toLocaleDateString('sv-SE')")
        source_text = '这句来源原文应该随清除对话而消失'
        self.seed(records=[{'id':'source-one','date':today,'kind':'conversation',
                           'title':source_text,'summary':source_text,'provenance':'personal'}])
        self.open_growth()
        self.click('source-detail')
        self.click('milestone-from-source')
        self.page.locator('#gmMeaning').fill('这是我自己另外写下的理解')
        self.click('milestone-save')
        self.assertEqual(len(self.stored()['growthReports']['milestones']), 1)
        self.click('source-detail')
        self.click('milestone-from-source')
        self.assertEqual(self.page.locator('#gmTitle').count(), 0, 'same source opens existing milestone')
        self.assertIn('这是我自己另外写下的理解', self.page.locator('#overlayRoot').inner_text())
        self.click('close')
        self.page.evaluate("location.hash='#/settings/privacy'")
        self.page.locator('[data-action="clear-chat"]').click()
        self.page.locator('[data-overlay-action="confirm-callback"]').click()
        item = self.stored()['growthReports']['milestones'][0]
        self.assertNotIn(source_text, str(item))
        self.assertTrue(item['sourceDeleted'])
        self.assertEqual(item['meaning'], '这是我自己另外写下的理解')
        self.page.evaluate("location.hash='#/growth'")
        self.page.wait_for_selector('#grContent')
        self.click('milestone-section')
        self.click('milestone-detail')
        self.assertNotIn(source_text, self.page.locator('#overlayRoot').inner_text())

    def test_example_isolation_and_backdated_month_summary(self):
        self.open_growth()
        self.milestones()
        self.click('source','[data-value="example"]')
        self.click('milestone-new')
        self.fill_milestone('仅供示例的时刻', '2026-08-25')
        self.click('milestone-save')
        self.click('source','[data-value="personal"]')
        self.assertNotIn('仅供示例的时刻', self.page.locator('#grContent').inner_text())
        self.click('milestone-new')
        self.fill_milestone('去年最后一天的尝试', '2025-12-31')
        self.click('milestone-save')
        self.click('growth-review')
        self.click('mode','[data-value="month"]')
        self.assertNotIn('去年最后一天的尝试', self.page.locator('.gm-summary').inner_text())
        state = self.stored()
        state['growthReports']['anchor'] = '2025-12-31'
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.assertIn('去年最后一天的尝试', self.page.locator('.gm-summary').inner_text())
        self.assertNotIn('本月留下的具体时刻', self.page.locator('#grContent').inner_text())
        self.assertEqual(len(self.stored()['growthReports']['milestones']), 1)

    def test_action_feedback_source_change_preserves_confirmed_words(self):
        today = self.page.evaluate("new Date().toLocaleDateString('sv-SE')")
        self.seed(actions=[{'id':'personal-milestone','date':today,'title':'试过后还是很难',
                           'source':'一次尝试','status':'done','result':'worse','resultText':'更糟','provenance':'personal'}])
        self.open_growth()
        self.click('action','[data-id="personal-milestone"]')
        self.click('milestone-from-source')
        self.fill_milestone('困难的时候我也愿意回来看看')
        self.click('milestone-save')
        self.click('feedback','[data-id="personal-milestone"]')
        self.click('feedback-save','[data-value="same"]')
        self.click('milestone-section')
        self.click('milestone-detail')
        self.assertIn('困难的时候我也愿意回来看看', self.page.locator('#overlayRoot').inner_text())
        self.assertTrue(self.stored()['growthReports']['milestones'][0]['sourceChanged'])
        self.click('milestone-source')
        self.assertIn('没变化', self.page.locator('#overlayRoot').inner_text())
        self.page.locator('#overlayRoot [data-gr-action="milestone-detail"]').click()
        self.click('milestone-reviewed')
        self.assertFalse(self.stored()['growthReports']['milestones'][0]['sourceChanged'])
        self.assertIn('困难的时候我也愿意回来看看', self.page.locator('#overlayRoot').inner_text())

    def test_validation_is_visible_and_child_ownership_persists(self):
        self.open_growth()
        self.click('milestone-section')
        self.click('milestone-new')
        self.click('milestone-save')
        self.assertTrue(self.page.locator('#gmError').is_visible())
        self.assertEqual(self.stored()['growthReports']['milestones'], [])
        self.page.locator('#gmTitle').fill('孩子说出了担心')
        self.click('milestone-save')
        self.assertTrue(self.page.locator('#gmError').is_visible())
        self.assertEqual(self.stored()['growthReports']['milestones'], [])
        self.page.locator('#gmDescription').fill('他告诉我担心做错。')
        self.page.locator('#gmMember').select_option('child:child1')
        self.click('milestone-save')
        item = self.stored()['growthReports']['milestones'][0]
        self.assertEqual(item['memberId'], 'child:child1')
        self.assertEqual(item['subject'], 'child')
        self.click('milestone-detail')
        self.assertIn('根据你的记录', self.page.locator('#overlayRoot').inner_text())

    def test_undo_after_clear_chat_does_not_restore_deleted_quotes(self):
        today = self.page.evaluate("new Date().toLocaleDateString('sv-SE')")
        text = '移除后撤销也不可复活的对话原文'
        self.seed(records=[{'id':'undo-source','date':today,'kind':'conversation','title':text,'summary':text,'provenance':'personal'}])
        self.open_growth()
        self.click('source-detail')
        self.click('milestone-from-source')
        self.page.locator('#gmDescription').fill(text + '\n我给自己的补充')
        self.page.locator('#gmMeaning').fill('我另外写的感受')
        self.click('milestone-save')
        self.click('milestone-section')
        self.click('milestone-detail')
        self.click('milestone-remove')
        self.page.locator('[data-overlay-action="confirm-callback"]').click()
        self.page.evaluate("location.hash='#/settings/privacy'")
        self.page.locator('[data-action="clear-chat"]').click()
        self.page.locator('[data-overlay-action="confirm-callback"]').click()
        self.page.evaluate("location.hash='#/growth'")
        self.page.wait_for_selector('#grContent')
        self.click('milestone-undo')
        item = self.stored()['growthReports']['milestones'][0]
        self.assertNotIn(text, str(item))
        self.assertEqual(item['meaning'], '我另外写的感受')
        self.assertEqual(item['description'], '我给自己的补充')

    def test_reused_action_id_does_not_attach_old_milestone_to_new_action(self):
        today = self.page.evaluate("new Date().toLocaleDateString('sv-SE')")
        state = self.stored()
        action = next(item for item in state['actions'] if item['id'] == 'a26')
        action.update(date=today, title='第一次这件具体尝试', result='same', status='done')
        state['growthReports']['actionMeta']['a26'] = {'provenance':'personal','createdAt':'2026-09-01T01:00:00Z','date':today}
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.open_growth()
        self.click('action','[data-id="a26"]')
        self.click('milestone-from-source')
        self.fill_milestone('值得记住的旧尝试')
        self.click('milestone-save')
        state = self.stored()
        next(item for item in state['actions'] if item['id'] == 'a26')['title'] = '后来新创建的行动'
        state['growthReports']['actionMeta']['a26']['createdAt'] = '2026-09-09T02:00:00Z'
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.assertTrue(self.stored()['growthReports']['milestones'][0]['sourceDeleted'])
        self.click('action','[data-id="a26"]')
        self.click('milestone-from-source')
        self.assertEqual(self.page.locator('#gmTitle').input_value(), '后来新创建的行动')
        self.click('milestone-save')
        self.assertEqual(len(self.stored()['growthReports']['milestones']), 2)


if __name__ == '__main__':
    unittest.main()
