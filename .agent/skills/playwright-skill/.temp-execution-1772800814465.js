const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3011';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Dashboard...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait for the Dashboard text to ensure it's loaded
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    await page.screenshot({ path: '/tmp/dashboard.png' });
    console.log('📸 Dashboard screenshot saved to /tmp/dashboard.png');

    console.log('Navigating to Media Manager...');
    // Click on Media Manager tab
    await page.click('text=Media Manager');
    await page.waitForTimeout(1000); // Wait for transition
    await page.screenshot({ path: '/tmp/media_manager.png' });
    console.log('📸 Media Manager screenshot saved to /tmp/media_manager.png');

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error.message);
  } finally {
    await browser.close();
  }
})();
