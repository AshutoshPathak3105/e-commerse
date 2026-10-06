const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const debugScript = `
<script>
window.addEventListener('load', () => {
  const heroCard = document.querySelector('.ap-table-card:has(#ap-hero-promo-table-body)');
  const parentGrid = heroCard.parentElement;
  
  const childrenInfo = Array.from(heroCard.children).map(c => ({
    tag: c.tagName,
    className: c.className,
    offsetWidth: c.offsetWidth,
    scrollWidth: c.scrollWidth,
    minWidth: window.getComputedStyle(c).minWidth,
    width: window.getComputedStyle(c).width
  }));

  const info = {
    heroCardWidth: heroCard.offsetWidth,
    children: childrenInfo
  };

  const d = document.createElement('div');
  d.id = 'debug-layout-info';
  d.textContent = JSON.stringify(info, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', debugScript + '</body>');
fs.writeFileSync('scratch/test_layout_debug.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_layout_debug.html').replace(/\\/g, '/');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,1200 --dump-dom "file:///${p}" > scratch/dump_layout_debug.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump_layout_debug.html', 'utf8');
const match = dump.match(/<div id="debug-layout-info">([\s\S]*?)<\/div>/);
console.log(match ? match[1] : 'not found');
