const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Navigating to http://localhost:3011...');
    await page.goto('http://localhost:3011', { waitUntil: 'networkidle' });

    console.log('Attempting login...');
    await page.fill('input[name="username"], input[placeholder*="usuário"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[placeholder*="senha"], input[type="password"]', 'admin');
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');

    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('Logged in. Navigating to http://localhost:3011/settings...');

    // Directly navigate to the URL provided by the user
    await page.goto('http://localhost:3011/settings', { waitUntil: 'networkidle' });
    
    // Extra wait for the page to be fully rendered
    await page.waitForTimeout(3000);

    const screenshotPath = '/tmp/settings_final_v3.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to ${screenshotPath}`);
    console.log(`Final URL: ${page.url()}`);

    await browser.close();
})();
