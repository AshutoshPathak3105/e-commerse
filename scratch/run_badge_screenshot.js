const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const testHtml = path.resolve(__dirname, 'test_promos_standalone.html');
const outPng = path.resolve(__dirname, 'promos_standalone.png');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=1600,800 --virtual-time-budget=2000 --screenshot="${outPng}" "file:///${testHtml.replace(/\\/g, '/')}"`;
try {
  execSync(cmd, { stdio: 'inherit', timeout: 15000 });
  console.log("Screenshot generated:", fs.existsSync(outPng));
} catch(e) {
  console.error("Error:", e.message);
}
