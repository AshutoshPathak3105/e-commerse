const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.join(__dirname, 'preview_debug_375.html');

// Let's inspect which element has scrollWidth > 375
const inspectHtml = fs.readFileSync(htmlPath, 'utf8').replace('</body>', `
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const docWidth = document.documentElement.clientWidth;
    console.log('Doc clientWidth:', docWidth);
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.offsetWidth > docWidth) {
        console.log('OVERFLOW EL:', el.tagName, el.className, el.id, el.offsetWidth);
      }
    }
  });
</script>
</body>
`);

fs.writeFileSync(path.join(__dirname, 'test_eval.html'), inspectHtml);
const output = execSync(`"${chromePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --virtual-time-budget=2000 --window-size=375,800 --dump-dom "${path.join(__dirname, 'test_eval.html')}"`).toString();
console.log('Done dump dom, length:', output.length);
