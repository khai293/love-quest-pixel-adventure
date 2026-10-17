"""Verify the real supplied MP3 and player controls in Chromium."""
import os
import unittest
from playwright.sync_api import expect, sync_playwright

BASE_URL = os.environ.get('LOVEQUEST_TEST_URL', 'http://127.0.0.1:8000/')


class BackgroundMusicTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = None
        self.errors = []

    def tearDown(self):
        if self.context:
            self.context.close()
        self.assertEqual(self.errors, [])

    def open_game(self, mobile=False):
        options = {'viewport': {'width': 390, 'height': 844}, 'is_mobile': True, 'has_touch': True} if mobile else {'viewport': {'width': 1280, 'height': 800}}
        self.context = self.browser.new_context(**options)
        page = self.context.new_page()
        page.on('pageerror', lambda error: self.errors.append(str(error)))
        page.goto(BASE_URL)
        expect(page.locator('#loadingMessage')).to_be_hidden()
        return page

    def wait_playing(self, page):
        page.wait_for_function('''() => {
          const audio = document.querySelector('#backgroundMusic');
          return !audio.paused && audio.readyState >= 2 && audio.currentTime > 0.1;
        }''')

    def test_mp3_playback_controls_and_loop(self):
        page = self.open_game()
        self.assertTrue(page.locator('#backgroundMusic').evaluate('audio => audio.paused && audio.currentTime === 0'))
        page.locator('#startNew').click()
        self.wait_playing(page)
        audio = page.locator('#backgroundMusic')
        self.assertIn('/assets/audio/noi-nay-co-anh-instrumental.mp3', audio.evaluate('audio => audio.currentSrc'))
        self.assertAlmostEqual(audio.evaluate('audio => audio.duration'), 264.7, delta=1)

        page.locator('#settingsBtn').click()
        expect(page.locator('#panelContent')).to_contain_text('Nơi này có anh')
        page.locator('#volumeInput').fill('0.2')
        self.assertAlmostEqual(audio.evaluate('audio => audio.volume'), 0.2)
        page.keyboard.press('Escape')

        page.locator('#soundBtn').click()
        paused_at = audio.evaluate('audio => audio.currentTime')
        self.assertTrue(audio.evaluate('audio => audio.paused'))
        page.wait_for_timeout(250)
        self.assertAlmostEqual(audio.evaluate('audio => audio.currentTime'), paused_at, delta=0.08)
        page.locator('#soundBtn').click()
        self.wait_playing(page)
        page.wait_for_timeout(250)
        self.assertGreater(audio.evaluate('audio => audio.currentTime'), paused_at)

        # Opening a memory must keep the same song position instead of restarting it.
        position_before_chapter = audio.evaluate('audio => audio.currentTime')
        page.locator('#guideBtn').click()
        page.wait_for_timeout(400)
        page.keyboard.press('e')
        expect(page.locator('#activityModal')).to_be_visible()
        self.assertGreaterEqual(audio.evaluate('audio => audio.currentTime'), position_before_chapter - 0.08)
        page.locator('.activity-close').click()

        # Consume the real file to its end at accelerated speed. This also works with
        # a simple development server that does not advertise HTTP byte-range seeking.
        audio.evaluate('''audio => {
          window.musicLoopObserved = false;
          let previous = audio.currentTime;
          const observe = () => {
            if (previous > audio.duration - 10 && audio.currentTime < 10) {
              window.musicLoopObserved = true;
              audio.playbackRate = 1;
              audio.removeEventListener('timeupdate', observe);
            }
            previous = audio.currentTime;
          };
          audio.addEventListener('timeupdate', observe);
          audio.playbackRate = 16;
        }''')
        page.wait_for_function('window.musicLoopObserved', timeout=30000)
        self.assertFalse(audio.evaluate('audio => audio.paused'))

        # Headless Chromium keeps tabs active. Deliver the browser lifecycle events
        # and assert the actual MP3 pauses/resumes, rather than mocking the player.
        page.evaluate('window.dispatchEvent(new Event("blur"))')
        page.wait_for_function('document.querySelector("#backgroundMusic").paused')
        page.evaluate('window.dispatchEvent(new Event("focus"))')
        self.wait_playing(page)

        page.locator('#soundBtn').click()
        page.reload()
        expect(page.locator('#loadingMessage')).to_be_hidden()
        page.locator('#continueBtn').click()
        self.assertTrue(page.locator('#backgroundMusic').evaluate('audio => audio.paused'))
        expect(page.locator('#soundBtn')).to_have_attribute('aria-label', 'Bật nhạc')
        self.assertEqual(page.evaluate('JSON.parse(localStorage.getItem("lovequest.preferences.v1")).volume'), 0.2)

    def test_mobile_touch_starts_music(self):
        page = self.open_game(mobile=True)
        self.assertTrue(page.locator('#backgroundMusic').evaluate('audio => audio.paused'))
        page.locator('#startNew').tap()
        self.wait_playing(page)
        page.locator('#soundBtn').tap()
        self.assertTrue(page.locator('#backgroundMusic').evaluate('audio => audio.paused'))
        page.locator('#soundBtn').tap()
        self.wait_playing(page)
        self.assertTrue(page.locator('#backgroundMusic').evaluate('audio => audio.loop'))


if __name__ == '__main__':
    unittest.main(verbosity=2)
