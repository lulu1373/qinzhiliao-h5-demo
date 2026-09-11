"""Real user journeys through the co-creation demo, isolated local storage."""
import unittest
from growth_report_e2e import GrowthReportTests


class ExperienceTests(unittest.TestCase):
    setUpClass = classmethod(GrowthReportTests.setUpClass.__func__)
    tearDownClass = classmethod(GrowthReportTests.tearDownClass.__func__)
    setUp = GrowthReportTests.setUp
    tearDown = GrowthReportTests.tearDown
    stored = GrowthReportTests.stored

    def xp(self, action, extra=''):
        self.page.locator(f'[data-xp-action="{action}"]{extra}:visible').first.click()

    def start_internal_journey(self, scene):
        self.page.evaluate("""scene => {
          const b=document.createElement('button');
          b.dataset.xpAction='journey-start';
          b.dataset.scene=scene;
          b.style.display='none';
          document.getElementById('pageStack').appendChild(b);
          b.click();
          b.remove();
        }""", scene)
        self.page.wait_for_selector('#xpDescription:visible')

    def test_community_to_action_feedback_is_persistent_and_unique(self):
        self.assertEqual(self.page.locator('.xp-home').count(), 1, 'home must mount the new experience shell')
        self.page.locator('[data-action="drawer-open"]').click()
        self.page.locator('.v6-tool-orbit [data-route="guides"]:visible').click()
        self.page.locator('[data-xp-action="route"][data-route^="experience/post/"]').first.click()
        self.xp('adopt')
        self.page.wait_for_selector('.v36-conversation.active')
        self.assertIn('不用照搬', self.page.locator('.v36-conversation').inner_text())
        self.start_internal_journey('screen')
        self.page.locator('#xpDescription').fill('今天约定的时间到了，我又提高了声音。')
        self.xp('journey-save-context')
        self.xp('journey-next', '[data-step="phrase"]')
        self.xp('journey-next', '[data-step="action"]')
        self.xp('action-confirm')
        self.page.reload(wait_until='networkidle')
        self.xp('feedback', '[data-value="same"]')
        current = self.stored()
        personal = [a for a in current['actions'] if a.get('journeyId')]
        self.assertEqual(len(personal), 1)
        self.assertEqual(personal[0]['result'], 'same')
        self.page.reload(wait_until='networkidle')
        self.assertEqual(len([a for a in self.stored()['actions'] if a.get('journeyId')]), 1)
        self.page.goto(self.url + '#/growth')
        self.page.wait_for_selector('#grContent')
        self.assertIn(personal[0]['title'], self.page.locator('#grContent').inner_text())
        self.page.locator('[data-gr-action="feedback"]').first.click()
        self.page.wait_for_selector('[data-xp-action="feedback"]')
        self.xp('feedback', '[data-value="worse"]')
        self.assertEqual(self.stored()['experience']['journeys'][-1]['feedback'], 'worse')
        self.xp('record-milestone')
        self.page.wait_for_selector('#gmTitle')
        self.assertEqual(self.stored()['growthReports'].get('milestones', []), [])
        self.page.locator('#gmMeaning').fill('记录一次尝试的事实，不要求结果变好。')
        self.page.locator('[data-gr-action="milestone-save"]').click()
        self.assertEqual(len(self.stored()['growthReports']['milestones']), 1)

    def test_private_support_can_end_without_action(self):
        self.xp('chat-start', '[data-scene="emotion"]')
        self.page.wait_for_selector('.v36-conversation.active')
        self.assertEqual(self.page.locator('#xpDescription').count(), 0)
        self.start_internal_journey('self')
        self.page.locator('#xpDescription').fill('我今天很累，只想先停一下。')
        self.xp('journey-save-context')
        self.xp('journey-end')
        self.page.reload(wait_until='networkidle')
        self.assertEqual(len([a for a in self.stored()['actions'] if a.get('journeyId')]), 0)
        self.assertEqual(self.stored()['experience']['journeys'][-1]['step'], 'done')

    def test_light_home_and_post_entries_stay_in_chat_until_user_asks_for_structure(self):
        self.page.goto(self.url + '#/home')
        self.xp('chat-start', '[data-scene="emotion"]')
        self.page.wait_for_selector('.v36-conversation.active')
        self.assertIn('先不做练习', self.page.locator('.v36-conversation').inner_text())
        self.assertEqual(self.page.locator('#xpDescription').count(), 0)
        self.page.locator('#chatInput').fill('孩子正在搭积木。')
        self.page.locator('[data-action="chat-send"]').click()
        self.page.wait_for_timeout(500)
        self.page.locator('#chatInput').fill('我大概只有十分钟。')
        self.page.locator('[data-action="chat-send"]').click()
        self.page.wait_for_timeout(500)
        self.assertNotIn('正面解读', self.page.locator('.v36-conversation').inner_text())
        self.assertEqual(len(self.stored()['experience']['journeys']), 0)
        self.page.goto(self.url + '?quickbar=post#/experience/post/p1', wait_until='networkidle')
        self.page.wait_for_selector('[data-xp-action="adopt"]:visible')
        self.xp('adopt')
        self.page.wait_for_function("JSON.parse(localStorage.getItem('qzl-h5-app-demo-v3-state')).chat.sourcePostId === 'p1'")
        self.page.wait_for_function("document.querySelector('.v36-conversation')?.innerText.includes('先约好怎么结束')")
        self.assertIn('先约好怎么结束', self.page.locator('.v36-conversation').inner_text())
        self.assertEqual(self.page.locator('#xpDescription').count(), 0)
        pills=self.page.locator('.v90-card-pill:visible')
        self.assertEqual(pills.count(), 5)
        self.assertEqual([pills.nth(i).inner_text() for i in range(5)], ['解读卡','行动卡','优势卡','镜子卡','修复卡'])
        self.assertEqual(self.page.locator('[data-xp-action="tools"]:visible').count(), 0)
        self.assertNotIn('整理成一个小行动', self.page.locator('body').inner_text())
        self.page.locator('.v90-card-pill.action:visible').click()
        self.assertIn('行动卡', self.page.locator('.v36-conversation').inner_text())

    def test_community_back_returns_home_when_opened_from_a_direct_link(self):
        self.page.goto('about:blank')
        self.page.goto(self.url + '#/guides', wait_until='networkidle')
        self.page.locator('[data-xp-action="back"]').click()
        self.page.wait_for_selector('.xp-home')
        self.assertTrue(self.page.url.endswith('#/home'))

    def test_draft_preview_publish_and_comment_are_local(self):
        self.page.goto(self.url + '#/experience/compose')
        self.page.locator('#xpTitle').fill('试着先听完')
        self.page.locator('#xpBody').fill('我把想说的话停了一下，听完了对方的意思。<img src=x onerror=alert(1)>')
        self.page.reload(wait_until='networkidle')
        self.assertEqual(self.page.locator('#xpTitle').input_value(), '试着先听完')
        self.xp('draft-preview')
        self.assertEqual(self.stored()['experience']['posts'], [])
        self.xp('draft-publish')
        self.page.wait_for_selector('.xp-story:visible')
        self.page.locator('.xp-story').first.locator('.xp-story-open').click()
        self.page.wait_for_selector('#xpComment:visible')
        self.assertIn('本机', self.page.locator('.xp-page').inner_text())
        self.assertEqual(self.page.locator('.xp-page img[src="x"]').count(), 0)
        self.page.locator('#xpComment').fill('我想再试一次。')
        self.xp('comment')
        self.assertEqual(len(self.stored()['experience']['comments']), 1)
        self.page.reload(wait_until='networkidle')
        self.assertIn('我想再试一次。', self.page.locator('.xp-page').inner_text())

    def test_dynamic_feed_like_save_and_photo_publish_persist_locally(self):
        import base64
        self.page.goto(self.url + '#/guides')
        first=self.page.locator('.xp-story').first
        first.locator('[data-xp-action="like-post"]').click()
        self.assertIn('p1', self.stored()['experience']['liked'])
        first.locator('[data-xp-action="save-post"]').click()
        self.assertIn('p1', self.stored()['experience']['saved'])
        self.page.locator('[data-xp-action="compose"]').click()
        self.page.locator('#xpTitle').fill('今天一起准备了入园书包')
        self.page.locator('#xpBody').fill('孩子选了自己的水杯，我只帮忙确认了一次。')
        png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
        self.page.locator('#xpImages').set_input_files({'name':'school.png','mimeType':'image/png','buffer':png})
        self.page.wait_for_selector('.xp-compose-media img')
        self.xp('draft-preview')
        self.page.wait_for_selector('.xp-story-media img:visible')
        self.assertEqual(self.page.locator('.xp-story-media img:visible').count(),1)
        self.xp('draft-publish')
        self.page.wait_for_selector('.xp-story:visible')
        self.page.reload(wait_until='networkidle')
        saved=self.stored()['experience']['posts'][0]
        self.assertEqual(saved['title'],'今天一起准备了入园书包')
        self.assertEqual(len(saved['images']),1)

    def test_official_news_has_status_timeline_and_real_source_link(self):
        self.page.goto(self.url + '#/guides')
        self.xp('tab','[data-value="news"]')
        if self.page.locator('.qzl-region-sheet:visible').count():
            self.page.locator('[data-overlay-action="close"]').click()
        self.assertIn('广州市教育局',self.page.locator('.xp-page').inner_text())
        self.assertIn('本地教育信息，一处看清', self.page.locator('.xp-community-copy').inner_text())
        self.assertEqual(self.page.locator('.xp-news-source i:visible').first.inner_text(), '官方来源')
        self.assertGreater(self.page.locator('a.xp-news-original:visible').count(), 0)
        self.assertIn('打开原文', self.page.locator('a.xp-news-original:visible').first.inner_text())
        self.page.locator('[data-xp-action="route"][data-route^="experience/news/"]').first.click()
        self.page.wait_for_selector('.xp-official:visible')
        self.assertIn('关键时间',self.page.locator('.xp-official:visible').inner_text())
        source=self.page.locator('a.xp-official-link:visible')
        self.assertTrue((source.get_attribute('href') or '').startswith('https://jyj.gz.gov.cn/'))

    def test_stage_checklist_persists_without_creating_milestone(self):
        self.page.goto(self.url + '#/experience/stages')
        self.page.locator('[data-xp-action="route"][data-route^="experience/stage/"]').first.click()
        self.xp('stage-toggle')
        self.page.reload(wait_until='networkidle')
        self.assertEqual(self.page.locator('[data-xp-action="stage-toggle"][aria-pressed="true"]').count(), 1)
        self.assertEqual(self.stored()['growthReports'].get('milestones', []), [])
        for width in (360, 390, 430):
            self.page.set_viewport_size({'width': width, 'height': 844})
            self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))

    def test_four_cards_save_and_edit_without_duplicate(self):
        for kind in ('action', 'strength', 'mirror', 'repair'):
            self.page.goto(self.url + '#/experience/card/' + kind)
            self.page.locator('#xpCardEvent').fill('我刚才打断了对方的话。')
            self.page.locator('#xpCardNote').fill('我决定先听对方说完。')
            self.xp('card-prepare')
            self.assertEqual(self.page.locator('[data-xp-action="card-save"]').count(), 0)
            self.xp('card-flip')
            self.xp('card-save')
            self.assertIn('已存入百宝箱', self.page.locator('.cp-page').inner_text())
            self.xp('card-edit')
            self.page.locator('#xpCardNote').fill('修改后，我想先表达歉意。')
            self.xp('card-prepare')
            self.xp('card-flip')
            self.xp('card-save')
            saved = [c for c in self.stored()['cards']['toolbox'] if c['type'] == kind]
            self.assertEqual(len(saved), 1, 'editing a saved card updates that card')
            self.assertIn('修改后', str(saved[0]['summary']))
            self.xp('card-new')
            self.assertEqual(self.page.locator('#xpCardEvent').input_value(), '')
            self.page.locator('#xpCardEvent').fill('另一件新的事情。')
            self.page.locator('#xpCardNote').fill('这是下一次的练习。')
            self.xp('card-prepare')
            self.xp('card-flip')
            self.xp('card-save')
            self.assertEqual(len([c for c in self.stored()['cards']['toolbox'] if c['type'] == kind]), 2)
            latest_card = self.stored()['cards']['toolbox'][-1]
            self.page.goto(self.url + '#/treasure-box/card/' + latest_card['id'])
            self.assertIn('由我填写的私人练习', self.page.locator('.v90-card-meta').inner_text())
            self.assertEqual(self.page.locator('[data-action="treasure-back-chat"]').count(), 0)

    def test_search_scroll_and_relationship_survive_navigation(self):
        self.page.goto(self.url + '#/guides')
        self.page.locator('#xpSearch').fill('入园')
        self.assertGreater(self.page.locator('.xp-story').count(), 0)
        self.page.locator('.xp-page').evaluate('(el)=>el.scrollTop=200')
        top = self.page.locator('.xp-page').evaluate('(el)=>el.scrollTop')
        self.page.locator('[data-xp-action="route"][data-route^="experience/post/"]').first.click()
        self.xp('back')
        self.assertEqual(self.page.locator('#xpSearch').input_value(), '入园')
        self.assertAlmostEqual(self.page.locator('.xp-page').evaluate('(el)=>el.scrollTop'), top, delta=3)
        self.page.locator('[data-xp-action="route"][data-route^="experience/post/"]').first.click()
        self.xp('adopt')
        self.page.wait_for_selector('.v36-conversation.active')
        self.assertEqual(self.page.locator('#xpDescription').count(), 0)
        self.start_internal_journey('nursery')
        self.page.locator('#xpDescription').fill('我想和伴侣商量接送。')
        self.xp('relation', '[data-value="伴侣"]')
        self.assertEqual(self.page.locator('#xpDescription').input_value(), '我想和伴侣商量接送。')
        self.xp('journey-save-context')
        self.xp('journey-next', '[data-step="phrase"]')
        self.page.locator('#xpPhrase').fill('这是我自己想说的话。')
        self.xp('journey-next', '[data-step="action"]')
        self.assertEqual(self.page.locator('#xpActionScript').input_value(), '这是我自己想说的话。')
        self.page.locator('#xpActionScript').fill('行动页的再次编辑。')
        self.page.reload(wait_until='networkidle')
        self.assertEqual(self.page.locator('#xpActionScript').input_value(), '行动页的再次编辑。')
        self.xp('back')
        self.xp('phrase-choice', '[data-value="1"]')
        chosen = self.page.locator('#xpPhrase').input_value()
        self.xp('journey-next', '[data-step="action"]')
        self.assertEqual(self.page.locator('#xpActionScript').input_value(), chosen)

    def test_clear_conversations_removes_private_journeys(self):
        self.page.goto(self.url + '#/home')
        self.xp('chat-start', '[data-scene="emotion"]')
        self.start_internal_journey('self')
        self.page.locator('#xpDescription').fill('这句只在私人练习里。')
        self.xp('journey-save-context')
        self.page.goto(self.url + '#/settings/privacy')
        self.page.locator('[data-action="clear-chat"]').click()
        self.page.locator('[data-overlay-action="confirm-callback"]').click()
        self.assertEqual(self.stored()['experience']['journeys'], [])

    def test_comment_draft_and_adopted_method_survive(self):
        self.page.goto(self.url + '#/experience/post/p2')
        self.page.locator('#xpComment').fill('尚未提交的一点想法。')
        self.xp('save-post')
        self.assertEqual(self.page.locator('#xpComment').input_value(), '尚未提交的一点想法。')
        self.xp('adopt')
        self.page.wait_for_selector('.v36-conversation.active')
        self.assertIn('先说清自己的责任', self.page.locator('.v36-conversation').inner_text())
        self.assertEqual(self.page.locator('#xpDescription').count(), 0)
        self.start_internal_journey('screen')
        self.page.locator('#xpDescription').fill('这次是我先提高了声音。')
        self.xp('journey-save-context')
        self.xp('journey-next', '[data-step="phrase"]')
        self.xp('journey-next', '[data-step="action"]')
        self.assertIn('先说清自己的责任', self.page.locator('#xpActionTitle').input_value())

    def test_resume_after_end_and_relation_change_preserve_completed_action(self):
        self.xp('chat-start', '[data-scene="emotion"]')
        self.start_internal_journey('self')
        self.page.locator('#xpDescription').fill('我想先留两分钟给自己。')
        self.xp('journey-save-context')
        self.xp('journey-end')
        self.xp('back')
        self.xp('journey-next', '[data-step="phrase"]')
        self.xp('journey-next', '[data-step="action"]')
        self.xp('action-confirm')
        self.xp('feedback', '[data-value="better"]')
        before = [a for a in self.stored()['actions'] if a.get('journeyId')][0]
        self.assertFalse(self.stored()['experience']['journeys'][-1].get('ended'))
        for _ in range(5):
            self.xp('back')
        self.xp('relation', '[data-value="伴侣"]')
        journeys = self.stored()['experience']['journeys']
        self.assertEqual(len(journeys), 2, 'saved action keeps its original journey when relationship changes')
        self.assertIsNone(journeys[-1]['actionId'])
        after = [a for a in self.stored()['actions'] if a['id'] == before['id']][0]
        self.assertEqual(after, before)

    def test_message_helpful_is_visual_toggle_and_persists_on_the_message(self):
        self.page.goto(self.url + '#/home')
        self.page.locator('[data-action="start-scenario"][data-scenario="homework"]').click()
        self.page.wait_for_selector('.message-helpful-btn:visible')
        heart=self.page.locator('.message-helpful-btn:visible')
        self.assertEqual(heart.get_attribute('aria-pressed'), 'false')
        heart.click()
        self.assertEqual(self.page.locator('.message-helpful-btn.is-helpful:visible').count(), 1)
        self.assertTrue(self.stored()['chat']['messages'][-1].get('helpful'))
        self.assertTrue(bool(self.stored()['chat']['messages'][-1].get('helpfulAt')))
        self.assertEqual(len(self.stored().get('chatFeedbacks', [])), 1)
        self.assertEqual(self.stored()['chatFeedbacks'][0]['kind'], 'helpful')
        self.page.reload(wait_until='networkidle')
        self.assertEqual(self.page.locator('.message-helpful-btn.is-helpful:visible').count(), 1)
        self.page.locator('#chatInput').fill('我想再补充一点。')
        self.page.locator('[data-action="chat-send"]').click()
        self.page.wait_for_selector('.message-helpful-mark')
        self.assertGreaterEqual(self.page.locator('.message-helpful-mark').count(), 1)

    def test_education_region_manual_selection_filters_and_persists(self):
        self.page.goto(self.url + '?education=manual#/guides', wait_until='networkidle')
        self.xp('tab', '[data-value="news"]')
        self.page.wait_for_selector('.qzl-region-sheet:visible')
        self.assertIn('看看你家所在地区的教育资讯', self.page.locator('.qzl-region-sheet').inner_text())
        self.page.locator('[data-overlay-action="education-region-manual"]').click()
        self.page.locator('[data-region-id="sz-nanshan"]').click()
        self.page.wait_for_selector('.xp-education-region-bar:visible')
        self.assertIn('深圳市 · 南山区', self.page.locator('.xp-education-region-bar').inner_text())
        self.assertEqual(self.page.locator('.xp-news-card').count(), 0)
        self.assertIn('暂未接入 Demo 资讯', self.page.locator('.xp-news-region-empty').inner_text())
        self.assertNotIn('广州市教育局', self.page.locator('.xp-page').inner_text())
        stored = self.stored()['locationContext']
        self.assertEqual(stored['educationRegion']['id'], 'sz-nanshan')
        self.assertEqual(stored['educationRegion']['source'], 'manual')
        self.assertTrue(stored['educationRegion']['confirmed'])
        self.page.reload(wait_until='networkidle')
        self.assertIn('深圳市 · 南山区', self.page.locator('.xp-education-region-bar').inner_text())
        self.page.goto(self.url + '?education=settings#/settings/location', wait_until='networkidle')
        self.assertIn('深圳市 · 南山区', self.page.locator('.location-settings-page').inner_text())
        self.page.goto(self.url + '?education=archive#/archive', wait_until='networkidle')
        self.assertIn('深圳市 · 南山区', self.page.locator('.qzl-education-region-panel').inner_text())

    def test_education_geolocation_requires_confirmation_and_stores_no_coordinates(self):
        self.page.goto(self.url + '#/settings/location')
        self.page.locator('[data-action="education-region-open"]').click()
        self.page.locator('[data-region-id="sz-nanshan"]').click()
        self.assertEqual(self.stored()['locationContext']['educationRegion']['id'], 'sz-nanshan')
        origin = self.url.rstrip('/')
        self.page.context.grant_permissions(['geolocation'], origin=origin)
        self.page.context.set_geolocation({'latitude': 23.1247, 'longitude': 113.3612})
        self.page.locator('[data-action="education-location-use-current"]').click()
        self.page.wait_for_selector('[data-overlay-action="education-region-confirm"]:visible')
        self.assertIn('广州市 · 天河区', self.page.locator('.qzl-region-sheet').inner_text())
        before = self.stored()['locationContext']
        self.assertEqual(before['educationRegion']['id'], 'sz-nanshan', 'GPS candidate must not auto-switch the education region')
        self.assertEqual(before['currentLocation']['matchedRegionId'], 'gz-tianhe')
        self.assertEqual(before['currentLocation']['status'], 'matched')
        self.assertNotIn('lat', before['currentLocation'])
        self.assertNotIn('lng', before['currentLocation'])
        self.page.locator('[data-overlay-action="education-region-confirm"]').click()
        after = self.stored()['locationContext']
        self.assertEqual(after['educationRegion']['id'], 'gz-tianhe')
        self.assertEqual(after['educationRegion']['source'], 'gps')
        self.page.goto(self.url + '?education=gps#/guides', wait_until='networkidle')
        if self.page.locator('[data-xp-action="tab"][data-value="news"].is-active').count() == 0:
            self.xp('tab', '[data-value="news"]')
        self.assertIn('广州市 · 天河区', self.page.locator('.xp-education-region-bar').inner_text())
        self.assertEqual(self.page.locator('.xp-news-card').count(), 5)

    def test_home_clean_layout_keeps_composer_bottom_and_removes_feature_hub(self):
        self.page.goto(self.url + '#/home')
        self.page.wait_for_selector('.xp-home-clean:visible')
        home = self.page.locator('.xp-home-clean')
        self.assertEqual(home.locator('.xp-home-primary').count(), 0)
        self.assertEqual(home.locator('.xp-home-light').count(), 0)
        self.assertEqual(home.locator('.xp-home-utilities').count(), 0)
        self.assertEqual(home.locator('.xp-home-starters > button').count(), 3)
        self.assertEqual(self.page.locator('.v90-card-pill:visible').count(), 0)
        self.assertEqual(self.page.locator('#chatInput').count(), 1)
        composer = self.page.locator('.ai-shell > .composer:visible').bounding_box()
        hero = self.page.locator('.xp-home-hero:visible').bounding_box()
        starters = self.page.locator('.xp-home-starters:visible').bounding_box()
        self.assertLessEqual(hero['height'], 160)
        self.assertGreater(starters['y'], hero['y'])
        self.assertGreater(composer['y'], starters['y'] + starters['height'])
        self.assertGreater(composer['y'], 620)
        self.page.locator('.xp-home-starters > button').first.click()
        self.page.wait_for_selector('.v36-conversation.active')
        self.assertEqual(self.page.locator('.v90-card-pill:visible').count(), 5)

    def test_drawer_common_tools_has_no_placeholder_more_entry(self):
        self.page.goto(self.url + '#/home')
        self.page.locator('[data-action="drawer-open"]').click()
        section = self.page.locator('.v6-tools-section:visible')
        self.assertIn('常用功能', section.inner_text())
        self.assertNotIn('更多', section.inner_text())
        self.assertEqual(section.locator('.v6-tool-orbit > button').count(), 4)

    def test_mobile_routes_fit_and_forms_remain_reachable(self):
        for width in (360, 390, 430):
            self.page.set_viewport_size({'width': width, 'height': 844})
            for route in ('home','guides','experience/post/p1','experience/group/screen',
                          'experience/compose','experience/stage/nursery','experience/card/repair','growth'):
                self.page.goto(self.url + '#/' + route)
                self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'))
                if route.startswith('experience/'):
                    self.assertFalse(self.page.locator('.xp-page').evaluate('(el)=>el.scrollWidth>el.clientWidth+1'))
        self.page.set_viewport_size({'width':390,'height':460})
        self.page.goto(self.url + '#/experience/compose')
        self.page.locator('#xpBody').fill('较小可视高度下仍可填写和继续。')
        self.page.locator('[data-xp-action="draft-preview"]').scroll_into_view_if_needed()
        box = self.page.locator('[data-xp-action="draft-preview"]').bounding_box()
        self.assertLessEqual(box['y'] + box['height'], 461)


if __name__ == '__main__':
    unittest.main()
