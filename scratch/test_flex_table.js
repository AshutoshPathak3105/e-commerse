const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const testCss = `
<style>
  /* Reset ap-table-wrap */
  #admin-panel-overlay .ap-cms-view .ap-table-wrap,
  #ap-quad-cards-section .ap-table-wrap {
    max-height: none !important;
    overflow-y: visible !important;
    overflow-x: auto !important;
  }

  /* Test tbody scroll with display: block */
  #admin-panel-overlay .ap-cms-view .ap-table {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
  }

  #admin-panel-overlay .ap-cms-view .ap-table thead {
    display: table !important;
    width: 100% !important;
    background: #ff9400 !important;
  }

  #admin-panel-overlay .ap-cms-view .ap-table tbody {
    display: block !important;
    max-height: 350px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }

  #admin-panel-overlay .ap-cms-view .ap-table tbody tr {
    display: table !important;
    width: 100% !important;
  }
</style>
`;

html = html.replace('</head>', testCss + '</head>');
fs.writeFileSync('scratch/test_flex_table.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'test_flex_table.png');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1460,1100 --screenshot="${outPng}" "file://${path.resolve('scratch/test_flex_table.html')}"`);
console.log('Saved', outPng);
