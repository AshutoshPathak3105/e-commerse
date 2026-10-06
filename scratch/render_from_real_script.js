const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const script = fs.readFileSync('script.js', 'utf8');

const cmsStart = script.indexOf('async function renderCMS');
const startMatch = script.indexOf('body.innerHTML = `', cmsStart);
const endMatch = script.indexOf('`;', startMatch);

let template = script.slice(startMatch + 'body.innerHTML = `'.length, endMatch);

// Replace template placeholders for preview
template = template.replace(/\$\{esc\(cms\.announcementText \|\| ''\)\}/g, 'Mega Festive Super Sale: Up to 10% OFF Across All Electronics & Fashion_XYZ');
template = template.replace(/\$\{announcements\.filter\(a => a\.active !== false\)\.length\}/g, '2');
template = template.replace(/\$\{announcements\.length\}/g, '2');
template = template.replace('${esc(cms.announcementText || announcements.find(a => a.active !== false)?.text || \'No active announcement\')}', 'Mega Festive Super Sale: Up to 10% OFF Across All Electronics & Fashion_XYZ');
template = template.replace('${renderAnnouncementRows(getFilteredAnnouncements())}', `
  <tr>
    <td style="font-weight:700; color:#475569; width:45px;">#0</td>
    <td style="min-width:260px;">
      <div style="font-weight:700; color:#0f172a; font-size:13px; line-height:1.4;">Mega Festive Super Sale: Up to 10% OFF Across All Electronics &amp; Fashion_XYZ</div>
      <span class="ap-badge blue" style="font-size:10.5px; margin-top:4px; display:inline-block; font-weight:700;">Super Sale</span>
    </td>
    <td style="font-size:12px; color:#334155;">
      <code style="color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:4px; font-size:11px;">#deals</code>
    </td>
    <td style="text-align:center;">
      <button type="button" class="ap-btn-tiny ap-badge green" style="cursor:pointer; border:none; padding:4px 10px; font-size:11px; font-weight:800;">● Active</button>
    </td>
    <td style="text-align:right; white-space:nowrap;">
      <button type="button" class="ap-btn ghost ap-edit-ann-btn" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
      <button type="button" class="ap-btn danger ap-del-ann-btn" style="padding:4px 10px; font-size:12px;">Delete</button>
    </td>
  </tr>
  <tr>
    <td style="font-weight:700; color:#475569; width:45px;">#1</td>
    <td style="min-width:260px;">
      <div style="font-weight:700; color:#0f172a; font-size:13px; line-height:1.4;">Express Courier Dispatch &amp; Doorstep Delivery Available Across India!</div>
      <span class="ap-badge blue" style="font-size:10.5px; margin-top:4px; display:inline-block; font-weight:700;">Fast Delivery</span>
    </td>
    <td style="font-size:12px; color:#334155;">
      <code style="color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:4px; font-size:11px;">#delivery</code>
    </td>
    <td style="text-align:center;">
      <button type="button" class="ap-btn-tiny ap-badge green" style="cursor:pointer; border:none; padding:4px 10px; font-size:11px; font-weight:800;">● Active</button>
    </td>
    <td style="text-align:right; white-space:nowrap;">
      <button type="button" class="ap-btn ghost ap-edit-ann-btn" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
      <button type="button" class="ap-btn danger ap-del-ann-btn" style="padding:4px 10px; font-size:12px;">Delete</button>
    </td>
  </tr>
`);
template = template.replace(/\$\{quadCards\.length\}/g, '28');
template = template.replace(/\$\{banners\.length\}/g, '5');
template = template.replace(/\$\{promotions\.length\}/g, '14');
template = template.replace(/\$\{voucherCount\}/g, '5');
template = template.replace(/\$\{bankCount\}/g, '4');
template = template.replace(/\$\{upiCount\}/g, '3');
template = template.replace(/\$\{storeSpecificCount\}/g, '2');

