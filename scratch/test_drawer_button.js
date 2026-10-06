const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_drawer.html');
const outPng = path.resolve(__dirname, 'drawer_button_verified.png');

const css = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${css}
  </style>
</head>
<body style="background:#f1f5f9; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div id="admin-panel-overlay" style="display:block !important; position:relative !important; opacity:1 !important; visibility:visible !important;">
    <div id="ap-tab-body">
      <div class="ap-crm-drawer" style="max-width: 480px; background: #ffffff; padding: 24px; border-radius: 12px; border:1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h3 style="margin-top:0; font-size:16px; color:#0f172a;">Customer Dispute Resolution</h3>
        <div style="margin-bottom:12px;">
          <textarea placeholder="Write official reply..." style="width:100%; height:70px; padding:8px; border-radius:6px; border:1px solid #cbd5e1; box-sizing:border-box;"></textarea>
        </div>
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;">
          <button class="ap-btn primary" id="ap-drawer-send-reply-btn" style="font-size:12px;font-weight:800;padding:8px 16px;background:#ff9400 !important;color:#000000 !important;border:1px solid #e08300 !important;border-radius:6px;cursor:pointer;box-shadow:0 1px 3px rgba(255,148,0,0.35);">
            Send Response &amp; Update Case
          </button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');

const cmd = `"${chromePath}" --headless --disable-gpu --screenshot="${outPng}" --window-size=800,400 "${htmlPath}"`;
execSync(cmd, { stdio: 'inherit' });
console.log('Screenshot saved to:', outPng);
