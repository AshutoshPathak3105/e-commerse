const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Synchronously scroll outer to right
const scrollScript = `
<script>
document.querySelectorAll('.ap-cms-table-outer').forEach(el => {
  el.scrollLeft = el.scrollWidth + 10000;
});
</script>
`;

html = html.replace('</body>', scrollScript + '</body>');
fs.writeFileSync('scratch/sync_desktop_scroll.html', html, 'utf8');

const p = path.resolve('scratch/sync_desktop_scroll.html').replace(/\\/g, '/');
const snapDesktop = path.resolve('scratch/sync_snap_desktop.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=1280,2600 --screenshot="${snapDesktop}" "file:///${p}"`);

execSync(`python -c "
from PIL import Image
im = Image.open('scratch/sync_snap_desktop.png')
crop = im.crop((im.width - 550, 1400, im.width, 1900))
crop.save('scratch/sync_crop_desktop_actions.png')
print('Desktop actions scrolled!')
"`);
