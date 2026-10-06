const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptContent = fs.readFileSync('script.js', 'utf8');

// Find the CMS section specifically
const pos = scriptContent.indexOf('ap-announcements-section');
const startIndex = scriptContent.lastIndexOf('<div class="ap-view-inner">', pos);
const endIndex = scriptContent.indexOf('`;', pos);
let cmsHtml = scriptContent.slice(startIndex, endIndex);

console.log('Found CMS HTML, length:', cmsHtml.length);

// Replace template expressions with mock data
cmsHtml = cmsHtml.replace(/\$\{announcements\.length === 1 \? '' : 's'\}/g, 's');
cmsHtml = cmsHtml.replace(/\$\{announcements\.length\}/g, '2');
cmsHtml = cmsHtml.replace(/\$\{quadCards\.length\}/g, '28');
cmsHtml = cmsHtml.replace(/\$\{banners\.length\}/g, '6');
cmsHtml = cmsHtml.replace(/\$\{promotions\.length\}/g, '2');
cmsHtml = cmsHtml.replace(/\$\{voucherCount\}/g, '0');
cmsHtml = cmsHtml.replace(/\$\{bankCount\}/g, '1');
cmsHtml = cmsHtml.replace(/\$\{upiCount\}/g, '1');
cmsHtml = cmsHtml.replace(/\$\{storeSpecificCount\}/g, '1');

// Mock rows
cmsHtml = cmsHtml.replace(/\$\{renderAnnouncementRows\(announcements\)\}/g, `
  <tr style="border-bottom:1px solid #e2e8f0;">
    <td style="padding:10px 14px; font-weight:700;">Mega Festive Super Sale: Up to 10% OFF Across All Electronics & Fashion</td>
    <td style="text-align:center; padding:10px 8px;"><span class="ap-badge green">∞ No Expiry</span></td>
    <td style="text-align:center; padding:10px 8px;"><span class="ap-badge green">● Active</span></td>
    <td style="text-align:center; padding:10px 8px;">#1</td>
    <td style="text-align:center; padding:10px 8px;"><button class="ap-btn primary" style="background:#FF9400; color:#000; font-weight:800; padding:6px 12px; border-radius:6px; border:none; cursor:pointer;">Edit</button></td>
  </tr>
  <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc;">
    <td style="padding:10px 14px; font-weight:700;">Express Courier Dispatch & Doorstep Delivery Available Across India!</td>
    <td style="text-align:center; padding:10px 8px;"><span class="ap-badge red">Expired</span></td>
    <td style="text-align:center; padding:10px 8px;"><span class="ap-badge gray">Paused</span></td>
    <td style="text-align:center; padding:10px 8px;">#2</td>
    <td style="text-align:center; padding:10px 8px;"><button class="ap-btn primary" style="background:#FF9400; color:#000; font-weight:800; padding:6px 12px; border-radius:6px; border:none; cursor:pointer;">Edit</button></td>
  </tr>
`);

cmsHtml = cmsHtml.replace(/\$\{renderQuadCardRows\(getFilteredQuadCards\(\)\)\}/g, `
  <tr style="border-bottom:1px solid #e2e8f0;">
    <td style="text-align:center; padding:8px;"><div style="width:60px; height:60px; background:#e2e8f0; border-radius:6px; margin:0 auto;"></div></td>
    <td style="padding:10px 14px; font-weight:700;">Deals for you<br><small style="color:#64748b;">Smartphones, Audio, Laptops</small></td>
    <td style="text-align:center; padding:10px 8px;">Row 1 / #1</td>
    <td style="text-align:center; padding:10px 8px;">#deals</td>
    <td style="text-align:center; padding:10px 8px;"><span class="ap-badge green">● Active</span></td>
    <td style="text-align:center; padding:10px 8px;"><button class="ap-btn primary" style="background:#FF9400; color:#000; font-weight:800; padding:6px 12px; border-radius:6px; border:none; cursor:pointer;">Edit</button></td>
  </tr>
`);

cmsHtml = cmsHtml.replace(/\$\{renderHeroPromoRows\(heroPromoCards\)\}/g, `
  <tr style="border-bottom:1px solid #e2e8f0;">
    <td style="text-align:center; padding:8px;"><div style="width:50px; height:40px; background:#e2e8f0; border-radius:4px; margin:0 auto;"></div></td>
    <td style="padding:10px 12px; font-weight:700;">Mega Deals</td>
    <td style="text-align:center; padding:10px 8px;"><span class="ap-badge green">● Active</span></td>
    <td style="text-align:center; padding:10px 8px;"><button class="ap-btn primary" style="background:#FF9400; color:#000; font-weight:800; padding:4px 8px; border-radius:6px; border:none; cursor:pointer;">Edit</button></td>
  </tr>
`);

