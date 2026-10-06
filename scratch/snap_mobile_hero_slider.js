const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Modify style to realistic mobile padding
html = html.replace('padding: 24px;', 'padding: 8px;');

const scrollScript = `
<script>
window.addEventListener('load', () => {
  // Find Top Hero Promo Cards
  const heroCard = document.querySelector('.ap-table-card:has(#ap-hero-promo-table-body)') || 
                   document.querySelector('#ap-hero-promo-table-body')?.closest('.ap-table-card');
  if (heroCard) {
    const outer = heroCard.querySelector('.ap-cms-table-outer');
    if (outer) {
      outer.scrollLeft = 9999;
    }
  }
});
</script>
`;

const htmlScrolled = html.replace('</body>', scrollScript + '</body>');
fs.writeFileSync('scratch/preview_hero_scrolled.html', htmlScrolled, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve('scratch/preview_hero_scrolled.html').replace(/\\/g, '/');
const snapPng = path.resolve('scratch/snap_hero_scrolled.png').replace(/\\/g, '/');

execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,1200 --screenshot="${snapPng}" "file:///${htmlPath}"`);
console.log('Screenshot taken!');

// Crop Top Hero Promo Cards
execSync(`python -c "from PIL import Image; im = Image.open('scratch/snap_hero_scrolled.png'); crop = im.crop((0, 480, im.width, 980)); crop.save('scratch/crop_hero_final.png');"`);
console.log('Cropped hero card saved to scratch/crop_hero_final.png');
