const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Re-generate preview from script.js
require('./render_from_real_script.js');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Inject test script to check button styling and border radius
const testScript = `
<script>
window.addEventListener('load', () => {
  const promoCard = document.querySelector('.ap-promos-card') || document.querySelector('.ap-table-card:has(#ap-promos-table-body)');
  const header = promoCard.querySelector('.ap-card-header');
  const addBtn = promoCard.querySelector('#ap-cms-add-promo-btn');
  
  const cardStyle = window.getComputedStyle(promoCard);
  const headerStyle = window.getComputedStyle(header);
  const btnStyle = window.getComputedStyle(addBtn);

  const res = {
    cardBorderTopLeftRadius: cardStyle.borderTopLeftRadius,
    cardBorderTopRightRadius: cardStyle.borderTopRightRadius,
    headerBorderTopLeftRadius: headerStyle.borderTopLeftRadius,
    headerBorderTopRightRadius: headerStyle.borderTopRightRadius,
    buttonText: addBtn.innerText.trim(),
    buttonBg: btnStyle.backgroundColor,
    buttonColor: btnStyle.color,
    buttonFontWeight: btnStyle.fontWeight
  };

  const d = document.createElement('div');
  d.id = 'promo-check-res';
  d.textContent = JSON.stringify(res, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', testScript + '</body>');
fs.writeFileSync('scratch/test_promo_check.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_promo_check.html').replace(/\\/g, '/');
const snapPng = path.resolve('scratch/promo_mobile_checked.png').replace(/\\/g, '/');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,1400 --screenshot="${snapPng}" --dump-dom "file:///${p}" > scratch/dump_promo_check.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump_promo_check.html', 'utf8');
const match = dump.match(/<div id="promo-check-res">([\s\S]*?)<\/div>/);
console.log('RESULTS:\n', match ? match[1] : 'not found');
