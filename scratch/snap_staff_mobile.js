const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'verified_staff_mobile.png');
const htmlFile = path.resolve(__dirname, 'test_staff_mobile.html').replace(/\\/g, '/');
const targetUrl = `file:///${htmlFile}`;
const tmpProfile = path.resolve(__dirname, 'chrome_temp_profile');

const cmd = `"${chromePath}" --headless=new --disable-gpu --user-data-dir="${tmpProfile}" --window-size=500,900 --screenshot="${outPng}" "${targetUrl}"`;

console.log('Capturing staff mobile screenshot...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 30000 });
  console.log('Done! File exists:', fs.existsSync(outPng));
} catch (e) {
  console.error('Error:', e.message);
}
