const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });

  // Switch to seller view and go to Add Product tab
  await page.evaluate(() => {
    localStorage.setItem('currentUser', JSON.stringify({
      id: 'seller-1',
      name: 'Apex Merchant',
      email: 'merchant@apex.com',
      role: 'seller',
      storeName: 'Apex Tech Store'
    }));
    // Open seller portal
    if (typeof openSellerPortal === 'function') {
      openSellerPortal();
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Click on "Add New Product" tab or call renderAddProductPage
  await page.evaluate(() => {
    const addTab = document.querySelector('[data-seller-tab="add-product"]') || Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Add New Product') || el.textContent.includes('Add Product'));
    if (addTab) {
      addTab.click();
    } else if (typeof renderSellerAddProduct === 'function') {
      renderSellerAddProduct();
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Capture desktop Add Product view showing Angle presets and Live preview
  await page.screenshot({ path: path.join(__dirname, 'seller_add_prod_desktop.png'), fullPage: false });

  // Now test mobile view
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(__dirname, 'seller_add_prod_mobile.png'), fullPage: false });

  console.log('Screenshots saved successfully.');
  await browser.close();
})();
