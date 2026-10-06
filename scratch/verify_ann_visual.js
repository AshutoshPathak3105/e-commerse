const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test mobile (375x812) and tablet (768x1024)
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://127.0.0.1:5500/index.html', { waitUntil: 'networkidle0' }).catch(async () => {
      // If no local server, open file directly
      const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
      await page.goto(fileUrl, { waitUntil: 'load' });
    });

    // Open Admin Console and navigate to CMS
    await page.evaluate(() => {
      localStorage.setItem('xmart_admin_active', '1');
      const u = { name: 'Admin', role: 'admin', email: 'admin@xmart.com' };
      localStorage.setItem('xmart_user', JSON.stringify(u));
      if (typeof window.openAdminPanel === 'function') {
        window.openAdminPanel();
      }
    });

    await new Promise(r => setTimeout(r, 800));

    // Click CMS & Storefront tab if available
    await page.evaluate(() => {
      const cmsTab = Array.from(document.querySelectorAll('.ap-sidebar-nav-item, .ap-nav-item, button')).find(b => b.textContent.includes('CMS') || b.textContent.includes('Storefront'));
      if (cmsTab) cmsTab.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // Capture announcement section element or header
    const el = await page.$('#ap-announcements-section');
    if (el) {
      await el.screenshot({ path: path.join(__dirname, `verify_ann_${vp.name}.png`) });
      console.log(`Saved screenshot for ${vp.name}`);
    } else {
      console.log(`Could not find #ap-announcements-section for ${vp.name}`);
      // Take full page screenshot
      await page.screenshot({ path: path.join(__dirname, `verify_page_${vp.name}.png`), fullPage: false });
    }
  }

  await browser.close();
})();
