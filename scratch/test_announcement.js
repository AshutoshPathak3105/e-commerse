const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

require(path.resolve(__dirname, 'render_from_real_script.js'));

const p = path.resolve('scratch/preview_from_script.html').replace(/\\/g, '/');

// Mobile capture (375x1000)
const snapMobile = path.resolve('scratch/snap_announcement_mobile.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=375,1000 --screenshot="${snapMobile}" "file:///${p}"`);

// Desktop capture (1280x1000)
const snapDesktop = path.resolve('scratch/snap_announcement_desktop.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=1280,1000 --screenshot="${snapDesktop}" "file:///${p}"`);

execSync(`python -c "
from PIL import Image
im_m = Image.open('scratch/snap_announcement_mobile.png')
# Crop announcement card on mobile
crop_m = im_m.crop((0, 200, im_m.width, 700))
crop_m.save('scratch/crop_announcement_mobile.png')

im_d = Image.open('scratch/snap_announcement_desktop.png')
# Crop announcement card on desktop
crop_d = im_d.crop((0, 150, im_d.width, 600))
crop_d.save('scratch/crop_announcement_desktop.png')

print('Announcement screenshots cropped successfully!')
"`);

console.log('Done!');
