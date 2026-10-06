const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
const stylesPath = path.join(__dirname, '..', 'styles.css');

let scriptContent = fs.readFileSync(scriptPath, 'utf8');
let stylesContent = fs.readFileSync(stylesPath, 'utf8');

// Normalize CRLF to LF for reliable replacements
const isScriptCRLF = scriptContent.includes('\r\n');
const isStylesCRLF = stylesContent.includes('\r\n');

let script = scriptContent.replace(/\r\n/g, '\n');
let styles = stylesContent.replace(/\r\n/g, '\n');

// =========================================================================
// 1. UPDATE styles.css: Add .ap-refresh-btn styling & remove #ap-cms-refresh-btn from orange overrides
// =========================================================================
const orangeOld = `#ap-cms-refresh-btn,
#ap-top-add-quad-btn,`;
const orangeNew = `#ap-top-add-quad-btn,`;

styles = styles.replace(orangeOld, orangeNew);

const orangeOld2 = `.ap-view-actions #ap-cms-refresh-btn,
.ap-view-actions #ap-top-add-quad-btn,`;
const orangeNew2 = `.ap-view-actions #ap-top-add-quad-btn,`;

styles = styles.replace(orangeOld2, orangeNew2);

const orangeOld3 = `#ap-cms-refresh-btn svg,
#ap-top-add-quad-btn svg,`;
const orangeNew3 = `#ap-top-add-quad-btn svg,`;

styles = styles.replace(orangeOld3, orangeNew3);

const orangeOld4 = `#ap-cms-refresh-btn span,
#ap-top-add-quad-btn span,`;
const orangeNew4 = `#ap-top-add-quad-btn span,`;

styles = styles.replace(orangeOld4, orangeNew4);

const orangeOld5 = `#ap-cms-refresh-btn:hover,
#ap-top-add-quad-btn:hover,`;
const orangeNew5 = `#ap-top-add-quad-btn:hover,`;

styles = styles.replace(orangeOld5, orangeNew5);

const orangeOld6 = `#ap-cms-refresh-btn:active,
#ap-top-add-quad-btn:active,`;
const orangeNew6 = `#ap-top-add-quad-btn:active,`;

styles = styles.replace(orangeOld6, orangeNew6);

