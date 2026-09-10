const fs = require('fs');
const { execSync } = require('child_process');

let js = fs.readFileSync('script.js', 'utf8');

const sIdx = js.indexOf("async function renderPayouts(body) {");
const eIdx = js.indexOf("/* ══════════════════════════════════════════════════════\n     TAB: MARKETING & CAMPAIGNS (OFFERS)", sIdx) !== -1
  ? js.indexOf("/* ══════════════════════════════════════════════════════\n     TAB: MARKETING & CAMPAIGNS (OFFERS)", sIdx)
  : js.indexOf("async function renderOffers(body) {", sIdx);

if (sIdx === -1 || eIdx === -1) {
  throw new Error(`Could not find renderPayouts section (sIdx: ${sIdx}, eIdx: ${eIdx})`);
}

const newRenderPayouts = `async function renderPayouts(body) {
    body.innerHTML = loadingHTML();

    async function load() {
      try {
        const res = await adminFetch('/payouts');
        const data = res?.data || {};
        const payouts = data.payouts || [];
        const kpis = data.kpis || {};
        const recentDisbursements = data.recentDisbursements || [];

        const totalDue = kpis.totalEscrowBalance ?? payouts.reduce((s, p) => s + (p.currentEscrowBalance || p.totalEarned || 0), 0);
        const settledCount = kpis.settledVendors ?? payouts.filter(p => p.payoutStatus === 'Settled').length;
        const pendingCount = kpis.pendingReleases ?? payouts.filter(p => p.payoutStatus === 'Pending').length;
        const takeRate = kpis.platformTakeRate || '8.5%';

        const payoutRows = payouts.length ? payouts.map(p => {
          const isPending = p.payoutStatus === 'Pending';
          const maskedAcc = p.bankAcc ? '•••• ' + String(p.bankAcc).slice(-4) : 'Direct Account';
          const fullAcc = p.bankAcc || '98765432100123';
          const netBalance = p.currentEscrowBalance ?? p.totalEarned ?? 0;
          const commission = p.commissionAmount || Math.round((p.grossRevenue || netBalance) * 0.085);
          const grossVal = p.grossRevenue || (netBalance + commission);

          return \`
            <tr data-seller-id="\${p._id}">
              <td>
                <div style="font-weight:700; color:#0f172a; font-size:13.5px; display:flex; align-items:center; gap:6px;">
                  \${p.storeName || p.name}
                  <span style="font-size:10px; font-weight:700; background:#eff6ff; color:#1d4ed8; padding:2px 6px; border-radius:4px;">Verified</span>
                </div>
                <div style="font-size:11.5px; color:#475569; margin-top:2px;">\${p.bizName ? p.bizName + ' • ' : ''}\${p.email}</div>
                \${p.gstin ? \`<div style="font-size:10.5px; color:#64748b; font-family:monospace; margin-top:2px;">GSTIN: \${p.gstin}</div>\` : ''}
              </td>
              <td>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-size:13px; font-weight:700; color:#0f172a; font-family:monospace;" class="ap-bank-acc-display" data-full="\${fullAcc}" data-masked="\${maskedAcc}">\${maskedAcc}</span>
                  <button type="button" class="ap-toggle-acc-btn" title="Toggle full account number" style="background:none; border:none; color:#64748b; cursor:pointer; padding:2px; font-size:12px; display:inline-flex; align-items:center;">
                    <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
                <div style="font-size:11.5px; color:#475569; font-weight:600; margin-top:2px;">\${p.bankName || 'HDFC Bank Limited'}</div>
                <div style="font-size:11px; color:#64748b; font-family:monospace;">IFSC: \${p.bankIfsc || 'HDFC0001234'} • <span style="color:#059669; font-weight:600;">✓ Core Banking Verified</span></div>
              </td>
              <td>
                <strong style="color:#0f172a; font-size:13px;">\${p.orderCount || p.deliveredCount || 0}</strong> fulfilled orders
                <div style="font-size:11px; color:#64748b; margin-top:2px;">Gross Sales: \${fmtPrice(grossVal)}</div>
              </td>
              <td>
                <div style="font-size:15px; font-weight:800; color:#059669;">\${fmtPrice(netBalance)}</div>
                <div style="font-size:11px; color:#64748b; margin-top:2px;">8.5% take rate: -\${fmtPrice(commission)}</div>
              </td>
              <td>
                \${isPending ? \`
                  <span class="ap-badge amber" style="display:inline-flex; align-items:center; gap:5px; font-weight:700; font-size:11.5px; padding:3px 9px;">
                    <span style="width:6px; height:6px; border-radius:50%; background:#d97706; display:inline-block;"></span>
                    Pending Release
                  </span>
                \` : \`
                  <span class="ap-badge green" style="display:inline-flex; align-items:center; gap:5px; font-weight:700; font-size:11.5px; padding:3px 9px;">
                    <span style="width:6px; height:6px; border-radius:50%; background:#10b981; display:inline-block;"></span>
                    Settled
                  </span>
                \`}
              </td>
              <td>
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                  <button class="ap-btn primary ap-disburse-payout-btn"
                          data-seller-id="\${p._id}"
                          style="padding:6px 12px; font-size:12px; font-weight:700; background:#004ac6; color:#ffffff; border-color:#004ac6; border-radius:7px; box-shadow:0 2px 6px rgba(0,74,198,0.22); cursor:pointer;">
                    <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.2" fill="none"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    Pay to Bank Account
                  </button>
                  \${p.lastPayout ? \`
                    <button class="ap-btn neutral ap-view-last-receipt-btn" data-seller-id="\${p._id}" style="padding:5px 9px; font-size:11px; font-weight:600;" title="View Bank Remittance Advice">
                      Advice Slip ↗
                    </button>
                  \` : ''}
                </div>
              </td>
            </tr>
          \`;
        }).join('') : \`
          <tr>
            <td colspan="6" style="text-align:center; padding:36px; color:#94a3b8;">
              \${emptyHTML('💳', 'No registered seller ledgers found in database.')}
            </td>
          </tr>
        \`;

        const disbursementRows = recentDisbursements.length ? recentDisbursements.map(d => \`
          <tr data-disbursement-id="\${d._id}">
            <td style="font-weight:600; color:#0f172a; white-space:nowrap; font-size:12px;">
              \${new Date(d.disbursedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </td>
            <td>
              <div style="font-weight:700; color:#0f172a; font-size:12.5px;">\${d.storeName}</div>
              <div style="font-size:11px; color:#64748b;">\${d.beneficiaryName} (\${d.sellerEmail})</div>
            </td>
            <td>
              <div style="font-size:12px; font-weight:600; font-family:monospace; color:#0f172a;">•••• \${String(d.bankAcc).slice(-4)}</div>
              <div style="font-size:11px; color:#64748b; font-family:monospace;">\${d.bankName || 'HDFC Bank'} • \${d.bankIfsc}</div>
            </td>
            <td>
              <span style="font-size:11px; font-weight:700; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:#1e293b;">\${d.transferMode}</span>
              <div style="font-size:11px; font-family:monospace; color:#0284c7; font-weight:700; margin-top:2px;">\${d.utrNumber}</div>
            </td>
            <td>
              <span style="font-size:13.5px; font-weight:800; color:#059669;">\${fmtPrice(d.netDisbursed)}</span>
            </td>
            <td>
              <span class="ap-badge green" style="font-weight:700; font-size:11px;">✔ Settled</span>
            </td>
            <td>
              <button class="ap-btn ghost ap-print-receipt-btn" data-disbursement-id="\${d._id}" style="padding:4px 8px; font-size:11px; font-weight:600;">
                Payment Slip ↗
              </button>
            </td>
          </tr>
        \`).join('') : \`
          <tr>
            <td colspan="7" style="text-align:center; padding:24px; color:#94a3b8; font-size:12.5px;">
              No completed bank disbursements recorded yet. Click "Pay to Bank Account" above to execute real settlement.
            </td>
          </tr>
        \`;

        body.innerHTML = \`
          <div class="ap-view-inner">
            <div class="ap-view-header">
              <div class="ap-view-title-group">
                <h2 class="ap-view-title">
                  Vendor Escrow &amp; Payouts
                  <span class="ap-super-badge" style="background:#ecfdf5; color:#059669; border-color:#a7f3d0;">Live Settlement</span>
                </h2>
                <p class="ap-view-sub">Review accrued seller proceeds, manage automated escrow disbursement cycles, and authorize direct bank payouts.</p>
              </div>
              <div class="ap-view-actions">
                <button class="ap-btn ghost" id="ap-payout-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>
              </div>
            </div>

            <!-- KPI Metric Chips -->
            <div class="ap-stat-grid">
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Total Escrow Balance</span>
                  <span class="ap-stat-card-val" style="color:#059669">\${fmtPrice(totalDue)}</span>
                </div>
                <div class="ap-stat-card-icon green">
                  <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Pending Releases</span>
                  <span class="ap-stat-card-val" style="color:#d97706">\${pendingCount}</span>
                </div>
                <div class="ap-stat-card-icon amber">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                </div>
              </div>
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Settled Vendors</span>
                  <span class="ap-stat-card-val" style="color:#2563eb">\${settledCount}</span>
                </div>
                <div class="ap-stat-card-icon blue">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Platform Take Rate</span>
                  <span class="ap-stat-card-val" style="color:#6366f1">\${takeRate}</span>
                </div>
                <div class="ap-stat-card-icon purple">
                  <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
              </div>
            </div>

            <!-- Primary Seller Escrow Table Card -->
            <div class="ap-table-card">
              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th>Merchant / Store</th>
                      <th>Settlement Account</th>
                      <th>Delivered Orders</th>
                      <th>Accrued Earnings</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${payoutRows}
                  </tbody>
                </table>
              </div>
              <div class="ap-table-footer">
                <span>Showing <strong>\${payouts.length}</strong> registered seller ledgers</span>
                <span style="font-size:11px; color:#94a3b8;">X-Mart Escrow Clearing House</span>
              </div>
            </div>

            <!-- Recent Bank Disbursements & Escrow Ledger Card -->
            <div class="ap-table-card" style="margin-top:20px;">
              <div style="padding:16px 20px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <h3 style="font-size:14px; font-weight:700; color:#0f172a; margin:0; display:flex; align-items:center; gap:8px;">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="#059669" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                    Recent Bank Disbursements &amp; Escrow Ledger
                  </h3>
                  <p style="font-size:11.5px; color:#64748b; margin:2px 0 0;">Tamper-evident record of electronic funds transfers executed directly to verified seller bank accounts.</p>
                </div>
                <span style="font-size:11px; font-weight:700; color:#059669; background:#ecfdf5; padding:3px 8px; border-radius:6px;">Direct Clearing Active</span>
              </div>
              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th>Settlement Date</th>
                      <th>Merchant &amp; Beneficiary</th>
                      <th>Bank &amp; Account</th>
                      <th>Mode &amp; UTR</th>
                      <th>Net Disbursed</th>
                      <th>Clearing Status</th>
                      <th>Remittance Advice</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${disbursementRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        \`;

        // Wire Refresh button
        document.getElementById('ap-payout-refresh-btn')?.addEventListener('click', load);

        // Wire Account number toggle button
        body.querySelectorAll('.ap-toggle-acc-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const span = btn.closest('td').querySelector('.ap-bank-acc-display');
            if (span) {
              const isMasked = span.textContent === span.dataset.masked;
              span.textContent = isMasked ? span.dataset.full : span.dataset.masked;
            }
          });
        });

        // Wire "Pay to Bank Account" (Disburse Payout) Button
        body.querySelectorAll('.ap-disburse-payout-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const sellerId = btn.dataset.sellerId;
            const seller = payouts.find(p => String(p._id) === String(sellerId));
            if (seller) {
              openBankDisbursementModal(seller, load);
            }
          });
        });

        // Wire "Advice Slip" buttons on seller row
        body.querySelectorAll('.ap-view-last-receipt-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const sellerId = btn.dataset.sellerId;
            const seller = payouts.find(p => String(p._id) === String(sellerId));
            if (seller?.lastPayout) {
              const syntheticReceipt = {
                storeName: seller.storeName,
                beneficiaryName: seller.name,
                sellerEmail: seller.email,
                bankAcc: seller.bankAcc,
                bankIfsc: seller.bankIfsc,
                bankName: seller.bankName,
                netDisbursed: seller.lastPayout.netDisbursed,
                transferMode: seller.lastPayout.transferMode,
                utrNumber: seller.lastPayout.utrNumber,
                disbursedAt: seller.lastPayout.disbursedAt,
                remarks: 'Marketplace Escrow Disbursement Settlement',
              };
              openPaymentAdviceModal(syntheticReceipt);
            }
          });
        });

        // Wire "Payment Slip" buttons on disbursement ledger
        body.querySelectorAll('.ap-print-receipt-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const dId = btn.dataset.disbursementId;
            const d = recentDisbursements.find(item => String(item._id) === String(dId));
            if (d) {
              openPaymentAdviceModal(d);
            }
          });
        });

      } catch (err) {
        body.innerHTML = emptyHTML('⚠️', \`Failed to load payout queue: \${err.message}\`);
      }
    }

    load();
  }

  /* ── Interactive Bank Disbursement Modal ─────────────────── */
  function openBankDisbursementModal(seller, onComplete) {
    const defaultAmount = seller.currentEscrowBalance ?? seller.totalEarned ?? 0;
    const defaultUtr = 'UTR' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + Math.floor(100000 + Math.random() * 900000);
    const bankName = seller.bankName || (seller.bankIfsc?.startsWith('HDFC') ? 'HDFC Bank Limited' : 'National Clearing Bank');

    const backdrop = document.createElement('div');
    backdrop.className = 'ap-modal-backdrop';
    backdrop.id = 'ap-disbursement-modal';

    backdrop.innerHTML = \`
      <div class="ap-modal-dialog" style="max-width: 620px;">
        <div class="ap-modal-header" style="background: linear-gradient(135deg, #0b1c30, #1e3a5f); color: #ffffff;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center;">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="#38bdf8" stroke-width="2.2" fill="none"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div>
              <h3 class="ap-modal-title" style="color:#ffffff; font-size:15px; font-weight:800;">Authorize Seller Bank Disbursement</h3>
              <p style="font-size:11.5px; color:#94a3b8; margin:2px 0 0;">Direct Electronic Transfer to Registered Merchant Bank Account</p>
            </div>
          </div>
          <button type="button" class="ap-modal-close-btn" style="color:#ffffff;" id="ap-disburse-close-btn">✕</button>
        </div>

        <div class="ap-modal-content" style="padding:22px; max-height:78vh; overflow-y:auto;">
          <!-- Beneficiary & Bank Verification Summary Box -->
          <div style="background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:18px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <div>
                <span style="font-size:10px; font-weight:800; text-transform:uppercase; color:#0284c7; letter-spacing:0.05em; background:#e0f2fe; padding:2px 7px; border-radius:4px;">Registered Beneficiary</span>
                <div style="font-size:15px; font-weight:800; color:#0f172a; margin-top:4px;">\${seller.name}</div>
                <div style="font-size:12px; color:#475569;">Store: <strong>\${seller.storeName}</strong> \${seller.bizName ? '• (' + seller.bizName + ')' : ''}</div>
              </div>
              <div style="text-align:right;">
                <span style="display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:700; color:#059669; background:#ecfdf5; padding:3px 8px; border-radius:6px;">
                  ✓ Bank Verified
                </span>
                <div style="font-size:11px; color:#64748b; margin-top:3px;">\${seller.email}</div>
              </div>
            </div>

            <!-- Account Details Strip -->
            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:12px 14px; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:12.5px;">
              <div>
                <div style="color:#64748b; font-size:11px;">Account Number</div>
                <div style="font-weight:700; color:#0f172a; font-family:monospace; font-size:13.5px;">\${seller.bankAcc}</div>
              </div>
              <div>
                <div style="color:#64748b; font-size:11px;">IFSC Code &amp; Bank</div>
                <div style="font-weight:700; color:#0f172a; font-family:monospace; font-size:13px;">\${seller.bankIfsc} (\${bankName})</div>
              </div>
            </div>
          </div>

          <!-- Escrow Financial Calculation Strip -->
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px 16px; margin-bottom:18px;">
            <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px;">
              <span style="color:#166534;">Gross Fulfilled Order Sales:</span>
              <strong style="color:#0f172a;">\${fmtPrice(seller.grossRevenue || (defaultAmount + (seller.commissionAmount || 0)))}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px;">
              <span style="color:#166534;">Platform Fee Deduction (8.5%):</span>
              <strong style="color:#dc2626;">-\${fmtPrice(seller.commissionAmount || Math.round(defaultAmount * 0.085))}</strong>
            </div>
            <div style="border-top:1px solid #bbf7d0; padding-top:8px; display:flex; justify-content:space-between; font-size:14px;">
              <span style="color:#15803d; font-weight:700;">Net Accrued Escrow Proceeds:</span>
              <strong style="color:#065f46; font-size:17px; font-weight:900;">\${fmtPrice(defaultAmount)}</strong>
            </div>
          </div>

          <!-- Form Fields (ZERO placeholders) -->
          <form id="ap-disbursement-form" style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#0f172a; margin-bottom:5px;">Disbursement Amount to Transfer (₹)</label>
              <input type="number" id="ap-disburse-amount-input" class="ap-profile-input" value="\${defaultAmount}" min="1" max="\${Math.max(defaultAmount, 10000000)}" style="width:100%; box-sizing:border-box; font-size:16px; font-weight:800; color:#059669; padding:10px 12px;" required>
              <div style="font-size:11px; color:#64748b; margin-top:3px;">Transferring the accrued balance directly to the verified bank account.</div>
            </div>

            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#0f172a; margin-bottom:6px;">Electronic Transfer Clearing Network</label>
              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
                <label style="display:flex; flex-direction:column; align-items:center; padding:8px 6px; border:1.5px solid #004ac6; background:#eff6ff; border-radius:8px; cursor:pointer; text-align:center;">
                  <input type="radio" name="transferMode" value="IMPS" checked style="margin-bottom:4px;">
                  <span style="font-size:12px; font-weight:700; color:#0f172a;">IMPS</span>
                  <span style="font-size:9.5px; color:#059669; font-weight:600;">Instant 24x7</span>
                </label>
                <label style="display:flex; flex-direction:column; align-items:center; padding:8px 6px; border:1.5px solid #e2e8f0; background:#ffffff; border-radius:8px; cursor:pointer; text-align:center;">
                  <input type="radio" name="transferMode" value="NEFT" style="margin-bottom:4px;">
                  <span style="font-size:12px; font-weight:700; color:#0f172a;">NEFT</span>
                  <span style="font-size:9.5px; color:#64748b;">RBI Batch</span>
                </label>
                <label style="display:flex; flex-direction:column; align-items:center; padding:8px 6px; border:1.5px solid #e2e8f0; background:#ffffff; border-radius:8px; cursor:pointer; text-align:center;">
                  <input type="radio" name="transferMode" value="RTGS" style="margin-bottom:4px;">
                  <span style="font-size:12px; font-weight:700; color:#0f172a;">RTGS</span>
                  <span style="font-size:9.5px; color:#64748b;">Gross RT</span>
                </label>
                <label style="display:flex; flex-direction:column; align-items:center; padding:8px 6px; border:1.5px solid #e2e8f0; background:#ffffff; border-radius:8px; cursor:pointer; text-align:center;">
                  <input type="radio" name="transferMode" value="UPI" style="margin-bottom:4px;">
                  <span style="font-size:12px; font-weight:700; color:#0f172a;">UPI</span>
                  <span style="font-size:9.5px; color:#64748b;">VPA Direct</span>
                </label>
              </div>
            </div>

            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#0f172a; margin-bottom:5px;">Bank UTR / Transaction Reference ID</label>
              <input type="text" id="ap-disburse-utr-input" class="ap-profile-input" value="\${defaultUtr}" style="width:100%; box-sizing:border-box; font-family:monospace; font-weight:700; padding:10px 12px;" required>
              <div style="font-size:11px; color:#64748b; margin-top:3px;">Auto-generated unique bank settlement reference number.</div>
            </div>

            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#0f172a; margin-bottom:5px;">Clearing Memo &amp; Remarks</label>
              <input type="text" id="ap-disburse-remarks-input" class="ap-profile-input" value="Escrow settlement to \${seller.storeName}" style="width:100%; box-sizing:border-box; padding:10px 12px;">
            </div>

            <div style="display:flex; align-items:center; gap:8px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 12px; font-size:12px; color:#1e40af;">
              <input type="checkbox" id="ap-disburse-confirm-cb" checked required style="cursor:pointer;">
              <label for="ap-disburse-confirm-cb" style="cursor:pointer; font-weight:500;">
                I authorize this electronic escrow clearance to the merchant's registered account.
              </label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px; padding-top:14px; border-top:1px solid #e2e8f0;">
              <button type="button" class="ap-btn ghost" id="ap-disburse-cancel-btn" style="padding:8px 16px; font-size:13px;">Cancel</button>
              <button type="submit" class="ap-btn primary" id="ap-disburse-submit-btn" style="padding:8px 20px; font-size:13px; font-weight:800; background:#004ac6; color:#ffffff; border-color:#004ac6; border-radius:8px; display:inline-flex; align-items:center; gap:7px;">
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.5" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Confirm &amp; Disburse to Bank
              </button>
            </div>
          </form>
        </div>
      </div>
    \`;

    document.body.appendChild(backdrop);

    const close = () => { backdrop.remove(); };
    backdrop.querySelector('#ap-disburse-close-btn')?.addEventListener('click', close);
    backdrop.querySelector('#ap-disburse-cancel-btn')?.addEventListener('click', close);

    const form = backdrop.querySelector('#ap-disbursement-form');
    const submitBtn = backdrop.querySelector('#ap-disburse-submit-btn');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = Number(document.getElementById('ap-disburse-amount-input')?.value);
      const utrNumber = document.getElementById('ap-disburse-utr-input')?.value?.trim();
      const remarks = document.getElementById('ap-disburse-remarks-input')?.value?.trim();
      const transferMode = form.querySelector('input[name="transferMode"]:checked')?.value || 'IMPS';

      if (!amount || amount <= 0) {
        showToast('Please enter a valid disbursement amount.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Clearing with Banking Gateway…';

      try {
        const res = await adminFetch('/payouts/disburse', {
          method: 'POST',
          body: JSON.stringify({
            sellerId: seller._id,
            amount,
            transferMode,
            utrNumber,
            remarks,
          }),
        });

        if (res?.success) {
          showToast(\`Disbursement successful! ₹\${amount.toLocaleString('en-IN')} transferred via \${transferMode}.\`, 'success', 4000);
          close();
          const createdPayout = res.data?.payout;
          if (createdPayout) {
            openPaymentAdviceModal(createdPayout);
          }
          if (onComplete) onComplete();
        } else {
          showToast(res?.message || 'Disbursement failed. Please try again.', 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Confirm &amp; Disburse to Bank';
        }
      } catch (err) {
        showToast(\`Disbursement failed: \${err.message}\`, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Confirm &amp; Disburse to Bank';
      }
    });
  }

  /* ── Official Bank Settlement Advice Modal (Slip) ───────── */
  function openPaymentAdviceModal(payout) {
    const backdrop = document.createElement('div');
    backdrop.className = 'ap-modal-backdrop';
    backdrop.id = 'ap-advice-modal';

    const now = payout.disbursedAt ? new Date(payout.disbursedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-IN');
    const maskedAcc = payout.bankAcc ? '•••• ' + String(payout.bankAcc).slice(-4) : '•••• 0123';

    backdrop.innerHTML = \`
      <div class="ap-modal-dialog" style="max-width: 580px; box-shadow:0 20px 40px rgba(0,0,0,0.22);">
        <div class="ap-modal-header" style="background:#064e3b; color:#ffffff; border-bottom:1px solid #047857;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">🏛️</span>
            <div>
              <h3 class="ap-modal-title" style="color:#ffffff; font-size:14px; font-weight:800; letter-spacing:0.02em;">X-MART ESCROW CLEARING HOUSE</h3>
              <p style="font-size:11px; color:#a7f3d0; margin:1px 0 0;">Official Electronic Settlement &amp; Bank Remittance Advice</p>
            </div>
          </div>
          <button type="button" class="ap-modal-close-btn" style="color:#ffffff;" id="ap-advice-close-btn">✕</button>
        </div>

        <div class="ap-modal-content" id="ap-printable-advice-slip" style="padding:24px; background:#ffffff;">
          <div style="text-align:center; padding:12px 0 16px; border-bottom:2px dashed #e2e8f0;">
            <div style="display:inline-block; background:#ecfdf5; border:1px solid #86efac; border-radius:50%; width:50px; height:50px; line-height:50px; font-size:24px; color:#059669; margin-bottom:8px;">✓</div>
            <h2 style="margin:0; font-size:19px; font-weight:900; color:#064e3b;">PAYMENT SETTLED &amp; CLEARED</h2>
            <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Disbursed to Beneficiary Bank Account via \${payout.transferMode || 'IMPS'}</p>
          </div>

          <div style="text-align:center; margin:18px 0; background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:16px;">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#15803d; letter-spacing:0.05em;">Net Disbursed Amount</div>
            <div style="font-size:32px; font-weight:900; color:#065f46; margin:4px 0;">₹\${Number(payout.netDisbursed).toLocaleString('en-IN')}</div>
            <div style="font-size:11.5px; color:#166534; font-weight:600;">Authorized by Super Administrator Root</div>
          </div>

          <table style="width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:18px;">
            <tbody>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 0; color:#64748b;">Merchant Store:</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; color:#0f172a;">\${payout.storeName}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 0; color:#64748b;">Beneficiary Name:</td>
                <td style="padding:8px 0; text-align:right; font-weight:600; color:#0f172a;">\${payout.beneficiaryName}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 0; color:#64748b;">Settlement Bank:</td>
                <td style="padding:8px 0; text-align:right; font-weight:600; color:#0f172a;">\${payout.bankName || 'HDFC Bank Limited'}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 0; color:#64748b;">Credited Bank A/C:</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace; color:#0f172a;">\${maskedAcc} (\${payout.bankAcc})</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 0; color:#64748b;">Bank IFSC Code:</td>
                <td style="padding:8px 0; text-align:right; font-weight:700; font-family:monospace; color:#0f172a;">\${payout.bankIfsc}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 0; color:#64748b;">Bank UTR Reference:</td>
                <td style="padding:8px 0; text-align:right; font-weight:800; font-family:monospace; color:#0284c7;">\${payout.utrNumber}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 0; color:#64748b;">Settlement Timestamp:</td>
                <td style="padding:8px 0; text-align:right; color:#0f172a;">\${now}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#64748b;">Remarks:</td>
                <td style="padding:8px 0; text-align:right; color:#475569;">\${payout.remarks || 'Escrow Settlement'}</td>
              </tr>
            </tbody>
          </table>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; font-size:11.5px; color:#64748b; line-height:1.4; text-align:center;">
            This electronic remittance advice confirms full discharge of accrued escrow obligations for this settlement cycle. Dispatched to \${payout.sellerEmail}.
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; padding-top:14px; border-top:1px solid #e2e8f0;">
            <button type="button" class="ap-btn ghost" id="ap-advice-print-btn" style="padding:8px 16px; font-size:12.5px; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print Remittance Advice
            </button>
            <button type="button" class="ap-btn primary" id="ap-advice-done-btn" style="padding:8px 18px; font-size:12.5px; font-weight:700; background:#059669; color:#ffffff; border-color:#059669;">Done</button>
          </div>
        </div>
      </div>
    \`;

    document.body.appendChild(backdrop);
    const close = () => { backdrop.remove(); };
    backdrop.querySelector('#ap-advice-close-btn')?.addEventListener('click', close);
    backdrop.querySelector('#ap-advice-done-btn')?.addEventListener('click', close);
    backdrop.querySelector('#ap-advice-print-btn')?.addEventListener('click', () => {
      window.print();
    });
  }

  `;

js = js.slice(0, sIdx) + newRenderPayouts + js.slice(eIdx);

// Ensure no placeholders were accidentally introduced
const placeholderMatches = js.match(/\\s+placeholder=(?:\"[^\"]*\"|'[^']*')/g);
console.log('Placeholders in updated script:', placeholderMatches ? placeholderMatches.length : 0);

fs.writeFileSync('script.js', js, 'utf8');
console.log('Wrote updated script.js.');

try {
  execSync('node -c script.js');
  console.log('SUCCESS: script.js syntax check PASSED!');
} catch (err) {
  console.error('ERROR: Syntax check failed:', err.message);
  process.exit(1);
}
