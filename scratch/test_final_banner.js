const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/preview_from_script.html').replace(/\\/g, '/');
const out = path.resolve('scratch/final_banner_verify.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=600,2400 --screenshot="${out}" "file:///${p}"`);

execSync(`python -c "
from PIL import Image
im = Image.open('scratch/final_banner_verify.png')
# Crop around Active Featured Banners (approx y=1470 to 1720)
crop = im.crop((10, 1470, 590, 1720))
crop.save('scratch/final_banner_crop.png')
print('Cropped final banner')
"`);
console.log('Done!');
