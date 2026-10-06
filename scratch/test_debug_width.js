const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

// Match the entire CMS view header + announcement card
const cmsViewMatch = script.match(/<div class="ap-view-inner ap-cms-view">[\s\S]*?<!-- Global Announcement Ticker Manager -->[\s\S]*?<\/table>\s*<\/div>\s*<\/div>/);

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
  <title>Width Debug</title>
  <link rel="stylesheet" href="../styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; max-width: 100%; overflow-x: hidden; font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; }
    #admin-panel-overlay.active { display: block !important; position: static !important; background: transparent !important; opacity: 1 !important; visibility: visible !important; width: 100% !important; max-width: 100% !important; overflow-x: hidden !important; }
    .ap-cms-view { width: 100% !important; max-width: 100% !important; display: block !important; padding: 12px !important; box-sizing: border-box !important; }
    #ap-announcements-section { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
    #ap-announcements-section .ap-table-wrap {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      display: block !important;
    }

    /* Desktop View */
    @media (min-width: 1025px) {
      #ap-announcements-section .ap-card-header h3 {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 10px !important;
        width: auto !important;
      }
      #admin-panel-overlay #ap-announcements-section #ap-ann-count-badge,
      #ap-announcements-section #ap-ann-count-badge,
      .ap-ann-count-badge-tag {
        margin-left: 0 !important;
        position: static !important;
        display: inline-flex !important;
        align-self: center !important;
      }
    }

    /* Mobile & Tablet View */
    @media (max-width: 1024px) {
      /* 1. Announcement Bar Card */
      #ap-announcements-section .ap-card-header {
        position: relative !important;
      }
      #admin-panel-overlay #ap-announcements-section #ap-ann-count-badge,
      #ap-announcements-section #ap-ann-count-badge,
      .ap-ann-count-badge-tag {
        position: absolute !important;
        top: 14px !important;
        right: 16px !important;
        margin: 0 !important;
        font-size: 10px !important;
        padding: 2.5px 7.5px !important;
        z-index: 5 !important;
        max-width: fit-content !important;
        white-space: nowrap !important;
      }
      #ap-announcements-section .ap-card-header h3 {
        padding-right: 125px !important;
        display: block !important;
        width: 100% !important;
      }
      #ap-announcements-section .ap-card-header p {
        padding-right: 0 !important;
        width: 100% !important;
        margin-top: 6px !important;
      }

      /* 2. CMS & Storefront Control View Header */
      .ap-view-header {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 12px !important;
      }
      .ap-view-title-group {
        position: relative !important;
        width: 100% !important;
      }
      .ap-view-title {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100% !important;
        font-size: 16px !important;
      }
      .ap-view-title .ap-super-badge {
        margin-left: auto !important;
        flex-shrink: 0 !important;
        font-size: 9.5px !important;
        padding: 2px 7px !important;
      }

      /* Pills wrap cleanly on small screen */
      .ap-cms-toolbar {
        gap: 10px !important;
      }
      .ap-cms-pills {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
      }
      .ap-cms-pill {
        white-space: nowrap !important;
        font-size: 11px !important;
        padding: 5px 10px !important;
      }
    }
  </style>
</head>
<body>
  <div id="admin-panel-overlay" class="active">
    ${cmsHtml}
  </div>
</body>
</html>`;

const previewHtmlPath = path.join(__dirname, 'preview_debug_375.html');
fs.writeFileSync(previewHtmlPath, htmlContent, 'utf8');

execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${path.join(__dirname, 'snap_debug_desktop_1200.png')}" --window-size=1200,800 --hide-scrollbars "${previewHtmlPath}"`);
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${path.join(__dirname, 'snap_debug_tablet_768.png')}" --window-size=768,800 --hide-scrollbars "${previewHtmlPath}"`);
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${path.join(__dirname, 'snap_debug_mobile_375.png')}" --window-size=375,800 --hide-scrollbars "${previewHtmlPath}"`);

console.log('Generated debug snapshots successfully!');
