const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const testScript = `
<script>
window.addEventListener('load', () => {
  const heroCard = document.querySelector('.ap-table-card:has(#ap-hero-promo-table-body)');
  const addBtn = heroCard.querySelector('#ap-add-hero-promo-btn');
  const outer = heroCard.querySelector('.ap-cms-table-outer');
  
  // Slide all the way to the right horizontally
  outer.scrollLeft = 9999;

  const addBtnStyle = window.getComputedStyle(addBtn);
  const addBtnInfo = {
    text: addBtn.innerText,
    bg: addBtnStyle.backgroundColor,
    color: addBtnStyle.color,
    border: addBtnStyle.borderColor
  };

  const firstRow = heroCard.querySelector('tbody tr');
  const actionTd = firstRow ? firstRow.querySelector('td:last-child') : null;
  const editBtn = actionTd ? actionTd.querySelector('.ap-edit-hero-btn, .ap-btn.ghost') : null;
  const deleteBtn = actionTd ? actionTd.querySelector('.ap-del-hero-btn, .ap-btn.danger') : null;

  const outerRect = outer.getBoundingClientRect();
  const editRect = editBtn ? editBtn.getBoundingClientRect() : {};
  const delRect = deleteBtn ? deleteBtn.getBoundingClientRect() : {};

  const report = {
    addBtn: addBtnInfo,
    outer: {
      left: outerRect.left,
      right: outerRect.right,
      width: outerRect.width,
      scrollLeft: outer.scrollLeft,
      scrollWidth: outer.scrollWidth
    },
    editBtn: {
      text: editBtn ? editBtn.innerText : null,
      left: editRect.left,
      right: editRect.right,
      width: editRect.width,
      fullyVisible: editRect.left >= outerRect.left && editRect.right <= outerRect.right + 2
    },
    deleteBtn: {
      text: deleteBtn ? deleteBtn.innerText : null,
      left: delRect.left,
      right: delRect.right,
      width: delRect.width,
      fullyVisible: delRect.left >= outerRect.left && delRect.right <= outerRect.right + 2
    }
  };

  const d = document.createElement('div');
  d.id = 'verification-report';
  d.textContent = JSON.stringify(report, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', testScript + '</body>');
fs.writeFileSync('scratch/verify_mobile_slider.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/verify_mobile_slider.html').replace(/\\/g, '/');
const outPng = path.resolve('scratch/mobile_slider_verified.png').replace(/\\/g, '/');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,1600 --screenshot="${outPng}" --dump-dom "file:///${p}" > scratch/dump_slider_verif.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump_slider_verif.html', 'utf8');
const match = dump.match(/<div id="verification-report">([\s\S]*?)<\/div>/);
console.log('REPORT:\n', match ? match[1] : 'NOT FOUND');
