const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'cms_live_desktop.png');
const outPngFull = path.resolve(__dirname, 'cms_live_full.png');

const bridgeHtml = path.resolve(__dirname, 'bridge_live.html');
const code = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0;">
<iframe id="f" src="http://localhost:8000" style="width:100vw; height:100vh; border:none;"></iframe>
<script>
  const f = document.getElementById('f');
  f.onload = () => {
    setTimeout(() => {
      try {
        f.contentWindow.localStorage.setItem('xmart_user', JSON.stringify({ name: 'Super Admin', role: 'admin', email: 'admin@xmart.com' }));
        f.contentWindow.localStorage.setItem('xmart_token', 'mock_token_admin');
        if (f.contentWindow._openAdminPanel) {
          f.contentWindow._openAdminPanel('cms');
        }
      } catch(e) {
        console.error(e);
      }
    }, 1200);
  };
</script>
</body>
</html>`;

fs.writeFileSync(bridgeHtml, code, 'utf8');

console.log('Capturing live CMS view desktop screenshot...');
try {
  execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1280,1000 --virtual-time-budget=6000 --screenshot="${outPng}" "file://${bridgeHtml}"`, { stdio: 'inherit' });
  console.log('cms_live_desktop.png exists:', fs.existsSync(outPng));
} catch(e) {
  console.error('Desktop error:', e.message);
}

console.log('Capturing live CMS view full screenshot...');
try {
  execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1280,2400 --virtual-time-budget=6000 --screenshot="${outPngFull}" "file://${bridgeHtml}"`, { stdio: 'inherit' });
  console.log('cms_live_full.png exists:', fs.existsSync(outPngFull));
} catch(e) {
  console.error('Full error:', e.message);
}
