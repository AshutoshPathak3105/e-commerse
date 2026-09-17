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

    // Open Auth Modal via Admin Login Shortcut / Link
    await page.evaluate(() => {
      const modal = document.querySelector('#auth-modal');
      if (modal) modal.style.display = 'flex';
      // Call showAuthStep('admin-login') directly to ensure admin portal modal is visible
      if (typeof showAuthStep === 'function') {
        showAuthStep('admin-login');
      }
    });

    await new Promise(r => setTimeout(r, 500));

    // Capture screenshot of Admin Portal Modal
    await page.screenshot({ path: 'scratch/admin_portal_user_login_tab.png' });
    console.log('Saved scratch/admin_portal_user_login_tab.png');

    // Click User Login tab
    await page.evaluate(() => {
      const userLoginBtn = Array.from(document.querySelectorAll('#admin-main-tabs button')).find(b => b.textContent.includes('User Login'));
      if (userLoginBtn) userLoginBtn.click();
    });

    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: 'scratch/after_clicking_user_login_tab.png' });
    console.log('Saved scratch/after_clicking_user_login_tab.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