cmsHtml = cmsHtml.replace(/\$\{renderQuickBrowseRows\(quickBrowseItems\)\}/g, `
  <tr style="border-bottom:1px solid #e2e8f0;">
    <td style="text-align:center; padding:8px;"><div style="width:50px; height:40px; background:#e2e8f0; border-radius:4px; margin:0 auto;"></div></td>
    <td style="padding:10px 12px; font-weight:700;">Electronics</td>
    <td style="text-align:center; padding:10px 8px;"><span class="ap-badge green">● Active</span></td>
    <td style="text-align:center; padding:10px 8px;"><button class="ap-btn primary" style="background:#FF9400; color:#000; font-weight:800; padding:4px 8px; border-radius:6px; border:none; cursor:pointer;">Edit</button></td>
  </tr>
`);

cmsHtml = cmsHtml.replace(/\$\{renderBannerRows\(banners\)\}/g, `
  <tr style="border-bottom:1px solid #e2e8f0;">
    <td style="text-align:center; padding:8px;"><div style="width:80px; height:45px; background:#e2e8f0; border-radius:4px; margin:0 auto;"></div></td>
    <td style="padding:10px 12px; font-weight:700;">Min. 50% - 75% Off Trending Styles<br><small style="color:#64748b;">Top fashion brands</small></td>
    <td style="text-align:center; padding:10px 8px;"><span class="ap-badge blue">Trending</span></td>
    <td style="text-align:center; padding:10px 8px;"><code>#fashion</code></td>
    <td style="text-align:center; padding:10px 8px;">#1</td>
    <td style="text-align:center; padding:10px 8px;"><span class="ap-badge green">● Active</span></td>
    <td style="text-align:center; padding:10px 8px;"><button class="ap-btn primary" style="background:#FF9400; color:#000; font-weight:800; padding:6px 12px; border-radius:6px; border:none; cursor:pointer;">Edit</button></td>
  </tr>
`);

cmsHtml = cmsHtml.replace(/\$\{renderPromoRows\(getFilteredPromotions\(\)\)\}/g, `
  <tr style="border-bottom:1px solid #e2e8f0;">
    <td style="text-align:center; padding:12px 8px; font-weight:800;">HDFC10</td>
    <td style="padding:12px 14px; font-weight:700;">Instant 10% Discount on HDFC Cards<br><small style="color:#64748b;">Valid on credit & debit cards</small></td>
    <td style="text-align:center; padding:12px 8px;">Storewide</td>
    <td style="text-align:center; padding:12px 8px; font-weight:800; color:#059669;">10% OFF</td>
    <td style="text-align:center; padding:12px 8px;">₹1,999</td>
    <td style="text-align:center; padding:12px 8px;">HDFC Bank</td>
    <td style="text-align:center; padding:12px 8px;">31 Dec 2026</td>
    <td style="text-align:center; padding:12px 8px;"><span class="ap-badge green">● Active</span></td>
    <td style="text-align:center; padding:12px 8px;"><button class="ap-btn primary" style="background:#FF9400; color:#000; font-weight:800; padding:6px 12px; border-radius:6px; border:none; cursor:pointer;">Edit</button></td>
  </tr>
`);

const cssContent = fs.readFileSync('styles.css', 'utf8');

const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>CMS Mobile Preview</title>
  <style>
    ${cssContent}
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #admin-panel-overlay {
      position: relative;
      width: 100%;
      max-width: 100%;
      min-height: 100vh;
      box-sizing: border-box;
      display: block;
    }
  </style>
</head>
<body>
  <div id="admin-panel-overlay" class="ap-open">
    ${cmsHtml}
  </div>
</body>
</html>
`;

const previewFile = path.resolve(__dirname, 'preview_cms_mobile.html');
fs.writeFileSync(previewFile, fullHtml, 'utf8');
console.log('Preview file written to:', previewFile);

// Now capture screenshot with Chrome
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'verified_mobile_cms.png');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,2800 --screenshot="${outPng}" "file://${previewFile}"`;
try {
  execSync(cmd, { stdio: 'inherit', timeout: 15000 });
  console.log('Mobile screenshot generated successfully:', fs.existsSync(outPng));
} catch(e) {
  console.error('Screenshot error:', e.message);
}
