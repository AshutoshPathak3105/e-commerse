const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_crm_responsive_verify.html');
const outPng375 = path.resolve(__dirname, 'verify_crm_375.png');
const outPng768 = path.resolve(__dirname, 'verify_crm_768.png');
const outPng1200 = path.resolve(__dirname, 'verify_crm_1200.png');

// Read styles.css to ensure actual styling is applied
const cssContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');

const sampleUsers = [
  { id: 'usr-1', name: 'Ashutosh Pathak', email: 'ashutosh@example.com', role: 'admin', isBlocked: false, createdAt: '2025-01-15', totalSpent: 1250, ordersCount: 14, segment: 'vip' },
  { id: 'usr-2', name: 'Elena Rostova', email: 'elena.rostova@acme.org', role: 'user', isBlocked: false, createdAt: '2025-02-01', totalSpent: 420, ordersCount: 5, segment: 'active' },
  { id: 'usr-3', name: 'Marcus Vance', email: 'm.vance@techcorp.io', role: 'user', isBlocked: true, createdAt: '2024-11-20', totalSpent: 89, ordersCount: 1, segment: 'restricted' },
  { id: 'usr-4', name: 'Priya Sharma', email: 'priya.s@designhub.co', role: 'user', isBlocked: false, createdAt: '2025-03-10', totalSpent: 980, ordersCount: 9, segment: 'active' }
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM Responsive Verification</title>
  <style>
    ${cssContent}
  </style>
</head>
<body style="background:#f1f5f9; padding:16px; margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width:1200px; margin:0 auto;">
    
    <!-- CRM Main Tabs Navigation -->
    <div class="ap-crm-main-tabs-bar" style="background:#0f172a; padding:12px 18px; border-radius:12px 12px 0 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-weight:900; font-size:16px; color:#ffffff;">CRM Directory</span>
      </div>
      <div class="ap-crm-main-tabs-pills" style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="ap-crm-main-tab-pill active" data-tab="users">Users Directory (4)</button>
        <button class="ap-crm-main-tab-pill" data-tab="admins">Admins & Staff (1)</button>
      </div>
    </div>

    <!-- CRM Directory Card -->
    <div id="ap-crm-directory-card" class="ap-crm-directory-card" style="background:#ffffff; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 12px 12px; box-shadow:0 4px 15px rgba(0,0,0,0.06); overflow:hidden;">
      
      <!-- Sub-Tabs Bar -->
      <div class="ap-crm-sub-tabs-bar ap-crm-segment-sub-bar" style="padding:10px 18px 8px; background:#ff9400 !important; color:#000000 !important; font-weight:800; border-bottom:1.5px solid #e08300; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div class="ap-toolbar-tabs" style="background:rgba(0,0,0,0.08); border:1px solid rgba(0,0,0,0.15); border-radius:8px; display:inline-flex; gap:4px; padding:3px;">
          <button class="ap-tab-pill ap-user-sub-tab active" data-user-seg="all">All Users <span class="ap-tab-count">4</span></button>
          <button class="ap-tab-pill ap-user-sub-tab" data-user-seg="active">Active <span class="ap-tab-count">3</span></button>
          <button class="ap-tab-pill ap-user-sub-tab" data-user-seg="vip">VIP <span class="ap-tab-count">1</span></button>
          <button class="ap-tab-pill ap-user-sub-tab" data-user-seg="restricted">Restricted <span class="ap-tab-count">1</span></button>
        </div>
        <div style="font-size:11.5px; color:#000000 !important; font-weight:800;">
          Segment: <strong id="ap-crm-user-segment-text" style="color:#000000 !important; text-transform:uppercase; font-weight:900;">ALL</strong>
        </div>
      </div>

      <!-- Dedicated Searchbar & Filters -->
      <div style="padding:14px 18px; border-bottom:1px solid #e2e8f0; background:#ffffff;">
        <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:10px; margin-bottom:10px;">
          <div style="position:relative; width:100%;">
            <input type="text" id="ap-crm-users-search" class="ap-search" placeholder="Search users by name, email, ID..." style="width:100%; box-sizing:border-box;" value="" />
          </div>
          <div>
            <select id="ap-crm-users-metro-select" class="ap-select" style="width:100%; box-sizing:border-box;">
              <option value="all">All Locations</option>
              <option value="metro">Major Metros</option>
            </select>
          </div>
          <div>
            <select id="ap-crm-users-status-select" class="ap-select" style="width:100%; box-sizing:border-box;">
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="blocked">Restricted</option>
            </select>
          </div>
        </div>

        <!-- Batch & Action Controls -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding-top:6px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <label style="display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:700; color:#334155; cursor:pointer;">
              <input type="checkbox" id="ap-crm-select-all-users" style="accent-color:#ff9400; width:16px; height:16px; cursor:pointer;" /> Select All (4)
            </label>
            <div id="ap-crm-user-batch-actions" style="display:inline-flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <button class="ap-btn-tiny ap-crm-batch-btn" style="background:#0f172a; color:#fff; border:none; padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">Bulk Email</button>
              <button class="ap-btn-tiny ap-crm-batch-btn" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">Restrict Selected</button>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="ap-btn-tiny" style="background:#f8fafc; border:1px solid #cbd5e1; color:#334155; padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">Export CSV</button>
          </div>
        </div>
      </div>

      <!-- Directory Grid of Cards -->
      <div style="padding:18px;">
        <div class="ap-crm-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:14px;">
          ${sampleUsers.map(u => `
            <div class="ap-crm-user-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; display:flex; flex-direction:column; gap:10px; box-shadow:0 1px 3px rgba(0,0,0,0.04); transition:all 0.15s ease;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:38px; height:38px; border-radius:50%; background:#ff9400; color:#000; font-weight:900; display:flex; align-items:center; justify-content:center; font-size:14px;">
                    ${u.name.charAt(0)}
                  </div>
                  <div>
                    <div style="font-weight:800; font-size:13.5px; color:#0f172a;">${u.name}</div>
                    <div style="font-size:11px; color:#64748b;">${u.email}</div>
                  </div>
                </div>
                <span class="ap-badge" style="font-size:10px; font-weight:800; padding:2px 8px; border-radius:12px; background:${u.isBlocked ? '#fee2e2' : '#dcfce7'}; color:${u.isBlocked ? '#dc2626' : '#15803d'};">
                  ${u.isBlocked ? 'RESTRICTED' : 'ACTIVE'}
                </span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:11.5px; color:#475569; border-top:1px solid #f1f5f9; padding-top:8px;">
                <span>Orders: <strong>${u.ordersCount}</strong></span>
                <span>Spent: <strong>$${u.totalSpent}</strong></span>
              </div>
              <div style="display:flex; gap:6px; margin-top:4px;">
                <button class="ap-btn-tiny" style="flex:1; background:#0f172a; color:#fff; border:none; padding:6px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">View Profile</button>
                <button class="ap-btn-tiny" style="background:#f8fafc; border:1px solid #cbd5e1; color:#334155; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Message</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');

try {
  const cmd375 = `"${chromePath}" --headless=new --disable-gpu --window-size=375,800 --screenshot="${outPng375}" "file://${htmlPath}"`;
  execSync(cmd375);
  console.log('Mobile (375px) screenshot saved:', outPng375);

  const cmd768 = `"${chromePath}" --headless=new --disable-gpu --window-size=768,800 --screenshot="${outPng768}" "file://${htmlPath}"`;
  execSync(cmd768);
  console.log('Tablet (768px) screenshot saved:', outPng768);

  const cmd1200 = `"${chromePath}" --headless=new --disable-gpu --window-size=1200,800 --screenshot="${outPng1200}" "file://${htmlPath}"`;
  execSync(cmd1200);
  console.log('Desktop (1200px) screenshot saved:', outPng1200);
} catch (e) {
  console.error('Error taking screenshots:', e.message);
}
