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
      <td style="min-width:220px; max-width:260px;">
        <div style="font-weight:700; color:#0f172a; font-size:13px; line-height:1.4;">Mega Festive Super Sale: Up to 10% OFF</div>
        <span class="ap-badge blue" style="font-size:10.5px; margin-top:4px; display:inline-block; font-weight:700;">Super Sale</span>
      </td>
      <td style="font-size:12px; color:#334155;"><code style="color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:4px; font-size:11px;">#deals</code></td>
      <td style="text-align:center;"><button type="button" class="ap-btn-tiny ap-badge green" style="cursor:pointer; border:none; padding:4px 10px; font-size:11px; font-weight:800;">● Active</button></td>
      <td style="text-align:right; white-space:nowrap;">
        <button type="button" class="ap-btn ghost ap-edit-ann-btn" data-id="ann-1" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
        <button type="button" class="ap-btn danger ap-del-ann-btn" data-id="ann-1" style="padding:4px 10px; font-size:12px;">Delete</button>
      </td>
    </tr>
  `);

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Final Verification</title>
  <link rel="stylesheet" href="../styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; max-width: 100%; font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; overflow-x: hidden; }
    body { padding: 16px; box-sizing: border-box; }
    #admin-panel-overlay.active { display: block !important; position: static !important; background: transparent !important; opacity: 1 !important; visibility: visible !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
    .ap-cms-view { width: 100% !important; max-width: 100% !important; display: block !important; }
  </style>
</head>
<body>
  <div id="admin-panel-overlay" class="active">
    ${cmsHtml}
  </div>
</body>
</html>`;

const previewHtmlPath = path.join(__dirname, 'preview_final_verify.html');
fs.writeFileSync(previewHtmlPath, htmlContent, 'utf8');

execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${path.join(__dirname, 'verify_final_desktop_1200.png')}" --window-size=1200,700 --hide-scrollbars "${previewHtmlPath}"`);
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${path.join(__dirname, 'verify_final_tablet_768.png')}" --window-size=768,700 --hide-scrollbars "${previewHtmlPath}"`);
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${path.join(__dirname, 'verify_final_mobile_375.png')}" --window-size=375,700 --hide-scrollbars "${previewHtmlPath}"`);

console.log('Final verification snapshots done!');
