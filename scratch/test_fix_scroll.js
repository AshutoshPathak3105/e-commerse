const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/test_mobile_scroll.html', 'utf8');

// Replace innerDiv style from min-width:480px to min-width:580px; width:100%;
html = html.replace('min-width:480px; width:100%;', 'min-width:580px; width:100%;');
fs.writeFileSync('scratch/test_fix_scroll.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_fix_scroll.html').replace(/\\/g, '/');
const outPng = path.resolve('scratch/mobile_scrolled_right.png').replace(/\\/g, '/');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,1600 --screenshot="${outPng}" --dump-dom "file:///${p}" > scratch/dump_fix.html`, { shell: 'cmd.exe' });

const dump = fs.readFileSync('scratch/dump_fix.html', 'utf8');
const match = dump.match(/<div id="debug-scroll-result">([\s\S]*?)<\/div>/);
console.log(match ? match[1] : 'not found');
