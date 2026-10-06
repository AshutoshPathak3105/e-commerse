const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (e) {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:8000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.evaluate(() => {
    localStorage.setItem('xmart_token', 'mock_token');
    localStorage.setItem('xmart_user', JSON.stringify({
      name: 'Ashutosh Pathak',
      email: 'ashutoshpathak127@gmail.com',
      isAdmin: true,
      staffRole: 'Super Administrator'
    }));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Open admin panel
  await page.evaluate(() => {
    if (typeof openAdminPanel === 'function') {
      openAdminPanel('cms');
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Take mobile screenshot
  await page.screenshot({ path: 'scratch/cms_restored_mobile.png', fullPage: false });
  console.log('Mobile screenshot saved to scratch/cms_restored_mobile.png');

  // Set desktop viewport
  await page.setViewport({ width: 1280, height: 900 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scratch/cms_restored_desktop.png', fullPage: false });
  console.log('Desktop screenshot saved to scratch/cms_restored_desktop.png');

  await browser.close();
})();
