const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'http://localhost:8000';
const artifactDir = 'C:\\Users\\ashut\\.gemini\\antigravity-ide\\brain\\f71df45d-35e7-4bd6-9011-0e6c92103995';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,950',
    '--user-data-dir=' + path.join(__dirname, 'chrome_tmp_live_card')
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const newTabRes = await fetch(`http://127.0.0.1:9226/json/new?${targetUrl}`, { method: 'PUT' });
    const tabData = await newTabRes.json();
    const ws = new WebSocket(tabData.webSocketDebuggerUrl);

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

    // Setup seller and open portal
    await send('Runtime.evaluate', {
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
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // Switch to Add Product tab (Product Listing Studio)
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tabBtn = Array.from(document.querySelectorAll('.seller-tab-btn')).find(b => b.textContent.includes('Listing') || b.dataset.tab === 'add-product');
          if (tabBtn) tabBtn.click();

          // Click Smartwatch preset
          const watchChip = document.querySelector('[data-preset="smartwatch"]');
          if (watchChip) watchChip.click();

          const card = document.querySelector('.storefront-live-card');
          if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    // Desktop screenshot of live card
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const shot1Path = path.join(artifactDir, 'storefront_live_card_carousel.png');
    fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
    console.log('Saved storefront_live_card_carousel.png');

    // Click Next Arrow to switch to Left Angle
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const nextArrow = document.getElementById('live-preview-arrow-next');
          if (nextArrow) nextArrow.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const shot2Path = path.join(artifactDir, 'storefront_live_card_angle_left.png');
    fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
    console.log('Saved storefront_live_card_angle_left.png');

  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

run();
