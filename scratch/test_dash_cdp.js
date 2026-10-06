const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'admin_dashboard_rendered.png');
const launcherHtml = path.resolve(__dirname, 'launch_dash_test.html');
const tmpProfile = path.resolve(__dirname, 'chrome_tmp_profile');

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
          w.localStorage.setItem('xmart_admin_active_tab', 'dashboard');
          w.localStorage.setItem('xmart_user', JSON.stringify({ name: 'Super Admin', role: 'admin', email: 'admin@xmart.com' }));
          w.localStorage.setItem('xmart_token', 'admin_jwt_mock');
          if (w._openAdminPanel) {
            w._openAdminPanel('dashboard');
          } else if (w.openAdminPanel) {
            w.openAdminPanel('dashboard');
          }
          setTimeout(() => {
            if (w._switchAdminTab) {
              w._switchAdminTab('dashboard');
            }
          }, 800);
        } catch(e) {
          console.error(e);
        }
      }, 1200);
    };
  </script>
</body>
</html>
`;

fs.writeFileSync(launcherHtml, htmlContent, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --disable-web-security --user-data-dir="${tmpProfile}" --window-size=1600,1200 --virtual-time-budget=9000 --screenshot="${outPng}" "file://${launcherHtml}"`;
console.log('Capturing admin dashboard screenshot with Headless Chrome...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 25000 });
  console.log('Screenshot success:', fs.existsSync(outPng));
} catch (e) {
  console.error('Error running Chrome:', e.message);
}
