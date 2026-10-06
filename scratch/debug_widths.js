const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const html = fs.readFileSync(path.resolve(__dirname, 'test_support_header.html'), 'utf8');

const testScript = html.replace('</body>', `
<script>
window.addEventListener('load', () => {
  const outer = document.querySelector('.ap-support-table-outer');
  const bodyWrap = document.querySelector('.ap-support-body-scroll');
  const table = document.querySelector('#ap-support-table');
  console.log('OUTER client/scroll:', outer.clientWidth, outer.scrollWidth);
  console.log('BODY WRAP client/scroll:', bodyWrap.clientWidth, bodyWrap.scrollWidth);
  console.log('TABLE client/scroll:', table.clientWidth, table.scrollWidth);
});
</script>
</body>`);

fs.writeFileSync(path.resolve(__dirname, 'test_support_debug.html'), testScript, 'utf8');
const p = path.resolve(__dirname, 'test_support_debug.html').replace(/\\/g, '/');
const res = execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1200,700 --run-all-compositor-stages-before-draw "file:///${p}"`, { encoding: 'utf8' });
console.log('RESULT:', res);
