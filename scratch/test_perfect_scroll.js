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
  padding-right: 36px !important;
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
<script>
window.addEventListener('DOMContentLoaded', () => {
  const outer = document.querySelector('.ap-promos-card .ap-cms-table-outer') || document.querySelector('.ap-table-card:has(#ap-promos-table) .ap-cms-table-outer');
  outer.scrollLeft = 999999;
  const table = document.getElementById('ap-promos-table');
  const tr = table.querySelector('tbody tr');
  const lastTd = tr.lastElementChild;
  const delBtn = lastTd.querySelector('.ap-delete-promo-btn');
  const editBtn = lastTd.querySelector('.ap-edit-promo-btn');
  const oRect = outer.getBoundingClientRect();
  const dRect = delBtn.getBoundingClientRect();
  const eRect = editBtn.getBoundingClientRect();

  const res = {
    outerScrollLeft: outer.scrollLeft,
    outerScrollWidth: outer.scrollWidth,
    outerClientWidth: outer.clientWidth,
    outerRight: oRect.right,
    delBtnLeft: dRect.left,
    delBtnRight: dRect.right,
    delBtnWidth: dRect.width,
    editBtnLeft: eRect.left,
    editBtnRight: eRect.right,
    // Distance from Delete button right edge to outer container right edge:
    // If positive, it means the Delete button is completely inside the visible viewport!
    clearanceFromRightEdge: oRect.right - dRect.right
  };
  const d = document.createElement('div');
  d.id = 'perfect-scroll-res';
  d.textContent = JSON.stringify(res, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_perfect_scroll.html', html, 'utf8');

const p = path.resolve('scratch/test_perfect_scroll.html').replace(/\\/g, '/');
const snap = path.resolve('scratch/snap_perfect_scroll.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=390,2600 --screenshot="${snap}" --dump-dom "file:///${p}" > scratch/dump_perfect_scroll.html`);

const dump = fs.readFileSync('scratch/dump_perfect_scroll.html', 'utf8');
const m = dump.match(/<div id="perfect-scroll-res">([\s\S]*?)<\/div>/);
console.log('PERFECT SCROLL RES:\n', m ? m[1] : 'not found');
