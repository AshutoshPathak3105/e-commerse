const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.join(__dirname, 'preview_debug_375.html');

const inspectHtml = fs.readFileSync(htmlPath, 'utf8').replace('</body>', `
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const docWidth = document.documentElement.clientWidth;
    const overflows = [];
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.offsetWidth > docWidth) {
        overflows.push(el.tagName + '.' + (el.className || '') + '#' + (el.id || '') + ' (' + el.offsetWidth + 'px)');
      }
    }
    const pre = document.createElement('pre');
    pre.id = 'debug-overflow-list';
    pre.textContent = overflows.join('\\n');
    document.body.appendChild(pre);
  });
</script>
</body>
`);

fs.writeFileSync(path.join(__dirname, 'test_eval.html'), inspectHtml);
const output = execSync(`"${chromePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --virtual-time-budget=2000 --window-size=375,800 --dump-dom "${path.join(__dirname, 'test_eval.html')}"`).toString();

const match = output.match(/<pre id="debug-overflow-list">([\s\S]*?)<\/pre>/);
if (match) {
  console.log('OVERFLOW ELEMENTS:');
  console.log(match[1]);
} else {
  console.log('No overflow list found in DOM');
}
