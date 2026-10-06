const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/test_quad_modal_sliding.html', 'utf8');
html = html.replace(/scrollTop = \d+;/, 'scrollTop = 2500;');
fs.writeFileSync('scratch/test_quad_modal_sliding.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const snap = path.resolve('scratch/snap_create_card_btn_bottom.png');
const outHtml = path.resolve('scratch/test_quad_modal_sliding.html');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=500,750 --screenshot="${snap}" "file://${outHtml}?scroll=1"`);
console.log('Captured bottom snap successfully!');
