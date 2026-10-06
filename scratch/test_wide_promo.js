const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const s = `
<style>
/* Promo table 1650px wide inner and tables */
#admin-panel-overlay .ap-cms-view .ap-table-card:has(#ap-promos-table) .ap-cms-table-inner,
.ap-table-card:has(#ap-promos-table) .ap-cms-table-inner,
.ap-promos-card .ap-cms-table-inner {
  min-width: 1650px !important;
  width: 1650px !important;
  display: block !important;
}

#admin-panel-overlay .ap-cms-view #ap-promos-table,
#admin-panel-overlay .ap-cms-view #ap-promos-table-header,
#ap-promos-table,
#ap-promos-table-header {
  min-width: 1650px !important;
  width: 1650px !important;
}

#ap-promos-table-header th:nth-child(9),
#ap-promos-table th:nth-child(9),
#ap-promos-table td:nth-child(9),
#ap-promos-table th:last-child,
#ap-promos-table td:last-child {
  min-width: 180px !important;
  width: 180px !important;
  text-align: right !important;
  padding-right: 24px !important;
  box-sizing: border-box !important;
  white-space: nowrap !important;
}

#ap-promos-table td:nth-child(9) .ap-delete-promo-btn {
  margin-right: 8px !important;
}
</style>
<script>
// On execution, scroll outer to right
window.addEventListener('load', () => {
  const outer = document.querySelector('.ap-promos-card .ap-cms-table-outer') || document.querySelector('.ap-table-card:has(#ap-promos-table) .ap-cms-table-outer');
  if (outer) {
    outer.scrollLeft = 999999;
  }
});
</script>
`;

html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_wide_promo.html', html, 'utf8');

const p = path.resolve('scratch/test_wide_promo.html').replace(/\\/g, '/');
const snap = path.resolve('scratch/snap_wide_promo.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,2600 --screenshot="${snap}" "file:///${p}"`);

execSync(`python -c "
from PIL import Image
im = Image.open('scratch/snap_wide_promo.png')
# Crop the promo table section
crop = im.crop((0, 1950, im.width, 2350))
crop.save('scratch/crop_wide_promo.png')
print('Done!')
"`);
console.log('Finished testing wide promo!');
