const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const s = `
<style>
/* Ensure inner container expands to fully contain table width + extra safety padding */
#admin-panel-overlay .ap-cms-view .ap-table-card:has(#ap-promos-table) .ap-cms-table-inner,
.ap-table-card:has(#ap-promos-table) .ap-cms-table-inner,
.ap-promos-card .ap-cms-table-inner {
  display: inline-block !important;
  width: max-content !important;
  min-width: 1620px !important;
  padding-right: 40px !important;
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
<script>
function runCheck() {
  const table = document.getElementById('ap-promos-table');
  const outer = table ? table.closest('.ap-cms-table-outer') : null;
  if (!table || !outer) return;

  // Scroll all the way to the right
  outer.scrollLeft = 999999;

  const tr = table.querySelector('tbody tr');
  const td9 = tr.children[8];
  const oRect = outer.getBoundingClientRect();
  const cRect = td9.getBoundingClientRect();
  const delBtn = td9.querySelector('.ap-delete-promo-btn');
  const bRect = delBtn.getBoundingClientRect();

  const res = {
    outer: {
      scrollLeft: outer.scrollLeft,
      scrollWidth: outer.scrollWidth,
      clientWidth: outer.clientWidth,
      right: oRect.right
    },
    delBtn: {
      left: bRect.left,
      right: bRect.right,
      width: bRect.width,
      clearanceInsideContainer: oRect.right - bRect.right
    }
  };

  const el = document.createElement('pre');
  el.id = 'scroll-check-res';
  el.textContent = JSON.stringify(res, null, 2);
  document.body.appendChild(el);
}
setTimeout(runCheck, 50);
</script>
`;

html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_scroll_fix2.html', html, 'utf8');
const p = path.resolve('scratch/test_scroll_fix2.html').replace(/\\/g, '/');
const snap = path.resolve('scratch/snap_scroll_fix2.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=390,1400 --screenshot="${snap}" --dump-dom "file:///${p}" > scratch/dump_scroll_fix2.html`);
const dump = fs.readFileSync('scratch/dump_scroll_fix2.html', 'utf8');
const m = dump.match(/<pre id="scroll-check-res">([\s\S]*?)<\/pre>/);
console.log('SCROLL CHECK 2:\n', m ? m[1] : 'not found');