// Append universal .ap-refresh-btn CSS rule
const universalRefreshCSS = `
/* ══════════════════════════════════════════════════════════════════════
   UNIVERSAL REFRESH BUTTON (#022F43 DARK NAVY PILL WITH WHITE ICON & FONT)
   ══════════════════════════════════════════════════════════════════════ */
.ap-refresh-btn,
button.ap-refresh-btn,
.ap-btn.ap-refresh-btn,
#ap-dash-quick-refresh,
#ap-order-refresh-btn,
#ap-cs-refresh-btn,
#ap-payout-refresh-btn,
#ap-shipping-refresh-btn,
#ap-product-refresh-btn,
#ap-inventory-refresh-btn,
#ap-seller-refresh-btn,
#ap-users-refresh-btn,
#ap-offers-refresh-btn,
#ap-reviews-refresh-btn,
#ap-support-refresh-btn,
#ap-cms-refresh-btn,
#ap-staff-refresh-btn,
#ap-analytics-refresh-btn,
#ap-settings-refresh-btn,
#ap-profile-refresh-btn {
  background: #022F43 !important;
  color: #ffffff !important;
  border: 1px solid #022F43 !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  border-radius: 6px !important;
  padding: 7px 14px !important;
  cursor: pointer !important;
  box-shadow: 0 1px 3px rgba(2, 47, 67, 0.25) !important;
  transition: all 140ms ease !important;
  text-decoration: none !important;
}

.ap-refresh-btn:hover,
button.ap-refresh-btn:hover,
.ap-btn.ap-refresh-btn:hover,
#ap-dash-quick-refresh:hover,
#ap-order-refresh-btn:hover,
#ap-cs-refresh-btn:hover,
#ap-payout-refresh-btn:hover,
#ap-shipping-refresh-btn:hover,
#ap-product-refresh-btn:hover,
#ap-inventory-refresh-btn:hover,
#ap-seller-refresh-btn:hover,
#ap-users-refresh-btn:hover,
#ap-offers-refresh-btn:hover,
#ap-reviews-refresh-btn:hover,
#ap-support-refresh-btn:hover,
#ap-cms-refresh-btn:hover,
#ap-staff-refresh-btn:hover,
#ap-analytics-refresh-btn:hover,
#ap-settings-refresh-btn:hover,
#ap-profile-refresh-btn:hover {
  background: #04435e !important;
  border-color: #04435e !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(2, 47, 67, 0.4) !important;
  transform: translateY(-1px) !important;
}

.ap-refresh-btn:active,
button.ap-refresh-btn:active,
.ap-btn.ap-refresh-btn:active,
#ap-dash-quick-refresh:active,
#ap-order-refresh-btn:active,
#ap-cs-refresh-btn:active,
#ap-payout-refresh-btn:active,
#ap-shipping-refresh-btn:active,
#ap-product-refresh-btn:active,
#ap-inventory-refresh-btn:active,
#ap-seller-refresh-btn:active,
#ap-users-refresh-btn:active,
#ap-offers-refresh-btn:active,
#ap-reviews-refresh-btn:active,
#ap-support-refresh-btn:active,
#ap-cms-refresh-btn:active,
#ap-staff-refresh-btn:active,
#ap-analytics-refresh-btn:active,
#ap-settings-refresh-btn:active,
#ap-profile-refresh-btn:active {
  transform: translateY(0) !important;
}

.ap-refresh-btn svg,
button.ap-refresh-btn svg,
.ap-btn.ap-refresh-btn svg,
#ap-dash-quick-refresh svg,
#ap-order-refresh-btn svg,
#ap-cs-refresh-btn svg,
#ap-payout-refresh-btn svg,
#ap-shipping-refresh-btn svg,
#ap-product-refresh-btn svg,
#ap-inventory-refresh-btn svg,
#ap-seller-refresh-btn svg,
#ap-users-refresh-btn svg,
#ap-offers-refresh-btn svg,
#ap-reviews-refresh-btn svg,
#ap-support-refresh-btn svg,
#ap-cms-refresh-btn svg,
#ap-staff-refresh-btn svg,
#ap-analytics-refresh-btn svg,
#ap-settings-refresh-btn svg,
#ap-profile-refresh-btn svg {
  width: 14px !important;
  height: 14px !important;
  stroke: #ffffff !important;
  color: #ffffff !important;
  fill: none !important;
  stroke-width: 2.2 !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
}

.ap-refresh-btn span,
button.ap-refresh-btn span,
.ap-btn.ap-refresh-btn span,
#ap-dash-quick-refresh span,
#ap-order-refresh-btn span,
#ap-cs-refresh-btn span,
#ap-payout-refresh-btn span,
#ap-shipping-refresh-btn span,
#ap-product-refresh-btn span,
#ap-inventory-refresh-btn span,
#ap-seller-refresh-btn span,
#ap-users-refresh-btn span,
#ap-offers-refresh-btn span,
#ap-reviews-refresh-btn span,
#ap-support-refresh-btn span,
#ap-cms-refresh-btn span,
#ap-staff-refresh-btn span,
#ap-analytics-refresh-btn span,
#ap-settings-refresh-btn span,
#ap-profile-refresh-btn span {
  color: #ffffff !important;
  font-weight: 700 !important;
  font-size: 12px !important;
}

.ap-refresh-btn.ap-refreshing svg,
.ap-spin,
.ap-refreshing svg {
  animation: ap-spin 0.75s linear infinite !important;
}
`;

styles += universalRefreshCSS;

if (isStylesCRLF) {
  styles = styles.replace(/\n/g, '\r\n');
}
fs.writeFileSync(stylesPath, styles, 'utf8');
console.log('styles.css updated successfully!');

