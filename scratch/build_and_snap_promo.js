const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const script = fs.readFileSync('script.js', 'utf8');

const startFunc = script.indexOf('function showPromoModal');
const backdropMatch = script.indexOf('backdrop.innerHTML = `', startFunc);
const endMatch = script.indexOf('`;', backdropMatch);

let modalHtml = script.slice(backdropMatch + 'backdrop.innerHTML = `'.length, endMatch);
modalHtml = modalHtml.replace(/\$\{isEdit \? '[^']*' : '([^']*)'\}/g, '$1');
modalHtml = modalHtml.replace(/\$\{existingPromo\?[^}]*\}/g, '');
modalHtml = modalHtml.replace(/\$\{esc\([^)]*\)\}/g, '');
modalHtml = modalHtml.replace(/\$\{currentType === 'bank' \? 'block' : 'none'\}/g, 'none');
modalHtml = modalHtml.replace(/\$\{currentType === 'upi' \? 'block' : 'none'\}/g, 'none');
modalHtml = modalHtml.replace(/\$\{!isEdit \? `[\s\S]*?` : ''\}/g, '');

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Promo Modal Test</title>
  <link rel="stylesheet" href="../styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #0b1329;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="admin-panel-overlay" class="ap-open" style="display:flex !important; opacity:1 !important; visibility:visible !important; position:fixed; inset:0; z-index:99999;">
    <div class="ap-modal-backdrop" style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:100050; padding:12px; box-sizing:border-box;">
      ${modalHtml}
    </div>
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const content = document.querySelector('.ap-modal-content');
        if (content) {
          content.scrollTop = content.scrollHeight;
        }
      }, 100);
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('scratch/promo_modal_test.html', fullHtml, 'utf8');

const testHtmlPath = path.resolve('scratch/promo_modal_test.html').replace(/\\/g, '/');

// Capture mobile 375x667
const snapMobile = path.resolve('scratch/promo_modal_mobile.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=375,667 --screenshot="${snapMobile}" "file:///${testHtmlPath}"`);

// Capture tablet 768x900
const snapTablet = path.resolve('scratch/promo_modal_tablet.png').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=768,900 --screenshot="${snapTablet}" "file:///${testHtmlPath}"`);

execSync(`python -c "
from PIL import Image
im_m = Image.open('scratch/promo_modal_mobile.png')
crop_m = im_m.crop((0, im_m.height - 180, im_m.width, im_m.height))
crop_m.save('scratch/crop_promo_mobile_bottom.png')

im_t = Image.open('scratch/promo_modal_tablet.png')
crop_t = im_t.crop((0, im_t.height - 180, im_t.width, im_t.height))
crop_t.save('scratch/crop_promo_tablet_bottom.png')
print('Cropped successfully!')
"`);

console.log('Screenshots captured successfully!');
