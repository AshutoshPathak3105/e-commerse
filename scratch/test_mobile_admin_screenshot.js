const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'mobile_admin_dashboard.png');

// HTML that will load the app and trigger open admin
const launcherHtml = path.resolve(__dirname, 'launch_admin_test.html');
const code = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0;">
  <iframe id="app-frame" src="http://localhost:8000" style="width:100vw; height:100vh; border:none;"></iframe>
  <script>
    const iframe = document.getElementById('app-frame');
    iframe.onload = () => {
      setTimeout(() => {
        try {
          const w = iframe.contentWindow;
          if (w.openAdminPanel) {
            w.openAdminPanel();
          } else if (w._openAdminPanelModal) {
            w._openAdminPanelModal();
          }
        } catch(e) {
          console.error(e);
        }
      }, 1500);
    };
  </script>
</body>
</html>
`;

fs.writeFileSync(launcherHtml, code, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --virtual-time-budget=6000 --screenshot="${outPng}" "file://${launcherHtml}"`;
console.log('Running Chrome screenshot for mobile admin view...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 15000 });
  console.log('Admin mobile screenshot captured:', fs.existsSync(outPng));
} catch (e) {
  console.error('Error running Chrome:', e.message);
}
