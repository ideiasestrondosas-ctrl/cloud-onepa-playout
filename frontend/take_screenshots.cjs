const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const outDir = '/Users/Shared/antigravity/cloud-onepa-alpha';

  try {
    console.log("Navigating to login...");
    await page.goto('http://localhost:3011');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '01_login.png') });
    console.log("Saved 01_login.png");

    console.log("Logging in...");
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].fill('admin');
      await inputs[1].fill('admin');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: path.join(outDir, '02_painel.png') });
    console.log("Saved 02_painel.png");

    console.log("Navigating to Modelos...");
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button, [role="menuitem"], li'));
      const target = links.find(el => el.textContent.toLowerCase().includes('modelos') || el.textContent.toLowerCase().includes('models'));
      if (target) target.click();
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '03_modelos.png') });
    console.log("Saved 03_modelos.png");

    console.log("Navigating to Configurações...");
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button, [role="menuitem"], li'));
      const target = links.find(el => el.textContent.toLowerCase().includes('configurações') || el.textContent.toLowerCase().includes('settings'));
      if (target) target.click();
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '04_configuracoes.png') });
    console.log("Saved 04_configuracoes.png");

    console.log("Navigating to Saúde do sistema...");
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button, [role="menuitem"], li'));
      const target = links.find(el => el.textContent.toLowerCase().includes('saúde') || el.textContent.toLowerCase().includes('health'));
      if (target) target.click();
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '05_saude_do_sistema.png') });
    console.log("Saved 05_saude_do_sistema.png");

    console.log("Navigating to Sobre o sistema...");
    await page.goto('http://localhost:3011');
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button, [role="menuitem"], li'));
      const config = links.find(el => el.textContent.toLowerCase().includes('configurações') || el.textContent.toLowerCase().includes('settings'));
      if (config) config.click();
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('a, button, [role="tab"], li'));
      const sobre = tabs.find(el => el.textContent.toLowerCase().includes('sobre') || el.textContent.toLowerCase().includes('about'));
      if (sobre) sobre.click();
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '06_sobre_o_sistema.png') });
    console.log("Saved 06_sobre_o_sistema.png");

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
