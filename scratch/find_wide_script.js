const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const html = fs.readFileSync('scratch/measure_banner_modal.html', 'utf8');
const replacement = `
  const els = Array.from(d.querySelectorAll('*'));
  const wide = els.map(el => ({
    tag: el.tagName,
    cls: el.className,
    id: el.id,
    w: Math.round(el.getBoundingClientRect().width),
    sw: el.scrollWidth,
    style: el.getAttribute('style') || ''
  })).filter(x => x.w > 300);
  debugDiv.innerHTML = '<pre>' + JSON.stringify(wide, null, 2) + '</pre>';
  document.body.appendChild(debugDiv);
`;

const updatedHtml = html.replace('document.body.appendChild(debugDiv);', replacement);
fs.writeFileSync('scratch/find_wide.html', updatedHtml);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'find_wide.png');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=375,667 --screenshot="${outPng}" "file://${path.resolve(__dirname, 'find_wide.html')}"`);
console.log('Done');
