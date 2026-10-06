const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper functions matching script.js
function getBankLogoUrl(bankName) {
  if (!bankName) return 'assets/banks/allbanks.svg';
  const str = bankName.toLowerCase();
  if (str.includes('hdfc')) return 'assets/banks/hdfc.svg';
  if (str.includes('sbi') || str.includes('state bank')) return 'assets/banks/sbi.svg';
  if (str.includes('icici')) return 'assets/banks/icici.svg';
  if (str.includes('axis')) return 'assets/banks/axis.svg';
  if (str.includes('kotak')) return 'assets/banks/kotak.svg';
  return 'assets/banks/allbanks.svg';
}

function getUpiLogoUrl(appName) {
  if (!appName) return 'assets/upi/upi.svg';
  const str = appName.toLowerCase();
  if (str.includes('phonepe')) return 'assets/upi/phonepe.svg';
  if (str.includes('google') || str.includes('gpay')) return 'assets/upi/gpay.svg';
  if (str.includes('paytm')) return 'assets/upi/paytm.svg';
  return 'assets/upi/upi.svg';
}

function renderBankColumn(p) {
  if (p.type !== 'bank') {
    return '<span style="color:#94a3b8; font-weight:700; font-size:13px;">—</span>';
  }
  let bankSlides = [];
  if (Array.isArray(p.bankRules) && p.bankRules.length > 0) {
    p.bankRules.forEach(r => {
      const badgeBg = r.cardType === 'debit' ? '#e0f2fe' : r.cardType === 'credit' ? '#fef3c7' : '#dcfce7';
      const badgeColor = r.cardType === 'debit' ? '#0369a1' : r.cardType === 'credit' ? '#92400e' : '#15803d';
      const badgeBorder = r.cardType === 'debit' ? '#bae6fd' : r.cardType === 'credit' ? '#fde68a' : '#86efac';
      const badgeText = r.cardType === 'debit' ? 'Debit Cards' : r.cardType === 'credit' ? 'Credit Cards' : 'Debit & Credit';
      const logoUrl = getBankLogoUrl(r.bank);
      bankSlides.push(`
        <div style="display:flex; align-items:center; gap:8px; width:100%;">
          <div style="width:24px; height:24px; border-radius:4px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:2px; flex-shrink:0;">
            <img src="${logoUrl}" alt="Bank" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
          </div>
          <div style="min-width:0; text-align:left;">
            <div style="font-weight:700; color:#000000; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.bank}</div>
            <span style="font-size:9.5px; font-weight:800; background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; padding:1px 5px; border-radius:4px; display:inline-block; margin-top:2px; white-space:nowrap;">${badgeText}</span>
          </div>
        </div>
      `);
    });
  } else {
    let bankList = Array.isArray(p.bankPartners) && p.bankPartners.length > 0
      ? p.bankPartners
      : (p.bankPartner ? p.bankPartner.split(',').map(s => s.trim()).filter(Boolean) : []);
    if (bankList.length === 0) bankList = ['All Banks (Any Card)'];
    const cardLabel = p.cardType === 'debit' ? 'Debit Cards' : p.cardType === 'credit' ? 'Credit Cards' : 'Debit & Credit';
    bankList.forEach(bName => {
      const logoUrl = getBankLogoUrl(bName);
      bankSlides.push(`
        <div style="display:flex; align-items:center; gap:8px; width:100%;">
          <div style="width:24px; height:24px; border-radius:4px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:2px; flex-shrink:0;">
            <img src="${logoUrl}" alt="Bank" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
          </div>
          <div style="min-width:0; text-align:left;">
            <div style="font-weight:700; color:#000000; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${bName}</div>
            <span style="font-size:9.5px; font-weight:800; background:#dcfce7; color:#15803d; border:1px solid #86efac; padding:1px 5px; border-radius:4px; display:inline-block; margin-top:2px; white-space:nowrap;">${cardLabel}</span>
          </div>
        </div>
      `);
    });
  }

  if (bankSlides.length === 0) return '<span style="color:#94a3b8; font-weight:700; font-size:13px;">—</span>';
  if (bankSlides.length === 1) return `<div style="display:flex; justify-content:center; align-items:center; width:100%;">${bankSlides[0]}</div>`;

  return `
    <div class="ap-promo-cyclic-ticker-wrap" data-count="${bankSlides.length}" style="width:100%; max-width:170px; margin:0 auto;" title="Cycling ${bankSlides.length} bank partners.">
      ${bankSlides.map((sHtml, sIdx) => `
        <div class="ap-promo-cyclic-slide ${sIdx === 0 ? 'is-active' : ''}" data-slide-idx="${sIdx}">
          ${sHtml}
          <span class="ap-cyclic-ticker-indicator">${sIdx + 1}/${bankSlides.length}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderUpiColumn(p) {
  if (p.type !== 'upi') {
    return '<span style="color:#94a3b8; font-weight:700; font-size:13px;">—</span>';
  }
  let upiList = Array.isArray(p.upiProviders) && p.upiProviders.length > 0
    ? p.upiProviders
    : (p.upiProvider ? p.upiProvider.split(',').map(s => s.trim()).filter(Boolean) : []);
  if (upiList.length === 0) upiList = ['All UPI Apps'];

  let upiSlides = upiList.map(uName => {
    const logoUrl = getUpiLogoUrl(uName);
    return `
      <div style="display:flex; align-items:center; gap:8px; width:100%;">
        <div style="width:24px; height:24px; border-radius:4px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:2px; flex-shrink:0;">
          <img src="${logoUrl}" alt="UPI" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
        </div>
        <div style="min-width:0; text-align:left;">
          <div style="font-weight:700; color:#000000; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${uName}</div>
          <span style="font-size:9.5px; font-weight:800; background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; padding:1px 5px; border-radius:4px; display:inline-block; margin-top:2px; white-space:nowrap;">UPI Cashback</span>
        </div>
      </div>
    `;
  });

  if (upiSlides.length === 0) return '<span style="color:#94a3b8; font-weight:700; font-size:13px;">—</span>';
  if (upiSlides.length === 1) return `<div style="display:flex; justify-content:center; align-items:center; width:100%;">${upiSlides[0]}</div>`;

  return `
    <div class="ap-promo-cyclic-ticker-wrap" data-count="${upiSlides.length}" style="width:100%; max-width:170px; margin:0 auto;" title="Cycling ${upiSlides.length} UPI apps.">
      ${upiSlides.map((sHtml, sIdx) => `
        <div class="ap-promo-cyclic-slide ${sIdx === 0 ? 'is-active' : ''}" data-slide-idx="${sIdx}">
          ${sHtml}
          <span class="ap-cyclic-ticker-indicator">${sIdx + 1}/${upiSlides.length}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// Mock the 3 promos from user image:
const promos = [
  {
    type: 'voucher',
    code: 'ABC10',
    title: '10% Storewide Mega Discount',
    description: 'Flat 10% instant discount across all products on minimum bag value of ₹999.',
    scope: 'store',
    storeName: 'Apex Tech Store',
    discountType: 'percent',
    discountValue: 10,
    minOrder: 999,
    maxDiscount: 1000,
    validUntil: '2026-09-30T02:52:00.000Z',
    active: false,
  },
  {
    type: 'upi',
    code: 'UPI100',
    title: 'Flat ₹100 Cashback on UPI',
    description: 'Flat ₹100 discount when paying with Google Pay, PhonePe, Paytm, or any UPI.',
    scope: 'storewide',
    discountType: 'flat',
    discountValue: 100,
    minOrder: 499,
    upiProviders: ['Paytm UPI', 'Google Pay'],
    validUntil: '2026-10-10T01:49:00.000Z',
    active: true,
  },
  {
    type: 'bank',
    code: 'CARDOFF500',
    title: 'Flat ₹500 Instant Discount on Debit/Credit Cards',
    description: 'Flat ₹500 instant discount on HDFC, SBI & ICICI Debit/Credit cards.',
    scope: 'storewide',
    discountType: 'flat',
    discountValue: 500,
    minOrder: 0,
    bankRules: [{ bank: 'HDFC Bank', cardType: 'all' }, { bank: 'SBI Bank', cardType: 'debit' }],
    validUntil: '2026-10-08T03:20:00.000Z',
    active: true,
  }
];

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="../styles.css">
  <style>
    body { margin: 20px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #admin-panel-overlay { display: block !important; visibility: visible !important; opacity: 1 !important; position: static !important; width: 1200px; margin: 0 auto; }
    .ap-cms-view { display: block !important; }
  </style>
</head>
<body>
<div id="admin-panel-overlay">
  <div class="ap-cms-view">
    <div class="ap-promos-card ap-table-card" id="ap-promos-section" style="margin-bottom:24px; border-radius:12px; overflow:hidden; background:#ffffff;">
      <div class="ap-card-header" style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 style="margin:0; font-size:15px; font-weight:800; color:#ffffff !important;">Promotional Offers, Bank Partners &amp; Vouchers</h3>
          <p style="margin:2px 0 0; font-size:12px; color:#cbd5e1 !important; font-weight:600;">Configure voucher codes, bank cards, UPI apps, and merchant promotions.</p>
        </div>
      </div>

      <div class="ap-cms-table-outer">
        <div class="ap-cms-table-inner">
          <div class="ap-table-header-part ap-cms-table-header" style="background:#ff9400; width:100%; overflow:hidden; border-bottom:2px solid #e08300;">
            <table class="ap-table" id="ap-promos-table-header">
              <colgroup>
                <col style="width:150px;">
                <col style="width:270px;">
                <col style="width:175px;">
                <col style="width:135px;">
                <col style="width:130px;">
                <col style="width:180px;">
                <col style="width:180px;">
                <col style="width:210px;">
                <col style="width:110px;">
                <col style="width:160px;">
              </colgroup>
              <thead style="background:#ff9400;">
                <tr style="background:#ff9400 !important;">
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">Voucher Code</th>
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">Offer Title &amp; Terms</th>
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">Scope / Target Store</th>
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">Discount Rate</th>
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">Min Bag Value</th>
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">Bank Partner</th>
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">UPI Offer</th>
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">Duration / Expiry</th>
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">Status</th>
                  <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border:none;">Actions</th>
                </tr>
              </thead>
            </table>
          </div>
          <div class="ap-cms-body-scroll ap-table-body-scroll" style="width:100%; background:#ffffff;">
            <table class="ap-table" id="ap-promos-table">
              <colgroup>
                <col style="width:150px;">
                <col style="width:270px;">
                <col style="width:175px;">
                <col style="width:135px;">
                <col style="width:130px;">
                <col style="width:180px;">
                <col style="width:180px;">
                <col style="width:210px;">
                <col style="width:110px;">
                <col style="width:160px;">
              </colgroup>
              <tbody id="ap-promos-table-body">
                ${promos.map(p => `
                  <tr>
                    <td style="text-align:center;">
                      <div style="font-family:monospace; font-weight:800; color:#000000; font-size:13.5px; letter-spacing:0.04em;">${p.code}</div>
                      <div style="margin-top:4px; display:flex; justify-content:center;">
                        <span class="ap-badge ${p.type === 'bank' ? 'blue' : p.type === 'upi' ? 'green' : 'orange'}">${p.type === 'bank' ? 'Bank Card' : p.type === 'upi' ? 'UPI Offer' : 'Voucher'}</span>
                      </div>
                    </td>
                    <td style="text-align:left;">
                      <div style="font-weight:700; color:#000000; font-size:13px; line-height:1.4;">${p.title}</div>
                      <div style="font-size:11.5px; color:#475569; margin-top:3px; line-height:1.4;">${p.description}</div>
                    </td>
                    <td style="text-align:center;">
                      <div style="display:inline-flex; justify-content:center; align-items:center;">
                        <span class="ap-badge ${p.scope === 'store' ? 'blue' : 'green'}">${p.scope === 'store' ? '● ' + p.storeName : '● Storewide'}</span>
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <strong style="color:#000000; font-size:12.5px;">${p.discountType === 'percent' ? p.discountValue + '% OFF' : '₹' + p.discountValue + ' FLAT'}</strong>
                      ${p.maxDiscount ? `<div style="font-size:11px; color:#64748b;">Max ₹${p.maxDiscount}</div>` : ''}
                    </td>
                    <td style="text-align:center;">
                      <strong style="color:#000000; font-size:13px; font-weight:800;">₹${p.minOrder}</strong>
                    </td>
                    <td style="text-align:center; vertical-align:middle;">
                      <div style="width:100%; display:flex; justify-content:center; align-items:center;">
                        ${renderBankColumn(p)}
                      </div>
                    </td>
                    <td style="text-align:center; vertical-align:middle;">
                      <div style="width:100%; display:flex; justify-content:center; align-items:center;">
                        ${renderUpiColumn(p)}
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <span class="ap-badge ${p.active ? 'green' : 'red'}">${p.active ? 'Active' : 'Expired'}</span>
                    </td>
                    <td style="text-align:center;">
                      <span class="ap-badge ${p.active ? 'green' : 'red'}">${p.active ? '● Active' : 'Expired'}</span>
                    </td>
                    <td style="white-space:nowrap; text-align:center; padding:13px 16px;">
                      <button type="button" class="ap-btn ghost ap-edit-promo-btn" style="padding:5px 12px; font-size:12px; margin-right:6px;">Edit</button>
                      <button type="button" class="ap-btn danger ap-delete-promo-btn" style="padding:5px 12px; font-size:12px;">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

fs.writeFileSync(path.resolve(__dirname, 'test_fix_snap.html'), html);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'snap_tested_fix.png');
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${outPng}" --window-size=1280,800 "file:///${path.resolve(__dirname, 'test_fix_snap.html').replace(/\\/g, '/')}"`);
console.log('Tested fix captured to ' + outPng);
