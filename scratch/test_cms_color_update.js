const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read preview_cms_restored.html
let html = fs.readFileSync(path.resolve(__dirname, 'preview_cms_restored.html'), 'utf8');

// 1. Container 1: Global Announcement Ticker Manager
// Header #022f43 bg with white text
html = html.replace(
  `<div class="ap-form-card" style="margin-bottom:24px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#000000;">Top Navigation Announcement Bar</h3>
                  <p style="font-size:12px; color:#1e293b; font-weight:600; margin:2px 0 0;">This marquee message is pinned at the top-left utility bar of the customer-facing storefront.</p>
                </div>
                <span class="ap-badge green">● Live on Production</span>
              </div>
              <div class="ap-form-group" style="margin-bottom:12px;">`,
  `<div class="ap-form-card" style="margin-bottom:24px; padding:0; overflow:hidden;">
              <div class="ap-card-header" style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#ffffff !important; display:flex; align-items:center; gap:8px;">Top Navigation Announcement Bar</h3>
                  <p style="font-size:12px; color:#cbd5e1 !important; font-weight:600; margin:2px 0 0;">This marquee message is pinned at the top-left utility bar of the customer-facing storefront.</p>
                </div>
                <span class="ap-badge green" style="background:#064e3b !important; color:#6ee7b7 !important; border:1px solid #059669 !important; font-weight:800;">● Live on Production</span>
              </div>
              <div style="padding:18px 20px;">
                <div class="ap-form-group" style="margin-bottom:12px;">`
);

// Close the inner padding div before closing ap-form-card
html = html.replace(
  `Save Announcement Bar
                </button>
              </div>
            </div>`,
  `Save Announcement Bar
                </button>
              </div>
              </div>
            </div>`
);

// 2. Container 2: Homepage 4-Quadrant Category Cards Manager
// Header: #022f43 bg and white text
html = html.replace(
  `<div style="padding:16px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#000000; display:flex; align-items:center; gap:8px;">
                    Homepage 4-Quadrant Category Cards
                    <span class="ap-badge blue" id="ap-quad-count-badge" style="font-weight:700;">8 Cards</span>
                  </h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#1e293b; font-weight:600;">Full control over all 4-item category cards on the customer homepage. Change titles, swap images, edit deal badges, and add/remove cards.</p>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <button type="button" class="ap-btn ghost" id="ap-cms-reset-quad-btn" style="padding:6px 14px; font-size:12px; font-weight:700;" title="Restore original factory preset cards">
                    ↺ Reset to Defaults
                  </button>
                  <button type="button" class="ap-btn primary" id="ap-cms-add-quad-btn" style="padding:6px 16px; font-size:12px; font-weight:800; background:#2563eb; color:#ffffff !important;">
                    + Add New Homepage Card
                  </button>
                </div>
              </div>`,
  `<div class="ap-card-header" style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#ffffff !important; display:flex; align-items:center; gap:8px;">
                    Homepage 4-Quadrant Category Cards
                    <span class="ap-badge blue" id="ap-quad-count-badge" style="font-weight:800; background:#0f2744 !important; color:#93c5fd !important; border:1px solid #1e40af !important; padding:3px 10px; border-radius:12px; font-size:11px;">8 Cards</span>
                  </h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#cbd5e1 !important; font-weight:600;">Full control over all 4-item category cards on the customer homepage. Change titles, swap images, edit deal badges, and add/remove cards.</p>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <button type="button" class="ap-btn ghost" id="ap-cms-reset-quad-btn" style="padding:6px 14px; font-size:12px; font-weight:700; background:#ffffff; color:#022f43 !important; border:1px solid #cbd5e1;" title="Restore original factory preset cards">
                    ↺ Reset to Defaults
                  </button>
                  <button type="button" class="ap-btn primary" id="ap-cms-add-quad-btn" style="padding:6px 16px; font-size:12px; font-weight:800; background:#2563eb; color:#ffffff !important; border-color:#1d4ed8;">
                    + Add New Homepage Card
                  </button>
                </div>
              </div>`
);