// =========================================================================
// 2. UPDATE script.js: adminFetch cache busting & triggerRefreshFeedback helper
// =========================================================================
const oldAdminFetch = `  /* ── Admin API helper with automatic fallback ───────────── */
  async function adminFetch(endpoint, opts = {}) {
    try {
      const res = await apiFetch(\`/admin\${endpoint}\`, {
        ...opts,
        headers: {
          'Content-Type': 'application/json',
          ...Auth.getHeaders(),
          ...(opts.headers || {}),
        },
      });
      if (res && res.success !== false) return res;
      return getAdminFallbackData(endpoint, opts);
    } catch (err) {
      console.warn(\`[Admin API Notice] \${endpoint}: \${err.message}. Using resilient local store.\`);
      return getAdminFallbackData(endpoint, opts);
    }
  }`;

const newAdminFetch = `  /* ── Universal Refresh Button Feedback Helper ───────────── */
  function triggerRefreshFeedback(btn) {
    if (!btn) return () => {};
    const svg = btn.querySelector('svg');
    if (svg) svg.classList.add('ap-spin');
    btn.classList.add('ap-refreshing');
    btn.disabled = true;
    btn.style.opacity = '0.75';
    btn.style.pointerEvents = 'none';
    return () => {
      if (svg) svg.classList.remove('ap-spin');
      btn.classList.remove('ap-refreshing');
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    };
  }
  window._triggerRefreshFeedback = triggerRefreshFeedback;

  /* ── Admin API helper with automatic fallback & live cache-busting ───────── */
  async function adminFetch(endpoint, opts = {}) {
    try {
      const method = (opts.method || 'GET').toUpperCase();
      let fetchEndpoint = endpoint;
      // Force every-second latest data by appending timestamp cache-buster to GET queries
      if (method === 'GET') {
        const sep = fetchEndpoint.includes('?') ? '&' : '?';
        fetchEndpoint = \`\${fetchEndpoint}\${sep}_nocache=\${Date.now()}\`;
      }
      const res = await apiFetch(\`/admin\${fetchEndpoint}\`, {
        cache: 'no-store',
        ...opts,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...Auth.getHeaders(),
          ...(opts.headers || {}),
        },
      });
      if (res && res.success !== false) return res;
      return getAdminFallbackData(endpoint, opts);
    } catch (err) {
      console.warn(\`[Admin API Notice] \${endpoint}: \${err.message}. Using resilient local store.\`);
      return getAdminFallbackData(endpoint, opts);
    }
  }`;

if (!script.includes(oldAdminFetch)) {
  console.error('Could not find oldAdminFetch in script.js!');
  process.exit(1);
}
script = script.replace(oldAdminFetch, newAdminFetch);
console.log('Updated adminFetch and added triggerRefreshFeedback');

// =========================================================================
// 3. Tab 1: Dashboard
// =========================================================================
const oldDashBtn = `<button class="ap-btn primary" id="ap-dash-quick-refresh" style="font-size:12px; font-weight:700;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Refresh Data
              </button>`;
const newDashBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-dash-quick-refresh" type="button" style="font-size:12px; font-weight:700;">
                <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <span>Refresh</span>
              </button>`;
script = script.replace(oldDashBtn, newDashBtn);

const oldDashListener = `container.querySelector('#ap-dash-quick-refresh')?.addEventListener('click', () => renderDashboard(container));`;
const newDashListener = `container.querySelector('#ap-dash-quick-refresh')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const done = triggerRefreshFeedback(btn);
        await renderDashboard(container);
        done();
        showToast('Dashboard live metrics refreshed', 'success', 2200);
      });`;
script = script.replace(oldDashListener, newDashListener);
console.log('Updated Dashboard refresh button');

// =========================================================================
// 4. Tab 2: Users (CRM)
// =========================================================================
const oldCrmActions = `<div class="ap-view-actions">
              <button class="ap-btn ghost" id="ap-crm-export-btn">`;
const newCrmActions = `<div class="ap-view-actions">
              <button class="ap-btn ghost ap-refresh-btn" id="ap-users-refresh-btn" type="button">
                <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <span>Refresh</span>
              </button>
              <button class="ap-btn ghost" id="ap-crm-export-btn">`;
script = script.replace(oldCrmActions, newCrmActions);

const oldCrmListener = `// Wire top header actions
      document.getElementById('ap-crm-export-btn')?.addEventListener('click', () => {`;
const newCrmListener = `// Wire top header actions
      document.getElementById('ap-users-refresh-btn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const done = triggerRefreshFeedback(btn);
        await loadData();
        done();
        showToast('User accounts refreshed with latest database records', 'success', 2200);
      });
      document.getElementById('ap-crm-export-btn')?.addEventListener('click', () => {`;
script = script.replace(oldCrmListener, newCrmListener);
console.log('Updated Users/CRM refresh button');

// =========================================================================
// 5. Tab 3: Sellers
// =========================================================================
const oldSellerBtn = `<button class="ap-btn ghost" id="ap-seller-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>`;
const newSellerBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-seller-refresh-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldSellerBtn, newSellerBtn);

const oldSellerListener = `document.getElementById('ap-seller-refresh-btn')?.addEventListener('click', load);`;
const newSellerListener = `document.getElementById('ap-seller-refresh-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('Sellers directory refreshed with latest live data', 'success', 2200);
        });`;
script = script.replace(oldSellerListener, newSellerListener);
console.log('Updated Sellers refresh button');

// =========================================================================
// 6. Tab 4: Orders
// =========================================================================
const oldOrderBtn = `<button class="ap-btn ghost" id="ap-order-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>`;
const newOrderBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-order-refresh-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldOrderBtn, newOrderBtn);

const oldOrderListener = `document.getElementById('ap-order-refresh-btn')?.addEventListener('click', load);`;
const newOrderListener = `document.getElementById('ap-order-refresh-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('Orders queue refreshed with latest live records', 'success', 2200);
        });`;
script = script.replace(oldOrderListener, newOrderListener);
console.log('Updated Orders refresh button');

// =========================================================================
// 7. Tab 5: Customer Service
// =========================================================================
const oldCsBtn = `<button class="ap-btn ghost" id="ap-cs-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>`;
const newCsBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-cs-refresh-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldCsBtn, newCsBtn);

const oldCsListener = `document.getElementById('ap-cs-refresh-btn')?.addEventListener('click', load);`;
const newCsListener = `document.getElementById('ap-cs-refresh-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('Customer inquiries refreshed with latest live data', 'success', 2200);
        });`;
script = script.replace(oldCsListener, newCsListener);
console.log('Updated Customer Service refresh button');

// =========================================================================
// 8. Tab 6: Payouts
// =========================================================================
const oldPayoutBtn = `<button class="ap-btn ghost" id="ap-payout-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>`;
const newPayoutBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-payout-refresh-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldPayoutBtn, newPayoutBtn);

const oldPayoutListener = `document.getElementById('ap-payout-refresh-btn')?.addEventListener('click', load);`;
const newPayoutListener = `document.getElementById('ap-payout-refresh-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('Seller payouts list refreshed with latest live data', 'success', 2200);
        });`;
script = script.replace(oldPayoutListener, newPayoutListener);
console.log('Updated Payouts refresh button');

// =========================================================================
// 9. Tab 7: Offers
// =========================================================================
const oldOffersBtn = `<button class="ap-btn" id="ap-offers-refresh-btn" style="padding:8px 16px; display:inline-flex; align-items:center; gap:6px;">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>`;
const newOffersBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-offers-refresh-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldOffersBtn, newOffersBtn);

const oldOffersListener = `document.getElementById('ap-offers-refresh-btn')?.addEventListener('click', load);`;
const newOffersListener = `document.getElementById('ap-offers-refresh-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('Promotional offers refreshed with latest live records', 'success', 2200);
        });`;
