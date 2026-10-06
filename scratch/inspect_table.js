const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const bridgeHtml = path.resolve(__dirname, 'inspect_bridge.html');
const outPng = path.resolve(__dirname, 'inspect_table.png');

const html = `<!DOCTYPE html>
<html><body>
<script>
  localStorage.setItem("xmart_user", JSON.stringify({ name: "Super Admin", role: "admin", email: "admin@xmart.com" }));
  localStorage.setItem("xmart_token", "mock_token_admin");
  localStorage.setItem("xmart_admin_active", "1");
  sessionStorage.setItem("xmart_admin_active", "1");
  localStorage.setItem("xmart_admin_active_tab", "cms");
  window.location.href = "http://localhost:8000/#admin-cms";
</script>
</body></html>`;

fs.writeFileSync(bridgeHtml, html, 'utf8');

try {
  execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1600,1200 --virtual-time-budget=6000 --screenshot="${outPng}" "file://${bridgeHtml}"`, { stdio: 'inherit', timeout: 20000 });
  console.log("Screenshot generated:", fs.existsSync(outPng));
} catch(e) {
  console.error("Error:", e.message);
}
