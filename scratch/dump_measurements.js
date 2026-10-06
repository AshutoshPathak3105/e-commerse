const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');
const inject = `
<script>
window.addEventListener('load', () => {
  const data = {};
  document.querySelectorAll('.ap-cms-table-outer').forEach((outer, i) => {
    const inner = outer.firstElementChild;
    const header = outer.querySelector('.ap-cms-table-header');
    const headerTable = header ? header.querySelector('table') : null;
    const bodyScroll = outer.querySelector('.ap-cms-body-scroll');
    const bodyTable = bodyScroll ? bodyScroll.querySelector('table') : null;
    
    data['table_' + i] = {
      outer: { offsetWidth: outer.offsetWidth, scrollWidth: outer.scrollWidth, clientWidth: outer.clientWidth },
      inner: inner ? { offsetWidth: inner.offsetWidth, scrollWidth: inner.scrollWidth } : null,
      header: header ? { offsetWidth: header.offsetWidth, scrollWidth: header.scrollWidth } : null,
      headerTable: headerTable ? { offsetWidth: headerTable.offsetWidth, scrollWidth: headerTable.scrollWidth } : null,
      bodyScroll: bodyScroll ? { offsetWidth: bodyScroll.offsetWidth, scrollWidth: bodyScroll.scrollWidth, clientWidth: bodyScroll.clientWidth } : null,
      bodyTable: bodyTable ? { offsetWidth: bodyTable.offsetWidth, scrollWidth: bodyTable.scrollWidth } : null,
    };
  });
  
  const fsDiv = document.createElement('div');
  fsDiv.id = 'debug-results';
  fsDiv.textContent = JSON.stringify(data, null, 2);
  document.body.appendChild(fsDiv);
});
</script>
`;
html = html.replace('</body>', inject + '</body>');
fs.writeFileSync('scratch/test_measure_dom.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_measure_dom.html').replace(/\\/g, '/');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1460,1100 --dump-dom "file:///${p}" > scratch/dump.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump.html', 'utf8');
const match = dump.match(/<div id="debug-results">([\s\S]*?)<\/div>/);
if (match) {
  console.log('RESULTS:\n', match[1]);
} else {
  console.log('Not found');
}
