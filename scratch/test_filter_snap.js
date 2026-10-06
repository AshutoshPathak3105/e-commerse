const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_reviews_filter_mobile.html');
const outMobile = path.resolve(__dirname, 'reviews_filter_mobile_verified.png');
const outTablet = path.resolve(__dirname, 'reviews_filter_tablet_verified.png');

console.log('Capturing mobile view (414x896)...');
const cmdMobile = `"${chromePath}" --headless=new --disable-gpu --window-size=414,896 --screenshot="${outMobile}" "file://${htmlPath}"`;
execSync(cmdMobile);
console.log('Mobile screenshot saved to', outMobile);

console.log('Capturing tablet view (768x1024)...');
const cmdTablet = `"${chromePath}" --headless=new --disable-gpu --window-size=768,1024 --screenshot="${outTablet}" "file://${htmlPath}"`;
execSync(cmdTablet);
console.log('Tablet screenshot saved to', outTablet);
