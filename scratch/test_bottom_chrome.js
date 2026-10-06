const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'admin_bridge_bottom_rendered.png');
const tmpProfile = path.resolve(__dirname, 'chrome_tmp_profile_3');

// Scroll down after load
const launcherHtml = path.resolve(__dirname, 'launch_bottom_test.html');
fs.writeFileSync(launcherHtml, `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0;">
  <iframe id="f" src="http://localhost:8000/admin_test_bridge.html" style="width:100vw; height:100vh; border:none;"></iframe>
  <script>
    const f = document.getElementById('f');
    setTimeout(() => {
      try {
        const w = f.contentWindow;
        w.scrollTo({ top: 1200, behavior: 'instant' });
      } catch(e) {}
    }, 6000);
  </script>
</body>
</html>
`, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --user-data-dir="${tmpProfile}" --window-size=1600,1400 --virtual-time-budget=10000 --screenshot="${outPng}" "http://localhost:8000/admin_test_bridge.html"`;
console.log('Capturing admin dashboard full page...');
try {
  // Let's take a full page screenshot or large height
  const fullPageCmd = `"${chromePath}" --headless=new --disable-gpu --user-data-dir="${tmpProfile}" --window-size=1600,2400 --virtual-time-budget=10000 --screenshot="${outPng}" "http://localhost:8000/admin_test_bridge.html"`;
  execSync(fullPageCmd, { stdio: 'inherit', timeout: 30000 });
  const stats = fs.statSync(outPng);
  console.log('Full page screenshot success! File size:', stats.size, 'bytes');
} catch (e) {
  console.error('Error running Chrome:', e.message);
}