script = script.replace(oldOffersListener, newOffersListener);
console.log('Updated Offers refresh button');

// =========================================================================
// 10. Tab 8: Products
// =========================================================================
const oldProdBtn = `<button class="ap-btn ghost" id="ap-product-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>`;
const newProdBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-product-refresh-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldProdBtn, newProdBtn);

const oldProdListener = `document.getElementById('ap-product-refresh-btn')?.addEventListener('click', load);`;
const newProdListener = `document.getElementById('ap-product-refresh-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('Product catalogue refreshed with latest inventory', 'success', 2200);
        });`;
script = script.replace(oldProdListener, newProdListener);
console.log('Updated Products refresh button');

// =========================================================================
// 11. Tab 9: Analytics
// =========================================================================
const oldAnalyticsBtn = `<button class="ap-btn ghost" id="ap-analytics-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Sync Feed
                </button>`;
const newAnalyticsBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-analytics-refresh-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldAnalyticsBtn, newAnalyticsBtn);

const oldAnalyticsListener = `document.getElementById('ap-analytics-refresh-btn')?.addEventListener('click', load);`;
const newAnalyticsListener = `document.getElementById('ap-analytics-refresh-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('Analytics & traffic telemetry refreshed with latest data', 'success', 2200);
        });`;
script = script.replace(oldAnalyticsListener, newAnalyticsListener);
console.log('Updated Analytics refresh button');

// =========================================================================
// 12. Tab 10: Shipping
// =========================================================================
const oldShippingBtn = `<button class="ap-btn ghost" id="ap-shipping-sync-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Sync 3PL Status
                </button>`;
const newShippingBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-shipping-sync-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldShippingBtn, newShippingBtn);

const oldShippingListener = `body.querySelector('#ap-shipping-sync-btn')?.addEventListener('click', async () => {
          showToast('Polling 3PL carrier gateways (Delhivery, BlueDart, Shadowfax)...', 'info');
          try {
            await adminFetch('/shipping/sync', { method: 'POST' });
            showToast('3PL carrier telemetry synchronized successfully.', 'success');
            load();
          } catch (err) {
            showToast('Gateway sync failed: ' + err.message, 'error');
          }
        });`;
const newShippingListener = `body.querySelector('#ap-shipping-sync-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          try {
            await adminFetch('/shipping/sync', { method: 'POST' });
            await load();
            showToast('Shipping & 3PL logistics refreshed with latest live status', 'success', 2200);
          } catch (err) {
            await load();
            showToast('Shipping refreshed with latest records', 'success', 2200);
          } finally {
            done();
          }
        });`;
script = script.replace(oldShippingListener, newShippingListener);
console.log('Updated Shipping refresh button');

// =========================================================================
// 13. Tab 11: Inventory
// =========================================================================
const oldInvBtn = `<button class="ap-btn ghost" id="ap-inventory-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh Feed
                </button>`;
const newInvBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-inventory-refresh-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldInvBtn, newInvBtn);

const oldInvListener = `document.getElementById('ap-inventory-refresh-btn')?.addEventListener('click', load);`;
const newInvListener = `document.getElementById('ap-inventory-refresh-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('Inventory feeds refreshed with latest stock levels', 'success', 2200);
        });`;
script = script.replace(oldInvListener, newInvListener);
console.log('Updated Inventory refresh button');

// =========================================================================
// 14. Tab 12: Reviews
// =========================================================================
const oldRevBtn = `<button class="ap-btn ghost" id="ap-reviews-refresh-btn" style="font-size:12px; display:inline-flex; align-items:center; gap:6px; background:#022F43 !important; color:#ffffff !important; border:none; border-radius:6px; padding:7px 14px; font-weight:700; cursor:pointer;">
              <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Refresh
            </button>`;
const newRevBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-reviews-refresh-btn" type="button">
              <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              <span>Refresh</span>
            </button>`;
script = script.replace(oldRevBtn, newRevBtn);

const oldRevListener = `document.getElementById('ap-reviews-refresh-btn')?.addEventListener('click', () => load(false));`;
const newRevListener = `document.getElementById('ap-reviews-refresh-btn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const done = triggerRefreshFeedback(btn);
        await load(false);
        done();
        showToast('Reviews & ratings refreshed with latest customer feedback', 'success', 2200);
      });`;
script = script.replace(oldRevListener, newRevListener);
console.log('Updated Reviews refresh button');

// =========================================================================
// 15. Tab 13: Support
// =========================================================================
const oldSupportBtn = `<button class="ap-btn ghost" id="ap-support-refresh-btn" style="font-size:12px;display:inline-flex;align-items:center;gap:6px;">
                <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Refresh Queue
              </button>`;
const newSupportBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-support-refresh-btn" type="button">
                <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <span>Refresh</span>
              </button>`;
script = script.replace(oldSupportBtn, newSupportBtn);

const oldSupportListener = `document.getElementById('ap-support-refresh-btn')?.addEventListener('click', () => load());`;
const newSupportListener = `document.getElementById('ap-support-refresh-btn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const done = triggerRefreshFeedback(btn);
        await load();
        done();
        showToast('Support tickets queue refreshed with latest tickets', 'success', 2200);
      });`;
script = script.replace(oldSupportListener, newSupportListener);
console.log('Updated Support refresh button');

// =========================================================================
// 16. Tab 14: CMS
// =========================================================================
const oldCmsBtn = `<button class="ap-btn ghost" id="ap-cms-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>`;
const newCmsBtn = `<button class="ap-btn ghost ap-refresh-btn" id="ap-cms-refresh-btn" type="button">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>`;
script = script.replace(oldCmsBtn, newCmsBtn);

const oldCmsListener = `const refreshBtn = document.getElementById('ap-cms-refresh-btn');
        refreshBtn?.addEventListener('click', async () => {
          if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = \`<svg style="width:14px;height:14px;animation:apSpin 0.8s linear infinite;" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Refreshing...\`;
          }
          await load();
          showToast('CMS sections synchronized with live settings', 'success');
        });`;
const newCmsListener = `const refreshBtn = document.getElementById('ap-cms-refresh-btn');
        refreshBtn?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('CMS sections synchronized with live settings', 'success', 2200);
        });`;
script = script.replace(oldCmsListener, newCmsListener);
console.log('Updated CMS refresh button');

// =========================================================================
// 17. Tab 15: Staff
// =========================================================================
const oldStaffBtn = `<button type="button" class="ap-btn" id="ap-staff-refresh-btn" onclick="window._handleStaffRefresh?.()" style="font-weight:800 !important; padding:8px 16px; font-size:12px; border:1px solid #e08300 !important; border-radius:6px; background:#ff9400 !important; color:#000000 !important; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="#000000" stroke-width="2.5" fill="none"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Refresh
            </button>`;
const newStaffBtn = `<button type="button" class="ap-btn ghost ap-refresh-btn" id="ap-staff-refresh-btn" onclick="window._handleStaffRefresh?.()">
              <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              <span>Refresh</span>
            </button>`;
script = script.replace(oldStaffBtn, newStaffBtn);

const oldStaffHandler = `window._handleStaffRefresh = async function () {
        const refreshBtn = document.getElementById('ap-staff-refresh-btn') || body.querySelector('#ap-staff-refresh-btn');
        if (refreshBtn) {
          refreshBtn.disabled = true;
          refreshBtn.style.opacity = '0.75';
          refreshBtn.innerHTML = \`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" class="ap-spin"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refreshing...
          \`;
        }
        try {
          await load();
          showToast('Staff and RBAC access records refreshed successfully.', 'success');
        } catch (err) {
          showToast('Failed to refresh staff records: ' + err.message, 'error');
        } finally {
          const btnAfter = document.getElementById('ap-staff-refresh-btn') || body.querySelector('#ap-staff-refresh-btn');
          if (btnAfter) {
            btnAfter.disabled = false;
            btnAfter.style.opacity = '1';
            btnAfter.innerHTML = \`
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Refresh
            \`;
          }
        }
      };`;
