const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 800 });
  const filePath = 'file:///' + path.resolve('scratch/test_quad_modal_sliding.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  const info = await page.evaluate(() => {
    const dialog = document.querySelector('.ap-modal-dialog');
    const header = document.querySelector('.ap-modal-header');
    const content = document.querySelector('.ap-modal-content');
    const dRect = dialog?.getBoundingClientRect();
    const hRect = header?.getBoundingClientRect();
    const cRect = content?.getBoundingClientRect();
    return {
      windowWidth: window.innerWidth,
      dialogWidth: dRect?.width,
      dialogLeft: dRect?.left,
      dialogRight: dRect?.right,
      headerBg: window.getComputedStyle(header).backgroundColor,
      contentOverflowY: window.getComputedStyle(content).overflowY,
      scrollable: content.scrollHeight > content.clientHeight,
      scrollHeight: content.scrollHeight,
      clientHeight: content.clientHeight
    };
  });

  console.log('Inspection Result:', JSON.stringify(info, null, 2));

  await page.screenshot({ path: path.resolve('scratch/real_mobile_modal_snap.png') });
  await browser.close();
})();
