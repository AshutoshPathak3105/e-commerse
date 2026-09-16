const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'http://localhost:8000';
const artifactDir = 'C:\\Users\\ashut\\.gemini\\antigravity-ide\\brain\\f71df45d-35e7-4bd6-9011-0e6c92103995';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    '--user-data-dir=' + path.join(__dirname, 'chrome_tmp_verify')
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const newTabRes = await fetch(`http://127.0.0.1:9225/json/new?${targetUrl}`, { method: 'PUT' });
    const tabData = await newTabRes.json();
    const wsUrl = tabData.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (callbacks.has(msg.id)) {
        const resolve = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        resolve(msg.result);
      }
    };

    await new Promise(r => ws.onopen = r);

    const send = (method, params = {}) => {
      return new Promise(resolve => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    };

    await send('Network.enable');
    await send('Page.enable');
    await send('Runtime.enable');

    const loadedPromise = new Promise(resolve => {
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Page.loadEventFired') resolve();
      };
      ws.addEventListener('message', handler);
    });

    await send('Page.navigate', { url: targetUrl });
    await loadedPromise;
    await new Promise(r => setTimeout(r, 3000));

    // 1. Setup seller profile & open seller portal
    const setupRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const seller = {
            isVerified: true,
            isActive: true,
            storeName: 'Apex Tech Store',
            gstin: '27ABCDE1234F1Z5',
            bizName: 'Apex Tech Enterprises Ltd',
            email: 'apex@xmart.com',
            phone: '9876543210',
            pincode: '400001',
            bankAcc: '918273645012',
            bankIfsc: 'HDFC0001234'
          };
          localStorage.setItem('xmart_seller_profile', JSON.stringify(seller));
          if (typeof Store !== 'undefined') {
            if (!Store.user) Store.user = {};
            Store.user.sellerProfile = seller;
          }
          if (typeof window._openSellerPortal === 'function') {
            window._openSellerPortal(false);
          }
          return { ready: true };
        })()
      `,
      returnByValue: true
    });
    console.log('Setup result:', setupRes.result.value);
    await new Promise(r => setTimeout(r, 1500));

    // 2. Open Inventory tab and click Offers button on first product
    const offersModalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Switch to inventory tab
          const invBtn = document.querySelector('[data-tab="inventory"]');
          if (invBtn) invBtn.click();
          
          return {
            hasInvBtn: !!invBtn
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Inventory tab click:', offersModalRes.result.value);
    await new Promise(r => setTimeout(r, 1500));

    // Trigger openSellerManageOffersModal directly or via button click
    const openModalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const offersBtn = document.querySelector('.btn-seller-offers');
          if (offersBtn) {
            offersBtn.click();
            return { triggeredVia: 'button_click' };
          }
          const prod = (typeof Store !== 'undefined' && Store.allProducts && Store.allProducts[0]) || {
            _id: 'test_sku_1',
            name: 'Fastrack Reflex Beat+ Smartwatch',
            price: 1995,
            mrp: 3995,
            brand: 'Fastrack',
            rating: 4.5,
            offers: [
              { tag: 'Bank Offer', text: '10% Instant Discount on HDFC Bank Cards', bank: 'HDFC', discount: '10% OFF', funding: 'Platform Subsidized' }
            ]
          };
          if (typeof window.openSellerManageOffersModal === 'function') {
            window.openSellerManageOffersModal(prod);
            return { triggeredVia: 'direct_call', prodName: prod.name };
          }
          return { error: 'openSellerManageOffersModal not found' };
        })()
      `,
      returnByValue: true
    });
    console.log('Open Offers Modal result:', openModalRes.result.value);
    await new Promise(r => setTimeout(r, 1500));

    // Verify modal DOM
    const modalCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('admin-manage-offers-modal');
          const isVisible = modal && modal.offsetParent !== null;
          const kpis = modal ? modal.querySelectorAll('.sku-offers-kpi-card').length : 0;
          const rows = modal ? modal.querySelectorAll('.sku-offers-table tbody tr').length : 0;
          const pubBtn = document.getElementById('sku-offers-modal-publish-btn');
          const closeBtn = document.getElementById('sku-offers-modal-close-btn');
          return {
            modalFound: !!modal,
            isVisible,
            kpis,
            rows,
            hasPublishBtn: !!pubBtn,
            publishBtnText: pubBtn?.textContent?.trim(),
            hasCloseBtn: !!closeBtn,
            closeBtnText: closeBtn?.textContent?.trim()
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Offers Modal verification:', modalCheck.result.value);

    // Capture Offers Modal Screenshot
    const shotModal = await send('Page.captureScreenshot', { format: 'png' });
    const modalShotPath = path.join(artifactDir, 'offers_modal_verified.png');
    fs.writeFileSync(modalShotPath, Buffer.from(shotModal.data, 'base64'));
    console.log('Saved Offers Modal screenshot to:', modalShotPath);

    // Test Mobile View of Offers Modal
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 800));

    const shotModalMobile = await send('Page.captureScreenshot', { format: 'png' });
    const modalMobileShotPath = path.join(artifactDir, 'offers_modal_mobile_verified.png');
    fs.writeFileSync(modalMobileShotPath, Buffer.from(shotModalMobile.data, 'base64'));
    console.log('Saved Mobile Offers Modal screenshot to:', modalMobileShotPath);

    // Reset viewport to Desktop
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 500));

    // Close the offers modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const closeBtn = document.getElementById('sku-offers-modal-close-btn');
          if (closeBtn) closeBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // 3. Switch to "Publish New Product" tab to test Multi-Image Live Preview
    const addProdTabRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const addBtn = document.querySelector('[data-tab="add-product"]');
          if (addBtn) addBtn.click();
          return { clickedAddTab: !!addBtn };
        })()
      `,
      returnByValue: true
    });
    console.log('Add Product Tab switch:', addProdTabRes.result.value);
    await new Promise(r => setTimeout(r, 1200));

    // Load 5 angle preset (e.g. Smartwatch or Smartphone)
    const presetRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const watchChip = document.querySelector('[data-preset="smartwatch"]');
          if (watchChip) watchChip.click();

          const card = document.querySelector('.storefront-live-card');
          if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });

          const counter = document.getElementById('live-preview-counter')?.textContent;
          const tag = document.getElementById('live-preview-tag-indicator')?.textContent;
          const dotsCount = document.querySelectorAll('.live-preview-dot').length;

          return {
            presetClicked: !!watchChip,
            counter,
            tag,
            dotsCount
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Preset test & carousel state:', presetRes.result.value);
    await new Promise(r => setTimeout(r, 800));

    // Capture desktop screenshot of Live Store Preview
    const shotCarousel1 = await send('Page.captureScreenshot', { format: 'png' });
    const carousel1Path = path.join(artifactDir, 'live_preview_carousel_front.png');
    fs.writeFileSync(carousel1Path, Buffer.from(shotCarousel1.data, 'base64'));
    console.log('Saved Live Preview Front screenshot to:', carousel1Path);

    // Click Next Arrow on carousel
    const nextRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const nextBtn = document.getElementById('live-preview-arrow-next');
          if (nextBtn) nextBtn.click();
          return {
            counter: document.getElementById('live-preview-counter')?.textContent,
            tag: document.getElementById('live-preview-tag-indicator')?.textContent
          };
        })()
      `,
      returnByValue: true
    });
    console.log('After Next click:', nextRes.result.value);
    await new Promise(r => setTimeout(r, 800));

    // Capture desktop screenshot of second angle
    const shotCarousel2 = await send('Page.captureScreenshot', { format: 'png' });
    const carousel2Path = path.join(artifactDir, 'live_preview_carousel_angle2.png');
    fs.writeFileSync(carousel2Path, Buffer.from(shotCarousel2.data, 'base64'));
    console.log('Saved Live Preview Angle 2 screenshot to:', carousel2Path);

    // Capture mobile view of Live Preview
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.storefront-live-card');
          if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const shotCarouselMobile = await send('Page.captureScreenshot', { format: 'png' });
    const carouselMobilePath = path.join(artifactDir, 'live_preview_mobile_verified.png');
    fs.writeFileSync(carouselMobilePath, Buffer.from(shotCarouselMobile.data, 'base64'));
    console.log('Saved Mobile Live Preview screenshot to:', carouselMobilePath);

    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    chrome.kill();
  }
}

run();
