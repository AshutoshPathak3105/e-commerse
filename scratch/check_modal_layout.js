const fs = require('fs');
const html = fs.readFileSync('scratch/render_modal_test.html', 'utf8');

// Let's inject a script before </body> that prints info to console
const injectedHtml = html.replace('</body>', `
<script>
  window.addEventListener('load', () => {
    const card = document.getElementById('ap-promo-modal-card');
    const row = document.querySelector('.promo-bank-rule-item');
    const group = document.querySelector('.rule-type-toggle-group');
    const btns = Array.from(document.querySelectorAll('.rule-type-btn')).slice(0,3);
    const info = {
      windowWidth: window.innerWidth,
      cardWidth: card ? card.offsetWidth : null,
      rowWidth: row ? row.offsetWidth : null,
      groupWidth: group ? group.offsetWidth : null,
      btnWidths: btns.map(b => ({
        text: b.textContent,
        width: b.offsetWidth,
        flex: getComputedStyle(b).flex,
        display: getComputedStyle(b).display
      }))
    };
    document.title = 'INFO:' + JSON.stringify(info);
  });
</script>
</body>`);

fs.writeFileSync('scratch/render_modal_test.html', injectedHtml);

const { execSync } = require('child_process');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve('scratch/render_modal_test.html');
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --dump-dom "file:///${htmlPath.replace(/\\/g, '/')}"`;
const out = execSync(cmd).toString();
const match = out.match(/<title>INFO:(.*?)<\/title>/);
if (match) {
  console.log('LAYOUT INFO:', JSON.parse(match[1]));
} else {
  console.log('No title match found');
}
