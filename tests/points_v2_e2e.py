"""Points V2 browser integration against the distributed H5."""
import unittest

from growth_report_e2e import GrowthReportTests, KEY


class PointsV2Tests(unittest.TestCase):
    setUpClass = classmethod(GrowthReportTests.setUpClass.__func__)
    tearDownClass = classmethod(GrowthReportTests.tearDownClass.__func__)
    setUp = GrowthReportTests.setUp
    tearDown = GrowthReportTests.tearDown
    stored = GrowthReportTests.stored

    def seed(self, amount=0, dismissed=True):
        state = self.stored()
        ledger = []
        if amount:
            ledger.append({
                'entryId':'points-v2-seed','kind':'earn','amount':amount,'remaining':amount,
                'expiresAt':'2027-09-18T00:00:00.000Z','sourceType':'demo','sourceId':'seed',
                'sourceDay':'2026-09-18','occurredAt':'2026-09-18T00:00:00.000Z'
            })
        state['course'] = {'points':{'ledger':ledger}}
        state['pointsV2'] = {'version':2,'reminder':{'dismissedDate':'2026-09-18' if dismissed else ''},'rewards':[]}
        self.page.evaluate('([key,value])=>localStorage.setItem(key,JSON.stringify(value))', [KEY,state])
        self.page.reload(wait_until='networkidle')

    def test_all_eight_points_routes_are_responsive(self):
        self.seed()
        routes = [
            ('points','成长中心'),('points/checkin','每日签到'),('points/calendar','签到日历'),
            ('points/tasks','任务中心'),('points/ledger','积分明细'),('points/rewards','积分兑换'),
            ('points/level','我的等级'),('points/rules','积分规则')
        ]
        for route,title in routes:
            self.page.goto(self.url + '#/' + route, wait_until='networkidle')
            self.page.wait_for_selector('.points-v2-page:visible')
            self.assertEqual(self.page.locator('.pv2-titlebar b').inner_text(), title)
            for width in (360,390,430):
                self.page.set_viewport_size({'width':width,'height':844})
                self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))

    def test_daily_reminder_routes_to_checkin_and_claims_once(self):
        self.seed(dismissed=False)
        self.page.goto(self.url + '#/home', wait_until='networkidle')
        self.page.wait_for_selector('.pv2-reminder:visible', timeout=3000)
        self.page.locator('[data-points-action="reminder-checkin"]:visible').click()
        self.page.wait_for_selector('.pv2-checkin-card:visible')
        self.page.locator('[data-points-action="claim-checkin"]:visible').click()
        self.assertEqual(self.stored()['course']['points']['balance'], 2)
        self.assertIn('今日已签到', self.page.locator('.pv2-checkin-card').inner_text())
        self.page.reload(wait_until='networkidle')
        self.assertTrue(self.page.locator('[data-points-action="claim-checkin"]').is_disabled())

    def test_checkin_updates_calendar_tasks_and_ledger(self):
        self.seed()
        self.page.goto(self.url + '#/points/checkin', wait_until='networkidle')
        self.page.locator('[data-points-action="claim-checkin"]:visible').click()
        self.page.goto(self.url + '#/points/calendar', wait_until='networkidle')
        self.assertEqual(self.page.locator('.pv2-cal-day.done').count(), 1)
        self.page.goto(self.url + '#/points/tasks', wait_until='networkidle')
        self.assertIn('1/1', self.page.locator('.pv2-task-row').first.inner_text())
        self.page.goto(self.url + '#/points/ledger', wait_until='networkidle')
        self.assertIn('每日签到', self.page.locator('.pv2-ledger-row').first.inner_text())
        self.assertIn('+2', self.page.locator('.pv2-ledger-row').first.inner_text())

    def test_redemption_reduces_balance_but_not_level(self):
        self.seed(300)
        self.page.goto(self.url + '#/points/level', wait_until='networkidle')
        self.assertEqual(self.page.locator('.pv2-level-hero strong').inner_text(), 'Lv.3')
        self.page.goto(self.url + '#/points/rewards', wait_until='networkidle')
        self.page.locator('[data-reward-id="reward-tools"]').click()
        self.page.wait_for_selector('.pv2-redeem-sheet:visible')
        self.page.locator('[data-points-action="confirm-redeem"]:visible').click()
        state = self.stored()
        balance = sum(max(0, item.get('remaining',0)) for item in state['course']['points']['ledger'])
        self.assertEqual(balance, 180)
        self.assertEqual(len(state['pointsV2']['rewards']), 1)
        self.page.goto(self.url + '#/points/level', wait_until='networkidle')
        self.assertEqual(self.page.locator('.pv2-level-hero strong').inner_text(), 'Lv.3')


if __name__ == '__main__':
    unittest.main()
