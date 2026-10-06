const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const annMatch = script.match(/<!-- Global Announcement Ticker Manager -->[\s\S]*?<\/table>\s*<\/div>\s*<\/div>/);

let annHtml = annMatch[0]
  .replace(/\$\{announcements\.filter\(a => a\.active !== false\)\.length\}/g, '2')
  .replace(/\$\{announcements\.length\}/g, '2')
  .replace(/\$\{renderAnnouncementRows\(getFilteredAnnouncements\(\)\)\}/g, `
    <tr data-ann-id="ann-1">
      <td style="font-weight:700; color:#475569; width:45px;">#1</td>
      <td style="min-width:260px;">
        <div style="font-weight:700; color:#0f172a; font-size:13px; line-height:1.4;">Mega Festive Super Sale: Up to 10% OFF Across All Electronics &amp; Fashion_XYZ</div>
        <span class="ap-badge blue" style="font-size:10.5px; margin-top:4px; display:inline-block; font-weight:700;">Super Sale</span>
      </td>
      <td style="font-size:12px; color:#334155;">
        <code style="color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:4px; font-size:11px;">#deals</code>
      </td>
      <td style="text-align:center;">
        <button type="button" class="ap-btn-tiny ap-ann-toggle-btn ap-badge green" style="cursor:pointer; border:none; padding:4px 10px; font-size:11px; font-weight:800;">
          ● Active
        </button>
      </td>
      <td style="text-align:right; white-space:nowrap;">
        <button type="button" class="ap-btn ghost ap-edit-ann-btn" data-id="ann-1" style="padding:4px 10px; font-size:12px; margin-right:4px; background:#022f43 !important; background-color:#022f43 !important; color:#ffffff !important; border:1px solid #022f43 !important; border-color:#022f43 !important; border-radius:6px; font-weight:700;">Edit</button>
        <button type="button" class="ap-btn danger ap-del-ann-btn" data-id="ann-1" style="padding:4px 10px; font-size:12px;">Delete</button>
      </td>
    </tr>
  `);

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Announcement Bar Verification</title>
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
    <div class="ap-cms-view">
      ${annHtml}
    </div>
  </div>
</body>
</html>`;

const previewHtmlPath = path.join(__dirname, 'preview_ann_exact.html');
fs.writeFileSync(previewHtmlPath, htmlContent, 'utf8');

const snapTablet = path.join(__dirname, 'snap_ann_tablet_verified.png');
const snapDesktop = path.join(__dirname, 'snap_ann_desktop_verified.png');

console.log('Taking tablet snapshot (768x650)...');
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${snapTablet}" --window-size=768,650 --hide-scrollbars "${previewHtmlPath}"`);

console.log('Taking desktop snapshot (1200x650)...');
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${snapDesktop}" --window-size=1200,650 --hide-scrollbars "${previewHtmlPath}"`);

console.log('Snapshots completed!');
