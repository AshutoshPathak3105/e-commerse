// Verifies the CRM table mobile rendering using the actual table structure from script.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_crm_actual_mobile.html');
const outMobile = path.resolve(__dirname, 'crm_actual_mobile_375.png');
const outTablet = path.resolve(__dirname, 'crm_actual_tablet_768.png');
const outDesktop = path.resolve(__dirname, 'crm_actual_desktop_1200.png');

const cssContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');

const sampleUsers = [
  { _id: 'usr001abc', name: 'Ashutosh Pathak', email: 'ashutosh@example.com', phone: '9876543210', isActive: true, totalSpent: 1250, ordersCount: 14, aov: 89, tier: 'VIP Elite', metro: 'Mumbai', lastOrderDate: '2025-01-15', lastOrderId: 'XM-00123' },
  { _id: 'usr002def', name: 'Elena Rostova', email: 'elena.rostova@acme.org', phone: '9845001234', isActive: true, totalSpent: 420, ordersCount: 5, aov: 84, tier: 'Gold', metro: 'Delhi', lastOrderDate: '2025-02-01', lastOrderId: 'XM-00456' },
  { _id: 'usr003ghi', name: 'Marcus Vance', email: 'm.vance@techcorp.io', phone: null, isActive: false, totalSpent: 89, ordersCount: 1, aov: 89, tier: 'New User', metro: 'Bangalore', lastOrderDate: '2024-11-20', lastOrderId: 'XM-00789' },
  { _id: 'usr004jkl', name: 'Priya Sharma', email: 'priya.s@designhub.co', phone: '9933445566', isActive: true, totalSpent: 980, ordersCount: 9, aov: 109, tier: 'Silver', metro: 'Hyderabad', lastOrderDate: '2025-03-10', lastOrderId: 'XM-00321' },
];

function fmtPrice(n) {
  const num = Number(n) || 0;
  if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return '₹' + (num / 1000).toFixed(1) + 'K';
  return '₹' + num;
}

const rowsHTML = sampleUsers.map(u => {
  const initial = (u.name || 'U').charAt(0).toUpperCase();
  const isActive = u.isActive !== false;
  const tierCls = (u.tier || '').includes('VIP') || (u.tier || '').includes('Elite') ? 'platinum' : ((u.tier || '').includes('Gold') ? 'gold' : 'silver');
  const tierIcon = (u.tier || '').includes('VIP') || (u.tier || '').includes('Gold') ? '★ ' : '';

  return `
    <tr class="ap-crm-tr" data-id="${u._id}" style="transition:background 140ms;">
      <td style="text-align:center; width:38px;">
        <input type="checkbox" class="ap-crm-check" data-id="${u._id}" style="cursor:pointer;" />
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="ap-avatar-circle" style="width:36px; height:36px; font-size:13px; background:#eff6ff; color:#2563eb; border:2px solid #bfdbfe; flex-shrink:0;">${initial}</div>
          <div>
            <div style="font-weight:700; color:#0f172a; font-size:13px; cursor:pointer;" class="ap-open-360" data-id="${u._id}">${u.name}</div>
            <span style="font-family:monospace; font-size:11px; color:#64748b;">#CUST-${u._id.slice(-6).toUpperCase()}</span>
          </div>
        </div>
      </td>
      <td>
        <div style="line-height:1.35;">
          <div style="font-weight:600; color:#1e293b; font-size:12px;">${u.email}</div>
          <div style="font-size:11px; color:#64748b; font-family:monospace;">${u.phone || '—'}</div>
        </div>
      </td>
      <td>
        <div style="line-height:1.35;">
          <span class="ap-crm-loc-badge">${u.metro || 'India'}</span>
        </div>
      </td>
      <td>
        <span class="ap-crm-tier-pill ${tierCls}">${tierIcon}${u.tier || 'Member'}</span>
      </td>
      <td style="text-align:right; font-family:monospace; font-weight:700; color:#0f172a;">${u.ordersCount || 0}</td>
      <td style="text-align:right; font-family:monospace; font-weight:800; color:#2563eb; font-size:13px;">${fmtPrice(u.totalSpent || 0)}</td>
      <td style="text-align:right; font-family:monospace; color:#64748b; font-size:12px;">${fmtPrice(u.aov || 0)}</td>
      <td>
        <div style="line-height:1.35;">
          <div style="font-weight:600; color:#0f172a; font-size:11.5px;">${u.lastOrderDate || 'None yet'}</div>
          <div style="font-family:monospace; font-size:10px; color:#2563eb;">${u.lastOrderId ? '#' + u.lastOrderId : '—'}</div>
        </div>
      </td>
      <td>
        <span class="ap-badge ${isActive ? 'green' : 'red'}" style="display:inline-flex; align-items:center; gap:4px;">
          <span style="width:6px; height:6px; border-radius:50%; background:currentColor; display:inline-block;"></span>
          ${isActive ? 'Active' : 'Restricted'}
        </span>
      </td>
      <td style="text-align:center;">
        <div style="display:inline-flex; align-items:center; gap:5px;">
          <button class="ap-btn ap-open-360 ap-crm-act-btn" data-id="${u._id}" title="Customer 360 View">
            <svg viewBox="0 0 24 24" style="width:14px; height:14px; stroke-width:2.2; fill:none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="ap-btn ap-receipt-btn ap-crm-act-btn" data-id="${u._id}" title="Order Ledger">
            <svg viewBox="0 0 24 24" style="width:14px; height:14px; stroke-width:2.2; fill:none;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </button>
          <button class="ap-btn ap-ban-btn ap-crm-act-btn" data-id="${u._id}" data-act="${isActive}" title="${isActive ? 'Restrict' : 'Activate'}">
            ${isActive ? 'Restrict' : 'Activate'}
          </button>
        </div>
      </td>
    </tr>
  `;
}).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM Actual Mobile Verification</title>
  <style>
    ${cssContent}
  </style>
