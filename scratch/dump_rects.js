const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');
const inject = `
<script>
window.addEventListener('load', () => {
  const outer = document.querySelector('.ap-cms-table-outer');
  const headerTable = outer.querySelector('.ap-cms-table-header table');
  const bodyTable = outer.querySelector('.ap-cms-body-scroll table');

  const ths = Array.from(headerTable.querySelectorAll('th')).map(th => {
    const r = th.getBoundingClientRect();
    return { text: th.innerText.trim(), left: r.left, right: r.right, width: r.width };
  });

  const firstTr = bodyTable.querySelector('tbody tr');
  const tds = Array.from(firstTr.querySelectorAll('td')).map(td => {
    const r = td.getBoundingClientRect();
    return { left: r.left, right: r.right, width: r.width, inner: td.innerText.trim().slice(0, 20) };
  });

  const resDiv = document.createElement('div');
  resDiv.id = 'debug-rects';
  resDiv.textContent = JSON.stringify({ ths, tds }, null, 2);
  document.body.appendChild(resDiv);
});
</script>
`;
html = html.replace('</body>', inject + '</body>');
fs.writeFileSync('scratch/test_measure_dom.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_measure_dom.html').replace(/\\/g, '/');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1600,1100 --dump-dom "file:///${p}" > scratch/dump2.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump2.html', 'utf8');
const match = dump.match(/<div id="debug-rects">([\s\S]*?)<\/div>/);
if (match) {
  console.log('RECTS:\n', match[1]);
} else {
  console.log('Not found');
}
