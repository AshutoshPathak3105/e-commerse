const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const previewHtml = fs.readFileSync(path.resolve(__dirname, 'preview_from_script.html'), 'utf8');

// Find the promotional card: "Promotional Offers, Bank Cards"
const cardIndex = previewHtml.indexOf('Promotional Offers, Bank Cards');
const cardStart = previewHtml.lastIndexOf('<div class="ap-card', cardIndex);
const cardEnd = previewHtml.indexOf('<!-- END PROMOS -->', cardStart); // or find closing tags

const headSection = previewHtml.slice(0, previewHtml.indexOf('<body>'));

const promoPart = previewHtml.slice(cardStart, previewHtml.lastIndexOf('</div>\n            </div>\n          </div>'));

const isolatedHtml = `${headSection}
<body id="admin-panel-overlay" class="ap-open ap-cms-view" style="margin:0; padding:12px; background:#f8fafc;">
  <div class="ap-view-inner ap-cms-view" style="width:100%;">
    ${promoPart}
  </div>
</body>
</html>`;

const testFile = path.resolve(__dirname, 'test_isolated_promo.html');
fs.writeFileSync(testFile, isolatedHtml, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'isolated_promo_mobile.png');

console.log('Capturing mobile screenshot of promo card...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=430,932 --screenshot="${outPng}" "file://${testFile}"`);
console.log('Done! Captured isolated_promo_mobile.png');
