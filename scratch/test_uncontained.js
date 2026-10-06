const fs = require('fs');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const s = `
<script>
const wideUncontained = [];
document.querySelectorAll('body *').forEach(el => {
  // Check if any ancestor has overflow-x auto/scroll
  let isContained = false;
  let p = el.parentElement;
  while (p && p !== document.body) {
    const ox = window.getComputedStyle(p).overflowX;
    if (ox === 'auto' || ox === 'scroll') {
      isContained = true;
      break;
    }
    p = p.parentElement;
  }
  if (!isContained && el.offsetWidth > 390) {
    wideUncontained.push({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      offsetWidth: el.offsetWidth,
      text: el.innerText ? el.innerText.slice(0, 40) : ''
    });
  }
});
const d = document.createElement('pre');
d.id = 'wide-uncontained';
d.textContent = JSON.stringify(wideUncontained, null, 2);
document.body.appendChild(d);
</script>
`;

html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_uncontained.html', html, 'utf8');
const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/test_uncontained.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_uncontained.html`);
const dump = fs.readFileSync('scratch/dump_uncontained.html', 'utf8');
const m = dump.match(/<pre id="wide-uncontained">([\s\S]*?)<\/pre>/);
console.log('WIDE UNCONTAINED:\n', m ? m[1] : 'not found');
