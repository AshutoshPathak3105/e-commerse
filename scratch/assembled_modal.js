    // ── Seller & Admin: Manage Per-Product Offers & Subsidy Modal (Admin-Grade Window) ──
    function openSellerManageOffersModal(prod) {
      window.openSellerManageOffersModal = openSellerManageOffersModal;
      if (!prod) return;
      const id = String(prod._id || prod.id || '');

      // Retrieve full product from memory if available
      let targetProd = prod;
      if (typeof Store !== 'undefined' && Array.isArray(Store.allProducts)) {
        const found = Store.allProducts.find(p => String(p._id || p.id) === id);
        if (found) targetProd = found;
      }

      // Load saved offers
      let savedOffers = Array.isArray(targetProd.offers) ? [...targetProd.offers] : [];
      try {
        const localOffers = JSON.parse(localStorage.getItem(`xmart_custom_offers_${id || targetProd.name}`) || 'null');
        if (Array.isArray(localOffers) && localOffers.length > 0) savedOffers = localOffers;
      } catch { }

      // If product has admin marketing offer attached, include it
      if (targetProd.offer && (Number(targetProd.offer.discountPct) > 0 || targetProd.offer.label)) {
        const exists = savedOffers.some(o => o.code === 'ADMIN_DEAL' || o.tag === 'Admin Deal');
        if (!exists) {
          const discPct = Number(targetProd.offer.discountPct) || 10;
          const discVal = Math.round(((targetProd.price || targetProd.finalPrice || 1000) * discPct) / 100);
          savedOffers.unshift({
            tag: 'Admin Deal',
            partnerName: 'X-Mart Official Deal',
            text: `${discPct}% OFF — ${targetProd.offer.label || 'Today\'s Special Promotion'}`,
            amountOff: `${discPct}% OFF`,
            discountValue: discVal,
            discountType: 'percent',
            minOrder: 0,
            type: 'voucher',
            fundedBy: 'Platform Subsidy',
            subsidyAmount: discVal,
            code: 'ADMIN_DEAL',
            validUntil: targetProd.offer.validUntil || null
          });
        }
      }

      const modalId = 'admin-manage-offers-modal';
      document.getElementById(modalId)?.remove();

      const pPrice = targetProd.finalPrice !== undefined ? targetProd.finalPrice : (targetProd.price || 0);
      const pOrig = targetProd.originalPrice || Math.round(pPrice * 1.3);
      const pDisc = targetProd.discount || (pOrig > pPrice ? Math.round(((pOrig - pPrice) / pOrig) * 100) : 0);
      const pImg = (targetProd.images && targetProd.images[0]) || targetProd.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120';
      const pSeller = targetProd.sellerStoreName || targetProd.sellerEmail || targetProd.brand || 'Verified Seller';

      // Helper to compute metrics
      function computeMetrics(offers) {
        const totalCount = offers.length;
        let totalSubsidy = 0;
        let maxSaving = 0;
        offers.forEach(o => {
          const val = Number(o.subsidyAmount) || Number(o.discountValue) || 500;
          if (o.fundedBy === 'Platform Subsidy' || !o.fundedBy || (o.tag && o.tag.includes('Bank'))) {
            totalSubsidy += val;
          } else if (o.fundedBy === 'Shared') {
            totalSubsidy += Math.round(val / 2);
          }
          if (val > maxSaving) maxSaving = val;
        });
        return { totalCount, totalSubsidy, maxSaving };
      }

      // Helper to build active offers table HTML
      function buildOffersTableHtml(offers) {
        if (!offers || offers.length === 0) {
          return `
            <tr>
              <td colspan="6" style="text-align:center; padding:32px 16px; color:#64748b; font-size:13px;">
                <div style="font-size:28px; margin-bottom:6px;">🏷️</div>
                <strong>No promotional offers active on this SKU yet.</strong>
                <p style="margin:4px 0 0; font-size:12px; color:#94a3b8;">Use the campaign creator below to publish bank offers, UPI discounts, or merchant deals.</p>
              </td>
            </tr>
          `;
        }
        return offers.map((o, idx) => {
          const tagClass = (o.tag && o.tag.includes('Bank')) ? 'blue' : ((o.tag && o.tag.includes('UPI')) ? 'green' : 'orange');
          const isPlatform = o.fundedBy === 'Platform Subsidy' || !o.fundedBy || (o.tag && o.tag.includes('Bank'));
          const isShared = o.fundedBy === 'Shared';
          const subsidyBadge = isPlatform
            ? `<span class="ap-badge green" style="font-size:11px; font-weight:700;">Platform Subsidized</span>`
            : (isShared
              ? `<span class="ap-badge purple" style="font-size:11px; font-weight:700;">Shared (50/50)</span>`
              : `<span class="ap-badge gray" style="font-size:11px; font-weight:700;">Seller Funded</span>`);

          const repayAmount = isPlatform
            ? `+${Currency.format(Number(o.subsidyAmount) || Number(o.discountValue) || 500)}`
            : (isShared
              ? `+${Currency.format(Math.round((Number(o.subsidyAmount) || Number(o.discountValue) || 500) / 2))}`
              : `₹0 (Seller Borne)`);

          return `
            <tr data-offer-idx="${idx}" class="sku-offer-row">
              <td class="sku-td-info">
                <div style="display:flex; flex-direction:column; gap:3px;">
                  <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span class="ap-badge ${tagClass}" style="font-size:11px;">${o.tag || 'Bank Offer'}</span>
                    <strong style="color:#0f172a; font-size:13px;">${o.partnerName || o.partner || 'Partner Bank'}</strong>
                  </div>
                  <span style="font-size:12px; color:#475569;">${o.text || o.description || o.amountOff || ''}</span>
                </div>
              </td>
              <td class="sku-td-discount">
                <span class="ap-badge orange" style="font-size:12px; font-weight:800;">
                  ${o.amountOff || (o.discountValue ? (o.discountType === 'percent' ? o.discountValue + '%' : '₹' + o.discountValue) : 'Active')}
                </span>
              </td>
              <td class="sku-td-min-order" style="font-size:12.5px; color:#334155;">
                <span class="sku-td-mobile-label">Min Order: </span>
                <span>${o.minOrder ? Currency.format(o.minOrder) : 'No Min'}</span>
              </td>
              <td class="sku-td-funding">
                <div style="display:flex; flex-direction:column; gap:2px;">
                  <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                    <span class="sku-td-mobile-label">Funding: </span>
                    ${subsidyBadge}
                  </div>
                  <span style="font-size:10.5px; color:#64748b;">${isPlatform ? 'Repaid in Escrow Payout' : (isShared ? 'Platform pays 50%' : 'Merchant absorbs discount')}</span>
                </div>
              </td>
              <td class="sku-td-repay">
                <span class="sku-td-mobile-label">Repayment: </span>
                <strong style="color:${isPlatform || isShared ? '#059669' : '#64748b'}; font-size:13px;">
                  ${repayAmount}
                </strong>
              </td>
              <td class="sku-td-action">
                <button type="button" class="ap-btn danger btn-remove-sku-offer" data-idx="${idx}" style="padding:4px 10px; font-size:11px;">
                  Remove
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }

      const metrics = computeMetrics(savedOffers);

      const modalHtml = `
        <div class="sku-offers-window-container" style="font-size:13.5px; color:#0f172a; display:flex; flex-direction:column; gap:18px;">
          <!-- Product Context Header Card (Admin Design) -->
          <div class="sku-offers-product-card" style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:10px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; gap:14px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div class="sku-offers-prod-inner" style="display:flex; align-items:center; gap:14px;">
              <img src="${pImg}" alt="${targetProd.name}" style="width:54px; height:54px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0; flex-shrink:0;">
              <div class="sku-offers-prod-details" style="min-width:0; flex:1;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <strong style="font-size:14.5px; color:#0f172a; word-break:break-word;">${targetProd.name}</strong>
                  <span class="ap-badge gray" style="font-size:11px;">SKU: ${id.slice(-6).toUpperCase()}</span>
                  <span class="ap-badge blue" style="font-size:11px;">${targetProd.category || 'General'}</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px; margin-top:4px; font-size:12px; color:#64748b; flex-wrap:wrap;">
                  <span>Seller: <strong style="color:#0f172a;">${pSeller}</strong></span>
                  <span>•</span>
                  <span>Selling Price: <strong style="color:#059669;">${Currency.format(pPrice)}</strong></span>
                  ${pOrig > pPrice ? `<span style="text-decoration:line-through;">${Currency.format(pOrig)}</span>` : ''}
                  ${pDisc > 0 ? `<span class="ap-badge green" style="padding:1px 5px; font-size:10.5px;">${pDisc}% OFF</span>` : ''}
                </div>
              </div>
            </div>
            <span class="ap-super-badge" id="modal-offer-count-badge" style="background:#eff6ff; color:#2563eb; border-color:#bfdbfe; font-size:12px; padding:6px 12px; white-space:nowrap;">
              ${metrics.totalCount} Active Offers
            </span>
          </div>

          <!-- KPI Metric Chips Strip -->
          <div class="ap-stat-grid" style="grid-template-columns: repeat(3, 1fr); gap:12px; margin:0;">
            <div class="ap-stat-card" style="padding:12px 14px;">
              <div class="ap-stat-card-left">
                <span class="ap-stat-card-lbl">Active Product Offers</span>
                <span class="ap-stat-card-val" id="metric-active-count" style="color:#2563eb; font-size:20px;">${metrics.totalCount}</span>
              </div>
              <div class="ap-stat-card-icon blue" style="width:36px; height:36px;">
                <svg viewBox="0 0 24 24" width="18" height="18"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              </div>
            </div>
            <div class="ap-stat-card" style="padding:12px 14px;">
              <div class="ap-stat-card-left">
                <span class="ap-stat-card-lbl">Platform Subsidy (Seller Repayment)</span>
                <span class="ap-stat-card-val" id="metric-subsidy-total" style="color:#059669; font-size:20px;">${Currency.format(metrics.totalSubsidy)}</span>
              </div>
              <div class="ap-stat-card-icon green" style="width:36px; height:36px;">
                <svg viewBox="0 0 24 24" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <div class="ap-stat-card" style="padding:12px 14px;">
              <div class="ap-stat-card-left">
                <span class="ap-stat-card-lbl">Maximum Customer Saving</span>
                <span class="ap-stat-card-val" id="metric-max-saving" style="color:#d97706; font-size:20px;">${Currency.format(metrics.maxSaving)}</span>
              </div>
              <div class="ap-stat-card-icon amber" style="width:36px; height:36px;">
                <svg viewBox="0 0 24 24" width="18" height="18"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
            </div>
          </div>

          <!-- Active Offers & Subsidy Repayment Table -->
          <div class="ap-table-card sku-offers-table-card" style="margin:0; box-shadow:none; border:1.5px solid #e2e8f0; border-radius:10px;">
            <div class="sku-offers-table-header" style="padding:12px 16px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
              <strong style="font-size:13.5px; color:#0f172a;">Active Offers &amp; Disbursement Repayment Terms</strong>
              <small style="color:#64748b; font-size:11.5px;">Platform subsidies are automatically credited to seller during bank disbursement</small>
            </div>
            <div class="ap-table-wrap">
              <table class="ap-table">
                <thead>
                  <tr>
                    <th>Offer / Campaign</th>
                    <th>Discount</th>
                    <th>Min Order</th>
                    <th>Funding &amp; Subsidy Terms</th>
                    <th>Repayment to Seller</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="sku-offers-table-tbody">
                  ${buildOffersTableHtml(savedOffers)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Create New Promotional Offer Form (Admin Layout) -->
          <div class="ap-form-card sku-offers-form-card" style="margin:0; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:16px;">
            <h3 style="font-size:14px; font-weight:800; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
              <span>+ Create New Promotional Offer</span>
              <span class="ap-badge blue" style="font-size:10px;">Instant Storefront Sync</span>
            </h3>

            <div class="ap-form-row sku-offers-form-row" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; margin-bottom:12px;">
              <div class="ap-form-group">
                <label style="font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">
                  OFFER CATEGORY <span style="color:#ef4444; font-weight:900;">*</span>
                </label>
                <select id="sku-offer-category" style="width:100%; box-sizing:border-box; padding:8px 10px; border:1.5px solid #cbd5e1; border-radius:7px; font-size:12.5px; font-weight:600; color:#0f172a;">
                  <option value="Credit Card Offer" selected>Credit Card Offer</option>
                  <option value="Debit Card Offer">Debit Card Offer</option>
                  <option value="Instant UPI">Instant UPI Offer</option>
                  <option value="No Cost EMI">No Cost EMI Offer</option>
                  <option value="Cashback">Cashback / Rewards</option>
                  <option value="Special Promotion">Special Discount Voucher</option>
                </select>
              </div>

              <div class="ap-form-group">
                <label id="sku-partner-code-label" style="font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">
                  BANK / UPI NAME <span style="color:#ef4444; font-weight:900;">*</span>
                </label>
                <!-- Bank / UPI Dropdown -->
                <div id="sku-bank-upi-dropdown" style="position:relative; width:100%;">
                  <button type="button" id="sku-bank-upi-trigger" style="width:100%; box-sizing:border-box; padding:7px 10px; border:1.5px solid #cbd5e1; border-radius:7px; background:#ffffff; display:flex; align-items:center; justify-content:space-between; cursor:pointer; min-height:38px;">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                      <img id="sku-selected-logo" src="assets/banks/sbi.svg" alt="Logo" style="width:24px; height:18px; object-fit:contain; border-radius:3px; background:#fff; border:1px solid #e2e8f0; padding:1px 2px; flex-shrink:0;">
                      <span id="sku-selected-name" style="font-weight:700; color:#0f172a; font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">State Bank of India (SBI)</span>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <div id="sku-bank-upi-menu" style="display:none; position:absolute; top:calc(100% + 4px); left:0; right:0; max-height:230px; overflow-y:auto; background:#ffffff; border:1.5px solid #cbd5e1; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.12); z-index:1000; padding:4px;">
                    <!-- Options injected dynamically based on category -->
                  </div>
                  <input type="hidden" id="sku-offer-partner" value="SBI Bank">
                  <input type="hidden" id="sku-offer-logo" value="assets/banks/sbi.svg">
                </div>
                <!-- Voucher Coupon Code Box (Shown when Special Discount Voucher is selected) -->
                <div id="sku-coupon-code-wrap" style="display:none; width:100%;">
                  <div style="position:relative; width:100%;">
                    <input type="text" id="sku-offer-coupon-code" placeholder="e.g. SAVE500, FESTIVE20" style="width:100%; box-sizing:border-box; padding:8px 10px 8px 34px; border:1.5px solid #cbd5e1; border-radius:7px; font-size:12.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0f172a;" value="SAVE500">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); pointer-events:none;"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r=".5" fill="#64748b"/></svg>
                  </div>
                  <small style="color:#64748b; font-size:10.5px; margin-top:3px; display:block;">Buyers can enter this code at checkout to claim the discount.</small>
                </div>
              </div>

              <div class="ap-form-group">
                <label style="font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">
                  DISCOUNT VALUE &amp; TYPE <span style="color:#ef4444; font-weight:900;">*</span>
                </label>
                <div style="display:flex; gap:6px;">
                  <input type="number" id="sku-offer-val" value="500" min="1" max="50000" style="flex:1; box-sizing:border-box; padding:8px 10px; border:1.5px solid #cbd5e1; border-radius:7px; font-size:12.5px; font-weight:700;">
                  <select id="sku-offer-val-type" style="width:80px; box-sizing:border-box; padding:8px 6px; border:1.5px solid #cbd5e1; border-radius:7px; font-size:12px;">
                    <option value="flat">₹ Flat</option>
                    <option value="percent">% Off</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="ap-form-row sku-offers-form-row" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; margin-bottom:12px;">
              <div class="ap-form-group">
                <label style="font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">
                  MIN ORDER VALUE (₹) <span style="color:#ef4444; font-weight:900;">*</span>
                </label>
                <input type="number" id="sku-offer-min-order" value="1500" min="0" style="width:100%; box-sizing:border-box; padding:8px 10px; border:1.5px solid #cbd5e1; border-radius:7px; font-size:12.5px;">
              </div>

              <div class="ap-form-group">
                <label style="font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">
                  DISBURSEMENT SUBSIDY FUNDING <span style="color:#ef4444; font-weight:900;">*</span>
                </label>
                <select id="sku-offer-funding" style="width:100%; box-sizing:border-box; padding:8px 10px; border:1.5px solid #cbd5e1; border-radius:7px; font-size:12.5px; font-weight:600; color:#166534;">
                  <option value="Platform Subsidy" selected>Platform Subsidy (100% Repaid to Seller in Disbursement)</option>
                  <option value="Seller Borne">Seller Borne (Merchant Absorbed)</option>
                  <option value="Shared">Shared 50% Platform / 50% Seller</option>
                </select>
              </div>

              <div class="ap-form-group">
                <label style="font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">
                  EXPIRY DATE <span style="color:#ef4444; font-weight:900;">*</span>
                </label>
                <input type="date" id="sku-offer-expiry" value="${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" required style="width:100%; box-sizing:border-box; padding:8px 10px; border:1.5px solid #cbd5e1; border-radius:7px; font-size:12.5px;">
              </div>
            </div>

            <div class="ap-form-group" style="margin-bottom:14px;">
              <label style="font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">
                OFFER HEADLINE / DESCRIPTION <span style="color:#ef4444; font-weight:900;">*</span>
              </label>
              <input type="text" id="sku-offer-headline" value="Flat ₹500 off on SBI Bank Credit Cards" style="width:100%; box-sizing:border-box; padding:9px 12px; border:1.5px solid #cbd5e1; border-radius:7px; font-size:12.5px;">
              <small style="color:#64748b; font-size:11px; margin-top:3px; display:block;">This text is displayed on the product page offer card and in checkout Step 3.</small>
            </div>

            <div class="sku-offers-actions-row" style="display:flex; justify-content:center; gap:16px; align-items:center; margin-top:20px; flex-wrap:wrap;">
              <button type="button" class="ap-btn primary" id="sku-offers-modal-publish-btn" style="min-width:240px; height:42px; font-size:13.5px; font-weight:800; background:#001f3f !important; color:#ffffff !important; border:1.5px solid #001f3f !important; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;">
                <span>Publish Offer &amp; Sync Subsidy</span>
              </button>
              <button type="button" class="ap-btn" id="sku-offers-modal-close-btn" style="min-width:240px; height:42px; font-size:13.5px; font-weight:800; color:#000000 !important; background:#ffffff !important; border:1.5px solid #94a3b8 !important; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;">
                Close
              </button>
            </div>
          </div>
        </div>
      `;
      document.getElementById('admin-manage-offers-modal')?.remove();
      const offersModal = createModal('admin-manage-offers-modal', {
        title: `Manage SKU Offers & Escrow Subsidies — ${targetProd.name}`,
        large: true,
        bodyHtml: modalHtml
      });
      offersModal._open();

      const modalEl = document.getElementById('admin-manage-offers-modal');
      const catEl = modalEl.querySelector('#sku-offer-category');
      const triggerEl = modalEl.querySelector('#sku-bank-upi-trigger');
      const menuEl = modalEl.querySelector('#sku-bank-upi-menu');
      const selectedLogoEl = modalEl.querySelector('#sku-selected-logo');
      const selectedNameEl = modalEl.querySelector('#sku-selected-name');
      const couponWrap = modalEl.querySelector('#sku-coupon-code-wrap');
      const couponInput = modalEl.querySelector('#sku-offer-coupon-code');
      const bankDropdownWrap = modalEl.querySelector('#sku-bank-upi-dropdown');
      const partnerCodeLabel = modalEl.querySelector('#sku-partner-code-label');
      const partnerInput = modalEl.querySelector('#sku-offer-partner');
      const logoInput = modalEl.querySelector('#sku-offer-logo');
      const valEl = modalEl.querySelector('#sku-offer-val');
      const valTypeEl = modalEl.querySelector('#sku-offer-val-type');
      const headlineEl = modalEl.querySelector('#sku-offer-headline');

      // Helper to populate Bank / UPI Dropdown based on chosen category
      function populateBankUpiDropdown(cat) {
        const isUpiCategory = cat === 'Instant UPI' || cat === 'Cashback';
        const items = isUpiCategory ? (typeof UPI_PROVIDERS !== 'undefined' ? UPI_PROVIDERS : [
          { shortName: 'Google Pay', name: 'Google Pay UPI', logo: 'assets/upi/googlepay.svg' },
          { shortName: 'PhonePe', name: 'PhonePe UPI', logo: 'assets/upi/phonepe.svg' },
          { shortName: 'Paytm UPI', name: 'Paytm UPI', logo: 'assets/upi/paytm.svg' },
          { shortName: 'BHIM UPI', name: 'BHIM Government UPI', logo: 'assets/upi/bhim.svg' },
          { shortName: 'Cred Pay', name: 'Cred UPI', logo: 'assets/upi/cred.svg' },
          { shortName: 'Amazon Pay', name: 'Amazon Pay UPI', logo: 'assets/upi/amazonpay.svg' }
        ]) : (typeof INDIAN_BANKS !== 'undefined' ? INDIAN_BANKS : [
          { shortName: 'SBI Bank', name: 'State Bank of India (SBI)', logo: 'assets/banks/sbi.svg' },
          { shortName: 'HDFC Bank', name: 'HDFC Bank', logo: 'assets/banks/hdfc.svg' },
          { shortName: 'ICICI Bank', name: 'ICICI Bank', logo: 'assets/banks/icici.svg' },
          { shortName: 'Axis Bank', name: 'Axis Bank', logo: 'assets/banks/axis.svg' },
          { shortName: 'Kotak Bank', name: 'Kotak Mahindra Bank', logo: 'assets/banks/kotak.svg' },
          { shortName: 'Bank of Baroda', name: 'Bank of Baroda', logo: 'assets/banks/bob.svg' },
          { shortName: 'Punjab National Bank', name: 'Punjab National Bank (PNB)', logo: 'assets/banks/pnb.svg' },
          { shortName: 'Canara Bank', name: 'Canara Bank', logo: 'assets/banks/canara.svg' },
          { shortName: 'IndusInd Bank', name: 'IndusInd Bank', logo: 'assets/banks/indusind.svg' },
          { shortName: 'IDFC FIRST Bank', name: 'IDFC FIRST Bank', logo: 'assets/banks/idfc.svg' },
          { shortName: 'Federal Bank', name: 'Federal Bank', logo: 'assets/banks/federal.svg' },
          { shortName: 'Yes Bank', name: 'Yes Bank', logo: 'assets/banks/yesbank.svg' }
        ]);
        const currentPartner = partnerInput ? partnerInput.value : '';

        // Auto-select first matching item or default to first
        const match = items.find(i => i.shortName === currentPartner || i.name === currentPartner) || items[0];
        if (partnerInput) partnerInput.value = match.shortName;
        if (logoInput) logoInput.value = match.logo;
        if (selectedLogoEl) selectedLogoEl.src = match.logo;
        if (selectedNameEl) selectedNameEl.textContent = match.name;

        if (!menuEl) return;
        menuEl.innerHTML = items.map(item => {
          const isSelected = item.shortName === match.shortName;
          return `
            <div class="sku-bank-upi-option" data-shortname="${item.shortName}" data-fullname="${item.name}" data-logo="${item.logo}" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 10px; border-radius:6px; cursor:pointer; background:${isSelected ? '#eff6ff' : 'transparent'}; transition:background 0.15s ease;">
              <div style="display:flex; align-items:center; gap:8px;">
                <img src="${item.logo}" alt="${item.name}" style="width:24px; height:18px; object-fit:contain; border-radius:3px; background:#fff; border:1px solid #e2e8f0; padding:1px 2px; flex-shrink:0;">
                <span style="font-size:12.5px; font-weight:600; color:${isSelected ? '#1d4ed8' : '#0f172a'};">${item.name}</span>
              </div>
              ${isSelected ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>` : ''}
            </div>
          `;
        }).join('');

        // Wire option clicks
        menuEl.querySelectorAll('.sku-bank-upi-option').forEach(opt => {
          opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const sName = opt.dataset.shortname;
            const fName = opt.dataset.fullname;
            const lSrc = opt.dataset.logo;
            if (partnerInput) partnerInput.value = sName;
            if (logoInput) logoInput.value = lSrc;
            if (selectedLogoEl) selectedLogoEl.src = lSrc;
            if (selectedNameEl) selectedNameEl.textContent = fName;
            menuEl.style.display = 'none';
            syncHeadline();
          });
        });
      }

      // Dropdown toggle
      triggerEl?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menuEl) {
          menuEl.style.display = menuEl.style.display === 'none' ? 'block' : 'none';
        }
      });

      document.addEventListener('click', (e) => {
        if (!bankDropdownWrap?.contains(e.target) && menuEl) {
          menuEl.style.display = 'none';
        }
      });

      // Category mode change sync
      function syncCategoryMode() {
        const cat = catEl?.value || 'Credit Card Offer';
        const isVoucher = cat === 'Special Promotion';
        if (isVoucher) {
          if (couponWrap) couponWrap.style.display = 'block';
          if (bankDropdownWrap) bankDropdownWrap.style.display = 'none';
          if (partnerCodeLabel) partnerCodeLabel.innerHTML = 'COUPON PROMO CODE <span style="color:#ef4444; font-weight:900;">*</span>';
        } else {
          if (couponWrap) couponWrap.style.display = 'none';
          if (bankDropdownWrap) bankDropdownWrap.style.display = 'block';
          if (partnerCodeLabel) partnerCodeLabel.innerHTML = (cat === 'Instant UPI' || cat === 'Cashback' ? 'UPI PROVIDER <span style="color:#ef4444; font-weight:900;">*</span>' : 'BANK NAME <span style="color:#ef4444; font-weight:900;">*</span>');
          populateBankUpiDropdown(cat);
        }
        syncHeadline();
      }

      function syncHeadline() {
        const cat = catEl?.value || 'Credit Card Offer';
        const isVoucher = cat === 'Special Promotion';
        const pName = isVoucher ? (couponInput?.value?.trim() || 'Voucher') : (partnerInput?.value?.trim() || 'Bank');
        const v = valEl?.value || '500';
        const vt = valTypeEl?.value || 'flat';
        const discStr = vt === 'percent' ? `${v}% off` : `Flat ₹${v} off`;
        if (headlineEl) {
          if (isVoucher) {
            headlineEl.value = `${discStr} with coupon code ${pName.toUpperCase()}`;
          } else {
            headlineEl.value = `${discStr} on ${pName} ${cat.replace(' Offer', '')}s`;
          }
        }
      }

      catEl?.addEventListener('change', () => {
        syncCategoryMode();
      });
      couponInput?.addEventListener('input', syncHeadline);
      valEl?.addEventListener('input', syncHeadline);
      valTypeEl?.addEventListener('change', syncHeadline);

      // Initial population of dropdown and headline
      populateBankUpiDropdown(catEl?.value || 'Credit Card Offer');
      syncCategoryMode();

      // Helper to refresh table & KPI chips in modal
      function refreshModalUI() {
        const tbody = modalEl.querySelector('#sku-offers-table-tbody');
        if (tbody) tbody.innerHTML = buildOffersTableHtml(savedOffers);
        const m = computeMetrics(savedOffers);
        const cntEl = modalEl.querySelector('#metric-active-count');
        const subEl = modalEl.querySelector('#metric-subsidy-total');
        const maxEl = modalEl.querySelector('#metric-max-saving');
        const badgeEl = modalEl.querySelector('#modal-offer-count-badge');
        if (cntEl) cntEl.textContent = m.totalCount;
        if (subEl) subEl.textContent = Currency.format(m.totalSubsidy);
        if (maxEl) maxEl.textContent = Currency.format(m.maxSaving);
        if (badgeEl) badgeEl.textContent = `${m.totalCount} Active Offers`;

        // Wire remove buttons
        tbody.querySelectorAll('.btn-remove-sku-offer').forEach(btn => {
          btn.addEventListener('click', async () => {
            const idx = parseInt(btn.dataset.idx, 10);
            if (isNaN(idx)) return;
            const removed = savedOffers.splice(idx, 1);
            await persistOffers();
            refreshModalUI();
            showToast(`Offer removed from "${targetProd.name}".`, 'info', 2500);
          });
        });
      }

      // Helper to persist offers to MongoDB Atlas & Local Storage
      async function persistOffers() {
        targetProd.offers = savedOffers;
        if (typeof Store !== 'undefined' && Array.isArray(Store.allProducts)) {
          const spIdx = Store.allProducts.findIndex(p => String(p._id || p.id) === id);
          if (spIdx !== -1) Store.allProducts[spIdx].offers = savedOffers;
        }
        try {
          localStorage.setItem(`xmart_custom_offers_${id || targetProd.name}`, JSON.stringify(savedOffers));
        } catch { }

        // Sync with backend API
        try {
          const token = Store.token || localStorage.getItem('xmart_token');
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await Promise.all([
            fetch(`${API_BASE}/products/${id}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ offers: savedOffers })
            }).catch(() => {}),
            fetch(`${API_BASE}/admin/offers`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ productId: id, offers: savedOffers })
            }).catch(() => {})
          ]);
        } catch (e) { }

        // Update product row in seller/admin table if present
        const row = document.querySelector(`tr[data-prod-id="${id}"]`);
        if (row) {
          const offersBtn = row.querySelector('.offers-btn');
          if (offersBtn) {
            offersBtn.innerHTML = `Offers ${savedOffers.length > 0 ? `<span style="background:#ffffff; color:#ff6a00; font-size:10px; border-radius:10px; padding:0 5px; font-weight:800;">${savedOffers.length}</span>` : ''}`;
          }
          const promoCell = row.querySelector('.btn-toggle-deal')?.parentElement || row.querySelector('td:nth-child(5)');
          if (promoCell) {
            let tickerWrap = promoCell.querySelector('.seller-promo-ticker-wrap');
            if (savedOffers.length > 0) {
              if (!tickerWrap) {
                tickerWrap = document.createElement('div');
                tickerWrap.className = 'seller-promo-ticker-wrap';
                tickerWrap.setAttribute('data-prod-ticker', id);
                tickerWrap.style.cssText = 'background:transparent; border:none; box-shadow:none; padding:0; min-width:210px; width:100%;';
                promoCell.appendChild(tickerWrap);
              }
              tickerWrap.innerHTML = savedOffers.map((o, oIdx) => `
                <div class="seller-promo-ticker-slide ${oIdx === 0 ? 'is-active' : ''}" data-slide-idx="${oIdx}" style="background:transparent; border:none; box-shadow:none; padding:0; color:#000000;">
                  <img src="${o.logoSrc || (o.type === 'upi' ? 'assets/upi/upi.svg' : 'assets/banks/allbanks.svg')}" alt="" style="width:18px; height:13px; object-fit:contain; border-radius:2px; flex-shrink:0;">
                  <span style="font-weight:700; color:#000000; font-size:11.5px; white-space:nowrap;">${o.partnerName || o.partner || 'Offer'}:</span>
                  <span style="font-weight:800; color:#000000; font-size:11.5px; white-space:nowrap;">${o.amountOff || (o.discountValue ? (o.discountType === 'percent' ? o.discountValue + '% off' : 'Flat ₹' + o.discountValue + ' off') : 'Active')}</span>
                </div>
              `).join('');
              if (typeof initSellerPromoTickers === 'function') initSellerPromoTickers();
            } else if (tickerWrap) {
              tickerWrap.remove();
            }
          }
        }

        // Live refresh of storefront and drawer voucher tickers
        if (typeof window.refreshVoucherCouponsTicker === 'function') {
          window.refreshVoucherCouponsTicker();
        }
      }

      // Initial wire of remove buttons
      refreshModalUI();

      // Close button handler
      modalEl.querySelector('#sku-offers-modal-close-btn')?.addEventListener('click', () => {
        offersModal._close();
      });

      // Publish New Offer Click Handler (placed above Close button in DOM)
      modalEl.querySelector('#sku-offers-modal-publish-btn')?.addEventListener('click', async () => {
        const cat = catEl?.value || 'Credit Card Offer';
        const partner = partnerInput?.value?.trim() || 'Bank';
        const couponCode = couponInput?.value?.trim().toUpperCase() || '';
        const logo = logoInput?.value || 'assets/banks/sbi.svg';
        const val = Number(valEl?.value || 0);
        const discType = valTypeEl?.value || 'flat';
        const minOrder = Number(modalEl.querySelector('#sku-offer-min-order')?.value || 0);
        const funding = modalEl.querySelector('#sku-offer-funding')?.value || 'Platform Subsidy';
        const expiry = modalEl.querySelector('#sku-offer-expiry')?.value;
        const headline = headlineEl?.value?.trim() || `${partner} Offer`;

        const isVoucher = cat === 'Special Promotion';
        const isCredit = cat === 'Credit Card Offer';

        if (isVoucher && !couponCode) {
          showToast('Please enter a valid coupon promo code (e.g. SAVE500).', 'warn');
          couponInput?.focus();
          return;
        }

        if (!val || val <= 0) {
          showToast('Please specify a positive discount value.', 'warn');
          valEl?.focus();
          return;
        }

        const newOfferItem = {
          tag: isVoucher ? 'Special Voucher' : (cat === 'Instant UPI' ? 'Instant UPI' : (cat === 'Cashback' ? 'Cashback' : (cat === 'No Cost EMI' ? 'No Cost EMI' : (cat === 'Debit Card Offer' ? 'Debit Card Offer' : 'Bank Offer')))),
          type: isVoucher ? 'voucher' : (cat === 'Instant UPI' ? 'upi' : 'bank'),
          partnerName: isVoucher ? couponCode : partner,
          couponCode: isVoucher ? couponCode : '',
          logoSrc: logo,
          amountOff: discType === 'percent' ? `${val}% off` : `Flat ₹${val} off`,
          discountType: discType,
          discountValue: val,
          minOrder: minOrder,
          fundedBy: funding,
          subsidyAmount: funding === 'Platform Subsidy' ? val : (funding === 'Shared' ? Math.round(val / 2) : 0),
          text: headline,
          validUntil: expiry ? new Date(expiry) : null
        };

        savedOffers.push(newOfferItem);
        await persistOffers();
        refreshModalUI();

        showToast(`✓ "${headline}" published! Platform subsidy recorded for seller repayment.`, 'success', 4000);
      });
    }
    window.openSellerManageOffersModal = openSellerManageOffersModal;