// Toolbar in Container 2 (Image 2): #ff9400 bg, black font
html = html.replace(
  `<div class="ap-cms-toolbar" style="padding:12px 20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">`,
  `<div class="ap-cms-toolbar" style="padding:12px 20px; border-bottom:1.5px solid #e08300; background:#ff9400; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">`
);

// Row pills inside Container 2 toolbar
html = html.replace(
  `<div class="ap-cms-pills" id="ap-quad-row-pills">
                  <button type="button" class="ap-cms-pill active" data-row="all">All Rows (8)</button>
                  <button type="button" class="ap-cms-pill" data-row="1">Row 1</button>
                  <button type="button" class="ap-cms-pill" data-row="2">Row 2</button>
                  <button type="button" class="ap-cms-pill" data-row="3">Row 3</button>
                  <button type="button" class="ap-cms-pill" data-row="4">Row 4</button>
                  <button type="button" class="ap-cms-pill" data-row="5">Row 5</button>
                  <button type="button" class="ap-cms-pill" data-row="6">Row 6</button>
                  <button type="button" class="ap-cms-pill" data-row="7">Row 7</button>
                </div>`,
  `<div class="ap-cms-pills" id="ap-quad-row-pills">
                  <button type="button" class="ap-cms-pill active" data-row="all" style="background:#022f43 !important; color:#ffffff !important; border-color:#022f43 !important; font-weight:800;">All Rows (8)</button>
                  <button type="button" class="ap-cms-pill" data-row="1" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Row 1</button>
                  <button type="button" class="ap-cms-pill" data-row="2" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Row 2</button>
                  <button type="button" class="ap-cms-pill" data-row="3" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Row 3</button>
                  <button type="button" class="ap-cms-pill" data-row="4" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Row 4</button>
                  <button type="button" class="ap-cms-pill" data-row="5" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Row 5</button>
                  <button type="button" class="ap-cms-pill" data-row="6" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Row 6</button>
                  <button type="button" class="ap-cms-pill" data-row="7" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Row 7</button>
                </div>`
);

// Container 2 search input
html = html.replace(
  `id="ap-quad-search-input" placeholder="Search cards by title or item..." style="width:240px; padding:6px 12px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; outline:none;"`,
  `id="ap-quad-search-input" placeholder="Search cards by title or item..." style="width:240px; padding:6px 12px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; outline:none; background:#ffffff; color:#000000;"`
);

// Container 2 Table Head with #ff9400 background
html = html.replace(
  `<div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th style="color:#000000; font-weight:800;">4 Tile Preview</th>
                      <th style="color:#000000; font-weight:800;">Card Title &amp; Items Summary</th>
                      <th style="color:#000000; font-weight:800;">Row &amp; Order</th>
                      <th style="color:#000000; font-weight:800;">Destination &amp; Footer</th>
                      <th style="color:#000000; font-weight:800;">Status</th>
                      <th style="text-align:right; color:#000000; font-weight:800;">Actions</th>
                    </tr>
                  </thead>`,
  `<div class="ap-table-wrap">
                <table class="ap-table">
                  <thead style="background:#ff9400;">
                    <tr style="background:#ff9400 !important;">
                      <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">4 Tile Preview</th>
                      <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Card Title &amp; Items Summary</th>
                      <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Row &amp; Order</th>
                      <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Destination &amp; Footer</th>
                      <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Status</th>
                      <th style="text-align:right; background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Actions</th>
                    </tr>
                  </thead>`
);

