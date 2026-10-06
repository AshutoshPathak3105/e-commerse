const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const s = `
<script>
window.addEventListener('load', () => {
  const table = document.getElementById('ap-promos-table');
  const tr = table.querySelector('tbody tr');
  const td9 = tr.children[8];
  const tRect = table.getBoundingClientRect();
  const cRect = td9.getBoundingClientRect();
  const buttons = Array.from(td9.querySelectorAll('button')).map(b => ({
    text: b.innerText,
    rect: b.getBoundingClientRect()
  }));

  const res = {
    table: { left: tRect.left, right: tRect.right, width: tRect.width },
    td9: { left: cRect.left, right: cRect.right, width: cRect.width },
    buttons: buttons.map(b => ({
      text: b.text,
      left: b.rect.left,
      right: b.rect.right,
      width: b.rect.width,
      offsetFromTd9Right: cRect.right - b.rect.right
    }))
  };

  const el = document.createElement('pre');
  el.id = 'precise-box';
  el.textContent = JSON.stringify(res, null, 2);
  document.body.appendChild(el);
});
</script>
`;

html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_precise.html', html, 'utf8');
const p = path.resolve('scratch/test_precise.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_precise.html`);
const dump = fs.readFileSync('scratch/dump_precise.html', 'utf8');
const m = dump.match(/<pre id="precise-box">([\s\S]*?)<\/pre>/);
console.log('PRECISE DATA:\n', m ? m[1] : 'not found');