// Mock rows (10 quad card items)
const quadRowMock = (i) => `
  <tr>
    <td style="text-align:center;"><div style="width:48px; height:48px; background:#e2e8f0; border-radius:6px; margin:0 auto;"></div></td>
    <td><strong style="color:#000000; font-size:13px;">Item Category Card #${i}</strong><div style="font-size:11.5px; color:#475569;">Air conditioners, Refrigerators, Microwaves, Washing machines</div></td>
    <td style="text-align:center;"><span class="ap-badge blue">Row 1 · Order ${i}</span></td>
    <td style="text-align:center;"><span style="font-size:12px; font-weight:600;">/category/item-${i}</span></td>
    <td style="text-align:center;"><span class="ap-badge green">● Active</span></td>
    <td style="text-align:right; white-space:nowrap;"><button class="ap-btn ghost ap-edit-quad-btn" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button><button class="ap-btn danger" style="padding:4px 10px; font-size:12px;">Delete</button></td>
  </tr>
`;
template = template.replace('${renderQuadCardRows(getFilteredQuadCards())}', Array.from({length: 10}, (_, i) => quadRowMock(i + 1)).join(''));


template = template.replace('${renderHeroPromoRows(heroPromoCards)}', `
  <tr>
    <td><div style="width:40px; height:40px; background:#e2e8f0; border-radius:4px;"></div></td>
    <td><div style="font-weight:700; color:#000000;">Mega Brand Days</div><span class="ap-badge orange">Hot Deal</span></td>
    <td><span class="ap-badge green">● Active</span></td>
    <td style="text-align:right; white-space:nowrap;"><button class="ap-btn ghost ap-edit-hero-btn" style="padding:4px 8px; font-size:11px; margin-right:2px;">Edit</button><button class="ap-btn danger" style="padding:4px 8px; font-size:11px;">Delete</button></td>
  </tr>
`);

template = template.replace('${renderQuickBrowseRows(quickBrowseItems)}', `
  <tr>
    <td><div style="width:36px; height:36px; background:#e2e8f0; border-radius:4px;"></div></td>
    <td><div style="font-weight:700; color:#000000;">Smartphones</div></td>
    <td><span class="ap-badge green">● Active</span></td>
    <td style="text-align:right; white-space:nowrap;"><button class="ap-btn ghost ap-edit-quick-btn" style="padding:4px 8px; font-size:11px; margin-right:2px;">Edit</button><button class="ap-btn danger" style="padding:4px 8px; font-size:11px;">Delete</button></td>
  </tr>
`);

template = template.replace('${renderBannerRows(banners)}', `
  <tr>
    <td><div style="width:80px; height:40px; background:#e2e8f0; border-radius:4px;"></div></td>
    <td><strong style="color:#000000;">Big Festival Bonanza</strong><div style="font-size:11px; color:#475569;">Up to 70% off on all trending styles</div></td>
    <td><span class="ap-badge blue">Hero Slider</span></td>
    <td><code>/deals</code></td>
    <td>#1</td>
    <td><span class="ap-badge green">● Active</span></td>
    <td style="text-align:right; white-space:nowrap;"><button class="ap-btn ghost ap-edit-banner-btn" style="padding:4px 8px; font-size:11px; margin-right:4px;">Edit</button><button class="ap-btn danger" style="padding:4px 8px; font-size:11px;">Delete</button></td>
  </tr>
`);

