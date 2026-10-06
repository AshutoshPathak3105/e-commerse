const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');
const inject = `
<script>
window.addEventListener('load', () => {
  const allTables = [];
  document.querySelectorAll('.ap-cms-table-outer').forEach((outer, idx) => {
    const card = outer.closest('.ap-table-card') || outer.parentElement;
    const headerTable = outer.querySelector('.ap-cms-table-header table');
    const bodyTable = outer.querySelector('.ap-cms-body-scroll table');
    
    const ths = headerTable ? Array.from(headerTable.querySelectorAll('th')).map(th => {
      const r = th.getBoundingClientRect();
      return { text: th.innerText.trim(), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
    }) : [];

    const firstTr = bodyTable ? bodyTable.querySelector('tbody tr') : null;
    const tds = firstTr ? Array.from(firstTr.querySelectorAll('td')).map(td => {
      const r = td.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), inner: td.innerText.trim().slice(0, 15) };
    }) : [];

    const cardRect = card.getBoundingClientRect();
    allTables.push({
      idx,
      cardWidth: Math.round(cardRect.width),
      cardRight: Math.round(cardRect.right),
      ths,
      tds
    });
  });

  const resDiv = document.createElement('div');
  resDiv.id = 'all-rects';
  resDiv.textContent = JSON.stringify(allTables, null, 2);
  document.body.appendChild(resDiv);
});
</script>
`;
html = html.replace('</body>', inject + '</body>');
fs.writeFileSync('scratch/test_measure_all.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_measure_all.html').replace(/\\/g, '/');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1600,1100 --dump-dom "file:///${p}" > scratch/dump_all.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump_all.html', 'utf8');
const match = dump.match(/<div id="all-rects">([\s\S]*?)<\/div>/);
if (match) {
  console.log('ALL RECTS:\n', match[1]);
} else {
  console.log('Not found');
}
