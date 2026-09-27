const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
let content = fs.readFileSync(scriptPath, 'utf8');

// Find start and end of renderOffers
const startMarker = '  async function renderOffers(body) {';
const endMarker = '    load();\r\n  }\r\n\r\n  /* ══════════════════════════════════════════════════════\r\n     SHARED HELPER: isBestsellerProduct';
const endMarkerLF = '    load();\n  }\n\n  /* ══════════════════════════════════════════════════════\n     SHARED HELPER: isBestsellerProduct';

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  console.error('startMarker not found!');
  process.exit(1);
}

let endIndex = content.indexOf(endMarker, startIndex);
let usedMarker = endMarker;
if (endIndex === -1) {
  endIndex = content.indexOf(endMarkerLF, startIndex);
  usedMarker = endMarkerLF;
}

if (endIndex === -1) {
  console.error('endMarker not found!');
  process.exit(1);
}

const replacement = `  async function renderOffers(body) {
    body.innerHTML = loadingHTML();
    async function load() {
      try {
        const [offersRes, productsRes, sellersRes] = await Promise.all([
          adminFetch('/offers'),
          adminFetch('/products?limit=1000'),
          adminFetch('/sellers').catch(() => ({ data: { sellers: [] } })),
        ]);
        const offers = offersRes.data.offers || [];
        const products = productsRes.data.products || [];
        const sellers = sellersRes?.data?.sellers || [];

        // Build unique store names list
        const storeSet = new Set();
        sellers.forEach(s => {
          const sName = s.sellerProfile?.storeName || s.sellerProfile?.bizName;
          if (sName) storeSet.add(sName.trim());
        });
        products.forEach(p => {
          if (p.sellerStoreName) storeSet.add(p.sellerStoreName.trim());
          else if (p.sellerEmail) storeSet.add(p.sellerEmail.trim());
        });
        const uniqueStores = Array.from(storeSet).filter(Boolean).sort();

        const productOptions = products.map(p =>
          \`<option value="\${p._id}">\${esc(p.name)} — \${fmtPrice(p.price)}</option>\`
        ).join('');

        const storeOptions = \`
          <option value="storewide">🌐 Storewide Marketing (All Stores &amp; Entire Catalog)</option>
          \${uniqueStores.length > 0 ? \`
            <optgroup label="Registered Merchant Stores (\${uniqueStores.length})">
              \${uniqueStores.map(s => \`<option value="\${esc(s)}">🏪 \${esc(s)}</option>\`).join('')}
            </optgroup>
          \` : ''}
        \`;

        const tableRows = offers.length ? offers.map(o => {
          const scope = o.offer?.scope || 'product';
          const isStore = scope === 'store' || scope === 'storewide';
          const scopeBadge = scope === 'storewide'
            ? \`<span class="ap-badge green" style="font-weight:700;">🌐 Storewide</span>\`
            : scope === 'store'
            ? \`<span class="ap-badge purple" style="font-weight:700;">🏪 Store-wise</span>\`
            : \`<span class="ap-badge blue" style="font-weight:700;">🏷️ Product-wise</span>\`;

          const storeName = o.offer?.storeName || o.sellerStoreName || o.sellerEmail || 'Storewide';

          return \`
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px;">
                  \${scopeBadge}
                  \${isStore ? \`<span style="font-size:11px; font-weight:700; color:#475569;">\${esc(storeName)}</span>\` : ''}
                </div>
                <strong style="color:#0f172a; font-size:13px;">\${esc(o.name)}</strong>
                <div style="font-size:11px; color:#64748b;">\${esc(o.sellerStoreName || o.sellerEmail || 'X-Mart Store')} &bull; MRP \${fmtPrice(o.price)}</div>
              </td>
              <td>
                <span class="ap-badge orange" style="font-size:12.5px; font-weight:800; background:#fff7ed; color:#c2410c; border:1px solid #fed7aa;">
                  \${o.offer?.discountPct || 0}% OFF
                </span>
              </td>
              <td>
                <span class="ap-badge blue" style="font-weight:700;">\${esc(o.offer?.label || 'Admin Promo')}</span>
              </td>
              <td style="color:#64748b; font-size:12px;">
                \${o.offer?.validUntil ? fmtDate(o.offer.validUntil) : 'Ongoing (No Expiry)'}
              </td>
              <td>
                <button class="ap-btn ap-remove-offer" data-id="\${o._id}" data-scope="\${scope}" data-store="\${esc(storeName)}" style="background:#ff9400 !important; color:#000000 !important; font-weight:800 !important; border:1px solid #ff9400 !important; padding:5px 12px; font-size:11.5px; border-radius:6px; cursor:pointer;">
                  Revoke Deal
                </button>
              </td>
            </tr>
          \`;
        }).join('') : \`
          <tr>
            <td colspan="5" style="text-align:center; padding:36px; color:#94a3b8;">
              \${emptyHTML('', 'No active marketing offers yet. Create one above.')}
            </td>
          </tr>
        \`;

        body.innerHTML = \`
          <div class="ap-view-inner ap-offers-window">
            <style>
              /* User instruction: #ff9400 background and black font color for all buttons in this window */
              .ap-offers-window button,
              .ap-offers-window .ap-btn,
              .ap-offers-window input[type="button"],
              .ap-offers-window input[type="submit"] {
                background-color: #ff9400 !important;
                background: #ff9400 !important;
                color: #000000 !important;
                font-weight: 800 !important;
                border: 1.5px solid #ff9400 !important;
                border-radius: 6px !important;
                transition: all 0.15s ease-in-out !important;
                box-shadow: 0 2px 6px rgba(255, 148, 0, 0.28) !important;
                cursor: pointer !important;
              }
              .ap-offers-window button:hover,
              .ap-offers-window .ap-btn:hover {
                background-color: #e68500 !important;
                background: #e68500 !important;
                color: #000000 !important;
                border-color: #e68500 !important;
                box-shadow: 0 4px 10px rgba(255, 148, 0, 0.42) !important;
              }
              .ap-offers-window button svg,
              .ap-offers-window .ap-btn svg {
                stroke: #000000 !important;
                color: #000000 !important;
              }
              .ap-offers-window .ap-scope-toggle-btn.ap-scope-inactive {
                background: #f1f5f9 !important;
                color: #475569 !important;
                border-color: #cbd5e1 !important;
                box-shadow: none !important;
                font-weight: 700 !important;
              }
              .ap-offers-window .ap-scope-toggle-btn.ap-scope-inactive:hover {
                background: #e2e8f0 !important;
                color: #0f172a !important;
              }
            </style>

            <div class="ap-view-header">
              <div class="ap-view-title-group">
                <h2 class="ap-view-title">
                  Marketing &amp; Promotions
                  <span class="ap-super-badge" style="background:#eff6ff; color:#2563eb; border-color:#bfdbfe;">\${offers.length} Active Deals</span>
                </h2>
                <p class="ap-view-sub">Manage storewise promotions, product-wise discounts, seasonal flash-sales, and marketplace campaigns.</p>
              </div>
              <div class="ap-view-actions">
                <button class="ap-btn" id="ap-offers-refresh-btn" style="background:#ff9400 !important; color:#000000 !important; font-weight:800 !important; border:1px solid #ff9400 !important; padding:8px 16px; display:inline-flex; align-items:center; gap:6px;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>
              </div>
            </div>

            <!-- KPI Chips -->
            <div class="ap-stat-grid">
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Active Promotions</span>
                  <span class="ap-stat-card-val" style="color:#2563eb">\${offers.length}</span>
                </div>
                <div class="ap-stat-card-icon blue">
                  <svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </div>
              </div>
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Discounted SKUs</span>
                  <span class="ap-stat-card-val" style="color:#059669">\${offers.filter(o => (o.offer?.discountPct || 0) > 0).length}</span>
                </div>
                <div class="ap-stat-card-icon green">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Catalog Coverage</span>
                  <span class="ap-stat-card-val" style="color:#d97706">\${products.length > 0 ? ((offers.length / products.length) * 100).toFixed(1) : 0}%</span>
                </div>
                <div class="ap-stat-card-icon amber">
                  <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Max Discount</span>
                  <span class="ap-stat-card-val" style="color:#6366f1">\${offers.length > 0 ? Math.max(...offers.map(o => o.offer?.discountPct || 0)) : 0}%</span>
                </div>
                <div class="ap-stat-card-icon purple">
                  <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
              </div>
            </div>

            <!-- Create Offer Form Card -->
            <div class="ap-form-card">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
                <h3 style="margin:0; font-size:16px; font-weight:800; color:#0f172a;">Create Promotional Campaign</h3>
                
                <!-- Campaign Scope Toggle: Product-wise vs Store-wise -->
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Campaign Scope:</span>
                  <div style="display:inline-flex; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:3px; gap:4px;">
                    <button type="button" id="ap-scope-prod-btn" class="ap-scope-toggle-btn" style="padding:6px 14px; border-radius:6px; font-size:12px; font-weight:800; border:1px solid #ff9400 !important; cursor:pointer; background:#ff9400 !important; color:#000000 !important;">
                      🏷️ Product-wise
                    </button>
                    <button type="button" id="ap-scope-store-btn" class="ap-scope-toggle-btn ap-scope-inactive" style="padding:6px 14px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                      🏪 Store-wise
                    </button>
                  </div>
                </div>
              </div>

              <div class="ap-form-row">
                <!-- Product Target Group -->
                <div class="ap-form-group" id="ap-target-prod-wrap" style="flex:2">
                  <label style="font-size:11.5px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.5px;">Select Target Product</label>
                  <select id="ap-offer-product">
                    <option value="">— Select a catalog SKU —</option>
                    \${productOptions}
                  </select>
                </div>

                <!-- Store Target Group -->
                <div class="ap-form-group" id="ap-target-store-wrap" style="flex:2; display:none;">
                  <label style="font-size:11.5px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.5px;">Select Target Store / Scope</label>
                  <select id="ap-offer-store">
                    <option value="">— Select a Store or Storewide —</option>
                    \${storeOptions}
                  </select>
                </div>

                <div class="ap-form-group" style="flex:1">
                  <label style="font-size:11.5px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.5px;">Discount Percentage (%)</label>
                  <input type="number" id="ap-offer-pct" min="1" max="90" placeholder="e.g. 20">
                </div>
              </div>

              <div class="ap-form-row">
                <div class="ap-form-group" style="flex:1">
                  <label style="font-size:11.5px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.5px;">Campaign Label / Headline</label>
                  <input type="text" id="ap-offer-label" placeholder="e.g. Mega Summer Flash Sale / Flat 20% Off">
                </div>
                <div class="ap-form-group" style="flex:1">
                  <label style="font-size:11.5px; font-weight:800; color:#334155; text-transform:uppercase; letter-spacing:0.5px;">Expiry Date (Optional)</label>
                  <input type="date" id="ap-offer-date" placeholder="dd-mm-yyyy">
                </div>
              </div>

              <div style="text-align:right; margin-top:10px;">
                <button class="ap-btn" id="ap-create-offer-btn" style="background:#ff9400 !important; color:#000000 !important; font-weight:800 !important; border:1px solid #ff9400 !important; padding:9px 22px; font-size:13px; display:inline-flex; align-items:center; gap:8px;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Launch Campaign Offer
                </button>
              </div>
            </div>

            <!-- Active Campaigns Table -->
            <div class="ap-table-card">
              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th>Target &amp; Details</th>
                      <th>Discount Applied</th>
                      <th>Campaign Label</th>
                      <th>Validity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${tableRows}
                  </tbody>
                </table>
              </div>
              <div class="ap-table-footer">
                <span>Showing <strong>\${offers.length}</strong> active promo campaigns</span>
                <span style="font-size:11px; color:#94a3b8;">X-Mart Growth &amp; Promotions Engine</span>
              </div>
            </div>
          </div>
        \`;

        document.getElementById('ap-offers-refresh-btn')?.addEventListener('click', load);

        // Scope switching logic
        let currentScope = 'product';
        const prodScopeBtn = document.getElementById('ap-scope-prod-btn');
        const storeScopeBtn = document.getElementById('ap-scope-store-btn');
        const prodWrap = document.getElementById('ap-target-prod-wrap');
        const storeWrap = document.getElementById('ap-target-store-wrap');

        prodScopeBtn?.addEventListener('click', () => {
          currentScope = 'product';
          prodScopeBtn.classList.remove('ap-scope-inactive');
          prodScopeBtn.style.setProperty('background', '#ff9400', 'important');
          prodScopeBtn.style.setProperty('color', '#000000', 'important');
          prodScopeBtn.style.setProperty('font-weight', '800', 'important');
          prodScopeBtn.style.setProperty('border-color', '#ff9400', 'important');

          storeScopeBtn.classList.add('ap-scope-inactive');
          storeScopeBtn.style.setProperty('background', '#f1f5f9', 'important');
          storeScopeBtn.style.setProperty('color', '#475569', 'important');
          storeScopeBtn.style.setProperty('font-weight', '700', 'important');
          storeScopeBtn.style.setProperty('border-color', '#cbd5e1', 'important');

          if (prodWrap) prodWrap.style.display = 'block';
          if (storeWrap) storeWrap.style.display = 'none';
        });

        storeScopeBtn?.addEventListener('click', () => {
          currentScope = 'store';
          storeScopeBtn.classList.remove('ap-scope-inactive');
          storeScopeBtn.style.setProperty('background', '#ff9400', 'important');
          storeScopeBtn.style.setProperty('color', '#000000', 'important');
          storeScopeBtn.style.setProperty('font-weight', '800', 'important');
          storeScopeBtn.style.setProperty('border-color', '#ff9400', 'important');

          prodScopeBtn.classList.add('ap-scope-inactive');
          prodScopeBtn.style.setProperty('background', '#f1f5f9', 'important');
          prodScopeBtn.style.setProperty('color', '#475569', 'important');
          prodScopeBtn.style.setProperty('font-weight', '700', 'important');
          prodScopeBtn.style.setProperty('border-color', '#cbd5e1', 'important');

          if (prodWrap) prodWrap.style.display = 'none';
          if (storeWrap) storeWrap.style.display = 'block';
        });

        document.getElementById('ap-create-offer-btn')?.addEventListener('click', async () => {
          const discountPct = parseInt(document.getElementById('ap-offer-pct')?.value || '0', 10);
          const label = document.getElementById('ap-offer-label')?.value?.trim() || 'Admin Special Offer';
          const validUntil = document.getElementById('ap-offer-date')?.value || null;

          if (!discountPct || discountPct < 1 || discountPct > 90) {
            showToast('Discount must be between 1% and 90%', 'warn');
            return;
          }

          if (currentScope === 'product') {
            const productId = document.getElementById('ap-offer-product')?.value;
            if (!productId) { showToast('Please select a target product SKU', 'warn'); return; }

            try {
              await adminFetch('/offers', {
                method: 'POST',
                body: JSON.stringify({ scope: 'product', productId, discountPct, label, validUntil }),
              });
              showToast(\`\${discountPct}% product discount applied successfully!\`, 'success');
              load();
            } catch (e) { showToast(e.message, 'error'); }
          } else {
            const storeVal = document.getElementById('ap-offer-store')?.value;
            if (!storeVal) { showToast('Please select a target store or storewide', 'warn'); return; }

            const isStorewide = storeVal === 'storewide';
            try {
              const res = await adminFetch('/offers', {
                method: 'POST',
                body: JSON.stringify({
                  scope: isStorewide ? 'storewide' : 'store',
                  storeName: isStorewide ? 'storewide' : storeVal,
                  discountPct,
                  label,
                  validUntil
                }),
              });
              showToast(res.message || \`\${discountPct}% \${isStorewide ? 'Storewide' : storeVal} campaign launched!\`, 'success');
              load();
            } catch (e) { showToast(e.message, 'error'); }
          }
        });

        body.querySelectorAll('.ap-remove-offer').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const scope = btn.dataset.scope;
            const store = btn.dataset.store;

            if (scope === 'store' || scope === 'storewide') {
              const isStorewide = scope === 'storewide';
              const actionChoice = confirm(\`This product belongs to an active \${isStorewide ? 'Storewide' : \`"\${store}" Store\`} campaign.\\n\\nClick OK to revoke the campaign for \${isStorewide ? 'ALL products across the store' : \`all products in "\${store}"\`}.\\n(Cancel to abort)\`);
              if (!actionChoice) return;
              try {
                const query = isStorewide ? '?scope=storewide' : \`?scope=store&storeName=\${encodeURIComponent(store)}\`;
                await adminFetch(\`/offers/\${id}\${query}\`, { method: 'DELETE' });
                showToast('Campaign offer revoked.', 'success');
                load();
              } catch (e) { showToast(e.message, 'error'); }
            } else {
              if (!confirm('Revoke this offer? Product will revert to regular MRP.')) return;
              try {
                await adminFetch(\`/offers/\${id}\`, { method: 'DELETE' });
                showToast('Campaign offer revoked.', 'success');
                load();
              } catch (e) { showToast(e.message, 'error'); }
            }
          });
        });

      } catch (err) {
        body.innerHTML = emptyHTML('', \`Failed to load campaigns: \${err.message}\`);
      }
    }
    load();
  }`;

// Use the line ending found in the file
const isCRLF = content.includes('\r\n');
const newline = isCRLF ? '\r\n' : '\n';
const normalizedReplacement = replacement.replace(/\r?\n/g, newline);

const newContent = content.slice(0, startIndex) + normalizedReplacement + (isCRLF ? '\r\n\r\n  /* ══════════════════════════════════════════════════════\r\n     SHARED HELPER: isBestsellerProduct' : '\n\n  /* ══════════════════════════════════════════════════════\n     SHARED HELPER: isBestsellerProduct') + content.slice(endIndex + usedMarker.length);

fs.writeFileSync(scriptPath, newContent, 'utf8');
console.log('Successfully updated renderOffers in script.js!');