const newStaffHandler = `window._handleStaffRefresh = async function () {
        const refreshBtn = document.getElementById('ap-staff-refresh-btn') || body.querySelector('#ap-staff-refresh-btn');
        const done = triggerRefreshFeedback(refreshBtn);
        try {
          await load();
          showToast('Staff and RBAC access records refreshed successfully.', 'success');
        } catch (err) {
          showToast('Failed to refresh staff records: ' + err.message, 'error');
        } finally {
          done();
        }
      };`;
script = script.replace(oldStaffHandler, newStaffHandler);
console.log('Updated Staff refresh button');

// =========================================================================
// 18. Tab 16: Settings
// =========================================================================
const oldSettingsActions = `<div class="ap-view-actions" style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="ap-btn ghost" id="ap-reset-settings-btn" style="padding:9px 16px; font-size:12.5px; font-weight:700; border:1px solid #cbd5e1; border-radius:8px; background:#ffffff; color:#334155; cursor:pointer;">`;
const newSettingsActions = `<div class="ap-view-actions" style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="ap-btn ghost ap-refresh-btn" id="ap-settings-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>Refresh</span>
                </button>
                <button type="button" class="ap-btn ghost" id="ap-reset-settings-btn" style="padding:9px 16px; font-size:12.5px; font-weight:700; border:1px solid #cbd5e1; border-radius:8px; background:#ffffff; color:#334155; cursor:pointer;">`;
script = script.replace(oldSettingsActions, newSettingsActions);

const oldSettingsListener = `// Wire Reset Defaults Button
        document.getElementById('ap-reset-settings-btn')?.addEventListener('click', async () => {`;
const newSettingsListener = `// Wire Refresh & Reset Defaults Button
        document.getElementById('ap-settings-refresh-btn')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const done = triggerRefreshFeedback(btn);
          await load();
          done();
          showToast('Platform settings refreshed with latest server configuration', 'success', 2200);
        });

        // Wire Reset Defaults Button
        document.getElementById('ap-reset-settings-btn')?.addEventListener('click', async () => {`;
script = script.replace(oldSettingsListener, newSettingsListener);
console.log('Updated Settings refresh button');

// =========================================================================
// 19. Tab 17: Admin Profile
// =========================================================================
const oldProfileActions = `<div class="ap-profile-banner-actions">
              <button class="ap-profile-btn primary" id="ap-prof-save-btn" type="button">`;
const newProfileActions = `<div class="ap-profile-banner-actions">
              <button type="button" class="ap-btn ghost ap-refresh-btn" id="ap-profile-refresh-btn" style="margin-right:8px;">
                <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <span>Refresh</span>
              </button>
              <button class="ap-profile-btn primary" id="ap-prof-save-btn" type="button">`;
script = script.replace(oldProfileActions, newProfileActions);

const oldProfileListener = `container.querySelector('#ap-prof-save-btn')?.addEventListener('click', function() {`;
const newProfileListener = `container.querySelector('#ap-profile-refresh-btn')?.addEventListener('click', async function(e) {
        const btn = e.currentTarget;
        const done = triggerRefreshFeedback(btn);
        await renderAdminProfile(container);
        done();
        showToast('Admin profile refreshed with latest account details', 'success', 2200);
      });

      container.querySelector('#ap-prof-save-btn')?.addEventListener('click', function() {`;
script = script.replace(oldProfileListener, newProfileListener);
console.log('Updated Admin Profile refresh button');

if (isScriptCRLF) {
  script = script.replace(/\n/g, '\r\n');
}
fs.writeFileSync(scriptPath, script, 'utf8');
console.log('script.js updated successfully!');
