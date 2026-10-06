const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'mobile_table_captured.png');
const outHtml = path.resolve(__dirname, 'test_promo_table_render.html');

const fileUrl = 'file:///' + outHtml.replace(/\\/g, '/');
console.log('Capturing mobile table screenshot from', fileUrl);
const res = execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=430,700 --screenshot="${outPng}" "${fileUrl}"`);
console.log('Output:', res.toString());
console.log('Screenshot saved to:', outPng);
