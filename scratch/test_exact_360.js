const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Inject fix with explicit 360px container
html = html.replace('</head>', `
<style>
  #admin-panel-overlay {
    width: 360px !important;
    max-width: 360px !important;
    overflow-x: hidden !important;
    padding: 0 !important;
    margin: 0 auto !important;
  }
  .ap-table-card {
    min-width: 0 !important;
    max-width: 360px !important;
    width: 360px !important;
  }
  .ap-card-header {
    min-width: 0 !important;
    max-width: 360px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 12px 14px !important;
  }
  .ap-card-header > div:first-child {
    min-width: 0 !important;
    flex: 1 1 auto !important;
  }
  .ap-card-header p {
    white-space: normal !important;
    word-break: break-word !important;
  }
  .ap-cms-table-outer {
    width: 360px !important;
    max-width: 360px !important;
    overflow-x: auto !important;
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
    card: { w: cardRect.width, left: cardRect.left, right: cardRect.right },
    addBtn: { text: addBtn.innerText, w: addRect.width, left: addRect.left, right: addRect.right },
    outer: { w: outerRect.width, left: outerRect.left, right: outerRect.right, scrollLeft: outer.scrollLeft, scrollWidth: outer.scrollWidth },
    editBtn: { text: editBtn.innerText, w: editRect.width, left: editRect.left, right: editRect.right },
    deleteBtn: { text: deleteBtn.innerText, w: delRect.width, left: delRect.left, right: delRect.right },
    editVisible: editRect.left >= outerRect.left && editRect.right <= outerRect.right + 2,
    delVisible: delRect.left >= outerRect.left && delRect.right <= outerRect.right + 2
  };

  const d = document.createElement('div');
  d.id = 'exact-360-res';
  d.textContent = JSON.stringify(res, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', scrollScript + '</body>');
fs.writeFileSync('scratch/test_exact_360.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_exact_360.html').replace(/\\/g, '/');
const snapPng = path.resolve('scratch/exact_360.png').replace(/\\/g, '/');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=600,1400 --screenshot="${snapPng}" --dump-dom "file:///${p}" > scratch/dump_exact_360.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump_exact_360.html', 'utf8');
const match = dump.match(/<div id="exact-360-res">([\s\S]*?)<\/div>/);
console.log('RESULTS:\n', match ? match[1] : 'not found');