// 3. Container 3: Top Hero Promo Cards
html = html.replace(
  `<div style="padding:14px 18px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <h3 style="margin:0; font-size:14px; font-weight:800; color:#000000;">Top Hero Promo Cards</h3>
                    <p style="margin:2px 0 0; font-size:11.5px; color:#1e293b; font-weight:600;">The 4 showcase cards below the main banner slider.</p>
                  </div>
                  <button type="button" class="ap-btn primary" id="ap-add-hero-promo-btn" style="padding:5px 12px; font-size:11.5px; font-weight:800;">+ Add</button>
                </div>
                <div class="ap-table-wrap">
                  <table class="ap-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Details &amp; Badge</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                      </tr>
                    </thead>`,
  `<div class="ap-card-header" style="padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <h3 style="margin:0; font-size:14px; font-weight:800; color:#ffffff !important;">Top Hero Promo Cards</h3>
                    <p style="margin:2px 0 0; font-size:11.5px; color:#cbd5e1 !important; font-weight:600;">The 4 showcase cards below the main banner slider.</p>
                  </div>
                  <button type="button" class="ap-btn primary" id="ap-add-hero-promo-btn" style="padding:5px 12px; font-size:11.5px; font-weight:800; background:#2563eb; color:#ffffff !important; border-color:#1d4ed8;">+ Add</button>
                </div>
                <div class="ap-table-wrap">
                  <table class="ap-table">
                    <thead style="background:#ff9400;">
                      <tr style="background:#ff9400 !important;">
                        <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Image</th>
                        <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Details &amp; Badge</th>
                        <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Status</th>
                        <th style="text-align:right; background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Actions</th>
                      </tr>
                    </thead>`
);

// 4. Container 4: Quick-Browse Strip Items
html = html.replace(
  `<div style="padding:14px 18px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <h3 style="margin:0; font-size:14px; font-weight:800; color:#000000;">Quick-Browse Strip Items</h3>
                    <p style="margin:2px 0 0; font-size:11.5px; color:#1e293b; font-weight:600;">The mini horizontal browse items above the quad grid.</p>
                  </div>
                  <button type="button" class="ap-btn primary" id="ap-add-quick-browse-btn" style="padding:5px 12px; font-size:11.5px; font-weight:800;">+ Add</button>
                </div>
                <div class="ap-table-wrap">
                  <table class="ap-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title &amp; Badge</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                      </tr>
                    </thead>`,
  `<div class="ap-card-header" style="padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <h3 style="margin:0; font-size:14px; font-weight:800; color:#ffffff !important;">Quick-Browse Strip Items</h3>
                    <p style="margin:2px 0 0; font-size:11.5px; color:#cbd5e1 !important; font-weight:600;">The mini horizontal browse items above the quad grid.</p>
                  </div>
                  <button type="button" class="ap-btn primary" id="ap-add-quick-browse-btn" style="padding:5px 12px; font-size:11.5px; font-weight:800; background:#2563eb; color:#ffffff !important; border-color:#1d4ed8;">+ Add</button>
                </div>
                <div class="ap-table-wrap">
                  <table class="ap-table">
                    <thead style="background:#ff9400;">
                      <tr style="background:#ff9400 !important;">
                        <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Image</th>
                        <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Title &amp; Badge</th>
                        <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Status</th>
                        <th style="text-align:right; background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300;">Actions</th>
                      </tr>
                    </thead>`
);

// 5. Container 5: Active Featured Banners Table Card
html = html.replace(
  `<div style="padding:16px 20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#000000;">Active Featured Banners</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#1e293b; font-weight:600;">Hero slider images, headlines, and category callouts shown on the homepage.</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="ap-badge gray" id="ap-banner-count-badge" style="font-weight:700; color:#000000;">0 Banners</span>
                  <button class="ap-btn primary" id="ap-cms-add-banner-btn" style="padding:6px 14px; font-size:12px; color:#ffffff !important; font-weight:800;">
                    + Add Featured Banner
                  </button>
                </div>
              </div>
              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th style="color:#000000; font-weight:800;">Image Preview</th>
                      <th style="color:#000000; font-weight:800;">Banner Headline &amp; Subtitle</th>
                      <th style="color:#000000; font-weight:800;">Tag Badge</th>
                      <th style="color:#000000; font-weight:800;">Destination Link</th>
                      <th style="color:#000000; font-weight:800;">Order</th>
                      <th style="color:#000000; font-weight:800;">Status</th>
                      <th style="text-align:right; color:#000000; font-weight:800;">Actions</th>
                    </tr>
                  </thead>`,
  `<div class="ap-card-header" style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#ffffff !important;">Active Featured Banners</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#cbd5e1 !important; font-weight:600;">Hero slider images, headlines, and category callouts shown on the homepage.</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="ap-badge gray" id="ap-banner-count-badge" style="font-weight:700; background:#0f2744 !important; color:#93c5fd !important; border:1px solid #1e40af !important;">0 Banners</span>
                  <button class="ap-btn primary" id="ap-cms-add-banner-btn" style="padding:6px 14px; font-size:12px; color:#ffffff !important; font-weight:800; background:#2563eb; border-color:#1d4ed8;">
                    + Add Featured Banner
                  </button>
                </div>
              </div>
              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead style="background:#ff9400;">
                    <tr style="background:#ff9400 !important;">
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Image Preview</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Banner Headline &amp; Subtitle</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Tag Badge</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Destination Link</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Order</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Status</th>
                      <th style="text-align:right; color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Actions</th>
                    </tr>
                  </thead>`
);

