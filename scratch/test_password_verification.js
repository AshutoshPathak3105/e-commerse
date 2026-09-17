const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'file:///C:/Users/ashut/Documents/E-Commerse/index.html';
const customerModalImg = path.join(__dirname, 'customer_login_modal.png');
const sellerModalImg = path.join(__dirname, 'seller_login_modal.png');

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9234',
    '--disable-gpu',
    '--no-sandbox',
    '--allow-file-access-from-files',
    '--window-size=1280,900',
    '--user-data-dir=' + path.join(__dirname, 'chrome_tmp_pwd_verify10')
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const newTabRes = await fetch(`http://127.0.0.1:9234/json/new?${targetUrl}`, { method: 'PUT' });
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

    await send('Page.navigate', { url: targetUrl });
    await new Promise(r => setTimeout(r, 2000));

    // Test 1: Click Account & Lists (Image 1 -> Customer Login Mode)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.account-action');
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot of Customer Login Modal (showing "Admin Login" at bottom & both tabs)
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(customerModalImg, Buffer.from(shot1.data, 'base64'));
    console.log('Saved Customer Modal screenshot to:', customerModalImg);

    // Close modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('#auth-interactive-modal .xmodal-close');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // Test 2: Click Sell on X-Mart (Image 3 -> Seller Login Mode)
    await send('Runtime.evaluate', {
      expression: `(async () => {
        localStorage.setItem('xmart_token', 'mock_token_123');
        localStorage.setItem('xmart_user', JSON.stringify({ email: 'seller@xmart.com', name: 'Test Merchant', password: 'password123' }));
        sessionStorage.clear();
        if (typeof window._openSellerPortal === 'function') {
          window._openSellerPortal(true);
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot of Seller Login Modal (showing no Create Account tab & "New user? Create an Account" at bottom)
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(sellerModalImg, Buffer.from(shot2.data, 'base64'));
    console.log('Saved Seller Modal screenshot to:', sellerModalImg);

    ws.close();
  } catch (err) {
    console.error('Error running test:', err);
  } finally {
    chrome.kill();
  }
}

run();
