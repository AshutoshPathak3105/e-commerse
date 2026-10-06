const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');
const inject = `
<script>
window.addEventListener('load', () => {
  const card = document.querySelector('#ap-quad-cards-section');
  const cardHeader = card.querySelector('.ap-card-header');
  const toolbar = card.querySelector('.ap-cms-toolbar');
  const outer = card.querySelector('.ap-cms-table-outer');
  const headerPart = card.querySelector('.ap-table-header-part');
  const bodyScroll = card.querySelector('.ap-cms-body-scroll');

  const info = {
    card: { w: card.offsetWidth, r: card.getBoundingClientRect().right },
    cardHeader: { w: cardHeader ? cardHeader.offsetWidth : 0, r: cardHeader ? cardHeader.getBoundingClientRect().right : 0 },
    toolbar: { w: toolbar ? toolbar.offsetWidth : 0, r: toolbar ? toolbar.getBoundingClientRect().right : 0 },
    outer: { w: outer ? outer.offsetWidth : 0, r: outer ? outer.getBoundingClientRect().right : 0 },
    headerPart: { w: headerPart ? headerPart.offsetWidth : 0, r: headerPart ? headerPart.getBoundingClientRect().right : 0 },
    bodyScroll: { w: bodyScroll ? bodyScroll.offsetWidth : 0, r: bodyScroll ? bodyScroll.getBoundingClientRect().right : 0 }
  };
  const d = document.createElement('div');
  d.id = 'debug-info';
  d.textContent = JSON.stringify(info, null, 2);
  document.body.appendChild(d);
});
</script>
`;
html = html.replace('</body>', inject + '</body>');
fs.writeFileSync('scratch/test_info.html', html, 'utf8');
const p = path.resolve('scratch/test_info.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=1800,1200 --dump-dom "file:///${p}" > scratch/dump_info.html`, { shell: 'cmd.exe' });
const dump = fs.readFileSync('scratch/dump_info.html', 'utf8');
const match = dump.match(/<div id="debug-info">([\s\S]*?)<\/div>/);
console.log(match ? match[1] : 'not found');
