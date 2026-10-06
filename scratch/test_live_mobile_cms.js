const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'live_mobile_cms_scrolled.png').replace(/\\/g, '/');

const bridgeHtml = path.resolve(__dirname, 'bridge_test.html');
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
</script>
</body>
</html>`;

fs.writeFileSync(bridgeHtml, code, 'utf8');

// Also create a puppeteer / chrome script or user-script that scrolls into view
// We can use headless Chrome with virtual-time-budget
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,1600 --virtual-time-budget=6000 --screenshot="${outPng}" "http://localhost:8000/#admin-cms"`;
console.log('Running test screenshot for admin CMS mobile view...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 20000 });
  console.log('Mobile screenshot generated:', fs.existsSync(outPng));
} catch(e) {
  console.error(e.message);
}
