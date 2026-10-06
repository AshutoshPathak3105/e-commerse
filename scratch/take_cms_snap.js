const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'preview_cms_restored.html');
const mobilePng = path.resolve(__dirname, 'cms_restored_mobile.png');
const desktopPng = path.resolve(__dirname, 'cms_restored_desktop.png');

// Read the original CMS HTML
let cmsHtml = fs.readFileSync(path.resolve(__dirname, 'original_cms_html.html'), 'utf8');
cmsHtml = cmsHtml.replace('body.innerHTML = `', '').replace(/`;\s*$/, '');

// Replace any template literals with placeholder text so it renders cleanly
cmsHtml = cmsHtml
  .replace(/\$\{esc\(cms\.announcementText \|\| ''\)\}/g, 'Mega Festive Super Sale: Up to 10% OFF Across All Electronics & Fashion!')
  .replace(/\$\{quadCards\.length\}/g, '8')
  .replace(/\$\{banners\.length\}/g, '5')
  .replace(/\$\{promotions\.length\}/g, '12')
  .replace(/\$\{voucherCount\}/g, '4')
  .replace(/\$\{bankCount\}/g, '3')
  .replace(/\$\{upiCount\}/g, '3')
  .replace(/\$\{storeSpecificCount\}/g, '2')
  .replace(/\$\{renderQuadCardRows\(getFilteredQuadCards\(\)\)\}/g, `
    <tr>
      <td><div style="width:50px;height:50px;background:#e2e8f0;border-radius:4px;"></div></td>
      <td><strong>Electronics & Gadgets</strong><div style="font-size:11px;color:#64748b;">4 items configured</div></td>
      <td>Row 1 · Order 1</td>
      <td>/category/electronics · See All Deals</td>
      <td><span class="ap-badge green">● Active</span></td>
      <td style="text-align:right;"><button class="ap-btn ghost" style="padding:4px 8px;font-size:11px;">Edit</button></td>
    </tr>
  `)
  .replace(/\$\{renderHeroPromoRows\(heroPromoCards\)\}/g, `
    <tr>
      <td><div style="width:40px;height:40px;background:#e2e8f0;border-radius:4px;"></div></td>
      <td><strong>Mega Festive Sale</strong><div style="font-size:11px;color:#64748b;">Flat 50% Off</div></td>
      <td><span class="ap-badge green">● Active</span></td>
      <td style="text-align:right;"><button class="ap-btn ghost" style="padding:4px 8px;font-size:11px;">Edit</button></td>
    </tr>
  `)
  .replace(/\$\{renderQuickBrowseRows\(quickBrowseItems\)\}/g, `
    <tr>
      <td><div style="width:40px;height:40px;background:#e2e8f0;border-radius:4px;"></div></td>
      <td><strong>Smartphones</strong></td>
      <td><span class="ap-badge green">● Active</span></td>
      <td style="text-align:right;"><button class="ap-btn ghost" style="padding:4px 8px;font-size:11px;">Edit</button></td>
    </tr>
  `)
  .replace(/\$\{renderBannerRows\(banners\)\}/g, `
    <tr>
      <td><div style="width:70px;height:35px;background:#e2e8f0;border-radius:4px;"></div></td>
      <td><strong>Grand Festival Carnival</strong><div style="font-size:11px;color:#64748b;">Explore Top Deals</div></td>
      <td><span class="ap-badge blue">Top Deal</span></td>
      <td>#deals</td>
      <td>1</td>
      <td><span class="ap-badge green">● Active</span></td>
      <td style="text-align:right;"><button class="ap-btn ghost" style="padding:4px 8px;font-size:11px;">Edit</button></td>
    </tr>
  `)
  .replace(/\$\{renderPromoRows\(getFilteredPromotions\(\)\)\}/g, `
    <tr>
      <td><strong style="color:#2563eb;">FESTIVE50</strong></td>
      <td>Flat 50% off on all items</td>
      <td>Global</td>
      <td>50%</td>
      <td>₹999</td>
      <td>HDFC Bank</td>
      <td>Valid till 31 Oct 2026</td>
      <td><span class="ap-badge green">● Active</span></td>
      <td style="text-align:right;"><button class="ap-btn ghost" style="padding:4px 8px;font-size:11px;">Edit</button></td>
    </tr>
  `);

// Build preview HTML
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CMS Restored Preview</title>
  <link rel="stylesheet" href="../styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; }
    #ap-tab-body { width: 100%; max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="ap-tab-body">
    ${cmsHtml}
  </div>
</body>
</html>
`;

fs.writeFileSync(htmlPath, fullHtml);

console.log('Capturing mobile view (375x812)...');
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${mobilePng}" --window-size=375,812 --hide-scrollbars "${htmlPath}"`, { stdio: 'inherit' });
console.log('Mobile screenshot saved to:', mobilePng);

console.log('Capturing desktop view (1280x900)...');
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${desktopPng}" --window-size=1280,900 --hide-scrollbars "${htmlPath}"`, { stdio: 'inherit' });
console.log('Desktop screenshot saved to:', desktopPng);
