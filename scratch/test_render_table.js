const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'promo_current_render.png');
const outHtmlPath = path.resolve(__dirname, 'test_promo_table_render.html');

try {
  execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=430,700 --screenshot="${outPng}" "file://${outHtmlPath}"`, { timeout: 15000 });
  console.log('SUCCESS: screenshot captured to', outPng);
} catch (e) {
  console.error('Error running chrome:', e.message);
}
