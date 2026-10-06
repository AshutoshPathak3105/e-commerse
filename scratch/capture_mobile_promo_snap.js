const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const previewHtml = fs.readFileSync(path.resolve(__dirname, 'preview_from_script.html'), 'utf8');

// Inject script to scroll to promos table
const scrolledHtml = previewHtml.replace('</body>', `
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const promoCard = document.querySelector('.ap-promos-card') || document.querySelector('#ap-promos-table-body')?.closest('.ap-card');
    if (promoCard) {
      promoCard.scrollIntoView({ block: 'start' });
      const wrap = promoCard.querySelector('.ap-table-wrap');
      if (wrap) {
        // scroll wrap horizontally to show column 6, 7, 8
        wrap.scrollLeft = 450;
      }
    }
  });
</script>
</body>
`);

const testFile = path.resolve(__dirname, 'test_promo_mobile_scroll.html');
fs.writeFileSync(testFile, scrolledHtml, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'promo_table_mobile_snap.png');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=430,932 --screenshot="${outPng}" "file://${testFile}"`);
console.log('Saved promo_table_mobile_snap.png');
