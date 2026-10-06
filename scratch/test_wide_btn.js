const fs = require('fs');

let dump = fs.readFileSync('scratch/dump_wide_debug.html', 'utf8');

// Let's add button coordinates to test_wide_debug.html and run
let html = fs.readFileSync('scratch/test_wide_debug.html', 'utf8');
html = html.replace('outerBounding: outer.getBoundingClientRect()', `outerBounding: outer.getBoundingClientRect(),
    buttons: Array.from(lastTd.querySelectorAll('button')).map(b => ({
      text: b.innerText,
      rect: b.getBoundingClientRect(),
      style: {
        display: window.getComputedStyle(b).display,
        marginRight: window.getComputedStyle(b).marginRight,
        padding: window.getComputedStyle(b).padding
      }
    }))`);
fs.writeFileSync('scratch/test_wide_btn.html', html, 'utf8');

const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/test_wide_btn.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_wide_btn.html`);
const d = fs.readFileSync('scratch/dump_wide_btn.html', 'utf8');
const m = d.match(/<div id="wide-res">([\s\S]*?)<\/div>/);
console.log('BTN METRICS:\n', m ? m[1] : 'not found');