</head>
<body style="background:#f1f5f9; padding:12px; margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <!-- CRM Directory Card — must have id="ap-crm-directory-card" for responsive CSS to apply -->
  <div id="ap-crm-directory-card" class="ap-table-card">

    <!-- Tag Switcher Bar -->
    <div class="ap-crm-main-tags-bar" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; gap:12px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="font-size:11.5px; font-weight:800; text-transform:uppercase; color:#ffffff !important; letter-spacing:0.06em; display:flex; align-items:center; gap:6px;">
          CRM Directory
        </div>
        <div class="ap-toolbar-tabs" style="background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); padding:3px; border-radius:8px; display:inline-flex; gap:4px;">
          <button class="ap-tab-pill ap-main-dir-tag active" data-dir-tag="users" style="cursor:pointer;">
            Users <span class="ap-tab-count">4</span>
          </button>
          <button class="ap-tab-pill ap-main-dir-tag" data-dir-tag="admins" style="cursor:pointer;">
            Admins <span class="ap-tab-count">1</span>
          </button>
        </div>
      </div>
      <div style="font-size:12px; color:#ffffff !important; font-weight:500;">
        Viewing: <strong id="ap-crm-viewing-count" style="color:#ffffff !important;">4</strong> user profiles
      </div>
    </div>

    <!-- #ap-crm-tag-body — this is where renderActiveTagContent() injects content -->
    <div id="ap-crm-tag-body">

      <!-- User Segmentation Sub-Tabs Bar (ap-crm-sub-tabs-bar) -->
      <div class="ap-crm-sub-tabs-bar ap-crm-segment-sub-bar" style="padding:10px 18px 8px; background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div class="ap-toolbar-tabs" style="background:rgba(0,0,0,0.08); border:1px solid rgba(0,0,0,0.15); border-radius:8px; display:inline-flex; gap:4px; padding:3px;">
          <button class="ap-tab-pill ap-user-sub-tab active" data-user-seg="all">All Customers <span class="ap-tab-count">4</span></button>
          <button class="ap-tab-pill ap-user-sub-tab" data-user-seg="vip">★ VIP &amp; High Spend <span class="ap-tab-count">1</span></button>
          <button class="ap-tab-pill ap-user-sub-tab" data-user-seg="repeat">Repeat Buyers <span class="ap-tab-count">3</span></button>
          <button class="ap-tab-pill ap-user-sub-tab" data-user-seg="atrisk">New / Inactive <span class="ap-tab-count">1</span></button>
          <button class="ap-tab-pill ap-user-sub-tab" data-user-seg="cart">Cart Active <span class="ap-tab-count">0</span></button>
        </div>
        <div style="font-size:11.5px; color:#000000 !important; font-weight:800;">
          Customer Segment: <strong id="ap-crm-user-segment-text" style="color:#000000 !important; font-weight:900; text-transform:uppercase;">all</strong>
        </div>
      </div>

      <!-- Dedicated Filter Bar — uses ap-crm-users-filters-grid for responsive CSS -->
      <div style="padding:14px 18px; border-bottom:1px solid #e2e8f0; background:#ffffff;">
        <div class="ap-crm-filters-grid ap-crm-users-filters-grid" style="display:grid; grid-template-columns: 2.2fr 1.2fr 1.2fr 1.2fr 1.2fr; gap:10px; margin-bottom:10px;">
          <div style="position:relative;">
            <input class="ap-search" id="ap-crm-user-search" placeholder="Search users by name, email, phone, #CUST ID..." value="" style="width:100%; padding-right:28px;" />
          </div>
          <select class="ap-select" id="ap-crm-tier-select" style="font-size:12px;">
            <option value="">All Customer Tiers</option>
            <option value="Elite">Gold Elite / VIP</option>
            <option value="Silver">Silver Plus</option>
          </select>
          <select class="ap-select" id="ap-crm-metro-select" style="font-size:12px;">
            <option value="">All Locations</option>
            <option value="Delhi">Delhi NCR</option>
            <option value="Mumbai">Mumbai</option>
          </select>
          <select class="ap-select" id="ap-crm-spend-select" style="font-size:12px;">
            <option value="">All Spend Brackets</option>
            <option value="high">&gt; ₹50,000 GMV</option>
            <option value="mid">₹10,000 – ₹50,000</option>
          </select>
          <select class="ap-select" id="ap-crm-status-select" style="font-size:12px;">
            <option value="">All Statuses</option>
            <option value="active">Active Shoppers</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>

        <!-- Batch Action Strip -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:12px; padding-top:4px;">
          <div id="ap-crm-batch-actions-row" style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
            <span style="color:#64748b;">Selected: <strong style="color:#0f172a;" id="ap-crm-selected-count">0 profiles</strong></span>
            <span style="color:#cbd5e1;">|</span>
            <button class="ap-btn ghost" id="ap-crm-batch-tier-btn" style="padding:3px 8px; font-size:11px;">Assign Loyalty Tier</button>
            <button class="ap-btn ghost" id="ap-crm-batch-wa-btn" style="padding:3px 8px; font-size:11px;">WhatsApp Outreach</button>
            <button class="ap-btn ghost" id="ap-crm-batch-export-btn" style="padding:3px 8px; font-size:11px;">Export Selection</button>
          </div>
          <div>
            <button class="ap-btn ghost" id="ap-crm-reset-filters" style="font-size:11px; color:#2563eb; border:none; background:transparent; cursor:pointer;">Reset User Filters</button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="ap-table-wrap">
        <table class="ap-table" style="font-size:12px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b; letter-spacing:0.04em;">
              <th style="width:38px; text-align:center;"><input type="checkbox" id="ap-crm-master-check" style="cursor:pointer;" /></th>
              <th>Customer</th>
              <th>Contact &amp; Communication</th>
              <th>Primary Location</th>
              <th>Segment / Tier</th>
              <th style="text-align:right;">Orders</th>
              <th style="text-align:right;">Total Spent</th>
              <th style="text-align:right;">AOV</th>
              <th>Last Order</th>
              <th>Status</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody id="ap-crm-table-tbody">${rowsHTML}</tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="ap-table-footer" style="padding:12px 18px; display:flex; justify-content:space-between; align-items:center;">
        <span id="ap-crm-footer-count">Displaying <strong>4</strong> of <strong>4</strong> user profiles</span>
        <span style="font-size:11px; color:#94a3b8;">X-Mart CRM Customer Database</span>
      </div>

    </div><!-- end #ap-crm-tag-body -->
  </div><!-- end #ap-crm-directory-card -->

</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML written:', htmlPath);

try {
  execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=375,900 --screenshot="${outMobile}" "file://${htmlPath}"`);
  console.log('Mobile (375px):', outMobile);

  execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=768,900 --screenshot="${outTablet}" "file://${htmlPath}"`);
  console.log('Tablet (768px):', outTablet);

  execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1200,900 --screenshot="${outDesktop}" "file://${htmlPath}"`);
  console.log('Desktop (1200px):', outDesktop);
} catch (e) {
  console.error('Screenshot error:', e.message);
}
