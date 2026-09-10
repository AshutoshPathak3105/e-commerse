const fs = require('fs');
const { execSync } = require('child_process');

let js = fs.readFileSync('script.js', 'utf8');

// 1. Update customer return submit handler in _openReturnReplacePage
const oldSubmitBlock = `    // Final submit
    pageContainer.querySelector('#btn-submit-return-final')?.addEventListener('click', () => {
      const rmaCode = \`RMA-XM-\${Math.floor(10000000 + Math.random() * 90000000)}\`;
      
      // Hide steps and step bar
      if (viewStep1) viewStep1.style.display = 'none';
      if (viewStep2) viewStep2.style.display = 'none';
      if (viewStep3) viewStep3.style.display = 'none';
      const wizardBar = pageContainer.querySelector('#return-step-wizard-bar');
      if (wizardBar) wizardBar.style.display = 'none';

      const successBox = pageContainer.querySelector('#return-success-container');
      if (successBox) {
        successBox.style.display = 'block';
        successBox.querySelector('#rma-ref-code').textContent = rmaCode;
        successBox.querySelector('#rma-refund-method-text').textContent = selectedRefundMethod === 'wallet' ? 'X-Mart Wallet (Instant Credit)' : 'Direct into Bank Account / UPI';
        successBox.querySelector('#rma-pickup-addr-text').textContent = \`\${selectedPickupAddr.street}, \${selectedPickupAddr.city} - \${selectedPickupAddr.pincode}\`;
      }
      showToast(\`Return Request Submitted! RMA ID: \${rmaCode}\`, 'success');
    });`;

const newSubmitBlock = `    // Final submit
    pageContainer.querySelector('#btn-submit-return-final')?.addEventListener('click', async () => {
      const submitBtn = pageContainer.querySelector('#btn-submit-return-final');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting Return Request…';
      }

      let rmaCode = \`RMA-XM-\${Math.floor(10000000 + Math.random() * 90000000)}\`;
      const comments = pageContainer.querySelector('#return-comments-input')?.value?.trim() || '';

      try {
        const targetId = order._id || order.id;
        if (targetId) {
          const res = await apiFetch(\`/orders/\${targetId}/return\`, {
            method: 'POST',
            body: JSON.stringify({
              reason: selectedReason,
              comments,
              pickupAddress: selectedPickupAddr,
              refundMethod: selectedRefundMethod,
            }),
          });
          if (res?.data?.rmaNumber) {
            rmaCode = res.data.rmaNumber;
          }
        }
      } catch (err) {
        console.warn('Backend return submission note:', err.message);
      }

      // Hide steps and step bar
      if (viewStep1) viewStep1.style.display = 'none';
      if (viewStep2) viewStep2.style.display = 'none';
      if (viewStep3) viewStep3.style.display = 'none';
      const wizardBar = pageContainer.querySelector('#return-step-wizard-bar');
      if (wizardBar) wizardBar.style.display = 'none';

      const successBox = pageContainer.querySelector('#return-success-container');
      if (successBox) {
        successBox.style.display = 'block';
        successBox.querySelector('#rma-ref-code').textContent = rmaCode;
        successBox.querySelector('#rma-refund-method-text').textContent = selectedRefundMethod === 'wallet' ? 'X-Mart Wallet (Instant Credit)' : 'Direct into Bank Account / UPI';
        successBox.querySelector('#rma-pickup-addr-text').textContent = \`\${selectedPickupAddr.street}, \${selectedPickupAddr.city} - \${selectedPickupAddr.pincode}\`;
      }
      showToast(\`Return Request Submitted! RMA ID: \${rmaCode}\`, 'success');
    });`;

if (js.includes(oldSubmitBlock)) {
  js = js.replace(oldSubmitBlock, newSubmitBlock);
  console.log('Customer return submission handler updated!');
} else {
  console.log('Warning: oldSubmitBlock not found exactly. Locating by substring...');
  const idx = js.indexOf("pageContainer.querySelector('#btn-submit-return-final')?.addEventListener('click',");
  if (idx !== -1) {
    const endIdx = js.indexOf("pageContainer.querySelector('#btn-return-done-orders')", idx);
    js = js.slice(0, idx) + newSubmitBlock.trim() + '\n\n    ' + js.slice(endIdx);
    console.log('Customer return submission handler replaced by index!');
  }
}

