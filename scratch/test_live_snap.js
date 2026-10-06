const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'admin_panel_mobile_snap.png').replace(/\\/g, '/');

const testHtml = path.resolve(__dirname, 'test_live_snap.html');
const code = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<iframe id="app-frame" src="http://localhost:8000" style="width:390px; height:844px; border:none;"></iframe>
<script>
  const iframe = document.getElementById('app-frame');
  iframe.onload = () => {
    const win = iframe.contentWindow;
    win.localStorage.setItem('xmart_user', JSON.stringify({ name: 'Super Admin', role: 'admin', email: 'admin@xmart.com' }));
    win.localStorage.setItem('xmart_token', 'mock_token_admin');
    
    // Call openAdminPanel and switchTab('cms')
    setTimeout(() => {
      if (typeof win.openAdminPanel === 'function') {
        win.openAdminPanel();
        setTimeout(() => {
          if (typeof win.switchAdminTab === 'function') {
            win.switchAdminTab('cms');
          }
          setTimeout(() => {
            const doc = win.document;
            const heroCard = doc.querySelector('.ap-table-card:has(#ap-hero-promo-table-body)') || 
                             doc.querySelector('#ap-hero-promo-table-body')?.closest('.ap-table-card');
            if (heroCard) {
              heroCard.scrollIntoView();
              const outer = heroCard.querySelector('.ap-cms-table-outer');
              if (outer) outer.scrollLeft = 9999;
            }
            const flag = doc.createElement('div');
            flag.id = 'render-ready';
            doc.body.appendChild(flag);
          }, 800);
        }, 500);
      }
    }, 500);
  };
</script>
</body>
</html>`;

fs.writeFileSync(testHtml, code, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=420,900 --virtual-time-budget=6000 --screenshot="${outPng}" "file://${testHtml.replace(/\\/g, '/')}"`;
try {
  execSync(cmd, { stdio: 'inherit', timeout: 20000 });
  console.log('Generated:', fs.existsSync(outPng));
} catch(e) {
  console.error(e.message);
}
