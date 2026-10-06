const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const testHtml = path.resolve(__dirname, 'test_promos_standalone.html');

let html = fs.readFileSync(testHtml, 'utf8');
const dumpScript = `
<script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      const data = {};
      const outer = document.querySelector('.ap-cms-table-outer');
      const inner = document.querySelector('.ap-cms-table-inner');
      const headerTable = document.querySelector('#ap-promos-table-header');
      const bodyTable = document.querySelector('#ap-promos-table');
      
      data.outer = { width: outer.offsetWidth, scrollWidth: outer.scrollWidth, clientWidth: outer.clientWidth };
      data.inner = { width: inner.offsetWidth, scrollWidth: inner.scrollWidth, styleWidth: inner.style.width, computedWidth: getComputedStyle(inner).width, paddingRight: getComputedStyle(inner).paddingRight };
      data.headerTable = { width: headerTable.offsetWidth, scrollWidth: headerTable.scrollWidth, computedWidth: getComputedStyle(headerTable).width, tableLayout: getComputedStyle(headerTable).tableLayout };
      data.bodyTable = { width: bodyTable.offsetWidth, scrollWidth: bodyTable.scrollWidth, computedWidth: getComputedStyle(bodyTable).width, tableLayout: getComputedStyle(bodyTable).tableLayout };
      
      data.ths = Array.from(headerTable.querySelectorAll('th')).map((th, i) => ({
        index: i + 1,
        text: th.textContent.trim(),
        offsetWidth: th.offsetWidth,
        rectWidth: th.getBoundingClientRect().width,
        computedWidth: getComputedStyle(th).width
      }));

      data.tds = Array.from(bodyTable.querySelectorAll('tr:first-child td')).map((td, i) => ({
        index: i + 1,
        offsetWidth: td.offsetWidth,
        rectWidth: td.getBoundingClientRect().width,
        computedWidth: getComputedStyle(td).width
      }));

      const outDiv = document.createElement('div');
      outDiv.id = 'debug-output';
      outDiv.textContent = JSON.stringify(data, null, 2);
      document.body.appendChild(outDiv);
      console.log('DATA_OUTPUT_START' + JSON.stringify(data) + 'DATA_OUTPUT_END');
    }, 500);
  });
</script>
`;

if (!html.includes('id="debug-output"')) {
  html = html.replace('</body>', dumpScript + '</body>');
  fs.writeFileSync(testHtml, html, 'utf8');
}

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=1200,800 --virtual-time-budget=2000 --dump-dom "file:///${testHtml.replace(/\\/g, '/')}"`;
const out = execSync(cmd, { encoding: 'utf8' });
const match = out.match(/<div id="debug-output">([\s\S]*?)<\/div>/);
if (match) {
  console.log("DUMPED DATA:\n", match[1]);
} else {
  console.log("No dump found, check console output");
}
