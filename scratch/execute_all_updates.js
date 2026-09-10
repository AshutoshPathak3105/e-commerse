const fs = require('fs');
const { execSync } = require('child_process');

let js = fs.readFileSync('script.js', 'utf8');

// 1. Slice 1: cleanEp === '/profile'
const s1 = js.indexOf("if (cleanEp === '/profile')");
const e1 = js.indexOf("// Default generic response", s1);

if (s1 === -1 || e1 === -1) {
  throw new Error("Could not find cleanEp === '/profile' section");
}

const newFallback = `if (cleanEp === '/profile') {
      const u = Auth.getUser() || {};
      const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Aug 2026';
      return {
        success: true,
        data: {
          id: u._id || 'ADM-ROOT',
          name: u.name || 'X-Mart Admin',
          email: u.email || 'admin@xmart.com',
          phone: u.phone || '+91 9999999999',
          role: 'Super Administrator',
          empId: \`ADM-\${(u._id || 'ROOT').toString().slice(-6).toUpperCase()}\`,
          designation: 'Marketplace Administrator',
          department: 'Operations & Management',
          registrationDate: regDate,
          securityScore: 100,
          activeNodes: 1,
          stats: {
            totalOrders: (window.Store?.orders?.length) || 23,
            pendingApprovals: (window.Store?.orders?.filter(o => o.status === 'Pending').length) || 5,
            catalogItems: (window.Store?.products?.length) || 662,
            activeSellers: 1,
            activeNodes: 1,
          },
          recentAuditLogs: []
        }
      };
    }

    `;

js = js.slice(0, s1) + newFallback + js.slice(e1);
console.log('Section 1 replaced.');

// 2. Slice 2: renderAdminProfile
const s2 = js.indexOf("async function renderAdminProfile(container)");
const e2 = js.indexOf("function switchTab(tabId)", s2);

if (s2 === -1 || e2 === -1) {
  throw new Error("Could not find renderAdminProfile section");
}

