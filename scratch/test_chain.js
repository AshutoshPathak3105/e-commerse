const fs = require('fs');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const s = `
<script>
window.addEventListener('DOMContentLoaded', () => {
  const outer = document.querySelector('.ap-promos-card .ap-cms-table-outer') || document.querySelector('.ap-table-card:has(#ap-promos-table) .ap-cms-table-outer');
  const chain = [];
  let curr = outer;
  while (curr && curr !== document.documentElement) {
    const r = curr.getBoundingClientRect();
    const st = window.getComputedStyle(curr);
    chain.push({
      tag: curr.tagName,
      id: curr.id,
      className: curr.className,
      rect: { left: r.left, width: r.width, right: r.right },
      cssWidth: st.width,
      cssMinWidth: st.minWidth,
      cssMaxWidth: st.maxWidth,
      cssPadding: st.padding,
      cssMargin: st.margin,
      cssOverflow: st.overflowX
    });
    curr = curr.parentElement;
  }
  const el = document.createElement('pre');
  el.id = 'ancestor-chain';
  el.textContent = JSON.stringify(chain, null, 2);
  document.body.appendChild(el);
});
</script>
`;

html = html.replace('</body>', s + '</body>');
fs.writeFileSync('scratch/test_chain.html', html, 'utf8');
const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/test_chain.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_chain.html`);
const dump = fs.readFileSync('scratch/dump_chain.html', 'utf8');
const m = dump.match(/<pre id="ancestor-chain">([\s\S]*?)<\/pre>/);
console.log('CHAIN:\n', m ? m[1] : 'not found');
