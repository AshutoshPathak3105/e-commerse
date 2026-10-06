const fs = require('fs');
const { execSync } = require('child_process');

const script = `
window.addEventListener('DOMContentLoaded', () => {
  const b = document.getElementById('ap-cms-refresh-btn');
  const matched = [];
  for (const sheet of document.styleSheets) {
    try {
      const checkRules = (rules) => {
        for (const rule of rules) {
          if (rule.cssRules) checkRules(rule.cssRules);
          if (rule.selectorText) {
            try {
              if (b.matches(rule.selectorText)) {
                if (rule.style.backgroundColor || rule.style.background) {
                  matched.push({ selector: rule.selectorText, bg: rule.style.background || rule.style.backgroundColor });
                }
              }
            } catch(e) {}
          }
        }
      };
      checkRules(sheet.cssRules);
    } catch(e) {}
  }
  const pre = document.createElement('pre');
  pre.id = 'matched-output';
  pre.textContent = JSON.stringify(matched, null, 2);
  document.body.appendChild(pre);
});
`;

const htmlWithScript = fs.readFileSync('scratch/preview_cms_restored.html', 'utf8')
  .replace('</body>', `<script>${script}</script></body>`);

fs.writeFileSync('scratch/test_debug_btn.html', htmlWithScript);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = execSync(`"${chromePath}" --headless --dump-dom "scratch/test_debug_btn.html"`, { encoding: 'utf8' });
const match = out.match(/<pre id="matched-output">([\s\S]*?)<\/pre>/);
if (match) {
  console.log('Matched rules:', match[1]);
} else {
  console.log('Could not find output in DOM');
}
