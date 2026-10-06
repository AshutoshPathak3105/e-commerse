const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const testHtml = path.resolve(__dirname, 'test_promos_standalone.html');
const outPngScrolled = path.resolve(__dirname, 'promos_1200_scrolled.png');

let html = fs.readFileSync(testHtml, 'utf8');
if (!html.includes('id="scroll-to-right"')) {
  html = html.replace('</body>', `<script id="scroll-to-right">
    window.addEventListener('load', () => {
      setTimeout(() => {
        const outer = document.querySelector('.ap-cms-table-outer');
        if (outer) outer.scrollLeft = 9999;
      }, 300);
    });
  </script></body>`);
  fs.writeFileSync(testHtml, html, 'utf8');
}

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1200,800 --virtual-time-budget=2000 --screenshot="${outPngScrolled}" "file:///${testHtml.replace(/\\/g, '/')}"`, { stdio: 'inherit' });

console.log("Scrolled screenshot generated");
