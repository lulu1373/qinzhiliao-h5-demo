"""Regression checks for persistent headers on every secondary-page family."""
import unittest

from growth_report_e2e import GrowthReportTests


class HeaderScrollTests(unittest.TestCase):
    setUpClass = classmethod(GrowthReportTests.setUpClass.__func__)
    tearDownClass = classmethod(GrowthReportTests.tearDownClass.__func__)
    setUp = GrowthReportTests.setUp
    tearDown = GrowthReportTests.tearDown

    def assert_header_stays_visible(self, route, header_selector, scroll_selector):
        self.page.set_viewport_size({'width': 390, 'height': 568})
        self.page.goto(self.url + '#/' + route, wait_until='networkidle')
        header = self.page.locator(header_selector + ':visible')
        scroll = self.page.locator(scroll_selector + ':visible')
        self.assertEqual(header.count(), 1, route)
        self.assertEqual(scroll.count(), 1, route)
        before = header.bounding_box()
        scroll.evaluate('(el) => { el.scrollTop = el.scrollHeight; }')
        self.page.wait_for_timeout(80)
        after = header.bounding_box()
        scroll_top = scroll.evaluate('(el) => el.scrollTop')
        self.assertGreater(scroll_top, 0, route)
        self.assertAlmostEqual(after['y'], before['y'], delta=1, msg=route)
        self.assertGreaterEqual(after['y'], 0, route)

    def test_course_headers_stay_visible_on_long_and_small_screens(self):
        for route in (
            'courses',
            'courses/list',
            'courses/detail/SPU_SRV_7552428368961d8zaFyye25',
            'points',
        ):
            with self.subTest(route=route):
                self.assert_header_stays_visible(
                    route, '.course-titlebar', '.course-page.qzl-page-scroll'
                )

    def test_community_headers_stay_visible_across_long_flows(self):
        for route in (
            'guides',
            'experience/post/p1',
            'experience/news/gz-primary-public-2026',
            'experience/group/screen',
            'experience/compose',
        ):
            with self.subTest(route=route):
                self.assert_header_stays_visible(route, '.xp-header', '.xp-page')

    def test_card_editor_header_stays_visible_with_reduced_height(self):
        self.assert_header_stays_visible(
            'experience/card/action', '.cp-header', '.cp-page'
        )

    def test_standard_header_is_fixed_and_visually_separates_content(self):
        self.assert_header_stays_visible(
            'membership', '.page-titlebar', '.secondary-page'
        )
        header = self.page.locator('.page-titlebar:visible')
        styles = header.evaluate("""el => {
          const css = getComputedStyle(el);
          return {
            background: css.backgroundColor,
            backdrop: css.backdropFilter || css.webkitBackdropFilter,
            border: css.borderBottomColor
          };
        }""")
        self.assertNotIn(styles['background'], ('transparent', 'rgba(0, 0, 0, 0)'))
        self.assertNotEqual(styles['backdrop'], 'none')
        self.assertNotEqual(styles['border'], 'rgba(0, 0, 0, 0)')

    def test_all_header_back_buttons_keep_mobile_touch_targets(self):
        cases = (
            ('membership', '.page-titlebar .back-btn'),
            ('courses', '.course-titlebar button'),
            ('guides', '.xp-header .xp-back'),
            ('experience/card/action', '.cp-header .cp-back'),
        )
        for route, selector in cases:
            with self.subTest(route=route):
                self.page.goto(self.url + '#/' + route, wait_until='networkidle')
                box = self.page.locator(selector + ':visible').bounding_box()
                self.assertGreaterEqual(box['width'], 44)
                self.assertGreaterEqual(box['height'], 44)

    def test_persistent_headers_do_not_create_horizontal_overflow(self):
        routes = ('membership', 'courses', 'guides', 'experience/card/action')
        for width in (320, 430):
            self.page.set_viewport_size({'width': width, 'height': 568})
            for route in routes:
                with self.subTest(width=width, route=route):
                    self.page.goto(self.url + '#/' + route, wait_until='networkidle')
                    self.assertFalse(
                        self.page.evaluate(
                            'document.documentElement.scrollWidth > innerWidth'
                        ),
                        route,
                    )

    def test_custom_headers_respect_real_mobile_safe_area(self):
        cases = (
            ('courses', '.course-titlebar'),
            ('guides', '.xp-header'),
            ('experience/card/action', '.cp-header'),
        )
        self.page.evaluate("""() => {
          document.documentElement.classList.add('mobile-runtime');
          document.documentElement.style.setProperty('--safe-top', '20px');
        }""")
        for route, selector in cases:
            with self.subTest(route=route):
                self.page.goto(self.url + '#/' + route, wait_until='networkidle')
                metrics = self.page.locator(selector + ':visible').evaluate("""el => {
                  const css = getComputedStyle(el);
                  return { height: el.getBoundingClientRect().height,
                           paddingTop: parseFloat(css.paddingTop) };
                }""")
                self.assertGreaterEqual(metrics['height'], 84, route)
                self.assertEqual(metrics['paddingTop'], 20, route)


if __name__ == '__main__':
    unittest.main()
