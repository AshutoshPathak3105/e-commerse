const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const s = `
<style>
/* Promo table container width fix */
#admin-panel-overlay .ap-cms-view .ap-table-card:has(#ap-promos-table) .ap-cms-table-inner,
.ap-table-card:has(#ap-promos-table) .ap-cms-table-inner,
.ap-promos-card .ap-cms-table-inner {
  display: block !important;
  width: 1650px !important;
  min-width: 1650px !important;
  padding-right: 40px !important;
  box-sizing: border-box !important;
}

#admin-panel-overlay .ap-cms-view #ap-promos-table,
#admin-panel-overlay .ap-cms-view #ap-promos-table-header,
#ap-promos-table,
#ap-promos-table-header {
  min-width: 1600px !important;
  width: 100% !important;
}

#ap-promos-table-header th:nth-child(9),
#ap-promos-table th:nth-child(9),
#ap-promos-table td:nth-child(9),
#ap-promos-table th:last-child,
#ap-promos-table th:last-child,
#ap-promos-table td:last-child {
  min-width: 175px !important;
  width: 175px !important;
  text-align: right !important;
  padding-right: 28px !important;
  box-sizing: border-box !important;
  white-space: nowrap !important;
}

#ap-promos-table td:nth-child(9) .ap-delete-promo-btn {
  margin-right: 4px !important;
}
</style>
`;

html = html.replace('</head>', s + '</head>');

// Immediate scroll script
const scrollScript = `
<script>
const outers = document.querySelectorAll('.ap-cms-table-outer');
outers.forEach(o => {
  o.scrollLeft = o.scrollWidth + 10000;
  console.log('Scrolled outer to:', o.scrollLeft, 'max was:', o.scrollWidth);
});
</script>
`;

html = html.replace('</body>', scrollScript + '</body>');
fs.writeFileSync('scratch/test_immediate_scroll.html', html, 'utf8');

const p = path.resolve('scratch/test_immediate_scroll.html').replace(/\\/g, '/');
const snap = path.resolve('scratch/snap_immediate_scroll.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,2600 --screenshot="${snap}" "file:///${p}"`);

execSync(`python -c "from PIL import Image; im = Image.open('scratch/snap_immediate_scroll.png'); crop = im.crop((0, 1950, im.width, 2350)); crop.save('scratch/crop_immediate_scroll.png'); print('Cropped immediate!')"`);
console.log('Done immediate scroll check!');