function esc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function getBankLogoUrl(bank) { return 'https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-Logo.svg'; }
function getUpiLogoUrl(upi) { return 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg'; }

function renderPromoRows(promoList) {
  return promoList.map(p => {
    let partnerStr = '';
    let slides = [];
    if (p.type === 'bank') {
      const bankList = ['HDFC Bank', 'ICICI Bank', 'SBI Card', 'Axis Bank'];
      bankList.forEach(b => {
        slides.push(`
          <div style="display:flex; align-items:flex-start; gap:8px;">
            <div style="width:22px; height:22px; border-radius:4px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:2px; flex-shrink:0;">
              <span style="font-size:10px; font-weight:bold;">🏛️</span>
            </div>
            <div>
              <div style="font-weight:700; color:#000000; font-size:12px;">${b}</div>
              <span class="ap-offer-ticker-badge bank" style="font-size:10px; font-weight:800; background:#dcfce7; color:#15803d; padding:1px 6px; border-radius:4px; border:1px solid #86efac; display:inline-block; margin-top:2px;">Debit &amp; Credit Cards</span>
            </div>
          </div>
        `);
      });
    } else if (p.type === 'upi') {
      const upiList = ['Google Pay', 'PhonePe', 'Paytm UPI'];
      upiList.forEach(u => {
        slides.push(`
          <div style="display:flex; align-items:flex-start; gap:8px;">
            <div style="width:22px; height:22px; border-radius:4px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:2px; flex-shrink:0;">
              <span style="font-size:10px; font-weight:bold;">📱</span>
            </div>
            <div>
              <div style="font-weight:700; color:#000000; font-size:12px;">${u}</div>
              <span class="ap-offer-ticker-badge upi" style="font-size:10px; font-weight:800; background:#e0f2fe; color:#0369a1; padding:1px 6px; border-radius:4px; border:1px solid #bae6fd; display:inline-block; margin-top:2px;">UPI Cashback</span>
            </div>
          </div>
        `);
      });
    } else {
      slides.push(`
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <div style="width:22px; height:22px; border-radius:4px; background:#fff7ed; border:1px solid #fed7aa; display:flex; align-items:center; justify-content:center; padding:2px; flex-shrink:0;">
            <span style="font-size:10px; font-weight:bold;">🏷️</span>
          </div>
          <div>
            <div style="font-weight:700; color:#000000; font-size:12px;">All Customers</div>
            <span class="ap-offer-ticker-badge voucher-all" style="font-size:10px; font-weight:800; background:#fef3c7; color:#92400e; padding:1px 6px; border-radius:4px; border:1px solid #fde68a; display:inline-block; margin-top:2px;">Storewide Coupon Code</span>
          </div>
        </div>
      `);
      slides.push(`
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <div style="width:22px; height:22px; border-radius:4px; background:#f0fdf4; border:1px solid #bbf7d0; display:flex; align-items:center; justify-content:center; padding:2px; flex-shrink:0;">
            <span style="font-size:10px; font-weight:bold;">✨</span>
          </div>
          <div>
            <div style="font-weight:700; color:#000000; font-size:12px;">Min Bag Value: ₹2,499+</div>
            <span class="ap-offer-ticker-badge bank" style="font-size:10px; font-weight:800; background:#dcfce7; color:#15803d; padding:1px 6px; border-radius:4px; border:1px solid #86efac; display:inline-block; margin-top:2px;">Auto-Apply Eligible</span>
          </div>
        </div>
      `);
    }

    partnerStr = `
      <div class="ap-promo-cyclic-ticker-wrap" data-count="${slides.length}" title="Cycling ${slides.length} offer details. Hover to pause.">
        ${slides.map((sHtml, sIdx) => `
          <div class="ap-promo-cyclic-slide ${sIdx === 0 ? 'is-active' : ''}" data-slide-idx="${sIdx}">
            ${sHtml}
            <span class="ap-cyclic-ticker-indicator">${sIdx + 1}/${slides.length}</span>
          </div>
        `).join('')}
      </div>
    `;

    const isExpired = p.code === 'ABC10';
    const durationBadge = isExpired ? `
      <div>
        <span class="ap-badge red" style="font-weight:800; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;">Expired</span>
        <div style="font-size:11px; color:#b91c1c; font-weight:700; margin-top:3px;">Ended: 30 Sept 2026, 02:52 am</div>
      </div>
    ` : `
      <div>
        <span class="ap-badge green" style="font-weight:800; background:#dcfce7; color:#15803d; border:1px solid #86efac;">Active (7d left)</span>
        <div style="font-size:11px; color:#000000; font-weight:600; margin-top:3px;">Expires: 10 Oct 2026, 01:49 am</div>
      </div>
    `;

    return `
      <tr>
        <td style="text-align:center;">
          <div style="font-family:monospace; font-weight:800; color:#000000; font-size:13px;">${p.code}</div>
          <span class="offer-type-tag ${p.type}" style="margin-top:2px;">${p.type}</span>
        </td>
        <td><strong style="color:#000000;">${p.title}</strong></td>
        <td><span class="ap-badge green">Storewide</span></td>
        <td><strong style="color:#000000;">${p.discountValue}% OFF</strong></td>
        <td>₹${p.minOrder}</td>
        <td>${partnerStr}</td>
        <td>${durationBadge}</td>
        <td style="text-align:center;">
          <span class="ap-badge ${p.active ? 'green' : (isExpired ? 'red' : 'gray')}">${isExpired ? '● Expired' : (p.active ? '● Active' : '○ Paused')}</span>
        </td>
        <td style="text-align:right; white-space:nowrap;"><button class="ap-btn ghost ap-edit-promo-btn" style="padding:4px 8px; font-size:11px; margin-right:4px;">Edit</button><button class="ap-btn danger" style="padding:4px 8px; font-size:11px;">Delete</button></td>
      </tr>
    `;
  }).join('');
}
const samplePromos = [
  {
    code: 'ABC10',
    title: 'Festival 10% Flat Savings',
    type: 'voucher',
    scope: 'storewide',
    discountType: 'percent',
    discountValue: 10,
    minOrder: 1999,
    validUntil: new Date('2026-09-30T02:52:00').toISOString(),
    active: false
  },
  {
    code: 'MEGAFESTIVE',
    title: '10% Instant Card Discount',
    type: 'bank',
    scope: 'storewide',
    discountType: 'percent',
    discountValue: 10,
    maxDiscount: 1500,
    minOrder: 4999,
    bankPartner: 'All Banks (Any Card), Axis Bank, HDFC Bank, ICICI Bank, SBI Card',
    cardType: 'all',
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
    active: true
  },
  {
    code: 'UPIPAYBACK',
    title: '₹100 Instant Cashback',
    type: 'upi',
    scope: 'storewide',
    discountType: 'flat',
    discountValue: 100,
    minOrder: 999,
    upiProvider: 'Google Pay (GPay), PhonePe, Paytm UPI',
    validUntil: new Date(Date.now() + 15 * 86400000).toISOString(),
    active: true
  },
  {
    code: 'RELIANCE10',
    title: '10% Exclusive Store Voucher',
    type: 'voucher',
    scope: 'store',
    storeName: 'Reliance Digital',
    discountType: 'percent',
    discountValue: 10,
    maxDiscount: 2000,
    minOrder: 10000,
    validUntil: new Date(Date.now() + 20 * 86400000).toISOString(),
    active: true
  }
];
const promoHtml = renderPromoRows(samplePromos);
template = template.replace('${renderPromoRows(getFilteredPromotions())}', promoHtml);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CMS Verified Preview</title>
  <link rel="stylesheet" href="../styles.css">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; }
    #admin-panel-overlay { position: static !important; width: 100% !important; max-width: 1280px !important; margin: 0 auto !important; display: block !important; opacity: 1 !important; pointer-events: all !important; background: transparent !important; }
  </style>
</head>
<body id="admin-panel-overlay" class="ap-open ap-cms-view">
  ${template}
</body>
</html>`;

const outHtml = path.resolve(__dirname, 'preview_from_script.html');
fs.writeFileSync(outHtml, fullHtml, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPngDesktop = path.resolve(__dirname, 'cms_verified_desktop.png');
const outPngTablet = path.resolve(__dirname, 'cms_verified_tablet.png');
const outPngFull = path.resolve(__dirname, 'cms_verified_full.png');
const outPngMobile = path.resolve(__dirname, 'cms_verified_mobile.png');

console.log('Capturing verified desktop screenshot...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1800,1200 --screenshot="${outPngDesktop}" "file://${outHtml}"`);

console.log('Capturing verified tablet screenshot...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=820,1180 --screenshot="${outPngTablet}" "file://${outHtml}"`);

console.log('Capturing verified full page screenshot...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1800,2800 --screenshot="${outPngFull}" "file://${outHtml}"`);

console.log('Capturing verified mobile screenshot...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outPngMobile}" "file://${outHtml}"`);

console.log('Done! All screenshots captured.');
