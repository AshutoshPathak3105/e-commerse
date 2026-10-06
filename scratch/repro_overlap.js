const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load script.js
const script = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

// Extract renderPromoRows function from script.js
const promoFnStart = script.indexOf('function renderPromoRows(');
const promoFnEnd = script.indexOf('const voucherCount = promotions.filter', promoFnStart);
const promoFnCode = script.slice(promoFnStart, promoFnEnd);

// Mock helper functions needed by renderPromoRows
function esc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function getBankLogoUrl(bank) { return 'https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-Logo.svg'; }
function getUpiLogoUrl(upi) { return 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg'; }

const now = new Date();

// Create sample promotions matching user's exact screenshot:
// Row 1: Code ABC10, Storewide Coupon Code, Expired on 30 Sept 2026
// Row 2: ICICI Bank, Debit & Credit Cards, Active (7d left), Expires: 10 Oct 2026, Paused
const samplePromos = [
  {
    _id: 'p1',
    code: 'ABC10',
    title: 'Festival 10% Flat Savings',
    description: 'Get extra 10% instant discount on cart',
    type: 'voucher',
    scope: 'storewide',
    discountType: 'percent',
    discountValue: 10,
    minOrder: 1999,
    validUntil: new Date('2026-09-30T02:52:00').toISOString(),
    active: true
  },
  {
    _id: 'p2',
    code: 'ICICICARD',
    title: 'ICICI Bank Instant 10% Offer',
    description: 'Exclusive instant savings on all ICICI Bank credit & debit cards',
    type: 'bank',
    scope: 'storewide',
    discountType: 'percent',
    discountValue: 10,
    maxDiscount: 1500,
    minOrder: 4999,
    bankPartner: 'ICICI Bank, HDFC Bank, SBI Card, Axis Bank, Kotak Bank',
    cardType: 'all',
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
    active: false
  }
];

// Evaluate renderPromoRows
const evalPromoRows = new Function('promotions', 'now', 'esc', 'getBankLogoUrl', 'getUpiLogoUrl', `
  ${promoFnCode}
  return renderPromoRows(promotions);
`);

const rowsHtml = evalPromoRows(samplePromos, now, esc, getBankLogoUrl, getUpiLogoUrl);

const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promo Table Mobile Test</title>
  <link rel="stylesheet" href="../styles.css">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; }
  </style>
</head>
<body id="admin-panel-overlay" class="ap-open ap-cms-view">
  <div class="ap-view-inner ap-cms-view" style="width:100%;">
    <div class="ap-table-card" style="border-radius:12px; overflow:hidden;">
      <div class="ap-card-header" style="padding:16px 20px; background:#022f43; color:#fff;">
        <h3 style="margin:0; color:#fff;">Promotional Offers, Bank Cards &amp; Vouchers</h3>
      </div>
      <div class="ap-cms-toolbar" style="background:#ff9400; padding:12px;">
        <div class="ap-cms-pills">
          <button class="ap-cms-pill active">All Offers (2)</button>
        </div>
      </div>
      <div class="ap-table-wrap">
        <table class="ap-table" id="ap-promos-table">
          <thead style="background:#ff9400;">
            <tr style="background:#ff9400 !important;">
              <th>Voucher Code &amp; Type</th>
              <th>Offer Title &amp; Terms</th>
              <th>Scope / Target Store</th>
              <th>Discount Rate</th>
              <th>Min Bag Value</th>
              <th>Bank / UPI Partner</th>
              <th>Duration / Expiry</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="ap-promos-table-body">
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;

const outHtmlPath = path.resolve(__dirname, 'test_promo_table_render.html');
fs.writeFileSync(outHtmlPath, testHtml, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'promo_current_render.png');

console.log('Capturing current render...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=430,700 --screenshot="${outPng}" "file://${outHtmlPath}"`);
console.log('Saved promo_current_render.png');
