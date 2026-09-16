const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser to test Offer Card Arrow Chevron Click...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });

    // Click on the first product card to open Product Detail page
    await page.waitForSelector('.product-card, .grid-product-card', { timeout: 10000 });
    const productCard = await page.$('.product-card, .grid-product-card');
    if (productCard) {
      await productCard.click();
      console.log('Clicked product card to open Product Detail Page.');
    }

    // Wait for offer card or chevron
    await page.waitForTimeout(2000);
    const chevron = await page.$('.offer-card-chevron, .offer-card-footer, .offer-card-box');
    if (chevron) {
      console.log('Found offer card chevron / footer. Clicking...');
      await chevron.click();
      await page.waitForTimeout(1000);

      const modal = await page.$('#sku-offer-details-modal.is-active, #sku-offer-details-modal');
      const isVisible = await page.evaluate(() => {
        const m = document.getElementById('sku-offer-details-modal');
        return m && m.style.display !== 'none';
      });

      console.log('Offer Terms Modal Visible:', isVisible);
      await page.screenshot({ path: 'scratch/offer_modal_verification.png' });
      console.log('Saved screenshot to scratch/offer_modal_verification.png');
    } else {
      console.log('No offer card chevron found on product detail page.');
    }

  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
  }
})();