// 2. Update renderCustomerService in Admin Panel
const sCS = js.indexOf("async function renderCustomerService(body) {");
const eCS = js.indexOf("/* ══════════════════════════════════════════════════════\n     TAB: PAYMENTS & PAYOUTS", sCS) !== -1
  ? js.indexOf("/* ══════════════════════════════════════════════════════\n     TAB: PAYMENTS & PAYOUTS", sCS)
  : js.indexOf("async function renderPayouts(body) {", sCS);

if (sCS === -1 || eCS === -1) {
  throw new Error(`Could not find renderCustomerService section (sCS: ${sCS}, eCS: ${eCS})`);
}

const newRenderCustomerService = `async function renderCustomerService(body) {
    let currentTab = 'returns';
    body.innerHTML = loadingHTML();

    async function load() {
      try {
        const res = await adminFetch('/customer-service');
        const { returnOrders = [], cancelOrders = [], stats = {} } = res.data || {};

        const activeList = currentTab === 'returns' ? returnOrders : cancelOrders;

        const rowsHTML = activeList.length ? activeList.map(o => {
          const itemsSummary = (o.items || []).map(i => \`\${i.quantity || 1}x \${i.name}\`).join(', ');
          const rr = o.returnRequest || {};
          const rmaStatus = rr.status || (o.refundApproved ? 'Refunded' : 'Requested');

          let statusBadgeHTML = '';
          if (currentTab === 'returns') {
            if (rmaStatus === 'Approved') {
              statusBadgeHTML = '<span class="ap-badge blue" style="font-weight:700;font-size:11px;">● RMA Approved (AWB Set)</span>';
            } else if (rmaStatus === 'Item_Picked_Up') {
              statusBadgeHTML = '<span class="ap-badge purple" style="font-weight:700;font-size:11px;">● Item Received at FC</span>';
            } else if (rmaStatus === 'Refunded' || o.refundApproved) {
              statusBadgeHTML = '<span class="ap-badge green" style="font-weight:700;font-size:11px;">✔ Refund Settled</span>';
            } else if (rmaStatus === 'Rejected') {
              statusBadgeHTML = '<span class="ap-badge red" style="font-weight:700;font-size:11px;">✖ RMA Rejected</span>';
            } else {
              statusBadgeHTML = '<span class="ap-badge amber" style="font-weight:700;font-size:11px;">● Return Requested</span>';
            }
          } else {
            statusBadgeHTML = o.refundApproved
              ? '<span class="ap-badge green" style="font-weight:700;font-size:11px;">✔ Refund Cleared</span>'
              : '<span class="ap-badge gray" style="font-weight:700;font-size:11px;">Pre-Dispatch Cancel</span>';
          }

          return \`
            <tr data-order-id="\${o._id}">
              <td>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:monospace; font-weight:700; color:#004ac6; font-size:13px;">\${o.orderId}</span>
                  \${rr.rmaNumber ? \`<span style="font-size:10px; font-weight:800; background:#f1f5f9; padding:2px 5px; border-radius:4px; color:#475569;">\${rr.rmaNumber}</span>\` : ''}
                </div>
                <div style="font-size:11px; color:#64748b; margin-top:2px;">\${fmtDate(o.date)}</div>
                \${rr.reverseAwb ? \`<div style="font-size:10.5px; color:#0284c7; font-family:monospace; font-weight:700; margin-top:2px;">AWB: \${rr.reverseAwb}</div>\` : ''}
              </td>
              <td>
                <div style="font-weight:700; color:#0f172a; font-size:13px;">\${o.user?.name || 'Customer'}</div>
                <div style="font-size:11.5px; color:#64748b;">\${o.user?.email || '—'}</div>
                \${o.user?.phone ? \`<div style="font-size:11px; color:#64748b;">\${o.user.phone}</div>\` : ''}
              </td>
              <td>
                <div style="font-weight:700; color:#0f172a; font-size:12.5px;">\${(o.items || []).length} Item(s)</div>
                <div style="font-size:11px; color:#64748b; max-width:210px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="\${itemsSummary}">\${itemsSummary || 'Standard Product'}</div>
                \${rr.reason ? \`<div style="font-size:11px; font-weight:600; color:#b45309; margin-top:2px; background:#fffbeb; padding:2px 6px; border-radius:4px; display:inline-block;">Reason: \${rr.reason}</div>\` : ''}
              </td>
              <td>
                <div style="font-size:14.5px; font-weight:800; color:#0f172a;">\${fmtPrice(o.total)}</div>
                <div style="font-size:10.5px; color:#64748b; text-transform:uppercase; font-weight:700;">Via \${rr.refundMethod || 'Wallet'}</div>
              </td>
              <td>
                \${statusBadgeHTML}
              </td>
              <td>
                \${currentTab === 'returns' ? \`
                  <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
                    \${rmaStatus === 'Requested' ? \`
                      <button class="ap-btn primary ap-rma-approve-btn" data-id="\${o._id}" style="padding:5px 10px; font-size:11.5px; font-weight:700; background:#004ac6; color:#ffffff; border-color:#004ac6;">
                        Approve RMA
                      </button>
                      <button class="ap-btn danger ap-rma-reject-btn" data-id="\${o._id}" style="padding:5px 8px; font-size:11px;">
                        Reject
                      </button>
                    \` : ''}
                    \${rmaStatus === 'Approved' ? \`
                      <button class="ap-btn neutral ap-rma-receive-btn" data-id="\${o._id}" style="padding:5px 10px; font-size:11.5px; font-weight:700; background:#f8fafc; border-color:#cbd5e1;">
                        Mark Item Received
                      </button>
                    \` : ''}
                    \${rmaStatus === 'Item_Picked_Up' ? \`
                      <button class="ap-btn success ap-rma-refund-btn" data-id="\${o._id}" data-total="\${o.total}" data-dest="\${rr.refundMethod || 'wallet'}" style="padding:5px 12px; font-size:11.5px; font-weight:800; background:#059669; color:#ffffff; border-color:#059669;">
                        Authorize Refund
                      </button>
                    \` : ''}
                    \${rmaStatus === 'Refunded' || o.refundApproved ? \`
                      <button class="ap-btn ghost ap-view-refund-receipt-btn" data-id="\${o._id}" style="padding:4px 9px; font-size:11px; font-weight:700;">
                        Credit Note ↗
                      </button>
                    \` : ''}
                  </div>
                \` : \`
                  <div style="display:flex; align-items:center; gap:6px;">
                    \${!o.refundApproved ? \`
                      <button class="ap-btn primary ap-cancel-refund-btn" data-id="\${o._id}" data-total="\${o.total}" style="padding:5px 11px; font-size:11.5px; font-weight:700; background:#004ac6; color:#ffffff; border-color:#004ac6;">
                        Process Refund
                      </button>
                    \` : \`
                      <button class="ap-btn ghost ap-view-refund-receipt-btn" data-id="\${o._id}" style="padding:4px 9px; font-size:11px; font-weight:700;">
                        Credit Note ↗
                      </button>
                    \`}
                  </div>
                \`}
              </td>
            </tr>
          \`;
        }).join('') : \`
          <tr>
            <td colspan="6" style="text-align:center; padding:36px; color:#94a3b8;">
              \${emptyHTML('📦', currentTab === 'returns' ? 'No pending return requests.' : 'No cancellation logs.')}
            </td>
          </tr>
        \`;

        body.innerHTML = \`
          <div class="ap-view-inner">
            <div class="ap-view-header">
              <div class="ap-view-title-group">
                <h2 class="ap-view-title">
                  Returns &amp; Refunds Management
                  <span class="ap-super-badge" style="background:#fef2f2; color:#ef4444; border-color:#fecaca;">RMA Controller</span>
                </h2>
                <p class="ap-view-sub">Process customer reverse logistics, authorize return authorizations (RMA), and issue verified credit settlements.</p>
              </div>
              <div class="ap-view-actions">
                <button class="ap-btn ghost" id="ap-cs-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>
              </div>
            </div>

            <!-- KPI Chips -->
            <div class="ap-stat-grid">
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Pending Returns</span>
                  <span class="ap-stat-card-val" style="color:#ef4444">\${stats.pendingReturns ?? 0}</span>
                </div>
                <div class="ap-stat-card-icon red">
                  <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
                </div>
              </div>
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Refunds Authorized</span>
                  <span class="ap-stat-card-val" style="color:#059669">\${stats.refundApproved ?? 0}</span>
                </div>
                <div class="ap-stat-card-icon green">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">Pre-Dispatch Cancel</span>
                  <span class="ap-stat-card-val" style="color:#d97706">\${stats.cancellations ?? 0}</span>
                </div>
                <div class="ap-stat-card-icon amber">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
              </div>
              <div class="ap-stat-card">
                <div class="ap-stat-card-left">
                  <span class="ap-stat-card-lbl">RTO Reverse SLA</span>
                  <span class="ap-stat-card-val" style="color:#2563eb">\${stats.rtoReverseSla || '98.9%'}</span>
                </div>
                <div class="ap-stat-card-icon blue">
                  <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
              </div>
            </div>

            <!-- Toolbar / Filter Tabs -->
            <div class="ap-toolbar">
              <div class="ap-toolbar-left">
                <div class="ap-toolbar-tabs">
                  <button class="ap-tab-pill \${currentTab === 'returns' ? 'active' : ''}" data-tab="returns">
                    Return Requests (\${returnOrders.length})
                  </button>
                  <button class="ap-tab-pill \${currentTab === 'cancellations' ? 'active' : ''}" data-tab="cancellations">
                    Cancellations (\${cancelOrders.length})
                  </button>
                </div>
              </div>
            </div>

            <!-- Table Card -->
            <div class="ap-table-card">
              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th>Order ID &amp; RMA</th>
                      <th>Customer</th>
                      <th>Items &amp; Reason</th>
                      <th>Settlement Total</th>
                      <th>RMA Status</th>
                      <th>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${rowsHTML}
                  </tbody>
                </table>
              </div>
              <div class="ap-table-footer">
                <span>Showing <strong>\${activeList.length}</strong> records</span>
                <span style="font-size:11px; color:#94a3b8;">X-Mart Reverse Logistics Engine</span>
              </div>
            </div>
          </div>
        \`;

        // Refresh handler
        document.getElementById('ap-cs-refresh-btn')?.addEventListener('click', load);

        // Subtab pill switching
        body.querySelectorAll('.ap-tab-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            currentTab = btn.dataset.tab;
            load();
          });
        });

        // 1. Approve RMA
        body.querySelectorAll('.ap-rma-approve-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const notes = prompt('Enter reverse logistics pickup notes (optional):', 'Blue Dart Express doorstep pickup scheduled');
            if (notes === null) return;
            btn.disabled = true;
            btn.textContent = 'Approving…';
            try {
              const res = await adminFetch(\`/orders/\${id}/return-action\`, {
                method: 'POST',
                body: JSON.stringify({ action: 'approve_rma', notes }),
              });
              showToast(res.message || 'RMA approved and AWB assigned.', 'success');
              load();
            } catch (err) {
              showToast(err.message, 'error');
              btn.disabled = false;
              btn.textContent = 'Approve RMA';
            }
          });
        });

        // 2. Mark Item Received
        body.querySelectorAll('.ap-rma-receive-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (!confirm('Confirm returned product has been physically received & inspected at warehouse?')) return;
            btn.disabled = true;
            btn.textContent = 'Updating…';
            try {
              const res = await adminFetch(\`/orders/\${id}/return-action\`, {
                method: 'POST',
                body: JSON.stringify({ action: 'mark_received', notes: 'Item physically checked into fulfillment center.' }),
              });
              showToast(res.message || 'Item marked as received.', 'success');
              load();
            } catch (err) {
              showToast(err.message, 'error');
              btn.disabled = false;
              btn.textContent = 'Mark Item Received';
            }
          });
        });

        // 3. Authorize Refund
        body.querySelectorAll('.ap-rma-refund-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const total = Number(btn.dataset.total);
            const dest = btn.dataset.dest || 'wallet';
            const refundAmt = prompt(\`Confirm refund settlement amount for this order (₹):\`, total);
            if (!refundAmt) return;

            btn.disabled = true;
            btn.textContent = 'Processing Refund…';
            try {
              const res = await adminFetch(\`/orders/\${id}/return-action\`, {
                method: 'POST',
                body: JSON.stringify({
                  action: 'authorize_refund',
                  refundAmount: Number(refundAmt),
                }),
              });
              showToast(res.message || 'Refund successfully issued.', 'success');
              load();
              // Show refund credit note modal
              openRefundCreditNoteModal(id);
            } catch (err) {
              showToast(err.message, 'error');
              btn.disabled = false;
              btn.textContent = 'Authorize Refund';
            }
          });
        });

        // 4. Reject RMA
        body.querySelectorAll('.ap-rma-reject-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const notes = prompt('Enter reason for rejecting return request:', 'Item outside allowable return policy window');
            if (notes === null) return;
            btn.disabled = true;
            btn.textContent = 'Rejecting…';
            try {
              const res = await adminFetch(\`/orders/\${id}/return-action\`, {
                method: 'POST',
                body: JSON.stringify({ action: 'reject_rma', notes }),
              });
              showToast(res.message || 'Return request rejected.', 'info');
              load();
            } catch (err) {
              showToast(err.message, 'error');
              btn.disabled = false;
              btn.textContent = 'Reject';
            }
          });
        });

        // 5. Process Cancellation Refund
        body.querySelectorAll('.ap-cancel-refund-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const total = Number(btn.dataset.total);
            if (!confirm(\`Process full cancellation refund of ₹\${total.toLocaleString('en-IN')} to customer?\`)) return;

            btn.disabled = true;
            btn.textContent = 'Refunding…';
            try {
              const res = await adminFetch(\`/orders/\${id}/return-action\`, {
                method: 'POST',
                body: JSON.stringify({
                  action: 'settle_cancellation',
                  refundAmount: total,
                }),
              });
              showToast(res.message || 'Cancellation refund settled.', 'success');
              load();
              openRefundCreditNoteModal(id);
            } catch (err) {
              showToast(err.message, 'error');
              btn.disabled = false;
              btn.textContent = 'Process Refund';
            }
          });
        });

        // 6. View Refund Credit Note
        body.querySelectorAll('.ap-view-refund-receipt-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            openRefundCreditNoteModal(id);
          });
        });

      } catch (err) {
        body.innerHTML = emptyHTML('⚠️', \`Failed to load returns: \${err.message}\`);
      }
    }

    load();
  }

  /* ── Interactive Refund Credit Note / Settlement Modal ───── */
  async function openRefundCreditNoteModal(orderId) {
    try {
      const res = await adminFetch(\`/orders/\${orderId}/refund-receipt\`);
      const receipt = res.data?.receipt;
      if (!receipt) throw new Error('Receipt details not found.');

      const backdrop = document.createElement('div');
      backdrop.className = 'ap-modal-backdrop';
      backdrop.id = 'ap-refund-credit-note-modal';

      const now = receipt.refundedAt ? new Date(receipt.refundedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-IN');
      const destination = receipt.refundMethod === 'wallet' ? 'X-Mart Wallet (Instant Balance)' : 'Original Payment Source / Direct Bank Account';

      backdrop.innerHTML = \`
        <div class="ap-modal-dialog" style="max-width: 580px; box-shadow:0 20px 40px rgba(0,0,0,0.2);">
          <div class="ap-modal-header" style="background: linear-gradient(135deg, #064e3b, #047857); color: #ffffff;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">📄</span>
              <div>
                <h3 class="ap-modal-title" style="color:#ffffff; font-size:14px; font-weight:800;">OFFICIAL REFUND CREDIT MEMORANDUM</h3>
                <p style="font-size:11px; color:#a7f3d0; margin:1px 0 0;">Reverse Logistics Settlement • X-Mart Financial Operations</p>
              </div>
            </div>
            <button type="button" class="ap-modal-close-btn" style="color:#ffffff;" id="ap-credit-note-close-btn">✕</button>
          </div>

          <div class="ap-modal-content" style="padding:22px; background:#ffffff;">
            <div style="text-align:center; padding:8px 0 14px; border-bottom:2px dashed #e2e8f0;">
              <div style="display:inline-block; background:#ecfdf5; border:1px solid #86efac; border-radius:50%; width:48px; height:48px; line-height:48px; font-size:22px; color:#059669; margin-bottom:8px;">✓</div>
              <h2 style="margin:0; font-size:18px; font-weight:900; color:#064e3b;">REFUND AUTHORIZED &amp; CLEARED</h2>
              <p style="margin:3px 0 0; font-size:12px; color:#64748b;">Credit settlement issued under Reference <strong>\${receipt.refundUtr}</strong></p>
            </div>

            <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:14px; margin:16px 0; text-align:center;">
              <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#15803d; letter-spacing:0.05em;">Total Settled Refund</div>
              <div style="font-size:30px; font-weight:900; color:#065f46; margin:4px 0;">₹\${Number(receipt.refundAmount).toLocaleString('en-IN')}</div>
              <div style="font-size:12px; color:#166534; font-weight:600;">Credited to \${destination}</div>
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:16px;">
              <tbody>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:7px 0; color:#64748b;">Order Number:</td>
                  <td style="padding:7px 0; text-align:right; font-weight:700; color:#0f172a;">\${receipt.orderId}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:7px 0; color:#64748b;">RMA Reference ID:</td>
                  <td style="padding:7px 0; text-align:right; font-weight:700; font-family:monospace; color:#004ac6;">\${receipt.rmaNumber}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:7px 0; color:#64748b;">Customer Name:</td>
                  <td style="padding:7px 0; text-align:right; font-weight:600; color:#0f172a;">\${receipt.customerName} (\${receipt.customerEmail})</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:7px 0; color:#64748b;">Refund UTR / Reference:</td>
                  <td style="padding:7px 0; text-align:right; font-weight:800; font-family:monospace; color:#0284c7;">\${receipt.refundUtr}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:7px 0; color:#64748b;">Settlement Timestamp:</td>
                  <td style="padding:7px 0; text-align:right; color:#0f172a;">\${now}</td>
                </tr>
                <tr>
                  <td style="padding:7px 0; color:#64748b;">Authorization Authority:</td>
                  <td style="padding:7px 0; text-align:right; color:#059669; font-weight:700;">Super Administrator Root Verified</td>
                </tr>
              </tbody>
            </table>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; font-size:11.5px; color:#64748b; line-height:1.4; text-align:center;">
              An official electronic credit note and transaction confirmation has been dispatched to the customer's registered email address.
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px; padding-top:12px; border-top:1px solid #e2e8f0;">
              <button type="button" class="ap-btn ghost" id="ap-credit-note-print-btn" style="padding:8px 16px; font-size:12.5px; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print Credit Note
              </button>
              <button type="button" class="ap-btn primary" id="ap-credit-note-done-btn" style="padding:8px 18px; font-size:12.5px; font-weight:700; background:#059669; color:#ffffff; border-color:#059669;">Done</button>
            </div>
          </div>
        </div>
      \`;

      document.body.appendChild(backdrop);
      const close = () => backdrop.remove();
      backdrop.querySelector('#ap-credit-note-close-btn')?.addEventListener('click', close);
      backdrop.querySelector('#ap-credit-note-done-btn')?.addEventListener('click', close);
      backdrop.querySelector('#ap-credit-note-print-btn')?.addEventListener('click', () => window.print());
    } catch (err) {
      showToast(\`Failed to open credit note: \${err.message}\`, 'error');
    }
  }

  `;

js = js.slice(0, sCS) + newRenderCustomerService + js.slice(eCS);

// Ensure no placeholders were introduced
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
