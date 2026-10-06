const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

require(path.resolve(__dirname, 'render_from_real_script.js'));

const p = path.resolve('scratch/preview_from_script.html').replace(/\\/g, '/');

// Desktop capture
const snapDesktop = path.resolve('scratch/snap_buttons_desktop.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=1280,600 --screenshot="${snapDesktop}" "file:///${p}"`);

// Mobile capture
const snapMobile = path.resolve('scratch/snap_buttons_mobile.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=375,600 --screenshot="${snapMobile}" "file:///${p}"`);

execSync(`python -c "
from PIL import Image
im_d = Image.open('scratch/snap_buttons_desktop.png')
# Crop top bar where actions are
crop_d = im_d.crop((0, 0, im_d.width, 160))
crop_d.save('scratch/crop_buttons_desktop.png')

im_m = Image.open('scratch/snap_buttons_mobile.png')
crop_m = im_m.crop((0, 0, im_m.width, 220))
crop_m.save('scratch/crop_buttons_mobile.png')

print('Cropped top buttons successfully!')
"`);

console.log('Done!');
