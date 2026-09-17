const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const filePath = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'load' });

  // Trigger Seller Sign In
  await page.evaluate(() => {
    window._openAuth?.('signin', true, null, 'seller');
  });

  await page.waitForTimeout(500);

  const emailVal = await page.evaluate(() => document.querySelector('#auth-login-email')?.value);
  const passVal = await page.evaluate(() => document.querySelector('#auth-login-password')?.value);

  console.log('Email value in modal:', JSON.stringify(emailVal));
  console.log('Password value in modal:', JSON.stringify(passVal));

  const artifactPath = path.resolve(process.env.APPDATA || 'C:\\Users\\ashut\\.gemini\\antigravity-ide', 'antigravity-ide/brain/ea73a337-7070-43f4-a22b-8e7ca827dbf5/clean_seller_login_modal.png');
  await page.screenshot({ path: artifactPath });
  console.log('Screenshot saved to:', artifactPath);

  await browser.close();
})();
