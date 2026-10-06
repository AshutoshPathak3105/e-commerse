const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Inject fix
html = html.replace('</head>', `
<style>
  .ap-table-card {
    min-width: 0 !important;
    max-width: 100% !important;
  }
  .ap-card-header {
    min-width: 0 !important;
    max-width: 100% !important;
  }
  .ap-card-header > div:first-child {
    min-width: 0 !important;
    flex: 1 1 auto !important;
  }
  .ap-card-header p {
    white-space: normal !important;
    word-break: break-word !important;
  }
  body {
    padding: 8px !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
  }
</style>
</head>`);

const scrollScript = `
<script>
window.addEventListener('load', () => {
  const heroCard = document.querySelector('.ap-table-card:has(#ap-hero-promo-table-body)');
  const addBtn = heroCard.querySelector('#ap-add-hero-promo-btn');
  const outer = heroCard.querySelector('.ap-cms-table-outer');
  
  // Slide all the way to the right
  outer.scrollLeft = 9999;

  const cardRect = heroCard.getBoundingClientRect();
  const addRect = addBtn.getBoundingClientRect();
  const outerRect = outer.getBoundingClientRect();
  
  const actionTd = heroCard.querySelector('tbody tr td:last-child');
  const editBtn = actionTd.querySelector('.ap-edit-hero-btn, .ap-btn.ghost');
  const deleteBtn = actionTd.querySelector('.ap-del-hero-btn, .ap-btn.danger');
  const editRect = editBtn.getBoundingClientRect();
  const delRect = deleteBtn.getBoundingClientRect();

  const res = {
    screenW: window.innerWidth,
    card: { w: cardRect.width, left: cardRect.left, right: cardRect.right, isWithinScreen: cardRect.right <= window.innerWidth },
    addBtn: { w: addRect.width, left: addRect.left, right: addRect.right, isWithinScreen: addRect.right <= window.innerWidth },
    outer: { w: outerRect.width, scrollLeft: outer.scrollLeft, scrollWidth: outer.scrollWidth },
    editBtn: { w: editRect.width, left: editRect.left, right: editRect.right, isWithinOuter: editRect.right <= outerRect.right + 2 },
    deleteBtn: { w: delRect.width, left: delRect.left, right: delRect.right, isWithinOuter: delRect.right <= outerRect.right + 2 }
  };

  const d = document.createElement('div');
  d.id = 'layout-fix-res';
  d.textContent = JSON.stringify(res, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', scrollScript + '</body>');
fs.writeFileSync('scratch/test_layout_fix.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_layout_fix.html').replace(/\\/g, '/');
const snapPng = path.resolve('scratch/mobile_layout_fixed.png').replace(/\\/g, '/');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,1400 --screenshot="${snapPng}" --dump-dom "file:///${p}" > scratch/dump_layout_fix.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump_layout_fix.html', 'utf8');
const match = dump.match(/<div id="layout-fix-res">([\s\S]*?)<\/div>/);
console.log('RESULTS:\n', match ? match[1] : 'not found');
