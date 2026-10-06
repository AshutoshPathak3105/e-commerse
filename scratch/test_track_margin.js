const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

const testCss = `
<style>
  #admin-panel-overlay .ap-cms-view .ap-table-wrap::-webkit-scrollbar {
    width: 7px !important;
    height: 7px !important;
  }
  #admin-panel-overlay .ap-cms-view .ap-table-wrap::-webkit-scrollbar-track {
    margin-top: 44px !important;
    background: #f1f5f9 !important;
  }
  #admin-panel-overlay .ap-cms-view .ap-table-wrap::-webkit-scrollbar-track-piece:start {
    margin-top: 44px !important;
  }
  /* Can we style the corner or pseudo overlay on table card? */
  .ap-table-card {
    position: relative !important;
  }
  .ap-table-card:has(#ap-quad-table-body)::after {
    content: '';
    position: absolute;
    top: 137px; /* top of the orange header */
    right: 0;
    width: 8px;
    height: 44px;
    background: #ff9400;
    z-index: 100;
    pointer-events: none;
  }
</style>
`;

html = html.replace('</head>', testCss + '</head>');
fs.writeFileSync('scratch/test_track_margin.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'test_track_margin.png');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1460,1100 --screenshot="${outPng}" "file://${path.resolve('scratch/test_track_margin.html')}"`);
console.log('Saved', outPng);
