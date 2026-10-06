const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Re-generate html from script.js
require('./render_from_real_script.js');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Inject script that:
// 1. Checks placeholders
// 2. Scrolls the promo table container all the way to the right
// 3. Reports bounding rects of the Delete button and its container
const checkScript = `
<script>
window.addEventListener('load', () => {
  const storeInput = document.getElementById('ap-cms-store-search-input');
  const offerInput = document.getElementById('ap-cms-offer-search-input');
  
  // Find the promo table outer container and scroll it all the way to the right
  const card = document.querySelector('.ap-promos-card') || document.querySelector('.ap-table-card:has(#ap-promos-table)');
  const outer = card.querySelector('.ap-cms-table-outer');
  if (outer) {
    outer.scrollLeft = 999999;
  }

  // Get the first delete button in promo table
  const deleteBtn = card.querySelector('.ap-delete-promo-btn');
  const dRect = deleteBtn ? deleteBtn.getBoundingClientRect() : null;
  const oRect = outer ? outer.getBoundingClientRect() : null;

  const info = {
    storePlaceholder: storeInput ? storeInput.getAttribute('placeholder') : null,
    offerPlaceholder: offerInput ? offerInput.getAttribute('placeholder') : null,
    outerScrollLeft: outer ? outer.scrollLeft : 0,
    outerScrollWidth: outer ? outer.scrollWidth : 0,
    outerClientWidth: outer ? outer.clientWidth : 0,
    deleteBtnRight: dRect ? dRect.right : 0,
    outerRight: oRect ? oRect.right : 0,
    // Distance from delete button right edge to outer container right edge (positive means inside, fully visible)
    clearanceFromRightEdge: oRect && dRect ? (oRect.right - dRect.right) : 0
  };

  const d = document.createElement('div');
  d.id = 'promo-fix-info';
  d.textContent = JSON.stringify(info, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', checkScript + '</body>');
fs.writeFileSync('scratch/test_promo_fix.html', html, 'utf8');

const p = path.resolve('scratch/test_promo_fix.html').replace(/\\/g, '/');
const snapPng = path.resolve('scratch/promo_fix_verified.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,2600 --screenshot="${snapPng}" --dump-dom "file:///${p}" > scratch/dump_promo_fix.html`);

const dump = fs.readFileSync('scratch/dump_promo_fix.html', 'utf8');
const match = dump.match(/<div id="promo-fix-info">([\s\S]*?)<\/div>/);
console.log('CHECK RESULTS:\n', match ? match[1] : 'not found');
