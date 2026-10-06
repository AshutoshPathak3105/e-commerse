const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'verified_modal_mobile.png');
const htmlFile = path.resolve(__dirname, 'test_modal_mobile_viewport.html').replace(/\\/g, '/');
const targetUrl = `file:///${htmlFile}`;

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outPng}" "${targetUrl}"`;

console.log('Capturing screenshot for:', targetUrl);
execSync(cmd, { stdio: 'inherit', timeout: 15000 });
console.log('File generated:', fs.existsSync(outPng));
