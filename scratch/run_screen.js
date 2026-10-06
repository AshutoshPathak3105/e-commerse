const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outPng = path.resolve(__dirname, 'verified_cyclic_tickers.png');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
execSync(`"${chromePath}" --headless=new --disable-gpu --virtual-time-budget=2000 --screenshot="${outPng}" --window-size=1280,800 "file:///${path.resolve(__dirname, 'test_fix_snap.html').replace(/\\/g, '/')}"`);
console.log('Verified screenshot saved to ' + outPng);
