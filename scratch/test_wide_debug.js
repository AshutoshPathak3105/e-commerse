const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

let html = fs.readFileSync('scratch/test_wide_promo.html', 'utf8');
const s = `
<script>
window.addEventListener('DOMContentLoaded', () => {
  const outer = document.querySelector('.ap-promos-card .ap-cms-table-outer') || document.querySelector('.ap-table-card:has(#ap-promos-table) .ap-cms-table-outer');
  outer.scrollLeft = 999999;
  const table = document.getElementById('ap-promos-table');
  const tr = table.querySelector('tbody tr');
  const lastTd = tr.lastElementChild;
  const res = {
    outerScrollLeft: outer.scrollLeft,
    outerScrollWidth: outer.scrollWidth,
    outerClientWidth: outer.clientWidth,
    outerOffsetWidth: outer.offsetWidth,
    tableScrollWidth: table.scrollWidth,
    tableOffsetWidth: table.offsetWidth,
    lastTdLeft: lastTd.offsetLeft,
    lastTdWidth: lastTd.offsetWidth,
    lastTdBounding: lastTd.getBoundingClientRect(),
    outerBounding: outer.getBoundingClientRect()
  };
  const d = document.createElement('div');
  d.id = 'wide-res';
  d.textContent = JSON.stringify(res, null, 2);
  document.body.appendChild(d);
});
</script>
`;
html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_wide_debug.html', html, 'utf8');
const p = path.resolve('scratch/test_wide_debug.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_wide_debug.html`);
const dump = fs.readFileSync('scratch/dump_wide_debug.html', 'utf8');
const m = dump.match(/<div id="wide-res">([\s\S]*?)<\/div>/);
console.log('WIDE DEBUG:\n', m ? m[1] : 'not found');
