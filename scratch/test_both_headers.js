const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

// Match the entire CMS view header + announcement card
const cmsViewMatch = script.match(/<div class="ap-view-inner ap-cms-view">[\s\S]*?<!-- Global Announcement Ticker Manager -->[\s\S]*?<\/table>\s*<\/div>\s*<\/div>/);

if (!cmsViewMatch) {
  console.error('Could not find CMS view match!');
  process.exit(1);
}

let cmsHtml = cmsViewMatch[0]
  .replace(/\$\{announcements\.filter\(a => a\.active !== false\)\.length\}/g, '2')
  .replace(/\$\{announcements\.length\}/g, '2')
  .replace(/\$\{renderAnnouncementRows\(getFilteredAnnouncements\(\)\)\}/g, `
    <tr data-ann-id="ann-1">
      <td style="font-weight:700; color:#475569; width:45px;">#1</td>
      <td style="min-width:260px;">
        <div style="font-weight:700; color:#0f172a; font-size:13px; line-height:1.4;">Mega Festive Super Sale</div>
      </td>
    </tr>
  `);

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CMS Header Verification</title>
  <link rel="stylesheet" href="../styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; }
    body { padding: 16px; }
    #admin-panel-overlay.active { display: block !important; position: static !important; background: transparent !important; opacity: 1 !important; visibility: visible !important; width: 100% !important; max-width: 100% !important; }
    .ap-cms-view { width: 100% !important; max-width: 100% !important; display: block !important; }
  </style>
</head>
<body>
  <div id="admin-panel-overlay" class="active">
    ${cmsHtml}
    </div>
  </div>
</body>
</html>`;

const previewHtmlPath = path.join(__dirname, 'preview_cms_both_headers.html');
fs.writeFileSync(previewHtmlPath, htmlContent, 'utf8');

execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${path.join(__dirname, 'snap_current_desktop_1200.png')}" --window-size=1200,800 --hide-scrollbars "${previewHtmlPath}"`);
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${path.join(__dirname, 'snap_current_tablet_768.png')}" --window-size=768,800 --hide-scrollbars "${previewHtmlPath}"`);
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${path.join(__dirname, 'snap_current_mobile_375.png')}" --window-size=375,800 --hide-scrollbars "${previewHtmlPath}"`);

console.log('Done generating current snapshots!');
