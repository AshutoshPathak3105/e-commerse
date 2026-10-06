const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const script = fs.readFileSync('script.js', 'utf8');

// Find showHeroPromoModal
const startIdx = script.indexOf('function showHeroPromoModal(existingCard) {');
const endIdx = script.indexOf('function attachQuickBrowseRowHandlers() {', startIdx);
const modalFnCode = script.slice(startIdx, endIdx);

const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hero Promo Modal Test</title>
  <link rel="stylesheet" href="../styles.css">
  <style>
    body { margin:0; padding:0; background: rgba(15,23,42,0.6); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; }
  </style>
</head>
<body>
  <div id="admin-panel-overlay" class="ap-open"></div>
  <script>
    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function showToast(msg) { console.log(msg); }
    const adminFetch = async () => {};
    const heroPromoCards = [];
    ${modalFnCode}
    showHeroPromoModal({
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100',
      badge: 'Min. 50% off',
      sub: 'Fresh finds',
      brand: 'SYMBOL PREMIUM',
      pill: 'Unlimited 5% cashback*',
      link: '#deals'
    });
  </script>
</body>
</html>`;

const outHtml = path.resolve('scratch/test_hero_promo_modal.html');
fs.writeFileSync(outHtml, testHtml, 'utf8');

const snap = path.resolve('scratch/snap_hero_promo_modal.png');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Capturing screenshot...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=600,850 --screenshot="${snap}" "file://${outHtml}"`);
console.log('Done! Screenshot saved to', snap);
