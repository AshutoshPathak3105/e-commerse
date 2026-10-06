const fs = require('fs');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const s = `
<script>
window.addEventListener('DOMContentLoaded', () => {
  const over = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.right > 395 && el.children.length === 0) {
      over.push({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        text: (el.innerText || '').slice(0, 30),
        right: r.right,
        width: r.width
      });
    }
  });
  // Sort descending by right edge
  over.sort((a, b) => b.right - a.right);
  const el = document.createElement('pre');
  el.id = 'overflowing-elements';
  el.textContent = JSON.stringify(over.slice(0, 15), null, 2);
  document.body.appendChild(el);
});
</script>
`;

html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_find_overflow.html', html, 'utf8');
const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/test_find_overflow.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_find_overflow.html`);
const dump = fs.readFileSync('scratch/dump_find_overflow.html', 'utf8');
const m = dump.match(/<pre id="overflowing-elements">([\s\S]*?)<\/pre>/);
console.log('OVERFLOWING ELEMENTS:\n', m ? m[1] : 'not found');
