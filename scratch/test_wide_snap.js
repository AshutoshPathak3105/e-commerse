const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/test_immediate_scroll.html').replace(/\\/g, '/');
const snap = path.resolve('scratch/snap_wide_test.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=600,2600 --screenshot="${snap}" "file:///${p}"`);
console.log('Saved snap wide test');