// 6. Container 6: Promotional Offers, Bank Cards & UPI Vouchers
html = html.replace(
  `<div style="padding:16px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#000000;">Promotional Offers, Bank Cards &amp; Vouchers</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#1e293b; font-weight:600;">Manage storewide vouchers, bank instant discounts, UPI cashback, and store-specific campaigns.</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="ap-badge green" id="ap-promo-count-badge" style="font-weight:700;">0 Offers</span>
                  <button class="ap-btn primary" id="ap-cms-add-promo-btn" style="background:#ea580c; border-color:#c2410c; padding:6px 14px; font-size:12px; color:#000000; font-weight:800;">
                    + Create Offer / Voucher
                  </button>
                </div>
              </div>`,
  `<div class="ap-card-header" style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#ffffff !important;">Promotional Offers, Bank Cards &amp; Vouchers</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#cbd5e1 !important; font-weight:600;">Manage storewide vouchers, bank instant discounts, UPI cashback, and store-specific campaigns.</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="ap-badge green" id="ap-promo-count-badge" style="font-weight:700; background:#064e3b !important; color:#6ee7b7 !important; border:1px solid #059669 !important;">0 Offers</span>
                  <button class="ap-btn primary" id="ap-cms-add-promo-btn" style="background:#ea580c; border-color:#c2410c; padding:6px 14px; font-size:12px; color:#ffffff !important; font-weight:800;">
                    + Create Offer / Voucher
                  </button>
                </div>
              </div>`
);

// Toolbar in Container 6: #ff9400 background
html = html.replace(
  `<div class="ap-cms-toolbar">`,
  `<div class="ap-cms-toolbar" style="background:#ff9400; border-bottom:1.5px solid #e08300;">`
);

// Pills in Container 6:
html = html.replace(
  `<div class="ap-cms-pills">
                  <button type="button" class="ap-cms-pill active" data-filter="all">All Offers (0)</button>
                  <button type="button" class="ap-cms-pill" data-filter="voucher">Vouchers (0)</button>
                  <button type="button" class="ap-cms-pill" data-filter="bank">Bank Cards (0)</button>
                  <button type="button" class="ap-cms-pill" data-filter="upi">UPI Offers (0)</button>
                  <button type="button" class="ap-cms-pill" data-filter="store">Store-Specific (0)</button>
                </div>`,
  `<div class="ap-cms-pills">
                  <button type="button" class="ap-cms-pill active" data-filter="all" style="background:#022f43 !important; color:#ffffff !important; border-color:#022f43 !important; font-weight:800;">All Offers (0)</button>
                  <button type="button" class="ap-cms-pill" data-filter="voucher" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Vouchers (0)</button>
                  <button type="button" class="ap-cms-pill" data-filter="bank" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Bank Cards (0)</button>
                  <button type="button" class="ap-cms-pill" data-filter="upi" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">UPI Offers (0)</button>
                  <button type="button" class="ap-cms-pill" data-filter="store" style="background:#ffffff; color:#000000; border:1px solid rgba(0,0,0,0.15); font-weight:700;">Store-Specific (0)</button>
                </div>`
);

