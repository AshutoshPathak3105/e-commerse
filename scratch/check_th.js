const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');
const inspectScript = `
<script>
  window.addEventListener('load', () => {
    const wrap = document.querySelector('#ap-quad-cards-section .ap-table-wrap');
    const table = wrap.querySelector('table');
    const thLast = table.querySelector('thead tr th:last-child');
    const rWrap = wrap.getBoundingClientRect();
    const rTh = thLast.getBoundingClientRect();
    const info = document.createElement('div');
    info.id = 'DEBUG_INFO';
    info.innerText = JSON.stringify({
      wrap: { top: rWrap.top, right: rWrap.right, width: rWrap.width },
      thLast: { top: rTh.top, right: rTh.right, width: rTh.width },
      diffRight: rWrap.right - rTh.right,
      clientWidth: wrap.clientWidth,
      offsetWidth: wrap.offsetWidth
    });
    document.body.appendChild(info);
  });
</script>
`;
fs.writeFileSync('scratch/inspect_th.html', html.replace('</body>', inspectScript + '</body>'));
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = execSync(`"${chromePath}" --headless=new --disable-gpu --virtual-time-budget=2000 --dump-dom "file://${path.resolve('scratch/inspect_th.html')}"`).toString();
const match = out.match(/<div id="DEBUG_INFO">([^<]+)<\/div>/);
console.log(match ? match[1] : 'NOT FOUND');
