const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const testCss = `
<style>
  /* 1. Make ap-table-wrap background #ff9400 so the top-right gutter in the header is pure orange */
  #admin-panel-overlay .ap-cms-view .ap-table-wrap,
  #ap-quad-cards-section .ap-table-wrap {
    background: #ff9400 !important;
  }

  /* 2. Keep tbody clean white */
  #admin-panel-overlay .ap-cms-view .ap-table tbody,
  #ap-quad-cards-section .ap-table tbody {
    background: #ffffff !important;
  }

  /* 3. Scrollbar gutter has orange background, while track begins below header (44px) */
  #admin-panel-overlay .ap-cms-view .ap-table-wrap::-webkit-scrollbar {
    width: 8px !important;
    background: #ff9400 !important;
  }
  #admin-panel-overlay .ap-cms-view .ap-table-wrap::-webkit-scrollbar-track {
    margin-top: 44px !important;
    background: #f1f5f9 !important;
    border-radius: 4px;
  }
  #admin-panel-overlay .ap-cms-view .ap-table-wrap::-webkit-scrollbar-thumb {
    background: #022f43 !important;
    border-radius: 4px;
  }
  #admin-panel-overlay .ap-cms-view .ap-table-wrap::-webkit-scrollbar-thumb:hover {
    background: #03415e !important;
  }
</style>
`;

html = html.replace('</head>', testCss + '</head>');
fs.writeFileSync('scratch/test_margin_proper.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'test_margin_proper.png');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1460,1100 --screenshot="${outPng}" "file://${path.resolve('scratch/test_margin_proper.html')}"`);
console.log('Saved', outPng);
