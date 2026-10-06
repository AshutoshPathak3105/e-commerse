const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = path.resolve(__dirname, 'test_modal_mobile_viewport.html');
const outPng = path.resolve(__dirname, 'verified_modal_mobile.png');
const tmpDir = path.join(os.tmpdir(), 'chrome_headless_' + Date.now());

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const cmd = `"${chromePath}" --headless=new --disable-gpu --no-sandbox --no-first-run --no-default-browser-check --user-data-dir="${tmpDir}" --window-size=390,844 --screenshot="${outPng}" "file://${htmlFile}"`;

console.log('Running cmd with isolated user-data-dir...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 15000 });
  console.log('Done! File exists:', fs.existsSync(outPng));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
}
