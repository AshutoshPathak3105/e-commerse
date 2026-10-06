const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/test_wide_btn.html').replace(/\\/g, '/');
const snap = path.resolve('scratch/snap_verified_visual.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=390,2600 --screenshot="${snap}" "file:///${p}"`);
console.log('Saved visual snap');
