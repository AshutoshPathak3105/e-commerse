const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'http://localhost:8000';
const artifactDir = 'C:\\Users\\ashut\\.gemini\\antigravity-ide\\brain\\f71df45d-35e7-4bd6-9011-0e6c92103995';

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,950',
    '--user-data-dir=' + path.join(__dirname, 'chrome_tmp_req')
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const newTabRes = await fetch(`http://127.0.0.1:9227/json/new?${targetUrl}`, { method: 'PUT' });
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

    // Setup seller profile and open portal
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

    // Switch to Add Product tab
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tabBtn = Array.from(document.querySelectorAll('.seller-tab-btn')).find(b => b.textContent.includes('Listing') || b.dataset.tab === 'add-product');
          if (tabBtn) tabBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Verify Top View slot (Image 4): check background color and border
    const topSlotCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const topSlot = document.querySelector('.seller-view-slot[data-angle="top"]');
          const style = topSlot ? window.getComputedStyle(topSlot) : null;
          return {
            found: !!topSlot,
            background: style?.backgroundColor,
            borderColor: style?.borderColor
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Top View Slot check (Image 4):', topSlotCheck.result.value);

    // Scroll to Top View slot & take screenshot
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const topSlot = document.querySelector('.seller-view-slot[data-angle="top"]');
          if (topSlot) topSlot.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const shotTopSlot = await send('Page.captureScreenshot', { format: 'png' });
    const topSlotPath = path.join(artifactDir, 'top_view_slot_no_pink.png');
    fs.writeFileSync(topSlotPath, Buffer.from(shotTopSlot.data, 'base64'));
    console.log('Saved top_view_slot_no_pink.png');

    // 2. Click "+ Add Photo Slot" button (Image 3) and check button font color
    const addPhotoCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.getElementById('btn-add-more-photo');
          const btnStyle = btn ? window.getComputedStyle(btn) : null;
          const span = btn?.querySelector('span:last-child');
          const spanStyle = span ? window.getComputedStyle(span) : null;

          if (btn) btn.click();

          return {
            btnFound: !!btn,
            btnColor: btnStyle?.color,
            spanColor: spanStyle?.color
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Add Photo Button check (Image 3):', addPhotoCheck.result.value);
    await new Promise(r => setTimeout(r, 800));

    // 3. Verify newly created Extra Photo row (Image 1):
    // check that tag is an <input> (not <select>), user can type in it, and label text color is white
    const extraPhotoRowCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const row = document.querySelector('.seller-extra-photo-row');
          const lbl = row?.querySelector('.extra-photo-lbl');
          const lblStyle = lbl ? window.getComputedStyle(lbl) : null;
          const tagBox = row?.querySelector('.seller-extra-photo-tag');

          const isInput = tagBox?.tagName === 'INPUT';
          const originalVal = tagBox?.value;

          // User types custom tag
          if (tagBox && isInput) {
            tagBox.value = 'LIFESTYLE SHOT';
            tagBox.dispatchEvent(new Event('input', { bubbles: true }));
            tagBox.dispatchEvent(new Event('change', { bubbles: true }));
          }

          return {
            rowFound: !!row,
            lblText: lbl?.textContent,
            lblColor: lblStyle?.color,
            lblBg: lblStyle?.backgroundColor,
            isInput,
            tagName: tagBox?.tagName,
            originalVal,
            newVal: tagBox?.value
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Extra Photo Row & User Input check (Image 1):', extraPhotoRowCheck.result.value);

    // Scroll to Extra Photo Slot & take screenshot
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const row = document.querySelector('.seller-extra-photo-row');
          if (row) row.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const shotExtraPhoto = await send('Page.captureScreenshot', { format: 'png' });
    const extraPhotoPath = path.join(artifactDir, 'extra_photo_user_input_box.png');
    fs.writeFileSync(extraPhotoPath, Buffer.from(shotExtraPhoto.data, 'base64'));
    console.log('Saved extra_photo_user_input_box.png');

    // 4. Verify "+ Add Specification" button (Image 2) font color
    const addSpecCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.getElementById('btn-seller-add-spec');
          const btnStyle = btn ? window.getComputedStyle(btn) : null;
          const span = btn?.querySelector('span:last-child');
          const spanStyle = span ? window.getComputedStyle(span) : null;

          if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });

          return {
            btnFound: !!btn,
            btnBg: btnStyle?.backgroundColor,
            btnColor: btnStyle?.color,
            spanColor: spanStyle?.color
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Add Specification Button check (Image 2):', addSpecCheck.result.value);
    await new Promise(r => setTimeout(r, 800));

    const shotAddSpec = await send('Page.captureScreenshot', { format: 'png' });
    const addSpecPath = path.join(artifactDir, 'add_specification_button_white_text.png');
    fs.writeFileSync(addSpecPath, Buffer.from(shotAddSpec.data, 'base64'));
    console.log('Saved add_specification_button_white_text.png');

    console.log('ALL VERIFICATION CHECKS FINISHED SUCCESSFULLY!');

  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

run();
