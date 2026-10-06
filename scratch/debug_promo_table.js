const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const debugScript = `
<script>
window.addEventListener('load', () => {
  const table = document.getElementById('ap-promos-table');
  const headerTable = document.getElementById('ap-promos-table-header');
  const outer = table.closest('.ap-cms-table-outer');
  const inner = table.closest('.ap-cms-table-inner');
  const bodyScroll = table.closest('.ap-table-body-scroll');
  const headerPart = headerTable.closest('.ap-table-header-part');

  const firstRow = table.querySelector('tbody tr');
  const cells = Array.from(firstRow.children).map((td, i) => ({
    col: i + 1,
    width: td.getBoundingClientRect().width,
    text: td.innerText.trim().slice(0, 20)
  }));

  const lastTd = firstRow.lastElementChild;
  const buttons = Array.from(lastTd.querySelectorAll('button')).map(b => ({
    text: b.innerText,
    rect: b.getBoundingClientRect()
  }));

  const res = {
    outer: { clientWidth: outer.clientWidth, scrollWidth: outer.scrollWidth },
    inner: { clientWidth: inner.clientWidth, scrollWidth: inner.scrollWidth, styleMinWidth: inner.style.minWidth },
    bodyScroll: { clientWidth: bodyScroll.clientWidth, scrollWidth: bodyScroll.scrollWidth },
    table: { width: table.getBoundingClientRect().width, scrollWidth: table.scrollWidth },
    headerTable: { width: headerTable.getBoundingClientRect().width, scrollWidth: headerTable.scrollWidth },
    cells,
    buttons,
    totalColsWidth: cells.reduce((sum, c) => sum + c.width, 0)
  };

  const d = document.createElement('div');
  d.id = 'table-debug-info';
  d.textContent = JSON.stringify(res, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', debugScript + '</body>');
fs.writeFileSync('scratch/debug_promo_table.html', html, 'utf8');

const p = path.resolve('scratch/debug_promo_table.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_debug_table.html`);

const dump = fs.readFileSync('scratch/dump_debug_table.html', 'utf8');
const match = dump.match(/<div id="table-debug-info">([\s\S]*?)<\/div>/);
console.log('TABLE DEBUG:\n', match ? match[1] : 'not found');
