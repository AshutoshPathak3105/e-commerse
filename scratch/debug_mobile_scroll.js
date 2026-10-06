const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const inject = `
<script>
window.addEventListener('load', () => {
  // Find Top Hero Promo Cards outer container
  const heroCard = document.querySelector('.ap-table-card:has(#ap-hero-promo-table-body)') || 
                   document.querySelector('#ap-hero-promo-table-body').closest('.ap-table-card');
  const outer = heroCard.querySelector('.ap-cms-table-outer');
  const innerDiv = outer.firstElementChild;
  const headerTable = outer.querySelector('.ap-cms-table-header table');
  const bodyScroll = outer.querySelector('.ap-cms-body-scroll');
  const bodyTable = bodyScroll.querySelector('table');
  const firstRow = bodyTable.querySelector('tbody tr');
  const actionTd = firstRow ? firstRow.querySelector('td:last-child') : null;
  const editBtn = actionTd ? actionTd.querySelector('.ap-edit-hero-btn, button') : null;

  // Scroll to max
  outer.scrollLeft = 9999;
  
  const outerRect = outer.getBoundingClientRect();
  const cardRect = heroCard.getBoundingClientRect();
  const tdRect = actionTd ? actionTd.getBoundingClientRect() : {};
  const btnRect = editBtn ? editBtn.getBoundingClientRect() : {};

  const result = {
    card: { w: cardRect.width, left: cardRect.left, right: cardRect.right },
    outer: { 
      clientWidth: outer.clientWidth, 
      scrollWidth: outer.scrollWidth, 
      scrollLeft: outer.scrollLeft, 
      maxScroll: outer.scrollWidth - outer.clientWidth,
      rect: { left: outerRect.left, right: outerRect.right, width: outerRect.width }
    },
    innerDiv: { w: innerDiv.offsetWidth, scrollWidth: innerDiv.scrollWidth },
    headerTable: { w: headerTable.offsetWidth, scrollWidth: headerTable.scrollWidth },
    bodyScroll: { clientWidth: bodyScroll.clientWidth, scrollWidth: bodyScroll.scrollWidth, w: bodyScroll.offsetWidth },
    bodyTable: { w: bodyTable.offsetWidth, scrollWidth: bodyTable.scrollWidth },
    actionTd: { 
      w: tdRect.width, 
      left: tdRect.left, 
      right: tdRect.right, 
      isVisibleInsideOuter: tdRect.right <= outerRect.right + 2 
    },
    editBtn: {
      w: btnRect.width,
      left: btnRect.left,
      right: btnRect.right,
      isVisibleInsideOuter: btnRect.right <= outerRect.right + 2
    },
    outerComputedOverflow: window.getComputedStyle(outer).overflowX,
    cardComputedOverflow: window.getComputedStyle(heroCard).overflowX
  };

  const d = document.createElement('div');
  d.id = 'debug-scroll-result';
  d.textContent = JSON.stringify(result, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', inject + '</body>');
fs.writeFileSync('scratch/test_mobile_scroll.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_mobile_scroll.html').replace(/\\/g, '/');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --dump-dom "file:///${p}" > scratch/dump_mobile_scroll.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump_mobile_scroll.html', 'utf8');
const match = dump.match(/<div id="debug-scroll-result">([\s\S]*?)<\/div>/);
console.log(match ? match[1] : 'not found');
