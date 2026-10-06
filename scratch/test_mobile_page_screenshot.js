const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'mobile_page_load.png');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outPng}" "http://localhost:8000"`;
console.log('Running Chrome screenshot for mobile view...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 15000 });
  console.log('Mobile screenshot captured successfully:', fs.existsSync(outPng));
} catch (e) {
  console.error('Error running Chrome:', e.message);
}
