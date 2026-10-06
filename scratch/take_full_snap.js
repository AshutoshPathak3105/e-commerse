const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/test_scroll_fix2.html').replace(/\\/g, '/');
const snap = path.resolve('scratch/snap_scroll_fix_full.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,2600 --screenshot="${snap}" "file:///${p}"`);
console.log('Saved snap');
