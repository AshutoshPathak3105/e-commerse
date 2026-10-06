const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_staff_edit_btn.html');
const outPngDesktop = path.resolve(__dirname, 'staff_edit_btn_desktop.png');
const outPngMobile = path.resolve(__dirname, 'staff_edit_btn_mobile.png');

const RBAC_MODULES = [
  { id: 'Orders',    name: 'Orders\u00a0& Fulfillment' },
  { id: 'Catalog',   name: 'Products\u00a0& Inventory' },
  { id: 'Stores',    name: 'Merchant Stores' },
  { id: 'CMS',       name: 'CMS\u00a0& Promotions' },
  { id: 'Users',     name: 'Customer Directory' },
  { id: 'Analytics', name: 'Analytics\u00a0& Revenue' },
  { id: 'Settings',  name: 'Platform Settings' },
  { id: 'Staff',     name: 'Staff\u00a0& Security' }
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staff Edit Button & Checkboxes Test</title>
  <link rel="stylesheet" href="../styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      background: #f1f5f9;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
  </style>
</head>
<body id="admin-panel-overlay" class="ap-open">
  <div class="ap-staff-window" style="max-width: 1000px; margin: 0 auto;">
    <!-- Granular Permissions Matrix -->
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-weight:800; color:#0f172a; font-size:12.5px;">Authorized Operational Modules (Granular Access):</div>
          <div style="font-size:11px; color:#64748b; font-weight:600;">Module-level security authorization granted to this staff account</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button type="button" id="ap-perm-select-all" class="ap-btn-tiny" style="background:#022f43 !important; border:1px solid #011f2d !important; color:#ffffff !important; font-size:11px; font-weight:800 !important; padding:5px 12px; border-radius:6px; cursor:pointer;">Select All</button>
          <button type="button" id="ap-perm-clear-all" class="ap-btn-tiny" style="background:#022f43 !important; border:1px solid #011f2d !important; color:#ffffff !important; font-size:11px; font-weight:800 !important; padding:5px 12px; border-radius:6px; cursor:pointer;">Clear</button>
        </div>
      </div>

      <div id="ap-staff-perms-grid" class="ap-perms-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:8px;">
        ${RBAC_MODULES.map(m => `
          <label class="ap-perm-item" style="display:flex; align-items:center; gap:8px; background:#ffffff; border:1px solid #cbd5e1; border-radius:7px; padding:9px 12px; cursor:pointer; transition:all 0.15s; user-select:none;">
            <input type="checkbox" class="ap-perm-checkbox" value="${m.id}" style="accent-color:#ff9400; width:15px; height:15px; cursor:pointer;" />
            <span style="font-size:12.5px; font-weight:700; color:#0f172a;">${m.name}</span>
          </label>
        `).join('')}
      </div>
    </div>

    <!-- Staff Directory Table Card -->
    <div class="ap-table-card" style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.04);">
      <!-- Table Header Toolbar -->
      <div class="ap-staff-toolbar" style="padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.15); background:#022f43 !important; color:#ffffff !important; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div class="ap-staff-search-wrap" style="display:flex; align-items:center; gap:8px; flex:1; min-width:240px; max-width:440px;">
          <input type="text" id="ap-staff-search-input" placeholder="Search staff by name, email, or role..." style="width:100%; padding:9px 14px; border:1.5px solid rgba(255,255,255,0.25); border-radius:7px; font-size:13px; font-weight:600; outline:none; background:#ffffff; color:#0f172a;" />
        </div>
        <div class="ap-staff-filters-row" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <div class="ap-staff-filter-item" style="display:flex; align-items:center; gap:8px;">
            <span class="ap-staff-filter-label" style="font-size:12px; font-weight:800; color:#ffffff !important;">Role:</span>
            <select id="ap-staff-filter-role" style="padding:7px 12px; border:1.5px solid rgba(255,255,255,0.25); border-radius:6px; font-size:12px; font-weight:700; color:#0f172a; outline:none; background:#ffffff; cursor:pointer;">
              <option value="all">All Roles</option>
            </select>
          </div>
          <div class="ap-staff-filter-item" style="display:flex; align-items:center; gap:8px;">
            <span class="ap-staff-filter-label" style="font-size:12px; font-weight:800; color:#ffffff !important;">Status:</span>
            <select id="ap-staff-filter-status" style="padding:7px 12px; border:1.5px solid rgba(255,255,255,0.25); border-radius:6px; font-size:12px; font-weight:700; color:#0f172a; outline:none; background:#ffffff; cursor:pointer;">
              <option value="all">All States</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table Head & Rows -->
      <table class="ap-table" style="width:100%; border-collapse:collapse;">
        <thead style="background:#ff9400 !important;">
          <tr style="background:#ff9400 !important;">
            <th style="padding:12px 16px; text-align:left; font-size:11.5px; font-weight:800; color:#000000 !important; background:#ff9400 !important;">Staff Member</th>
            <th style="padding:12px 16px; text-align:left; font-size:11.5px; font-weight:800; color:#000000 !important; background:#ff9400 !important;">Role &amp; Permissions</th>
            <th style="padding:12px 16px; text-align:center; font-size:11.5px; font-weight:800; color:#000000 !important; background:#ff9400 !important;">Account Status</th>
            <th style="padding:12px 16px; text-align:right; font-size:11.5px; font-weight:800; color:#000000 !important; background:#ff9400 !important;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px 16px; font-weight:700; color:#0f172a;">Aarav Sharma</td>
            <td style="padding:12px 16px; color:#475569;">Operations Lead (4 modules)</td>
            <td style="padding:12px 16px; text-align:center;"><span style="color:#15803d; font-weight:700;">Active</span></td>
            <td style="padding:12px 16px; text-align:right;">
              <div style="display:flex; justify-content:flex-end; gap:6px;">
                <button class="ap-btn-tiny ap-edit-staff-btn" title="Edit staff member permissions" style="background:#022f43 !important; background-color:#022f43 !important; color:#ffffff !important; border:1px solid #022f43 !important; border-color:#022f43 !important; font-size:11px; font-weight:800 !important; padding:4px 9px; border-radius:5px; cursor:pointer;">Edit</button>
                <button class="ap-btn-tiny ap-btn-danger ap-delete-staff-btn" title="Revoke staff account" style="background:#ff9400 !important; color:#000000 !important; border:1px solid #e08300 !important; font-size:11px; font-weight:800 !important; padding:4px 9px; border-radius:5px; cursor:pointer;">Revoke</button>
              </div>
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px 16px; font-weight:700; color:#0f172a;">Raj (Super Administrator)</td>
            <td style="padding:12px 16px; color:#475569;">Super Administrator (All modules)</td>
            <td style="padding:12px 16px; text-align:center;"><span style="color:#15803d; font-weight:700;">Active</span></td>
            <td style="padding:12px 16px; text-align:right;">
              <div style="display:flex; justify-content:flex-end; gap:6px;">
                <button class="ap-btn-tiny ap-edit-staff-btn" title="Edit staff member permissions" style="background:#022f43 !important; background-color:#022f43 !important; color:#ffffff !important; border:1px solid #022f43 !important; border-color:#022f43 !important; font-size:11px; font-weight:800 !important; padding:4px 9px; border-radius:5px; cursor:pointer;">Edit</button>
                <button class="ap-btn-tiny ap-btn-danger ap-delete-staff-btn" title="Revoke staff account" style="background:#ff9400 !important; color:#000000 !important; border:1px solid #e08300 !important; font-size:11px; font-weight:800 !important; padding:4px 9px; border-radius:5px; cursor:pointer;">Revoke</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Table Footer with #022f43 background -->
      <div class="ap-table-footer ap-staff-table-footer" style="padding:14px 18px; border-top:1px solid rgba(255,255,255,0.15); background:#022f43 !important; color:#ffffff !important; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <span style="font-size:12px; color:#ffffff !important; font-weight:600;">
          Showing <strong style="color:#ffffff !important; font-weight:800;">2</strong> of <strong style="color:#ffffff !important; font-weight:800;">2</strong> team members
        </span>
        <span style="font-size:11px; color:#94a3b8 !important; font-weight:700;">Human Resources (HR) Governance &amp; RBAC Access Controller</span>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');

const cmdDesktop = `"${chromePath}" --headless=new --disable-gpu --window-size=1100,750 --screenshot="${outPngDesktop}" "file://${htmlPath}"`;
execSync(cmdDesktop);
console.log('Saved desktop screenshot to', outPngDesktop);

const cmdMobile = `"${chromePath}" --headless=new --disable-gpu --window-size=480,850 --screenshot="${outPngMobile}" "file://${htmlPath}"`;
execSync(cmdMobile);
console.log('Saved mobile screenshot to', outPngMobile);
