const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPngMobile = path.resolve(__dirname, 'debug_mobile_table.png');
const outHtml = path.resolve(__dirname, 'preview_from_script.html');

console.log('Capturing mobile view of table...');
// Run chrome headless mobile viewport 412x915 (Pixel 7 / common mobile)
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=412,915 --screenshot="${outPngMobile}" "file://${outHtml}"`);
console.log('Mobile screenshot saved to', outPngMobile);
