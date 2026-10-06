const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'mobile_admin_cms_rendered.png');
const outPngScrolled = path.resolve(__dirname, 'mobile_admin_cms_scrolled.png');

// Helper HTML to initialize localStorage and jump to #admin-cms
const bridgeHtml = path.resolve(__dirname, 'bridge.html');
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

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --virtual-time-budget=6000 --screenshot="${outPng}" "file://${bridgeHtml}"`;
console.log('Running test screenshot for admin CMS mobile view...');
try {
  execSync(cmd, { stdio: 'inherit', timeout: 15000 });
  console.log('Mobile screenshot generated:', fs.existsSync(outPng));
} catch(e) {
  console.error(e.message);
}
