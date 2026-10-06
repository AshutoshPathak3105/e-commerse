const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function getChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

(async () => {
  const chromePath = await getChromePath();
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Mobile test (390px width - iPhone)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const filePath = 'file://' + path.resolve(__dirname, 'test_reviews_filter_mobile.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.resolve(__dirname, 'reviews_filter_mobile_verified.png'), fullPage: true });
  console.log('Mobile screenshot saved to reviews_filter_mobile_verified.png');

  // Tablet test (768px width - iPad)
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await page.screenshot({ path: path.resolve(__dirname, 'reviews_filter_tablet_verified.png'), fullPage: true });
  console.log('Tablet screenshot saved to reviews_filter_tablet_verified.png');

  await browser.close();
})();