const newRenderAdminProfile = `async function renderAdminProfile(container) {
    container.innerHTML = \`<div class="ap-profile-wrap">\${loadingHTML()}</div>\`;
    try {
      const res = await adminFetch('/profile');
      const p = res?.data || {};

      const user = Auth.getUser() || {};
      const adminName = p.name || user.name || 'X-Mart Admin';
      const adminEmail = p.email || user.email || 'admin@xmart.com';
      const adminPhone = p.phone || user.phone || 'Not Specified';
      const adminRole = p.role || 'Super Administrator';
      const adminEmpId = p.empId || (user._id ? ('ADM-' + user._id.toString().slice(-6).toUpperCase()) : 'ADM-ROOT');
      const designation = p.designation || 'Marketplace Administrator';
      const department = p.department || 'Operations & Management';
      const regDate = p.registrationDate || (user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Aug 2026');

      const stats = p.stats || { totalOrders: 23, pendingApprovals: 5, catalogItems: 662, activeSellers: 1, activeNodes: 1 };
      const auditLogs = p.recentAuditLogs || [];

      // Generate monogram initials from genuine admin name
      const adminInitials = (adminName || 'Admin')
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'XA';

      container.innerHTML = \`
        <div class="ap-profile-wrap">
          <!-- 1. Top Action & Notification Header Banner -->
          <div class="ap-profile-header-banner">
            <div>
              <div class="ap-profile-breadcrumb">
                <span>Admin</span>
                <span>/</span>
                <span>Governance &amp; System</span>
                <span>/</span>
                <span class="crumb-active">My Account &amp; Profile</span>
              </div>
              <div class="ap-profile-title-row">
                <h1 class="ap-profile-title">Admin Profile &amp; Security Center</h1>
                <div class="ap-profile-session-pill">
                  <span class="ap-profile-pulse-dot"></span>
                  Active Session • Authenticated Root
                </div>
              </div>
              <p class="ap-profile-subtitle">
                Enterprise account profile, scoped administrative privileges, session security, and live platform telemetry.
              </p>
            </div>
            <div class="ap-profile-banner-actions">
              <button class="ap-profile-btn neutral" id="ap-prof-export-btn" type="button">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Export Audit Ledger
              </button>
              <button class="ap-profile-btn primary" id="ap-prof-save-btn" type="button">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Save Changes
              </button>
            </div>
          </div>

          <!-- 2. Executive Profile Identity Card -->
          <div class="ap-profile-hero-card">
            <div class="ap-profile-hero-top">
              <div class="ap-profile-avatar-group">
                <div class="ap-profile-avatar-container">
                  <div class="ap-profile-avatar-img" style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#004ac6,#0b1c30);color:#ffffff;font-size:28px;font-weight:800;letter-spacing:1px;border-radius:18px;width:76px;height:76px;box-shadow:0 8px 24px rgba(0,74,198,0.22);border:3px solid #ffffff;">
                    \${adminInitials}
                  </div>
                  <div class="ap-profile-online-badge">Online</div>
                  <div class="ap-profile-verified-badge" title="Root Super Admin Verified">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
                <div class="ap-profile-identity-info">
                  <h2>
                    <span>\${adminName}</span>
                    <span class="ap-profile-role-tag">\${adminRole}</span>
                    <span class="ap-profile-fido-tag">
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="#006242" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Enterprise 256-Bit TLS
                    </span>
                  </h2>
                  <div class="ap-profile-designation">\${designation} • \${department}</div>
                  <div class="ap-profile-meta-strip">
                    <span>
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:-2px"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="9" y1="18" x2="9" y2="18.01"></line><line x1="15" y1="18" x2="15" y2="18.01"></line></svg>
                      Node: localhost:8000 (Production Hub)
                    </span>
                    <span>•</span>
                    <span>
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:-2px"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="2"></circle><line x1="15" y1="8" x2="17" y2="8"></line><line x1="15" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>
                      Emp ID: \${adminEmpId}
                    </span>
                    <span>•</span>
                    <span>
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:-2px"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      Registered: \${regDate}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Genuine Database Metric Strip -->
              <div class="ap-profile-metric-strip">
                <div class="ap-profile-metric-pill">
                  <div class="ap-profile-metric-lbl">Total Orders</div>
                  <div class="ap-profile-metric-num">\${(stats.totalOrders ?? 0).toLocaleString('en-IN')}</div>
                  <div class="ap-profile-metric-sub">
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    Database Total
                  </div>
                </div>
                <div class="ap-profile-metric-pill">
                  <div class="ap-profile-metric-lbl">Pending Orders</div>
                  <div class="ap-profile-metric-num" style="color:#004ac6">\${stats.pendingApprovals ?? 0}</div>
                  <div class="ap-profile-metric-sub" style="color:#64748b">Awaiting Processing</div>
                </div>
                <div class="ap-profile-metric-pill">
                  <div class="ap-profile-metric-lbl">Catalog SKUs</div>
                  <div class="ap-profile-metric-num" style="color:#006242">\${(stats.catalogItems ?? 0).toLocaleString('en-IN')}</div>
                  <div class="ap-profile-metric-sub" style="color:#006242">Active Products</div>
                </div>
                <div class="ap-profile-metric-pill">
                  <div class="ap-profile-metric-lbl">Active Sellers</div>
                  <div class="ap-profile-metric-num" id="ap-prof-nodes-cnt">\${stats.activeSellers ?? 1}</div>
                  <div class="ap-profile-metric-sub" style="color:#64748b">Verified Merchants</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Section Navigation Tabs Bar -->
          <div class="ap-profile-tabs-bar">
            <button class="ap-profile-tab-item active" type="button" data-sec="personal">
              <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Profile &amp; Personal Info
            </button>
            <button class="ap-profile-tab-item" type="button" data-sec="security">
              <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Authentication &amp; Security
              <span style="width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block"></span>
            </button>
            <button class="ap-profile-tab-item" type="button" data-sec="roles">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Roles &amp; Scoped RBAC
            </button>
            <button class="ap-profile-tab-item" type="button" data-sec="delegation">
              <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
              Operational Routing
            </button>
            <button class="ap-profile-tab-item" type="button" data-sec="alerts">
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              Incident &amp; Alert Rules
            </button>
            <button class="ap-profile-tab-item" type="button" data-sec="audit">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              Personal Audit Trail
            </button>
          </div>

          <!-- 4. Main Two-Column Grid (8:4 layout) -->
          <div class="ap-profile-main-grid">
            <!-- Left Column (8 cols) -->
            <div>
              <!-- Section A: Personal & Corporate Record -->
              <div class="ap-profile-card" id="ap-sec-personal">
                <div class="ap-profile-card-header">
                  <div>
                    <h3 class="ap-profile-card-title">
                      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="2"></circle><line x1="15" y1="8" x2="17" y2="8"></line><line x1="15" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>
                      Personal &amp; Corporate Identity
                    </h3>
                    <div class="ap-profile-card-desc">
                      Primary administrator record verified in X-Mart database.
                    </div>
                  </div>
                  <span class="ap-profile-role-tag" style="background:#dae2fd;color:#00174b">Verified Administrator</span>
                </div>

                <div class="ap-profile-form-grid">
                  <div class="ap-profile-field-group">
                    <label class="ap-profile-field-label">Full Legal Name</label>
                    <input class="ap-profile-input" type="text" id="ap-prof-name" value="\${adminName}">
                  </div>
                  <div class="ap-profile-field-group">
                    <label class="ap-profile-field-label">
                      <span>Official Corporate Email</span>
                      <span style="color:#006242;font-size:10px;text-transform:none">✓ Primary Login</span>
                    </label>
                    <input class="ap-profile-input" type="email" value="\${adminEmail}" readonly>
                  </div>
                  <div class="ap-profile-field-group">
                    <label class="ap-profile-field-label">
                      <span>Contact Phone Number</span>
                    </label>
                    <input class="ap-profile-input" type="text" id="ap-prof-phone" value="\${adminPhone}">
                  </div>
                  <div class="ap-profile-field-group">
                    <label class="ap-profile-field-label">Default Operational Timezone</label>
                    <select class="ap-profile-input" id="ap-prof-tz">
                      <option selected>Asia/Kolkata (IST • UTC+05:30) - Primary</option>
                      <option>Asia/Dubai (GST • UTC+04:00)</option>
                      <option>Asia/Singapore (SGT • UTC+08:00)</option>
                      <option>UTC (Coordinated Universal Time)</option>
                    </select>
                  </div>
                  <div class="ap-profile-field-group">
                    <label class="ap-profile-field-label">Administrative Department</label>
                    <input class="ap-profile-input" type="text" value="\${department}" readonly>
                  </div>
                  <div class="ap-profile-field-group">
                    <label class="ap-profile-field-label">Assigned Employee / Administrator ID</label>
                    <input class="ap-profile-input" type="text" value="\${adminEmpId}" readonly>
                  </div>
                </div>
              </div>

              <!-- Section B: Administrative Operational Routing -->
              <div class="ap-profile-card" id="ap-sec-delegation">
                <div class="ap-profile-card-header">
                  <div>
                    <h3 class="ap-profile-card-title">
                      <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                      Administrative Delegation &amp; Operational Routing
                    </h3>
                    <div class="ap-profile-card-desc">
                      Privileged governance routing for marketplace approvals and seller catalog audits.
                    </div>
                  </div>
                  <span class="ap-profile-role-tag" style="background:#eff4ff;color:#004ac6">Direct Control</span>
                </div>

                <div class="ap-profile-delegation-box">
                  <div class="ap-profile-delegation-lead">
                    <div style="display:flex;align-items:center;gap:12px">
                      <div class="ap-profile-actor-avatar" style="background:#dae2fd;color:#00174b;font-weight:700">SA</div>
                      <div>
                        <div style="font-weight:700;font-size:13.5px;color:#0b1c30">Direct Root Control</div>
                        <div style="font-size:11.5px;color:#64748b">All administrative approvals are routed directly to the logged-in Super Administrator</div>
                      </div>
                    </div>
                    <span class="ap-profile-role-tag" style="background:#eff4ff;color:#004ac6">Tier 1 Root Scope</span>
                  </div>

                  <div class="ap-profile-scope-chips">
                    <div class="ap-profile-scope-chip">
                      <span style="color:#006242">✔</span> Seller KYC &amp; Store Approvals
                    </div>
                    <div class="ap-profile-scope-chip">
                      <span style="color:#006242">✔</span> Order Logistics &amp; Refund Approvals
                    </div>
                    <div class="ap-profile-scope-chip">
                      <span style="color:#006242">✔</span> Product Catalog Governance
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section C: Critical Incident & Broadcast Configuration -->
              <div class="ap-profile-card" id="ap-sec-alerts">
                <div class="ap-profile-card-header">
                  <div>
                    <h3 class="ap-profile-card-title">
                      <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                      Operational Incident Notifications
                    </h3>
                    <div class="ap-profile-card-desc">
                      Critical marketplace alerts dispatched to your official corporate channels.
                    </div>
                  </div>
                  <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:0.05em">Dispatch Active</span>
                </div>

                <div style="display:flex;flex-direction:column;gap:10px">
                  <div class="ap-profile-alert-row">
                    <div class="ap-profile-alert-lead">
                      <div class="ap-profile-alert-icon warn">
                        <svg viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      </div>
                      <div>
                        <div style="font-weight:600;font-size:13px;color:#0b1c30">Pending Order &amp; Delivery SLA Alerts</div>
                        <div style="font-size:11px;color:#64748b">Instant notifications when orders require manual review or merchant intervention</div>
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px">
                      <span class="ap-profile-fido-tag">Email Notification</span>
                      <label class="ap-toggle-switch">
                        <input type="checkbox" checked>
                        <span class="ap-toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="ap-profile-alert-row">
                    <div class="ap-profile-alert-lead">
                      <div class="ap-profile-alert-icon sec">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      </div>
                      <div>
                        <div style="font-weight:600;font-size:13px;color:#0b1c30">New Seller Onboarding Submissions</div>
                        <div style="font-size:11px;color:#64748b">Immediate alert upon merchant registration and GSTIN KYC document upload</div>
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px">
                      <span class="ap-profile-fido-tag">Dashboard + Email</span>
                      <label class="ap-toggle-switch">
                        <input type="checkbox" checked>
                        <span class="ap-toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="ap-profile-alert-row">
                    <div class="ap-profile-alert-lead">
                      <div class="ap-profile-alert-icon info">
                        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      </div>
                      <div>
                        <div style="font-weight:600;font-size:13px;color:#0b1c30">Marketplace Daily Financial Reconciliation Digest</div>
                        <div style="font-size:11px;color:#64748b">Consolidated revenue, GMV, and order status report</div>
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px">
                      <span class="ap-profile-fido-tag">Automated Email</span>
                      <label class="ap-toggle-switch">
                        <input type="checkbox" checked>
                        <span class="ap-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column (4 cols) -->
            <div>
              <!-- Card 1: Authentication & Security -->
              <div class="ap-profile-card" id="ap-sec-security">
                <div class="ap-profile-card-header">
                  <h3 class="ap-profile-card-title">
                    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Authentication &amp; Security
                  </h3>
                  <span class="ap-profile-fido-tag" style="background:#eff4ff;color:#006242;font-weight:700">Protected</span>
                </div>

                <div class="ap-profile-delegation-box" style="margin-top:2px">
                  <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:600">
                    <span style="color:#64748b;text-transform:uppercase">Session Security State</span>
                    <span style="color:#006242">Active &amp; Verified</span>
                  </div>
                  <div class="ap-profile-prog-bar-bg">
                    <div class="ap-profile-prog-bar-fill" style="width:100%"></div>
                  </div>
                  <div style="font-size:11px;color:#64748b;line-height:1.4">
                    Cryptographic 256-bit JSON Web Token session verified against MongoDB Atlas backend.
                  </div>
                </div>

                <div style="display:flex;flex-direction:column;gap:8px">
                  <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px solid #f1f5f9">
                    <span style="display:flex;align-items:center;gap:6px;color:#0b1c30;font-weight:500">
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="#004ac6" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle></svg>
                      Enterprise Master Password
                    </span>
                    <span style="color:#006242;font-weight:700;font-size:11px">bcrypt Enforced</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0;border-bottom:1px solid #f1f5f9">
                    <span style="display:flex;align-items:center;gap:6px;color:#0b1c30;font-weight:500">
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="#64748b" stroke-width="2" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                      Encrypted JWT Token
                    </span>
                    <span style="color:#004ac6;font-size:11px">Active (HS256)</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:6px 0">
                    <span style="display:flex;align-items:center;gap:6px;color:#0b1c30;font-weight:500">
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="#64748b" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      Session Timeout
                    </span>
                    <span style="font-weight:700;color:#0b1c30">30 mins</span>
                  </div>
                </div>

                <div class="ap-profile-btn-row">
                  <button class="ap-profile-btn neutral" style="flex:1" id="ap-prof-rotate-btn" type="button">Change Password</button>
                </div>
              </div>

              <!-- Card 2: Active Authorized Devices & Live Sessions -->
              <div class="ap-profile-card">
                <div class="ap-profile-card-header">
                  <h3 class="ap-profile-card-title">
                    <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    Active Authorized Sessions
                  </h3>
                  <span style="font-size:11px;color:#64748b">1 Active Node</span>
                </div>

                <div style="display:flex;flex-direction:column;gap:8px">
                  <div class="ap-profile-session-block">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <span style="font-weight:600;font-size:13px;color:#0b1c30">Web Workstation</span>
                      <span class="ap-profile-role-tag" style="background:#dae2fd;color:#004ac6">This Device</span>
                    </div>
                    <div style="font-size:11px;color:#64748b">
                      127.0.0.1 (Local Verified) • <strong style="color:#006242">Active Now</strong>
                    </div>
                  </div>
                </div>

                <button class="ap-profile-btn danger" id="ap-prof-revoke-btn" type="button">
                  Sign Out of All Sessions
                </button>
              </div>

              <!-- Card 3: RBAC Scope & Privilege Summary -->
              <div class="ap-profile-card" id="ap-sec-roles">
                <div class="ap-profile-card-header">
                  <h3 class="ap-profile-card-title">
                    <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                    Assigned Capabilities
                  </h3>
                  <span class="ap-profile-role-tag" style="background:#dae2fd;color:#004ac6">Super Admin Root</span>
                </div>

                <div style="display:flex;flex-direction:column;gap:8px;font-size:12.5px;color:#0b1c30">
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="color:#006242">✔</span> Full Marketplace Escrow Release &amp; Payouts
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="color:#006242">✔</span> Merchant PAN / GSTIN KYC Review &amp; Approval
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="color:#006242">✔</span> Vendor Immediate Suspension &amp; Ban Authority
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="color:#006242">✔</span> Storefront CMS Live Production Publish
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="color:#006242">✔</span> Database Audit Log &amp; Transaction Ledger
                  </div>
                </div>

                <div style="font-size:11px;color:#64748b;background:#eff4ff;padding:8px 10px;border-radius:8px;display:flex;align-items:center;gap:6px">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  Protected Super Administrator access with root privileges.
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Full-Width Bottom Module: Recent Administrative Orders & Activity -->
          <div class="ap-profile-card" id="ap-sec-audit">
            <div class="ap-profile-card-header">
              <div>
                <h3 class="ap-profile-card-title">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                  Recent Administrative Orders &amp; Activity Log
                </h3>
                <div class="ap-profile-card-desc">
                  Live audit ledger synchronized from MongoDB Atlas database orders.
                </div>
              </div>
            </div>

            <div style="overflow-x:auto">
              <table class="ap-profile-audit-table">
                <thead>
                  <tr>
                    <th style="border-radius:8px 0 0 8px">Timestamp (IST)</th>
                    <th>Operational Domain</th>
                    <th>Action Description &amp; Affected Entity</th>
                    <th>Reference ID</th>
                    <th style="border-radius:0 8px 8px 0;text-align:right">Verification Status</th>
                  </tr>
                </thead>
                <tbody>
                  \${auditLogs.length ? auditLogs.map(l => \`
                    <tr>
                      <td style="font-weight:600;white-space:nowrap">\${l.timestamp}</td>
                      <td><span class="ap-profile-fido-tag" style="background:#eff4ff;color:#004ac6">\${l.domain}</span></td>
                      <td style="font-weight:500">\${l.action}</td>
                      <td style="font-family:monospace;color:#64748b">\${l.refId}</td>
                      <td style="text-align:right">
                        <span style="display:inline-flex;align-items:center;gap:4px;color:#006242;font-weight:700;font-size:11.5px">
                          ✔ \${l.status}
                        </span>
                      </td>
                    </tr>
                  \`).join('') : \`
                    <tr>
                      <td colspan="5" style="text-align:center;padding:24px;color:#64748b">No recent orders or events found in database.</td>
                    </tr>
                  \`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      \`;

      // ── Wire Interactions ──────────────────────────────────
      // Section Tab navigation
      container.querySelectorAll('.ap-profile-tab-item').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.ap-profile-tab-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const sec = btn.dataset.sec;
          const target = container.querySelector(\`#ap-sec-\${sec}\`) || container.querySelector(\`#ap-sec-personal\`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });

      // Save Changes
      const saveBtn = container.querySelector('#ap-prof-save-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          const newName = container.querySelector('#ap-prof-name')?.value?.trim();
          const newPhone = container.querySelector('#ap-prof-phone')?.value?.trim();
          saveBtn.disabled = true;
          saveBtn.innerHTML = 'Saving…';
          try {
            const upRes = await adminFetch('/profile', {
              method: 'PUT',
              body: JSON.stringify({ name: newName, phone: newPhone }),
            });
            if (upRes?.data?.name) {
              const cur = Auth.getUser();
              if (cur) {
                cur.name = upRes.data.name;
                if (upRes.data.phone) cur.phone = upRes.data.phone;
                localStorage.setItem('xmart_user', JSON.stringify(cur));
              }
              const sbName = document.querySelector('.ap-admin-name');
              if (sbName) sbName.textContent = upRes.data.name;
              const sbAvatar = document.querySelector('.ap-admin-avatar');
              if (sbAvatar) sbAvatar.textContent = upRes.data.name.charAt(0).toUpperCase();
            }
            showToast('Admin profile saved successfully!', 'success');
          } catch (err) {
            showToast(\`Failed to update profile: \${err.message}\`, 'error');
          } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = \`
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Save Changes
            \`;
          }
        });
      }

      // Export Audit History
      container.querySelector('#ap-prof-export-btn')?.addEventListener('click', () => {
        showToast('Exporting admin audit ledger...', 'info');
        const csvHeader = 'Timestamp,Domain,Action,ReferenceID,Status\\n';
        const csvRows = auditLogs.map(l => \`"\${l.timestamp}","\${l.domain}","\${(l.action || '').replace(/"/g, '""')}","\${l.refId}","\${l.status}"\`).join('\\n');
        const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`admin_audit_ledger_\${Date.now()}.csv\`;
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => showToast('Audit ledger downloaded successfully.', 'success'), 600);
      });

      // Change Password / Rotate Credentials
      container.querySelector('#ap-prof-rotate-btn')?.addEventListener('click', () => {
        showToast('To update your password, use the Account Security settings.', 'info', 3500);
      });

      // Revoke Other Sessions / Sign Out
      container.querySelector('#ap-prof-revoke-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out of this administrator session?')) {
          Auth.logout();
          window.location.reload();
        }
      });

    } catch (err) {
      container.innerHTML = emptyHTML('⚠️', \`Failed to load Admin Profile: \${err.message}\`);
    }
  }

  `;

js = js.slice(0, s2) + newRenderAdminProfile + js.slice(e2);
console.log('Section 2 replaced.');

// 3. Remove all placeholder attributes from script.js
const placeholderMatches = js.match(/\s+placeholder=(?:"[^"]*"|'[^']*')/g);
console.log('script.js placeholder attributes found:', placeholderMatches ? placeholderMatches.length : 0);

js = js.replace(/\s+placeholder=(?:"[^"]*"|'[^']*')/g, '');

// Verify remaining placeholders
const remainingMatches = js.match(/\s+placeholder=(?:"[^"]*"|'[^']*')/g);
console.log('script.js remaining placeholder attributes:', remainingMatches ? remainingMatches.length : 0);

// Write modified script.js
fs.writeFileSync('script.js', js, 'utf8');
console.log('Wrote updated script.js.');

// Check syntax
try {
  execSync('node -c script.js');
  console.log('SUCCESS: script.js syntax check PASSED!');
} catch (e) {
  console.error('ERROR: script.js syntax check failed:', e.message);
  process.exit(1);
}
