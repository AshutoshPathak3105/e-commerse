const { execSync } = require('child_process');
const fs = require('fs');

let html = fs.readFileSync('scratch/render_modal_test.html', 'utf8');
html = html.replace('</body>', `
<script>
window.addEventListener('load', () => {
  const btn = document.getElementById('ann-m-clear-time');
  const input = document.getElementById('ann-m-until');
  const parent = btn.parentElement;
  const res = {
    btn: {
      rect: btn.getBoundingClientRect(),
      style: window.getComputedStyle(btn).display,
      visibility: window.getComputedStyle(btn).visibility
    },
    input: {
      rect: input.getBoundingClientRect()
    },
    parent: {
      rect: parent.getBoundingClientRect(),
      scrollWidth: parent.scrollWidth,
      clientWidth: parent.clientWidth
    }
  };
  document.body.setAttribute('data-debug', JSON.stringify(res));
  console.log('DEBUG_INFO: ' + JSON.stringify(res));
});
</script>
</body>`);

fs.writeFileSync('scratch/render_modal_debug.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = require('path').resolve('scratch/render_modal_debug.html');
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,1200 --dump-dom "file:///${htmlPath.replace(/\\/g, '/')}"`;

try {
  const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10*1024*1024 });
  const m = output.match(/data-debug="([^"]+)"/);
  if (m) {
    console.log('DEBUG RESULT:', JSON.parse(m[1].replace(/&quot;/g, '"')));
  } else {
    console.log('No data-debug found');
  }
} catch(e) {
  console.error(e);
}
