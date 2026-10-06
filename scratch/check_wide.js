const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');
const inject = `
<script>
window.addEventListener('load', () => {
  const wide = [];
  document.querySelectorAll('body *').forEach(el => {
    if (el.offsetWidth > 390) {
      wide.push({ tag: el.tagName, id: el.id, class: el.className, w: el.offsetWidth, minW: window.getComputedStyle(el).minWidth });
    }
  });
  const d = document.createElement('div');
  d.id = 'wide-elements';
  d.textContent = JSON.stringify(wide.slice(0, 15), null, 2);
  document.body.appendChild(d);
});
</script>
`;
html = html.replace('</body>', inject + '</body>');
fs.writeFileSync('scratch/test_wide.html', html, 'utf8');
const p = path.resolve('scratch/test_wide.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,844 --dump-dom "file:///${p}" > scratch/dump_wide.html`, { shell: 'cmd.exe' });
const dump = fs.readFileSync('scratch/dump_wide.html', 'utf8');
const match = dump.match(/<div id="wide-elements">([\s\S]*?)<\/div>/);
console.log(match ? match[1] : 'not found');
