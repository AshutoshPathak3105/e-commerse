const fs = require('fs');

let html = fs.readFileSync('scratch/debug_promo_table.html', 'utf8');

// Inject test style overrides
const override = `
<style>
#ap-promos-table-header,
#ap-promos-table {
  min-width: 1580px !important;
  width: 1580px !important;
}
.ap-cms-table-inner {
  min-width: 1580px !important;
  width: 1580px !important;
}
#ap-promos-table-header th:nth-child(9),
#ap-promos-table th:nth-child(9),
#ap-promos-table td:nth-child(9) {
  min-width: 180px !important;
  width: 180px !important;
  padding-right: 28px !important;
  text-align: right !important;
  box-sizing: border-box !important;
}
#ap-promos-table td:nth-child(9) .ap-delete-promo-btn {
  margin-right: 8px !important;
}
</style>
`;

html = html.replace('</head>', override + '</head>');
fs.writeFileSync('scratch/test_applied_fix.html', html, 'utf8');

const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/test_applied_fix.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_applied_fix.html`);

const dump = fs.readFileSync('scratch/dump_applied_fix.html', 'utf8');
const match = dump.match(/<div id="table-debug-info">([\s\S]*?)<\/div>/);
console.log('NEW DEBUG:\n', match ? match[1] : 'not found');
