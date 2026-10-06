const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'dashboard_full_desktop.png');
const tmpProfile = path.resolve(__dirname, 'chrome_tmp_profile');

const cmd = `"${chromePath}" --headless=new --disable-gpu --user-data-dir="${tmpProfile}" --window-size=1600,2400 --virtual-time-budget=10000 --screenshot="${outPng}" "http://localhost:8000/test_admin_bridge.html"`;

console.log('Capturing full admin dashboard screenshot...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 30000 });
  console.log('Screenshot success:', fs.existsSync(outPng), 'Size:', fs.existsSync(outPng) ? fs.statSync(outPng).size : 0);
} catch (e) {
  console.error('Error running Chrome:', e.message);
}
