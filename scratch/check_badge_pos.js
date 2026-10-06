const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/test_badge_preview.html', 'utf8');
const script = `
<script>
window.addEventListener('load', () => {
  const badge = document.querySelector('#ap-banner-count-badge');
  const card = badge ? badge.closest('.ap-table-card') : null;
  const header = card ? card.querySelector('.ap-card-header') : null;
  if (!badge || !header) {
    const d = document.createElement('div');
    d.id = 'badge-pos';
    d.textContent = 'Badge not found';
    document.body.appendChild(d);
    return;
  }
  const bRect = badge.getBoundingClientRect();
  const hRect = header.getBoundingClientRect();
  const d = document.createElement('div');
  d.id = 'badge-pos';
  d.textContent = JSON.stringify({
    badgeText: badge.innerText,
    badgeTop: bRect.top,
    badgeRight: bRect.right,
    headerTop: hRect.top,
    headerRight: hRect.right,
    offsetFromHeaderTop: bRect.top - hRect.top,
    offsetFromHeaderRight: hRect.right - bRect.right
  }, null, 2);
  document.body.appendChild(d);
});
</script>
`;
html = html.replace('</body>', script + '</body>');
fs.writeFileSync('scratch/check_badge_pos.html', html, 'utf8');
const p = path.resolve('scratch/check_badge_pos.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,2000 --dump-dom "file:///${p}" > scratch/dump_badge_pos.html`, { shell: 'cmd.exe' });
const dump = fs.readFileSync('scratch/dump_badge_pos.html', 'utf8');
const m = dump.match(/<div id="badge-pos">([\s\S]*?)<\/div>/);
console.log('BADGE POS:\n', m ? m[1] : 'not found');
