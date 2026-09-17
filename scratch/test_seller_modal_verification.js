const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const filePath = `file://${path.resolve('index.html')}`;
    console.log('Navigating to:', filePath);
    await page.goto(filePath, { waitUntil: 'load' });

    // Test 1: Open Seller Auth Modal
    const sellerModalState = await page.evaluate(() => {
      // Clear auth user to trigger unauthenticated seller gate
      localStorage.removeItem('xmart_user');
      localStorage.removeItem('xmart_token');
      if (typeof window._openSellerPortal === 'function') {
        window._openSellerPortal();
      }
      const title = document.querySelector('#auth-modal .xmodal-header h3')?.textContent;
      const shortcut = document.querySelector('#admin-login-shortcut-wrap')?.style.display;
      const shortcutHTML = document.querySelector('#admin-login-shortcut-wrap')?.innerHTML;
      return { title, shortcut, shortcutHTML };
    });
    console.log('Seller Modal State:', sellerModalState);

    await page.screenshot({ path: 'scratch/seller_sign_in_modal_verified.png' });

    // Test 2: Open Customer Auth Modal
    const customerModalState = await page.evaluate(() => {
      if (typeof window._openAuth === 'function') {
        window._openAuth('signin');
      }
      const title = document.querySelector('#auth-modal .xmodal-header h3')?.textContent;
      const shortcut = document.querySelector('#admin-login-shortcut-wrap')?.style.display;
      const shortcutHTML = document.querySelector('#admin-login-shortcut-wrap')?.innerHTML;
      return { title, shortcut, shortcutHTML };
    });
    console.log('Customer Modal State:', customerModalState);

    await page.screenshot({ path: 'scratch/customer_sign_in_modal_verified.png' });

    // Test 3: Open Admin Login Modal
    const adminModalState = await page.evaluate(() => {
      if (typeof showAuthStep === 'function') {
        showAuthStep('admin-login');
      }
      const title = document.querySelector('#auth-modal .xmodal-header h3')?.textContent;
      const tab1 = document.querySelectorAll('#admin-main-tabs button')[0]?.textContent;
      const tab2 = document.querySelectorAll('#admin-main-tabs button')[1]?.textContent;
      const userLoginBtn = document.querySelector('#admin-to-user-login-btn')?.textContent;
      return { title, tab1, tab2, userLoginBtn };
    });
    console.log('Admin Modal State:', adminModalState);

    await page.screenshot({ path: 'scratch/admin_portal_modal_verified.png' });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
