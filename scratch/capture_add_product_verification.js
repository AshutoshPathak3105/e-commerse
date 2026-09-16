const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'http://localhost:8000';
const desktopOut = path.join(__dirname, 'add_product_desktop_verification.png');
const mobileOut = path.join(__dirname, 'add_product_mobile_verification.png');

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    '--user-data-dir=' + path.join(__dirname, 'chrome_tmp_add_prod')
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const newTabRes = await fetch(`http://127.0.0.1:9223/json/new?${targetUrl}`, { method: 'PUT' });
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

    // Evaluate opening seller portal and switching to Add Product
    const evalRes = await send('Runtime.evaluate', {
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

          // Navigate to add product tab
          const addBtn = document.querySelector('[data-seller-tab="add-product"]') || Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Add New Product') || el.textContent.includes('Add Product'));
          if (addBtn) {
            addBtn.click();
          }

          // Select Winners preset if present
          const presetSelect = document.getElementById('angle-preset-select');
          if (presetSelect) {
            presetSelect.value = 'winners';
            presetSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }

          return {
            presetOptions: presetSelect ? Array.from(presetSelect.options).map(o => o.value) : [],
            selectedVal: presetSelect ? presetSelect.value : null,
            liveCardTitle: document.getElementById('live-preview-title')?.textContent,
            liveCardBrand: document.getElementById('live-preview-brand')?.textContent,
            liveCardPrice: document.getElementById('live-preview-price')?.textContent,
            liveCardMrp: document.getElementById('live-preview-mrp')?.textContent,
            liveCardDisc: document.getElementById('live-preview-disc')?.textContent
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Eval result:', JSON.stringify(evalRes.result.value, null, 2));

    await new Promise(r => setTimeout(r, 1500));

    // Scroll to section 4 and live card
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.storefront-live-card');
          if (card) {
            card.scrollIntoView({ behavior: 'instant', block: 'center' });
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 800));

    // Desktop screenshot
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(desktopOut, Buffer.from(shot1.data, 'base64'));
    console.log('Saved desktop screenshot:', desktopOut);

    // Switch to mobile viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await new Promise(r => setTimeout(r, 800));

    // Scroll to section 4 & live preview in mobile
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.storefront-live-card');
          if (card) {
            card.scrollIntoView({ behavior: 'instant', block: 'center' });
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 800));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(mobileOut, Buffer.from(shot2.data, 'base64'));
    console.log('Saved mobile screenshot:', mobileOut);

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
