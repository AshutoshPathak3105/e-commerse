const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const bridgeHtml = path.resolve(__dirname, 'admin_bridge.html');
const outPng = path.resolve(__dirname, 'promos_table_desktop.png');

const code = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
  localStorage.setItem('xmart_user', JSON.stringify({ name: 'Super Admin', role: 'admin', email: 'admin@xmart.com' }));
  localStorage.setItem('xmart_token', 'mock_token_admin');
  localStorage.setItem('xmart_admin_active', '1');
  sessionStorage.setItem('xmart_admin_active', '1');
  localStorage.setItem('xmart_admin_active_tab', 'cms');
  window.location.href = 'http://localhost:8000/#admin-cms';
  setTimeout(() => {
    if (window._openAdminPanel) {
      window._openAdminPanel('cms');
    }
  }, 1000);
</script>
</body>
</html>`;

fs.writeFileSync(bridgeHtml, code, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=1600,1000 --virtual-time-budget=6000 --screenshot="${outPng}" "file://${bridgeHtml}"`;
try {
  execSync(cmd, { stdio: 'inherit', timeout: 20000 });
  console.log('Desktop screenshot generated:', fs.existsSync(outPng));
} catch(e) {
  console.error(e.message);
}
