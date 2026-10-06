const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Inject rule
html = html.replace('</head>', `
<style>
@media (max-width: 900px) {
  #admin-panel-overlay .ap-cms-view .ap-table-card .ap-card-header,
  .ap-table-card .ap-card-header {
    position: relative !important;
  }

  #admin-panel-overlay .ap-cms-view #ap-banner-count-badge,
  #admin-panel-overlay .ap-cms-view #ap-promo-count-badge,
  #ap-banner-count-badge,
  #ap-promo-count-badge {
    position: absolute !important;
    top: 14px !important;
    right: 14px !important;
    margin: 0 !important;
    z-index: 5 !important;
  }

  #admin-panel-overlay .ap-cms-view .ap-table-card:has(#ap-banner-count-badge) .ap-card-header > div:first-child,
  #admin-panel-overlay .ap-cms-view .ap-table-card:has(#ap-promo-count-badge) .ap-card-header > div:first-child,
  .ap-table-card:has(#ap-banner-count-badge) .ap-card-header > div:first-child,
  .ap-table-card:has(#ap-promo-count-badge) .ap-card-header > div:first-child {
    padding-right: 90px !important;
    box-sizing: border-box !important;
  }
}
</style>
</head>`);

fs.writeFileSync('scratch/test_badge_preview.html', html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const p = path.resolve('scratch/test_badge_preview.html').replace(/\\/g, '/');
const snapPng = path.resolve('scratch/badge_mobile_preview.png').replace(/\\/g, '/');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,1400 --screenshot="${snapPng}" "file:///${p}"`);

// Crop Active Featured Banners header
execSync(`python -c "
from PIL import Image
im = Image.open('scratch/badge_mobile_preview.png')
# Find the banner card header
for y in range(200, im.height - 150, 10):
    for x in range(20, 80, 10):
        r, g, b = im.getpixel((x, y))[:3]
        if r == 2 and g == 47 and b == 67: # #022f43
            if y > 400: # Below announcement bar
                print('Found banner header at y:', y)
                crop = im.crop((0, max(0, y - 5), im.width, min(im.height, y + 175)))
                crop.save('scratch/crop_badge_verified.png')
                exit(0)
"`);
console.log('Badge crop saved!');
