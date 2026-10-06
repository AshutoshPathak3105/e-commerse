const { execSync } = require('child_process');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'render_modal_test.html');
const outPng = path.resolve(__dirname, 'mobile_modal_result.png');
// Full page screenshot!
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=420,1200 --screenshot="${outPng}" "file:///${htmlPath.replace(/\\/g, '/')}"`;
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('done screenshot: ' + outPng);
} catch(e) {
  console.error(e);
}
