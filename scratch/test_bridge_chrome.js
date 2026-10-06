const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'admin_bridge_rendered.png');
const tmpProfile = path.resolve(__dirname, 'chrome_tmp_profile_2');

const cmd = `"${chromePath}" --headless=new --disable-gpu --user-data-dir="${tmpProfile}" --window-size=1600,1400 --virtual-time-budget=10000 --screenshot="${outPng}" "http://localhost:8000/admin_test_bridge.html"`;
console.log('Capturing admin dashboard from bridge...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 30000 });
  const stats = fs.statSync(outPng);
  console.log('Screenshot success! File size:', stats.size, 'bytes');
} catch (e) {
  console.error('Error running Chrome:', e.message);
}
