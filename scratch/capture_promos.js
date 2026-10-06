const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

let html = fs.readFileSync('scratch/check_badge_pos.html', 'utf8');
if (!html.includes('promo_scroll_test')) {
  html = html.replace('</body>', '<script id="promo_scroll_test">window.onload = () => document.querySelector(".ap-promos-card")?.scrollIntoView();</script></body>');
  fs.writeFileSync('scratch/check_badge_pos.html', html);
}
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'promos_scrolled.png');
const fileUrl = 'file:///' + path.resolve('scratch/check_badge_pos.html').replace(/\\/g, '/');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1600,1000 --virtual-time-budget=3000 --screenshot="${outPng}" "${fileUrl}"`, { stdio: 'inherit' });
console.log("Done");
