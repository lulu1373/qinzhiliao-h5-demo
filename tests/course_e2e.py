"""Course acquisition and learning flow against the distributed H5."""
import unittest

from growth_report_e2e import GrowthReportTests


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
        self.page.locator('.v6-drawer-feature.classroom[data-course-action="route"]:visible').click()
        self.page.wait_for_function("location.hash === '#/courses'")
        self.page.goto(self.url + '#/courses/preferences', wait_until='networkidle')
        toggle = self.page.locator('[data-course-action="toggle-recommendation"]:visible')
        self.assertEqual(toggle.get_attribute('aria-pressed'), 'true')
        toggle.click()
        self.assertEqual(self.stored()['course']['preferences']['proactiveRecommendations'], False)
        self.page.goto(self.url + '#/points', wait_until='networkidle')
        self.course_click('checkin')
        self.assertEqual(self.stored()['course']['points']['balance'], 2)
        self.assertIn('今日已签到', self.page.locator('.course-page').inner_text())
        for width in (360, 390, 430):
            self.page.set_viewport_size({'width': width, 'height': 844})
            self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))


if __name__ == '__main__':
    unittest.main()
