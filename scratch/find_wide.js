const fs = require('fs');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/render_modal_test.html', 'utf8');
html = html.replace('</body>', `
<script>
window.addEventListener('load', () => {
  const wide = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > 380) {
      wide.push({ tag: el.tagName, id: el.id, class: el.className, w: Math.round(r.width), r: Math.round(r.right) });
    }
  });
  document.body.setAttribute('data-wide', JSON.stringify(wide));
});
</script>
</body>`);
fs.writeFileSync('scratch/render_modal_debug.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = require('path').resolve('scratch/render_modal_debug.html');
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,1200 --dump-dom "file:///${htmlPath.replace(/\\/g, '/')}"`;

try {
  const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10*1024*1024 });
  const m = output.match(/data-wide="([^"]+)"/);
  if (m) {
    console.log('WIDE ELEMENTS:', JSON.parse(m[1].replace(/&quot;/g, '"')));
  }
} catch(e) {
  console.error(e);
}
