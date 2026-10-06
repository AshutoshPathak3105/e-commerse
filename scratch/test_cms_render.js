const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'mobile_admin_cms.png');
const launcherHtml = path.resolve(__dirname, 'launch_cms_test.html');

const htmlContent = `
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
          w.localStorage.setItem('xmart_admin_active', '1');
          w.sessionStorage.setItem('xmart_admin_active', '1');
          if (w._openAdminPanel) {
            w._openAdminPanel('cms');
          } else if (w.openAdminPanel) {
            w.openAdminPanel('cms');
          }
          setTimeout(() => {
            if (w._switchAdminTab) {
              w._switchAdminTab('cms');
            }
          }, 1000);
        } catch(e) {
          console.error(e);
        }
      }, 1500);
    };
  </script>
</body>
</html>
`;

fs.writeFileSync(launcherHtml, htmlContent, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --virtual-time-budget=6000 --screenshot="${outPng}" "file://${launcherHtml}"`;
console.log('Capturing mobile CMS screenshot...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 20000 });
  console.log('Screenshot success:', fs.existsSync(outPng));
} catch (e) {
  console.error('Error running Chrome:', e.message);
}
