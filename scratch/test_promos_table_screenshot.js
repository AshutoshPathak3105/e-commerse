const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const testHtml = path.resolve(__dirname, 'test_promos_runner.html');
const outPng = path.resolve(__dirname, 'promos_table_actual.png');

const indexHtml = path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0;">
<iframe id="f" src="file:///${indexHtml}" style="width:1600px; height:1200px; border:none;"></iframe>
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
          setTimeout(() => {
            const doc = w.document;
            const card = doc.querySelector('.ap-promos-card') || doc.querySelector('#ap-promos-table');
            if (card) {
              card.scrollIntoView();
            }
          }, 1000);
        }
      } catch(e) { console.error(e); }
    }, 1500);
  };
</script>
</body>
</html>`;

fs.writeFileSync(testHtml, html, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=1600,1200 --virtual-time-budget=8000 --screenshot="${outPng}" "file:///${testHtml.replace(/\\/g, '/')}"`;
try {
  execSync(cmd, { stdio: 'inherit', timeout: 20000 });
  console.log('Promos table screenshot generated:', fs.existsSync(outPng));
} catch(e) {
  console.error('Chrome execution error:', e.message);
}
