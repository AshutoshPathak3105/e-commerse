const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Inject the style fix into head
const fixStyles = `
<style>
#admin-panel-overlay .ap-cms-view .ap-cms-table-inner,
.ap-cms-table-inner {
  display: inline-block !important;
  width: max-content !important;
  min-width: 1620px !important;
  padding-right: 32px !important;
  box-sizing: content-box !important;
}

#admin-panel-overlay .ap-cms-view #ap-promos-table,
#admin-panel-overlay .ap-cms-view #ap-promos-table-header,
#ap-promos-table,
#ap-promos-table-header {
  min-width: 1620px !important;
  width: 1620px !important;
}

#ap-promos-table-header th:nth-child(9),
#ap-promos-table th:nth-child(9),
#ap-promos-table td:nth-child(9),
#ap-promos-table-header th:last-child,
#ap-promos-table th:last-child,
#ap-promos-table td:last-child {
  min-width: 180px !important;
  width: 180px !important;
  text-align: right !important;
  padding-right: 28px !important;
  box-sizing: border-box !important;
  white-space: nowrap !important;
}

#ap-promos-table td:nth-child(9) .ap-delete-promo-btn {
  margin-right: 8px !important;
}
</style>
`;

html = html.replace('</head>', fixStyles + '</head>');

// Scroll outer to maximum on load
const s = `
<script>
window.addEventListener('DOMContentLoaded', () => {
  const outer = document.querySelector('.ap-promos-card .ap-cms-table-outer') || document.querySelector('.ap-table-card:has(#ap-promos-table) .ap-cms-table-outer');
  outer.scrollLeft = 999999;

  const table = document.getElementById('ap-promos-table');
  const tr = table.querySelector('tbody tr');
  const td9 = tr.children[8];
  const delBtn = td9.querySelector('.ap-delete-promo-btn');
  const editBtn = td9.querySelector('.ap-edit-promo-btn');

  const oRect = outer.getBoundingClientRect();
  const dRect = delBtn.getBoundingClientRect();
  const eRect = editBtn.getBoundingClientRect();

  const data = {
    outerScrollLeft: outer.scrollLeft,
    outerScrollWidth: outer.scrollWidth,
    outerClientWidth: outer.clientWidth,
    outerRight: oRect.right,
    delBtnLeft: dRect.left,
    delBtnRight: dRect.right,
    clearanceInsideScrollContainer: oRect.right - dRect.right
  };

  const p = document.createElement('div');
  p.id = 'verified-fix-metrics';
  p.textContent = JSON.stringify(data, null, 2);
  document.body.appendChild(p);
});
</script>
`;

html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_verified_fix.html', html, 'utf8');

const p = path.resolve('scratch/test_verified_fix.html').replace(/\\/g, '/');
const snap = path.resolve('scratch/snap_verified_fix.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,2600 --screenshot="${snap}" --dump-dom "file:///${p}" > scratch/dump_verified_fix.html`);

const dump = fs.readFileSync('scratch/dump_verified_fix.html', 'utf8');
const m = dump.match(/<div id="verified-fix-metrics">([\s\S]*?)<\/div>/);
console.log('VERIFIED METRICS:\n', m ? m[1] : 'not found');