// Search inputs in Container 6
html = html.replace(
  `<div class="ap-cms-search-field">
                    <label for="ap-cms-store-search-input" class="ap-cms-label" style="color:#000000; font-weight:800;">Search by Store / Merchant</label>
                    <div class="ap-cms-input-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <input type="text" id="ap-cms-store-search-input" style="color:#000000; font-weight:600;" />
                      <button type="button" id="ap-cms-clear-store-search" class="ap-cms-clear-btn" style="display:none;" title="Clear store search">✕</button>
                    </div>
                  </div>

                  <!-- Offer Code & Title Search -->
                  <div class="ap-cms-search-field">
                    <label for="ap-cms-offer-search-input" class="ap-cms-label" style="color:#000000; font-weight:800;">Search Voucher / Code</label>
                    <div class="ap-cms-input-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input type="text" id="ap-cms-offer-search-input" style="color:#000000; font-weight:600;" />
                      <button type="button" id="ap-cms-clear-offer-search" class="ap-cms-clear-btn" style="display:none;" title="Clear search">✕</button>
                    </div>
                  </div>`,
  `<div class="ap-cms-search-field">
                    <label for="ap-cms-store-search-input" class="ap-cms-label" style="color:#000000; font-weight:800;">Search by Store / Merchant</label>
                    <div class="ap-cms-input-box" style="background:#ffffff; border-radius:6px; border:1px solid #cbd5e1;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <input type="text" id="ap-cms-store-search-input" style="color:#000000; font-weight:600; background:transparent;" />
                      <button type="button" id="ap-cms-clear-store-search" class="ap-cms-clear-btn" style="display:none;" title="Clear store search">✕</button>
                    </div>
                  </div>

                  <!-- Offer Code & Title Search -->
                  <div class="ap-cms-search-field">
                    <label for="ap-cms-offer-search-input" class="ap-cms-label" style="color:#000000; font-weight:800;">Search Voucher / Code</label>
                    <div class="ap-cms-input-box" style="background:#ffffff; border-radius:6px; border:1px solid #cbd5e1;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input type="text" id="ap-cms-offer-search-input" style="color:#000000; font-weight:600; background:transparent;" />
                      <button type="button" id="ap-cms-clear-offer-search" class="ap-cms-clear-btn" style="display:none;" title="Clear search">✕</button>
                    </div>
                  </div>`
);

// Container 6 Table Head
html = html.replace(
  `<div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th style="color:#000000; font-weight:800;">Voucher Code &amp; Type</th>
                      <th style="color:#000000; font-weight:800;">Offer Title &amp; Terms</th>
                      <th style="color:#000000; font-weight:800;">Scope / Target Store</th>
                      <th style="color:#000000; font-weight:800;">Discount Rate</th>
                      <th style="color:#000000; font-weight:800;">Min Bag Value</th>
                      <th style="color:#000000; font-weight:800;">Bank / UPI Partner</th>
                      <th style="color:#000000; font-weight:800;">Duration / Expiry</th>
                      <th style="color:#000000; font-weight:800;">Status</th>
                      <th style="text-align:right; color:#000000; font-weight:800;">Actions</th>
                    </tr>
                  </thead>`,
  `<div class="ap-table-wrap">
                <table class="ap-table">
                  <thead style="background:#ff9400;">
                    <tr style="background:#ff9400 !important;">
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Voucher Code &amp; Type</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Offer Title &amp; Terms</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Scope / Target Store</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Discount Rate</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Min Bag Value</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Bank / UPI Partner</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Duration / Expiry</th>
                      <th style="color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Status</th>
                      <th style="text-align:right; color:#000000 !important; font-weight:800; background:#ff9400 !important; border-bottom:1.5px solid #e08300;">Actions</th>
                    </tr>
                  </thead>`
);

const outHtml = path.resolve(__dirname, 'preview_cms_color_applied.html');
fs.writeFileSync(outHtml, html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPngDesktop = path.resolve(__dirname, 'cms_colors_desktop.png');
const outPngFull = path.resolve(__dirname, 'cms_colors_full.png');
const outPngMobile = path.resolve(__dirname, 'cms_colors_mobile.png');

console.log('Capturing desktop screenshot...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1200,1000 --screenshot="${outPngDesktop}" "file://${outHtml}"`);

console.log('Capturing full page screenshot...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1200,2200 --screenshot="${outPngFull}" "file://${outHtml}"`);

console.log('Capturing mobile screenshot...');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outPngMobile}" "file://${outHtml}"`);

console.log('Done! Screenshots saved to:', outPngDesktop, outPngFull, outPngMobile);

