const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const s = `
<script>
window.addEventListener('DOMContentLoaded', () => {
  const outer = document.querySelector('.ap-promos-card .ap-cms-table-outer') || document.querySelector('.ap-table-card:has(#ap-promos-table) .ap-cms-table-outer');
  const inner = outer ? outer.querySelector('.ap-cms-table-inner') : null;
  const headerTable = document.getElementById('ap-promos-table-header');
  const bodyTable = document.getElementById('ap-promos-table');
  const bodyScroll = document.querySelector('.ap-promos-card .ap-table-body-scroll') || document.querySelector('.ap-table-card:has(#ap-promos-table) .ap-table-body-scroll');

  outer.scrollLeft = 999999;

  const data = {
    outer: {
      scrollLeft: outer.scrollLeft,
      scrollWidth: outer.scrollWidth,
      clientWidth: outer.clientWidth,
      offsetWidth: outer.offsetWidth,
      cssOverflowX: window.getComputedStyle(outer).overflowX
    },
    inner: {
      scrollWidth: inner.scrollWidth,
      clientWidth: inner.clientWidth,
      offsetWidth: inner.offsetWidth,
      cssWidth: window.getComputedStyle(inner).width,
      cssMinWidth: window.getComputedStyle(inner).minWidth,
      cssDisplay: window.getComputedStyle(inner).display
    },
    headerTable: {
      offsetWidth: headerTable.offsetWidth,
      scrollWidth: headerTable.scrollWidth,
      cssWidth: window.getComputedStyle(headerTable).width,
      cssMinWidth: window.getComputedStyle(headerTable).minWidth
    },
    bodyScroll: {
      scrollLeft: bodyScroll.scrollLeft,
      scrollWidth: bodyScroll.scrollWidth,
      clientWidth: bodyScroll.clientWidth,
      offsetWidth: bodyScroll.offsetWidth,
      cssOverflowX: window.getComputedStyle(bodyScroll).overflowX,
      cssOverflowY: window.getComputedStyle(bodyScroll).overflowY
    },
    bodyTable: {
      offsetWidth: bodyTable.offsetWidth,
      scrollWidth: bodyTable.scrollWidth,
      cssWidth: window.getComputedStyle(bodyTable).width,
      cssMinWidth: window.getComputedStyle(bodyTable).minWidth
    }
  };

  const p = document.createElement('div');
  p.id = 'dom-metrics';
  p.textContent = JSON.stringify(data, null, 2);
  document.body.appendChild(p);
});
</script>
`;

html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_metrics.html', html, 'utf8');
const p = path.resolve('scratch/test_metrics.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_metrics.html`);
const dump = fs.readFileSync('scratch/dump_metrics.html', 'utf8');
const m = dump.match(/<div id="dom-metrics">([\s\S]*?)<\/div>/);
console.log('METRICS:\n', m ? m[1] : 'not found');
