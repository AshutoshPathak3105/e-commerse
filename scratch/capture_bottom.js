const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_crm_drawer.html');
const outPng = path.resolve(__dirname, 'crm_drawer_bottom.png');

let content = fs.readFileSync(htmlPath, 'utf8');
content = content.replace('</body>', `<script>
window.addEventListener('load', () => {
  const b = document.querySelector('.ap-crm-drawer-body');
  if (b) {
    b.scrollTop = 9999;
  }
});
</script></body>`);

const scrollHtml = path.resolve(__dirname, 'test_crm_drawer_scroll.html');
fs.writeFileSync(scrollHtml, content, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=500,850 --screenshot="${outPng}" "file://${scrollHtml}"`;
execSync(cmd);
console.log('Saved to', outPng);
