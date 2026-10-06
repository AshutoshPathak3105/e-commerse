const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPngDesktop = path.resolve('scratch/cms_announcements_desktop.png');

const testHtml = path.resolve('scratch/test_admin_runner.html');
const code = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<iframe id="appFrame" src="http://localhost:8000" style="width:1280px; height:950px; border:none;"></iframe>
<script>
  localStorage.setItem('xmart_user', JSON.stringify({ name: 'Super Admin', role: 'admin', email: 'admin@xmart.com' }));
  localStorage.setItem('xmart_token', 'mock_token_admin');
  localStorage.setItem('xmart_admin_active', '1');
  localStorage.setItem('xmart_admin_active_tab', 'cms');

  const f = document.getElementById('appFrame');
  f.onload = () => {
    setTimeout(() => {
      try {
        f.contentWindow.localStorage.setItem('xmart_user', JSON.stringify({ name: 'Super Admin', role: 'admin', email: 'admin@xmart.com' }));
        f.contentWindow.localStorage.setItem('xmart_token', 'mock_token_admin');
        f.contentWindow._openAdminPanel('cms');
      } catch(e) {}
    }, 1200);
  };
</script>
</body>
</html>`;

fs.writeFileSync(testHtml, code, 'utf8');

console.log('Generating Desktop screenshot with openAdminPanel...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1280,950 --virtual-time-budget=6000 --screenshot="${outPngDesktop}" "file://${testHtml}"`);
console.log('Desktop snapshot finished!');
