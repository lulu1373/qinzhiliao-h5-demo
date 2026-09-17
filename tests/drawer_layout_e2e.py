"""Responsive drawer geometry and information hierarchy regression checks."""
import unittest

import growth_report_e2e
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError


class DrawerLayoutTests(unittest.TestCase):
    setUpClass = classmethod(growth_report_e2e.GrowthReportTests.setUpClass.__func__)
    tearDownClass = classmethod(growth_report_e2e.GrowthReportTests.tearDownClass.__func__)
    tearDown = growth_report_e2e.GrowthReportTests.tearDown
    stored = growth_report_e2e.GrowthReportTests.stored

    def setUp(self):
        growth_report_e2e.GrowthReportTests.setUp(self)
        prompt_close = self.page.locator('[data-course-action="close-checkin"]:visible')
        try:
            prompt_close.wait_for(state='visible', timeout=3000)
            prompt_close.click()
        except PlaywrightTimeoutError:
            pass

    def open_drawer(self):
        self.page.goto(self.url + '#/home', wait_until='networkidle')
        self.page.locator('[data-action="drawer-open"]').click()
        self.page.wait_for_selector('#drawer[data-state="open"]')

    def test_drawer_fills_app_canvas_without_moving_main_viewport(self):
        for width, height in ((320, 568), (360, 800), (390, 844),
                              (430, 932), (480, 900), (1024, 768)):
            self.page.set_viewport_size({'width': width, 'height': height})
            self.open_drawer()
            geometry = self.page.evaluate("""() => {
              const frame = document.querySelector('.app-frame').getBoundingClientRect();
              const drawer = document.querySelector('#drawer').getBoundingClientRect();
              const main = getComputedStyle(document.querySelector('.main-viewport'));
              return {
                frameWidth: frame.width,
                drawerWidth: drawer.width,
                frameRight: frame.right,
                drawerRight: drawer.right,
                mainTransform: main.transform,
                horizontalOverflow: document.documentElement.scrollWidth > innerWidth
              };
            }""")
            self.assertAlmostEqual(geometry['drawerWidth'], geometry['frameWidth'], delta=1)
            self.assertAlmostEqual(geometry['drawerRight'], geometry['frameRight'], delta=1)
            self.assertIn(geometry['mainTransform'], ('none', 'matrix(1, 0, 0, 1, 0, 0)'))
            self.assertFalse(geometry['horizontalOverflow'])
            self.page.locator('[data-action="drawer-close"]').click()
            self.page.wait_for_function("document.querySelector('#drawer')?.dataset.state === 'closed'")

    def test_recent_conversation_has_complete_row_and_help_is_fixed(self):
        self.open_drawer()
        recent = self.page.locator('.v10-recent-conversations:visible')
        self.assertEqual(recent.count(), 1)
        row = recent.locator('.v10-conversation-row').first
        self.assertEqual(row.locator('.v10-conversation-avatar img').count(), 1)
        self.assertTrue(row.locator('.v10-conversation-copy b').inner_text().strip())
        self.assertTrue(row.locator('.v10-conversation-copy small').inner_text().strip())
        self.assertTrue(row.locator('.v10-conversation-time').inner_text().strip())
        self.assertEqual(row.locator('.v10-conversation-enter').count(), 1)

        footer = self.page.locator('.v10-drawer-footer:visible')
        footer_box = footer.bounding_box()
        frame_box = self.page.locator('.app-frame').bounding_box()
        self.assertLessEqual(abs((footer_box['y'] + footer_box['height']) -
                                 (frame_box['y'] + frame_box['height'])), 1)
        self.assertEqual(footer.locator('[data-route="settings/help"]').count(), 1)

    def test_short_screen_scroll_does_not_hide_or_cover_footer(self):
        self.page.set_viewport_size({'width': 320, 'height': 568})
        self.open_drawer()
        scroll = self.page.locator('#drawerScroll')
        scroll.evaluate('(el) => { el.scrollTop = el.scrollHeight; }')
        footer = self.page.locator('.v10-drawer-footer:visible').bounding_box()
        scroll_box = scroll.bounding_box()
        self.assertLessEqual(scroll_box['y'] + scroll_box['height'], footer['y'] + 1)
        self.assertGreaterEqual(
            self.page.locator('.v10-drawer-footer [data-route="settings/help"]').bounding_box()['height'],
            44,
        )

    def test_focus_is_trapped_in_fullscreen_drawer_and_returns_to_opener(self):
        self.open_drawer()
        self.page.wait_for_function("document.activeElement?.dataset.action === 'drawer-close'")
        self.assertTrue(self.page.locator('.main-viewport').evaluate('(el) => el.inert'))
        self.page.get_by_role('button', name='关闭', exact=True).click()
        self.page.wait_for_function("document.querySelector('#drawer')?.dataset.state === 'closed'")
        self.assertFalse(self.page.locator('.main-viewport').evaluate('(el) => el.inert'))
        self.assertEqual(
            self.page.evaluate("document.activeElement?.dataset.action"),
            'drawer-open',
        )

    def test_edge_gesture_uses_the_same_focus_isolation(self):
        self.page.locator('[data-action="drawer-open"]').focus()
        self.page.mouse.move(2, 320)
        self.page.mouse.down()
        self.page.mouse.move(220, 320, steps=6)
        self.page.mouse.up()
        self.page.wait_for_function("document.querySelector('#drawer')?.dataset.state === 'open'")
        self.page.wait_for_function("document.activeElement?.dataset.action === 'drawer-close'")
        self.assertTrue(self.page.locator('.main-viewport').evaluate('(el) => el.inert'))

    def test_history_identity_and_encoded_user_copy_survive_reopening(self):
        self.open_drawer()
        self.page.locator('[data-action="drawer-history-toggle"]').click()
        self.page.get_by_text('孩子一直玩手机', exact=True).click()
        self.page.locator('[data-action="drawer-open"]').click()
        current = self.page.locator('.v10-conversation-row.is-current')
        self.assertEqual(current.locator('.v10-conversation-copy b').inner_text(), '孩子一直玩手机')
        self.assertEqual(
            self.page.locator('#drawer .v10-conversation-copy b').filter(has_text='孩子一直玩手机').count(),
            1,
        )
        self.page.get_by_role('button', name='关闭', exact=True).click()
        self.page.wait_for_function("document.querySelector('#drawer')?.dataset.state === 'closed'")
        self.page.locator('[data-action="voice-start"]').click()
        self.page.wait_for_selector('.voice-overlay')
        self.page.wait_for_selector('.voice-overlay', state='detached', timeout=3000)
        self.page.locator('[data-action="drawer-open"]').click()
        self.assertEqual(
            self.page.locator('.v10-conversation-row.is-current .v10-conversation-copy b').inner_text(),
            '刚刚又因为写作业吵架了。',
        )

        state = self.stored()
        state['chat'].update(
            active=True,
            historyIndex=None,
            messages=[
                {'role': 'user', 'html': '1 &lt; 2 &amp; 3 &gt; 2', 'time': '10:18'},
                {'role': 'ai', 'html': '我们先按你的节奏聊。', 'time': '10:19'},
            ],
        )
        self.page.evaluate(
            '([key,value]) => localStorage.setItem(key, JSON.stringify(value))',
            [growth_report_e2e.KEY, state],
        )
        self.page.reload(wait_until='networkidle')
        self.page.locator('[data-action="drawer-open"]').click()
        self.assertEqual(
            self.page.locator('.v10-conversation-row.is-current .v10-conversation-copy b').inner_text(),
            '1 < 2 & 3 > 2',
        )


if __name__ == '__main__':
    unittest.main()
