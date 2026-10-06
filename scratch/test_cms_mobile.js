const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'mobile_admin_cms.png');
const indexHtml = path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

const testHtml = path.resolve(__dirname, 'test_runner.html');
const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0;">
<iframe id="f" src="file:///${indexHtml}" style="width:100vw; height:100vh; border:none;"></iframe>
<script>
  const f = document.getElementById('f');
  f.onload = () => {
    setTimeout(() => {
      try {
        const w = f.contentWindow;
        w.localStorage.setItem('xmart_user', JSON.stringify({ name: 'Admin', role: 'admin', email: 'admin@xmart.com' }));
        w.localStorage.setItem('xmart_token', 'mock_admin_token_123');
        w.localStorage.setItem('xmart_admin_active', '1');
        w.sessionStorage.setItem('xmart_admin_active', '1');
        if (w._openAdminPanel) {
          w._openAdminPanel('cms');
        }
      } catch(e) { console.error(e); }
    }, 1200);
  };
</script>
</body>
</html>`;

fs.writeFileSync(testHtml, html, 'utf8');
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --virtual-time-budget=6000 --screenshot="${outPng}" "file:///${testHtml.replace(/\\/g, '/')}"`;
try {
  execSync(cmd, { stdio: 'inherit', timeout: 15000 });
  console.log('Mobile screenshot generated successfully:', fs.existsSync(outPng));
} catch(e) {
  console.error('Chrome execution error:', e.message);
}
