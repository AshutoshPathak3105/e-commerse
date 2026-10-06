const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/test_fix_scroll.html', 'utf8');
const inject = `
<script>
window.addEventListener('load', () => {
  const heroCard = document.querySelector('.ap-table-card:has(#ap-hero-promo-table-body)') || 
                   document.querySelector('#ap-hero-promo-table-body').closest('.ap-table-card');
  const outer = heroCard.querySelector('.ap-cms-table-outer');
  outer.scrollLeft = 9999;
  const actionTd = heroCard.querySelector('tbody tr td:last-child');
  const btns = Array.from(actionTd.querySelectorAll('button')).map(b => {
    const r = b.getBoundingClientRect();
    return { text: b.innerText, left: r.left, right: r.right, width: r.width };
  });
  const outerRect = outer.getBoundingClientRect();
  const d = document.createElement('div');
  d.id = 'btns-pos';
  d.textContent = JSON.stringify({ outerRight: outerRect.right, btns }, null, 2);
  document.body.appendChild(d);
});
</script>
`;
html = html.replace('</body>', inject + '</body>');
fs.writeFileSync('scratch/test_btns.html', html, 'utf8');
const p = path.resolve('scratch/test_btns.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,844 --dump-dom "file:///${p}" > scratch/dump_btns.html`, { shell: 'cmd.exe' });
const dump = fs.readFileSync('scratch/dump_btns.html', 'utf8');
const match = dump.match(/<div id="btns-pos">([\s\S]*?)<\/div>/);
console.log(match ? match[1] : 'not found');
