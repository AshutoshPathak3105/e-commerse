const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const testHtml = path.resolve(__dirname, 'test_promos_standalone.html');
const outPng1200 = path.resolve(__dirname, 'promos_1200.png');
const outPng390 = path.resolve(__dirname, 'promos_390.png');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1200,800 --virtual-time-budget=2000 --screenshot="${outPng1200}" "file:///${testHtml.replace(/\\/g, '/')}"`, { stdio: 'inherit' });
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --virtual-time-budget=2000 --screenshot="${outPng390}" "file:///${testHtml.replace(/\\/g, '/')}"`, { stdio: 'inherit' });

console.log("Screenshots generated for 1200px and 390px");
