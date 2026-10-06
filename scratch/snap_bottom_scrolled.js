const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'verified_modal_bottom_scrolled.png');
const htmlFile = path.resolve(__dirname, 'test_modal_bottom_scrolled.html').replace(/\\/g, '/');
const targetUrl = `file:///${htmlFile}`;

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outPng}" "${targetUrl}"`;

console.log('Capturing bottom scrolled screenshot...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 30000 });
  console.log('Done! Exists:', fs.existsSync(outPng));
} catch (e) {
  console.error('Error:', e.message);
}
