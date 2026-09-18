"""Course acquisition and learning flow against the distributed H5."""
import unittest

from growth_report_e2e import GrowthReportTests, KEY


class CourseTests(unittest.TestCase):
    setUpClass = classmethod(GrowthReportTests.setUpClass.__func__)
    tearDownClass = classmethod(GrowthReportTests.tearDownClass.__func__)
    setUp = GrowthReportTests.setUp
    tearDown = GrowthReportTests.tearDown
    stored = GrowthReportTests.stored

    def course_click(self, action, extra=''):
        self.page.locator(f'[data-course-action="{action}"]{extra}:visible').first.click()

    def test_newcomer_bundle_purchase_reaches_learning_and_persists(self):
        self.page.goto(self.url + '#/courses', wait_until='networkidle')
        self.page.wait_for_selector('.course-page:visible')
        self.assertIn('新人 ¥9.9', self.page.locator('.course-page').inner_text())
        self.course_click('detail', '[data-product-id="B001"]')
        self.course_click('checkout')
        self.course_click('pay')
        self.page.wait_for_selector('.course-payment-sheet:visible')
        self.course_click('settle', '[data-result="success"]')
        self.page.wait_for_selector('.course-result-card.success:visible')
        self.course_click('learn', '[data-product-id="B001"]')
        self.page.wait_for_selector('.course-video:visible')
        self.course_click('complete-lesson')
        stored = self.stored()
        self.assertEqual(len(stored['course']['entitlements']), 1)
        self.assertEqual(stored['course']['points']['balance'], 6)
        self.page.reload(wait_until='networkidle')
        self.assertIn('演示播放器', self.page.locator('.course-page').inner_text())

    def test_drawer_classroom_and_recommendation_preference_are_available(self):
        self.page.goto(self.url + '#/home', wait_until='networkidle')
        self.page.locator('[data-action="drawer-open"]').click()
        self.page.wait_for_selector('[data-course-action="route"][data-route="courses"]:visible')
        self.page.locator('.course-drawer-tool.classroom[data-course-action="route"]:visible').click()
        self.page.wait_for_function("location.hash === '#/courses'")
        self.page.goto(self.url + '#/courses/preferences', wait_until='networkidle')
        toggle = self.page.locator('[data-course-action="toggle-recommendation"]:visible')
        self.assertEqual(toggle.get_attribute('aria-pressed'), 'true')
        toggle.click()
        self.assertEqual(self.stored()['course']['preferences']['proactiveRecommendations'], False)
        self.page.goto(self.url + '#/points', wait_until='networkidle')
        self.page.locator('.course-page [data-course-action="checkin"]:visible').click()
        self.assertEqual(self.stored()['course']['points']['balance'], 2)
        self.assertIn('今日已签到', self.page.locator('.course-page').inner_text())
        for width in (360, 390, 430):
            self.page.set_viewport_size({'width': width, 'height': 844})
            self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))

    def test_home_has_no_static_course_entry_and_drawer_uses_compact_tools(self):
        self.assertEqual(self.page.locator('.course-home-entry').count(), 0)
        self.page.locator('[data-action="drawer-open"]').click()
        self.page.wait_for_selector('.course-points-summary:visible')
        self.assertIn('成长积分', self.page.locator('.course-points-summary').inner_text())
        self.assertEqual(self.page.locator('.v6-drawer-feature.classroom,.v6-drawer-feature.learning').count(), 0)
        self.assertEqual(self.page.locator('.course-drawer-tool').count(), 2)

    def test_real_course_list_scrolls_to_the_last_official_course(self):
        self.page.goto(self.url + '#/courses/list', wait_until='networkidle')
        scroll = self.page.locator('.course-page.qzl-page-scroll')
        self.assertEqual(self.page.locator('[data-course-source="xet"]').count(), 10)
        self.assertIn('李中莹·NLP人生智慧深度答疑会', scroll.inner_text())
        before = scroll.evaluate('(el)=>el.scrollTop')
        scroll.hover()
        self.page.mouse.wheel(0, 2400)
        self.page.wait_for_timeout(250)
        after = scroll.evaluate('(el)=>el.scrollTop')
        self.assertGreater(after, before)
        self.assertTrue(self.page.locator('[data-product-id="course_3Cf7zajCa0bxYZc1WwnUbv3v4wG"]').last.is_visible())

    def test_classroom_back_restores_the_open_drawer(self):
        self.page.locator('[data-action="drawer-open"]').click()
        self.page.locator('.course-drawer-tool.classroom:visible').click()
        self.page.wait_for_function("location.hash === '#/courses'")
        self.page.locator('[data-course-action="back"]:visible').click()
        self.page.wait_for_function("location.hash === '#/home'")
        self.assertEqual(self.page.locator('#drawer').get_attribute('data-state'), 'open')

    def test_daily_checkin_prompt_awards_once_and_updates_drawer_balance(self):
        self.page.wait_for_selector('.course-checkin-prompt:visible', timeout=3000)
        self.page.locator('[data-course-action="claim-checkin"]:visible').click()
        self.page.wait_for_selector('.course-checkin-success:visible')
        self.assertEqual(self.stored()['course']['points']['balance'], 2)
        self.page.locator('[data-course-action="close-checkin"]:visible').click()
        self.page.reload(wait_until='networkidle')
        self.page.wait_for_timeout(1200)
        self.assertEqual(self.page.locator('.course-checkin-prompt:visible').count(), 0)
        self.page.locator('[data-action="drawer-open"]').click()
        self.assertIn('2', self.page.locator('.course-points-summary').inner_text())

    def test_reward_event_is_idempotent_and_light_chat_does_not_sell_immediately(self):
        self.page.wait_for_selector('.course-checkin-prompt:visible', timeout=3000)
        self.page.locator('[data-course-action="close-checkin"]:visible').click()
        self.page.locator('[data-xp-action="chat-start"][data-scene="emotion"]').click()
        self.page.wait_for_timeout(500)
        self.assertEqual(self.page.locator('.course-chat-recommendation').count(), 0)
        reward = "window.dispatchEvent(new CustomEvent('qzl:reward',{detail:{sourceType:'action_feedback',sourceId:'action-1',amount:8}}))"
        self.page.evaluate(reward)
        self.page.evaluate(reward)
        self.assertEqual(self.stored()['course']['points']['balance'], 8)

    def test_confirmed_understanding_opens_course_preview_without_losing_chat(self):
        self.page.wait_for_selector('.course-checkin-prompt:visible', timeout=3000)
        self.page.locator('[data-course-action="close-checkin"]:visible').click()
        state = self.stored()
        state['chat'].update(active=True, scenario='homework', node='card-reveal-back',
                             conversationId='recommendation-test', typing=False,
                             messages=[{'role':'user','html':'最近总在规则上冲突','time':'09:41'},
                                       {'role':'ai','html':'我们已经一起确认了互动循环。','time':'09:42'}])
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        card = self.page.locator('.course-chat-recommendation:visible')
        self.assertEqual(card.count(), 1)
        original = self.stored()['chat']['messages']
        card.locator('[data-course-action="preview-recommendation"]').click()
        self.page.wait_for_selector('.course-chat-preview:visible')
        self.assertEqual(self.stored()['chat']['messages'], original)
        self.page.locator('[data-course-action="close-checkin"]:visible').click()
        state = self.stored()
        state['chat']['conversationId'] = 'another-conversation'
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.assertEqual(self.page.locator('.course-chat-recommendation').count(), 0)

    def test_confirmed_understanding_requires_a_matching_course_topic(self):
        self.page.wait_for_selector('.course-checkin-prompt:visible', timeout=3000)
        self.page.locator('[data-course-action="close-checkin"]:visible').click()
        state = self.stored()
        state['chat'].update(active=True, scenario='homework', node='card-reveal-back',
                             conversationId='topic-match-test', typing=False,
                             messages=[{'role':'user','html':'我只是觉得最近有一点累','time':'09:41'},
                                       {'role':'ai','html':'我们先确认了你现在的感受。','time':'09:42'}])
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        self.assertEqual(self.page.locator('.course-chat-recommendation').count(), 0)

        state = self.stored()
        state['chat']['messages'] = [
            {'role':'user','html':'我和伴侣在共同养育上意见不同','time':'09:43'},
            {'role':'ai','html':'我们已经确认了你们的协作分歧。','time':'09:44'}]
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')
        card = self.page.locator('.course-chat-recommendation:visible')
        self.assertEqual(card.count(), 1)
        self.assertIn('伴侣一起养育', card.inner_text())


if __name__ == '__main__':
    unittest.main()
