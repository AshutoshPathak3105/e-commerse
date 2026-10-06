const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read preview_from_script.html
let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Let's test CSS rule that makes tbody the scroll container
// OR test wrapping
const testCss = `
<style>
  /* Reset ap-table-wrap overflow-y */
  #admin-panel-overlay .ap-cms-view .ap-table-wrap,
  #ap-quad-cards-section .ap-table-wrap {
    max-height: none !important;
    overflow-y: visible !important;
  }

  /* Test tbody scroll */
  #admin-panel-overlay .ap-cms-view .ap-table thead,
  #admin-panel-overlay .ap-cms-view .ap-table tbody tr {
    display: table !important;
    width: 100% !important;
    table-layout: fixed !important;
  }

  #admin-panel-overlay .ap-cms-view .ap-table tbody {
    display: block !important;
    max-height: 350px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }
</style>
`;

html = html.replace('</head>', testCss + '</head>');
fs.writeFileSync('scratch/test_tbody_result.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'test_tbody_result.png');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1460,1100 --screenshot="${outPng}" "file://${path.resolve('scratch/test_tbody_result.html')}"`);
console.log('Saved', outPng);
