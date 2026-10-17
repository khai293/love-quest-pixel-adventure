"""Real browser regression tests. Run against a local static server (see README)."""
import json
import os
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE_URL = os.environ.get('LOVEQUEST_TEST_URL', 'http://127.0.0.1:8000/')
SAVE_KEY = 'lovequest.our-story.v1'


class GameBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1280, 'height': 900})
        self.page = self.context.new_page()
        self.errors, self.failed = [], []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.on('requestfailed', lambda r: self.failed.append(r.url))
        self.page.goto(BASE_URL)
        expect(self.page.locator('#loadingMessage')).to_be_hidden()

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])
        self.assertEqual(self.failed, [])

    def progress(self):
        return self.page.evaluate('window.loveQuest.getProgress()')

    def advance_dialogue(self):
        for _ in range(15):
            button = self.page.locator('[data-dialogue-next]')
            if not button.count():
                return
            button.click()
        self.fail('Dialogue did not finish')

    def next_step(self):
        expect(self.page.locator('.activity-next')).to_be_enabled()
        self.page.locator('.activity-next').click()

    def canvas_move(self, x, y, wait_ms):
        canvas = self.page.locator('.activity-canvas')
        canvas.scroll_into_view_if_needed()
        box = canvas.bounding_box()
        self.page.mouse.click(box['x'] + x * box['width'] / 640, box['y'] + y * box['height'] / 270)
        self.page.wait_for_timeout(wait_ms)

    def arrive(self):
        self.page.locator('#guideBtn').click()
        expect(self.page.locator('#fadeLayer')).not_to_have_class('active')
        expect(self.page.locator('#interactPrompt')).to_be_visible()
        self.page.keyboard.press('e')
        expect(self.page.locator('#activityModal')).to_be_visible()
        self.advance_dialogue()

    def finish_chapter(self, chapter):
        self.advance_dialogue()
        expect(self.page.locator('#panelModal')).to_be_visible()
        self.assertEqual(self.progress()['completed'], list(range(chapter + 1)))
        self.page.locator('#stayHere').click()

    def test_full_story_and_resume(self):
        page = self.page
        page.locator('#startNew').click()
        self.arrive()
        expect(page.locator('.activity-next')).to_be_disabled()
        for x, y, delay in [(150, 184, 1500), (315, 145, 2200), (480, 183, 2200), (590, 167, 1600)]:
            self.canvas_move(x, y, delay)
        self.next_step()
        for i in range(5):
            page.locator(f'[data-flower="{i}"]').click()
            page.locator(f'[data-flower-slot="{i}"]').click()
        self.next_step()
        self.finish_chapter(0)

        self.arrive()
        for cell in ['1,4', '1,3', '2,3', '2,2', '3,2', '3,1', '4,1', '4,0']:
            page.locator(f'[data-cell="{cell}"]').click()
        self.next_step()
        self.assertEqual(self.progress()['steps']['1'], 1)
        # Reload mid-chapter: Continue must resume at the phone, not reset the route.
        page.reload()
        expect(page.locator('#loadingMessage')).to_be_hidden()
        page.locator('#continueBtn').click()
        self.arrive()
        expect(page.locator('[data-reply="0"]')).to_be_visible()
        for _ in range(3):
            page.locator('[data-reply="0"]').click()
            page.locator('[data-send]').click()
            page.wait_for_timeout(500)
        self.next_step()
        self.canvas_move(535, 196, 5000)
        expect(page.locator('[data-pickup]')).to_be_enabled()
        page.locator('[data-pickup]').click()
        self.canvas_move(65, 198, 5000)
        self.next_step()
        self.finish_chapter(1)

        self.arrive()
        for i in range(5):
            page.locator(f'[data-ticket="{i}"]').click()
            page.locator(f'[data-person="{i}"]').click()
        for i in range(5):
            page.locator(f'[data-person="{i}"]').click()
            page.locator(f'[data-seat="{i}"]').click()
        self.next_step()
        page.locator('[data-hide-food]').click()
        for person, food in enumerate([2, 0, 4, 1, 3]):
            page.locator(f'[data-food="{food}"]').click()
            page.locator(f'[data-food-person="{person}"]').click()
        self.next_step()
        for i in range(5):
            page.locator(f'[data-photo-person="{i}"]').click()
            page.locator(f'[data-photo-slot="{i}"]').click()
        page.locator('[data-shutter]').click()
        self.assertTrue(page.evaluate('JSON.parse(localStorage.getItem("lovequest.photo.v1")).startsWith("data:image/png;base64,")'))
        self.next_step()
        self.finish_chapter(2)

        self.arrive()
        for side in ['female', 'male']:
            for i in range(3):
                page.locator(f'[data-thought="{side}:{i}"]').click()
        self.next_step()
        for group in range(3):
            page.locator(f'[data-message-piece="{group}:1"]').click()
        page.locator('[data-send-feelings]').click()
        self.next_step()
        page.keyboard.down('a')
        page.keyboard.down('l')
        page.wait_for_timeout(2800)
        page.keyboard.up('a')
        page.keyboard.up('l')
        page.locator('[data-hug]').click()
        self.next_step()
        self.finish_chapter(3)

        self.arrive()
        for i in range(4):
            page.locator(f'[data-memory="{i}"]').click()
            page.locator(f'[data-memory-slot="{i}"]').click()
        self.next_step()
        page.locator('[data-ribbon]').fill('100')
        page.locator('[data-open-letter]').click()
        page.locator('.activity-personal-settings summary').click()
        page.locator('[name=greeting]').fill('Lời chúc riêng để kiểm thử')
        page.locator('[name=letter]').fill('Bức thư cá nhân để kiểm thử chức năng lưu.')
        page.locator('[data-save-personal]').click()
        self.assertIn('Bức thư', page.evaluate('JSON.parse(localStorage.getItem("lovequest.personal.v1")).letter'))
        self.next_step()
        self.finish_chapter(4)
        page.locator('#albumBtn').click()
        self.assertEqual(page.locator('.album-page:not(.locked)').count(), 5)
        expect(page.locator('.photo-grid img')).to_have_count(1)
        # Replay keeps the entire completed story intact.
        page.locator('[data-replay="0"]').click()
        expect(page.locator('#activityModal')).to_be_visible()
        page.locator('.activity-close').click()
        self.assertEqual(self.progress()['completed'], [0, 1, 2, 3, 4])
        page.locator('#homeBtn').click()
        before = page.evaluate(f'localStorage.getItem("{SAVE_KEY}")')
        page.locator('#previewBtn').click()
        page.locator('#guideBtn').click()
        page.locator('[data-area="lake"]').click()
        page.wait_for_timeout(400)
        self.assertEqual(page.evaluate(f'localStorage.getItem("{SAVE_KEY}")'), before)

    def test_keyboard_settings_and_bad_import(self):
        page = self.page
        page.locator('#startNew').click()
        before = page.evaluate('window.loveQuest.getWorld().player')
        page.keyboard.down('ArrowRight')
        page.wait_for_timeout(500)
        page.keyboard.up('ArrowRight')
        after = page.evaluate('window.loveQuest.getWorld().player')
        self.assertNotEqual(after['x'], before['x'])
        page.keyboard.press('c')
        self.assertEqual(page.evaluate('window.loveQuest.getWorld().player.character'), 'male')
        page.keyboard.press('Tab')
        self.assertEqual(page.evaluate('window.loveQuest.getWorld().player.character'), 'male')
        page.locator('#albumBtn').focus()
        page.keyboard.press('Enter')
        expect(page.locator('#panelModal')).to_be_visible()
        expect(page.locator('#activityModal')).to_be_hidden()
        page.keyboard.press('Escape')
        page.locator('#settingsBtn').click()
        page.locator('#femaleName').fill('Tên thử nghiệm')
        page.locator('#femaleName').press('Tab')
        page.locator('#volumeInput').fill('0.5')
        page.locator('#qualityInput').select_option('low')
        invalid = {'version': 1, 'completed': [], 'steps': {'0': 0.5}}
        page.locator('#importSave').set_input_files({'name': 'invalid.json', 'mimeType': 'application/json', 'buffer': json.dumps(invalid).encode()})
        expect(page.locator('#toast')).to_contain_text('không hợp lệ')
        expect(page.locator('#panelModal')).to_be_visible()
        page.keyboard.press('Escape')
        page.reload()
        expect(page.locator('#loadingMessage')).to_be_hidden()
        page.locator('#continueBtn').click()
        self.assertEqual(self.progress()['names']['female'], 'Tên thử nghiệm')
        self.assertEqual(page.evaluate('window.loveQuest.getWorld().player.character'), 'male')

    def test_mobile_touch_and_responsive(self):
        self.context.close()
        self.context = self.browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        self.page = page = self.context.new_page()
        page.on('pageerror', lambda e: self.errors.append(str(e)))
        page.goto(BASE_URL)
        expect(page.locator('#loadingMessage')).to_be_hidden()
        page.locator('#startNew').tap()
        before = page.evaluate('window.loveQuest.getWorld().player.x')
        right = page.locator('[data-dir="right"]').bounding_box()
        session = self.context.new_cdp_session(page)
        session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': right['x'] + right['width']/2, 'y': right['y'] + right['height']/2}]})
        page.wait_for_timeout(700)
        session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        self.assertGreater(page.evaluate('window.loveQuest.getWorld().player.x'), before)
        page.locator('#guideBtn').tap()
        page.wait_for_timeout(500)
        page.locator('#touchInteract').tap()
        expect(page.locator('#activityModal')).to_be_visible()
        self.advance_dialogue()
        self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'), 390)
        expect(page.locator('.activity-next')).to_be_disabled()
        page.locator('.activity-close').tap()
        page.locator('#homeBtn').tap()
        for width, height in [(844, 390), (667, 375), (360, 640)]:
            page.set_viewport_size({'width': width, 'height': height})
            page.locator('#previewBtn').scroll_into_view_if_needed()
            expect(page.locator('#previewBtn')).to_be_in_viewport()
            self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'), width)
        page.locator('#previewBtn').tap()
        expect(page.locator('#mobileControls')).to_be_visible()

    def test_published_letter_uses_story_configuration(self):
        page = self.page
        dialogue = json.loads((Path(__file__).resolve().parents[1] / 'story/dialogues.json').read_text())
        dialogue['personal']['greeting']['text'] = 'Lời chúc được cấu hình cho người nhận'
        dialogue['personal']['letter']['text'] = 'Nội dung lá thư lấy từ dữ liệu xuất bản.'
        dialogue['personal']['photos'] = ['assets/key-art.png']
        page.route('**/story/dialogues.json', lambda route: route.fulfill(json=dialogue))
        page.reload()
        expect(page.locator('#loadingMessage')).to_be_hidden()
        page.locator('#settingsBtn').click()
        imported = {'version': 1, 'completed': [0, 1, 2, 3], 'steps': {'4': 1}, 'album': [0, 1, 2, 3]}
        page.locator('#importSave').set_input_files({'name': 'gift.json', 'mimeType': 'application/json', 'buffer': json.dumps(imported).encode()})
        expect(page.locator('#questCard')).to_be_visible()
        self.arrive()
        page.locator('[data-ribbon]').fill('100')
        page.locator('[data-open-letter]').click()
        expect(page.locator('.activity-greeting')).to_have_text('Lời chúc được cấu hình cho người nhận')
        expect(page.locator('.activity-letter-text')).to_have_text('Nội dung lá thư lấy từ dữ liệu xuất bản.')
        expect(page.locator('.activity-private-photos img')).to_have_count(1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
