const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Add inline script to scroll the promo outer container all the way to the right
const scrollScript = `
<script>
window.addEventListener('DOMContentLoaded', () => {
  const card = document.querySelector('.ap-promos-card') || document.querySelector('.ap-table-card:has(#ap-promos-table)');
  if (card) {
    const outer = card.querySelector('.ap-cms-table-outer');
    if (outer) {
      outer.scrollLeft = 999999;
    }
  }
});
</script>
`;

html = html.replace('</body>', scrollScript + '</body>');
fs.writeFileSync('scratch/final_preview.html', html, 'utf8');

const p = path.resolve('scratch/final_preview.html').replace(/\\/g, '/');

// Capture at 768px (Tablet)
const snapTablet = path.resolve('scratch/final_snap_tablet.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=768,2600 --screenshot="${snapTablet}" "file:///${p}"`);

// Crop the promo table section on tablet
execSync(`python -c "from PIL import Image; im = Image.open('scratch/final_snap_tablet.png'); crop = im.crop((0, 1900, im.width, 2400)); crop.save('scratch/final_crop_promo_tablet.png'); print('Cropped tablet!')"`);

// Capture at 1280px (Desktop)
const snapDesktop = path.resolve('scratch/final_snap_desktop.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=1280,2600 --screenshot="${snapDesktop}" "file:///${p}"`);

// Crop the promo table section on desktop
execSync(`python -c "from PIL import Image; im = Image.open('scratch/final_snap_desktop.png'); crop = im.crop((0, 1900, im.width, 2400)); crop.save('scratch/final_crop_promo_desktop.png'); print('Cropped desktop!')"`);

console.log('All final captures done!');
