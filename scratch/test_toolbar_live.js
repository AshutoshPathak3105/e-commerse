const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const script = fs.readFileSync('script.js', 'utf8');

// extract the toolbar HTML
const startIdx = script.indexOf('<!-- Toolbar for Search and Filtering');
const endIdx = script.indexOf('<!-- Table (Second row of the header part');
const toolbarHtml = script.substring(startIdx, endIdx);

// also extract the style block inside renderStaff
const styleStart = script.indexOf('<style>', script.indexOf('renderStaff'));
const styleEnd = script.indexOf('</style>', styleStart) + 8;
const staffStyle = script.substring(styleStart, styleEnd);

const testHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../styles.css">
  <style>
    body { margin: 0; padding: 10px; background: #f1f5f9; font-family: sans-serif; }
    #admin-panel-overlay { display: block !important; position: static !important; }
  </style>
</head>
<body>
  <div id="admin-panel-overlay">
    <div class="ap-view-inner ap-staff-window">
      ${staffStyle}
      <div class="ap-table-card" style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:12px; overflow:hidden;">
        ${toolbarHtml}
      </div>
    </div>
  </div>
</body>
</html>`;

const outHtml = path.join(__dirname, 'test_toolbar_live.html');
fs.writeFileSync(outHtml, testHtml);

const s1024 = path.resolve(__dirname, 'snap_toolbar_1024.png');
const s768 = path.resolve(__dirname, 'snap_toolbar_768.png');
const s375 = path.resolve(__dirname, 'snap_toolbar_375.png');

const fileUrl = 'file:///' + outHtml.replace(/\\/g, '/');
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${s1024}" --window-size=1024,300 --hide-scrollbars "${fileUrl}"`);
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${s768}" --window-size=768,300 --hide-scrollbars "${fileUrl}"`);
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${s375}" --window-size=375,300 --hide-scrollbars "${fileUrl}"`);
console.log('Snapshots taken with fileUrl!');
