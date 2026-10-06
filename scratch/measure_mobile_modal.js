const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = path.resolve(__dirname, 'test_modal_mobile_viewport.html').replace(/\\/g, '/');
const targetUrl = `file:///${htmlFile}`;

// Add a script in the HTML to output dimensions to console or a div
const debugScript = `
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const dialog = document.querySelector('.ap-modal-dialog');
    const backdrop = document.querySelector('.ap-modal-backdrop');
    const header = document.querySelector('.ap-modal-header');
    const content = document.querySelector('.ap-modal-content');
    const saveBtn = document.querySelector('#ap-ann-m-save');
    const cancelBtn = document.querySelector('#ap-ann-m-cancel');
    
    const info = {
      windowH: window.innerHeight,
      backdropH: backdrop?.offsetHeight,
      dialogRect: dialog?.getBoundingClientRect(),
      headerH: header?.offsetHeight,
      contentRect: content?.getBoundingClientRect(),
      contentScrollH: content?.scrollHeight,
      contentClientH: content?.clientHeight,
      saveRect: saveBtn?.getBoundingClientRect(),
      cancelRect: cancelBtn?.getBoundingClientRect(),
    };
    console.log('MEASUREMENTS:', JSON.stringify(info, null, 2));
    const pre = document.createElement('pre');
    pre.id = 'measure-output';
    pre.textContent = JSON.stringify(info, null, 2);
    pre.style.position = 'fixed';
    pre.style.top = '0';
    pre.style.left = '0';
    pre.style.background = 'rgba(0,0,0,0.8)';
    pre.style.color = '#00ff00';
    pre.style.zIndex = '999999';
    pre.style.fontSize = '11px';
    pre.style.pointerEvents = 'none';
    document.body.appendChild(pre);
  });
</script>
`;

let html = fs.readFileSync(path.resolve(__dirname, 'test_modal_mobile_viewport.html'), 'utf8');
if (!html.includes('measure-output')) {
  html = html.replace('</body>', debugScript + '</body>');
  fs.writeFileSync(path.resolve(__dirname, 'test_modal_mobile_viewport.html'), html, 'utf8');
}

const outPng = path.resolve(__dirname, 'measured_modal.png');
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outPng}" "${targetUrl}"`;
const res = execSync(cmd, { encoding: 'utf8' });
console.log(res);
