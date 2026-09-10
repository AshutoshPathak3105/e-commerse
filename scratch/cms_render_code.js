  /* ══════════════════════════════════════════════════════
     TAB: CMS & STOREFRONT (BANNERS, VOUCHERS & OFFERS)
     ══════════════════════════════════════════════════════ */
  async function renderCMS(body) {
    body.innerHTML = loadingHTML();

    async function load() {
      try {
        const res = await adminFetch('/cms');
        const cms = res.data || {};
        const banners = cms.heroBanners || [];
        const promotions = cms.promotions || [];

        let currentFilter = 'all';
        let storeSearchQuery = '';
        let offerSearchQuery = '';

        function renderBannerRows(bannerList) {
          if (!bannerList.length) {
            return `<tr><td colspan="7" style="text-align:center; padding:32px; color:#64748b;">No active featured banners found. Click <strong>"+ Add Featured Banner"</strong> to publish your first banner!</td></tr>`;
          }
          return bannerList.map(b => `
            <tr data-banner-id="${b._id}">
              <td style="width:100px;">
                <img class="ap-banner-thumb" src="${esc(b.image)}" alt="${esc(b.title)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200';" />
              </td>
              <td>
                <div style="font-weight:750; color:#0f172a; font-size:13.5px;">${esc(b.title)}</div>
                <div style="font-size:12px; color:#64748b; margin-top:2px;">${esc(b.subtitle || '')}</div>
              </td>
              <td><span class="ap-badge blue">${esc(b.tag || 'Featured')}</span></td>
              <td><code style="font-size:11.5px; color:#2563eb; background:#eff6ff; padding:2px 6px; border-radius:4px;">${esc(b.link || '#')}</code></td>
              <td><span class="ap-badge gray" style="font-weight:700;">#${b.order ?? 0}</span></td>
              <td>
                <button type="button" class="ap-btn-tiny ap-banner-toggle-btn ${b.active ? 'ap-badge green' : 'ap-badge gray'}" data-id="${b._id}" data-active="${b.active}" style="cursor:pointer; border:none;">
                  ${b.active ? '● Active' : '○ Paused'}
                </button>
              </td>
              <td style="white-space:nowrap; text-align:right;">
                <button type="button" class="ap-btn ghost ap-edit-banner-btn" data-id="${b._id}" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
                <button type="button" class="ap-btn danger ap-delete-banner-btn" data-id="${b._id}" style="padding:4px 10px; font-size:12px;">Delete</button>
              </td>
            </tr>
          `).join('');
        }

        function getFilteredPromotions() {
          return promotions.filter(p => {
            // Type filter
            if (currentFilter === 'voucher' && p.type !== 'voucher') return false;
            if (currentFilter === 'bank' && p.type !== 'bank') return false;
            if (currentFilter === 'upi' && p.type !== 'upi') return false;
            if (currentFilter === 'store' && p.scope !== 'store') return false;

            // Store search
            if (storeSearchQuery) {
              const term = storeSearchQuery.toLowerCase();
              const storeMatch = (p.storeName || '').toLowerCase().includes(term);
              const partnerMatch = (p.bankPartner || '').toLowerCase().includes(term) || (p.upiProvider || '').toLowerCase().includes(term);
              const isStorewide = p.scope === 'storewide' && 'storewide all stores'.includes(term);
              if (!storeMatch && !partnerMatch && !isStorewide) return false;
            }

            // Offer search
            if (offerSearchQuery) {
              const term = offerSearchQuery.toLowerCase();
              const codeMatch = (p.code || '').toLowerCase().includes(term);
              const titleMatch = (p.title || '').toLowerCase().includes(term);
              const descMatch = (p.description || '').toLowerCase().includes(term);
              if (!codeMatch && !titleMatch && !descMatch) return false;
            }

            return true;
          });
        }

        function renderPromoRows(promoList) {
          if (!promoList.length) {
            return `<tr><td colspan="8" style="text-align:center; padding:32px; color:#64748b;">No promotional offers match your current filter or search criteria.</td></tr>`;
          }
          return promoList.map(p => {
            const typeBadge = p.type === 'voucher' 
              ? `<span class="offer-type-tag voucher">🎟️ Voucher</span>`
              : p.type === 'bank'
              ? `<span class="offer-type-tag bank">💳 Bank Card</span>`
              : `<span class="offer-type-tag upi">📱 UPI Offer</span>`;

            const scopeBadge = p.scope === 'store'
              ? `<span class="ap-badge blue" title="Specific Merchant Store">🏬 ${esc(p.storeName || 'Store')}</span>`
              : `<span class="ap-badge green" title="Storewide across all sellers">🌐 Storewide</span>`;

            const rateStr = p.discountType === 'percent'
              ? `<strong>${p.discountValue}% OFF</strong>${p.maxDiscount ? `<div style="font-size:11px; color:#64748b;">Max ₹${p.maxDiscount.toLocaleString('en-IN')}</div>` : ''}`
              : `<strong>₹${p.discountValue.toLocaleString('en-IN')} FLAT</strong>`;

            const partnerStr = p.bankPartner || p.upiProvider || `<span style="color:#94a3b8;">—</span>`;

            return `
              <tr data-promo-id="${p._id}">
                <td>
                  <div style="font-family:monospace; font-weight:800; color:#0f172a; font-size:13.5px; letter-spacing:0.04em;">${esc(p.code)}</div>
                  <div style="margin-top:2px;">${typeBadge}</div>
                </td>
                <td>
                  <div style="font-weight:700; color:#0f172a; font-size:13px;">${esc(p.title)}</div>
                  <div style="font-size:11.5px; color:#64748b; margin-top:2px; max-width:240px; line-height:1.35;">${esc(p.description || '')}</div>
                </td>
                <td>${scopeBadge}</td>
                <td>${rateStr}</td>
                <td><strong style="color:#0f172a; font-size:12.5px;">₹${(p.minOrder || 0).toLocaleString('en-IN')}</strong></td>
                <td><span style="font-size:12px; font-weight:600; color:#334155;">${esc(partnerStr)}</span></td>
                <td>
                  <button type="button" class="ap-btn-tiny ap-promo-toggle-btn ${p.active ? 'ap-badge green' : 'ap-badge gray'}" data-id="${p._id}" data-active="${p.active}" style="cursor:pointer; border:none;">
                    ${p.active ? '● Active' : '○ Paused'}
                  </button>
                </td>
                <td style="white-space:nowrap; text-align:right;">
                  <button type="button" class="ap-btn ghost ap-edit-promo-btn" data-id="${p._id}" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
                  <button type="button" class="ap-btn danger ap-delete-promo-btn" data-id="${p._id}" style="padding:4px 10px; font-size:12px;">Delete</button>
                </td>
              </tr>
            `;
          }).join('');
        }

        const voucherCount = promotions.filter(p => p.type === 'voucher').length;
        const bankCount = promotions.filter(p => p.type === 'bank').length;
        const upiCount = promotions.filter(p => p.type === 'upi').length;
        const storeSpecificCount = promotions.filter(p => p.scope === 'store').length;

        body.innerHTML = `
          <div class="ap-view-inner">
            <div class="ap-view-header">
              <div class="ap-view-title-group">
                <h2 class="ap-view-title">
                  CMS &amp; Storefront Control
                  <span class="ap-super-badge" style="background:#ecfdf5; color:#059669; border-color:#a7f3d0;">Storefront Live</span>
                </h2>
                <p class="ap-view-sub">Manage featured hero carousels with custom images, storewide discount vouchers, bank card instant discounts, and UPI app offers.</p>
              </div>
              <div class="ap-view-actions">
                <button class="ap-btn ghost" id="ap-cms-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>
                <button class="ap-btn primary" id="ap-top-add-banner-btn">
                  <span>+ Add Featured Banner</span>
                </button>
                <button class="ap-btn primary" id="ap-top-add-promo-btn" style="background:#ea580c; border-color:#c2410c;">
                  <span>+ Create Offer / Voucher</span>
                </button>
              </div>
            </div>

            <!-- Global Announcement Ticker Manager -->
            <div class="ap-form-card" style="margin-bottom:24px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:750; color:#0f172a;">Top Navigation Announcement Bar</h3>
                  <p style="font-size:12px; color:#64748b; margin:2px 0 0;">This marquee message is pinned at the top-left utility bar of the customer-facing storefront.</p>
                </div>
                <span class="ap-badge green">● Live on Production</span>
              </div>
              <div class="ap-form-group" style="margin-bottom:12px;">
                <label for="ap-cms-announcement-input" class="ap-cms-label" style="display:block; margin-bottom:6px;">Ticker Announcement Text</label>
                <input type="text" id="ap-cms-announcement-input" class="ap-input" value="${esc(cms.announcementText || '')}" style="width:100%; font-size:13px; font-weight:600; padding:10px 14px;" />
              </div>
              <div style="display:flex; justify-content:flex-end;">
                <button class="ap-btn primary" id="ap-save-cms-announcement-btn" style="padding:8px 20px;">
                  Save Announcement Bar
                </button>
              </div>
            </div>

            <!-- Active Featured Banners Table Card -->
            <div class="ap-table-card" style="margin-bottom:24px;">
              <div style="padding:16px 20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:750; color:#0f172a;">Active Featured Banners</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#64748b;">Hero slider images, headlines, and category callouts shown on the homepage.</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="ap-badge gray" id="ap-banner-count-badge">${banners.length} Banners</span>
                  <button class="ap-btn primary" id="ap-cms-add-banner-btn" style="padding:6px 14px; font-size:12px;">
                    + Add Featured Banner
                  </button>
                </div>
              </div>
              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th>Image Preview</th>
                      <th>Banner Headline &amp; Subtitle</th>
                      <th>Tag Badge</th>
                      <th>Destination Link</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th style="text-align:right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="ap-banners-table-body">
                    ${renderBannerRows(banners)}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Promotional Offers, Bank Cards & UPI Vouchers -->
            <div class="ap-table-card">
              <div style="padding:16px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:750; color:#0f172a;">Promotional Offers, Bank Cards &amp; Vouchers</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#64748b;">Manage storewide vouchers, bank instant discounts, UPI cashback, and store-specific campaigns.</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="ap-badge green" id="ap-promo-count-badge">${promotions.length} Offers</span>
                  <button class="ap-btn primary" id="ap-cms-add-promo-btn" style="background:#ea580c; border-color:#c2410c; padding:6px 14px; font-size:12px;">
                    + Create Offer / Voucher
                  </button>
                </div>
              </div>

              <!-- Filter Toolbar with Dedicated Searchbar for Stores -->
              <div class="ap-cms-toolbar">
                <div class="ap-cms-pills">
                  <button type="button" class="ap-cms-pill active" data-filter="all">All Offers (${promotions.length})</button>
                  <button type="button" class="ap-cms-pill" data-filter="voucher">🎟️ Vouchers (${voucherCount})</button>
                  <button type="button" class="ap-cms-pill" data-filter="bank">💳 Bank Cards (${bankCount})</button>
                  <button type="button" class="ap-cms-pill" data-filter="upi">📱 UPI Offers (${upiCount})</button>
                  <button type="button" class="ap-cms-pill" data-filter="store">🏬 Store-Specific (${storeSpecificCount})</button>
                </div>

                <div class="ap-cms-searches">
                  <!-- DEDICATED SEARCHBAR FOR STORES -->
                  <div class="ap-cms-search-field">
                    <label for="ap-cms-store-search-input" class="ap-cms-label">Search by Store / Merchant</label>
                    <div class="ap-cms-input-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <input type="text" id="ap-cms-store-search-input" />
                      <button type="button" id="ap-cms-clear-store-search" class="ap-cms-clear-btn" style="display:none;" title="Clear store search">✕</button>
                    </div>
                  </div>

                  <!-- Offer Code & Title Search -->
                  <div class="ap-cms-search-field">
                    <label for="ap-cms-offer-search-input" class="ap-cms-label">Search Voucher / Code</label>
                    <div class="ap-cms-input-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input type="text" id="ap-cms-offer-search-input" />
                      <button type="button" id="ap-cms-clear-offer-search" class="ap-cms-clear-btn" style="display:none;" title="Clear search">✕</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th>Voucher Code &amp; Type</th>
                      <th>Offer Title &amp; Terms</th>
                      <th>Scope / Target Store</th>
                      <th>Discount Rate</th>
                      <th>Min Bag Value</th>
                      <th>Bank / UPI Partner</th>
                      <th>Status</th>
                      <th style="text-align:right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="ap-promos-table-body">
                    ${renderPromoRows(getFilteredPromotions())}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;

        // Wire Refresh
        document.getElementById('ap-cms-refresh-btn')?.addEventListener('click', load);

        // Wire Announcement Bar Update
        document.getElementById('ap-save-cms-announcement-btn')?.addEventListener('click', async () => {
          const announcementText = document.getElementById('ap-cms-announcement-input')?.value;
          const btn = document.getElementById('ap-save-cms-announcement-btn');
          if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
          try {
            await adminFetch('/cms', {
              method: 'PUT',
              body: JSON.stringify({ announcementText }),
            });
            showToast('Storefront announcement bar updated successfully!', 'success');
            // Update live ticker in storefront if present
            const tickerFirst = document.querySelector('#utility-ticker .ticker-slide');
            if (tickerFirst) tickerFirst.innerHTML = esc(announcementText);
          } catch (e) {
            showToast(e.message, 'error');
          } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Save Announcement Bar'; }
          }
        });

        // Wire Filter Pills
        body.querySelectorAll('.ap-cms-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            body.querySelectorAll('.ap-cms-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter;
            updatePromosTable();
          });
        });

        // Wire Store Searchbar
        const storeSearchInput = document.getElementById('ap-cms-store-search-input');
        const clearStoreBtn = document.getElementById('ap-cms-clear-store-search');
        storeSearchInput?.addEventListener('input', (e) => {
          storeSearchQuery = e.target.value.trim();
          if (clearStoreBtn) clearStoreBtn.style.display = storeSearchQuery ? 'inline-block' : 'none';
          updatePromosTable();
        });
        clearStoreBtn?.addEventListener('click', () => {
          if (storeSearchInput) storeSearchInput.value = '';
          storeSearchQuery = '';
          clearStoreBtn.style.display = 'none';
          updatePromosTable();
        });

        // Wire Offer Searchbar
        const offerSearchInput = document.getElementById('ap-cms-offer-search-input');
        const clearOfferBtn = document.getElementById('ap-cms-clear-offer-search');
        offerSearchInput?.addEventListener('input', (e) => {
          offerSearchQuery = e.target.value.trim();
          if (clearOfferBtn) clearOfferBtn.style.display = offerSearchQuery ? 'inline-block' : 'none';
          updatePromosTable();
        });
        clearOfferBtn?.addEventListener('click', () => {
          if (offerSearchInput) offerSearchInput.value = '';
          offerSearchQuery = '';
          clearOfferBtn.style.display = 'none';
          updatePromosTable();
        });

        function updatePromosTable() {
          const tbody = document.getElementById('ap-promos-table-body');
          if (tbody) {
            tbody.innerHTML = renderPromoRows(getFilteredPromotions());
            attachPromoRowHandlers();
          }
        }

        // Wire Add Banner Buttons
        document.getElementById('ap-top-add-banner-btn')?.addEventListener('click', () => showBannerModal(null));
        document.getElementById('ap-cms-add-banner-btn')?.addEventListener('click', () => showBannerModal(null));

        // Wire Add Promo Buttons
        document.getElementById('ap-top-add-promo-btn')?.addEventListener('click', () => showPromoModal(null));
        document.getElementById('ap-cms-add-promo-btn')?.addEventListener('click', () => showPromoModal(null));

        // Banner Row Handlers
        function attachBannerRowHandlers() {
          body.querySelectorAll('.ap-banner-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.dataset.id;
              const currentActive = btn.dataset.active === 'true';
              try {
                await adminFetch(`/cms/banners/${id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ active: !currentActive }),
                });
                showToast(`Banner ${!currentActive ? 'activated' : 'paused'} successfully!`, 'success');
                load();
              } catch (e) { showToast(e.message, 'error'); }
            });
          });

          body.querySelectorAll('.ap-edit-banner-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const banner = banners.find(b => b._id === btn.dataset.id);
              if (banner) showBannerModal(banner);
            });
          });

          body.querySelectorAll('.ap-delete-banner-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.dataset.id;
              if (!confirm('Are you sure you want to permanently remove this featured banner?')) return;
              try {
                await adminFetch(`/cms/banners/${id}`, { method: 'DELETE' });
                showToast('Banner removed successfully!', 'success');
                load();
              } catch (e) { showToast(e.message, 'error'); }
            });
          });
        }
        attachBannerRowHandlers();

        // Promo Row Handlers
        function attachPromoRowHandlers() {
          body.querySelectorAll('.ap-promo-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.dataset.id;
              const currentActive = btn.dataset.active === 'true';
              try {
                await adminFetch(`/cms/promotions/${id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ active: !currentActive }),
                });
                showToast(`Offer ${!currentActive ? 'activated' : 'paused'} successfully!`, 'success');
                load();
              } catch (e) { showToast(e.message, 'error'); }
            });
          });

          body.querySelectorAll('.ap-edit-promo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const promo = promotions.find(p => p._id === btn.dataset.id);
              if (promo) showPromoModal(promo);
            });
          });

          body.querySelectorAll('.ap-delete-promo-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.dataset.id;
              if (!confirm('Are you sure you want to permanently remove this promotional code?')) return;
              try {
                await adminFetch(`/cms/promotions/${id}`, { method: 'DELETE' });
                showToast('Promotion removed successfully!', 'success');
                load();
              } catch (e) { showToast(e.message, 'error'); }
            });
          });
        }
        attachPromoRowHandlers();

        /* ── MODAL: ADD / EDIT FEATURED BANNER ── */
        function showBannerModal(existingBanner = null) {
          const isEdit = !!existingBanner;
          const backdrop = document.createElement('div');
          backdrop.className = 'ap-modal-backdrop';

          const defaultImg = existingBanner?.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80';

          backdrop.innerHTML = `
            <div class="ap-modal-dialog" style="max-width:580px;">
              <div class="ap-modal-header" style="background:linear-gradient(135deg, #0b1c30, #1e3a5f); color:#ffffff;">
                <div>
                  <h3 class="ap-modal-title" style="color:#ffffff; font-size:15px; font-weight:800;">
                    ${isEdit ? 'Edit Featured Banner' : 'Add New Featured Banner'}
                  </h3>
                  <p style="margin:2px 0 0; font-size:11.5px; color:#94a3b8;">Provide banner image URL, headline, and link for customer storefront.</p>
                </div>
                <button type="button" class="ap-modal-close-btn" id="ap-banner-modal-close" style="color:#ffffff;">✕</button>
              </div>

              <div class="ap-modal-content" style="padding:22px; max-height:80vh; overflow-y:auto;">
                <!-- Headline -->
                <div class="ap-form-group" style="margin-bottom:14px;">
                  <label for="banner-modal-title" class="ap-cms-label" style="display:block; margin-bottom:5px;">Banner Headline</label>
                  <input type="text" id="banner-modal-title" class="ap-input" value="${esc(existingBanner?.title || '')}" style="width:100%;" />
                </div>

                <!-- Subtitle -->
                <div class="ap-form-group" style="margin-bottom:14px;">
                  <label for="banner-modal-subtitle" class="ap-cms-label" style="display:block; margin-bottom:5px;">Subtitle / Tagline</label>
                  <input type="text" id="banner-modal-subtitle" class="ap-input" value="${esc(existingBanner?.subtitle || '')}" style="width:100%;" />
                </div>

                <!-- Category Tag -->
                <div class="ap-form-group" style="margin-bottom:14px;">
                  <label for="banner-modal-tag" class="ap-cms-label" style="display:block; margin-bottom:5px;">Category Tag / Badge</label>
                  <input type="text" id="banner-modal-tag" class="ap-input" value="${esc(existingBanner?.tag || 'Limited Edition')}" style="width:100%;" />
                  <div class="ap-preset-pills">
                    <button type="button" class="ap-preset-pill" data-target="banner-modal-tag" data-val="Limited Edition">Limited Edition</button>
                    <button type="button" class="ap-preset-pill" data-target="banner-modal-tag" data-val="Bestseller">Bestseller</button>
                    <button type="button" class="ap-preset-pill" data-target="banner-modal-tag" data-val="Trending Deals">Trending Deals</button>
                    <button type="button" class="ap-preset-pill" data-target="banner-modal-tag" data-val="Mega Festive Sale">Mega Festive Sale</button>
                    <button type="button" class="ap-preset-pill" data-target="banner-modal-tag" data-val="Exclusive Launch">Exclusive Launch</button>
                  </div>
                </div>

                <!-- Image URL + Live Preview -->
                <div class="ap-form-group" style="margin-bottom:14px;">
                  <label for="banner-modal-image" class="ap-cms-label" style="display:block; margin-bottom:5px;">Banner Image URL</label>
                  <input type="url" id="banner-modal-image" class="ap-input" value="${esc(defaultImg)}" style="width:100%;" />
                  
                  <div style="margin-top:6px;">
                    <span style="font-size:11px; color:#64748b; font-weight:600;">One-click high-res presets:</span>
                    <div class="ap-preset-pills">
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80">📱 Flagship Electronics</button>
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80">🎧 Audio &amp; Headphones</button>
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80">👗 Designer Fashion</button>
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=80">🛋️ Modern Living</button>
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80">🎮 Gaming Battle Station</button>
                    </div>
                  </div>

                  <!-- Live Image Preview Container -->
                  <div class="banner-preview-box">
                    <img id="banner-modal-preview-img" src="${esc(defaultImg)}" alt="Banner Live Preview" onerror="this.src='https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600';" />
                    <span style="font-size:11px; color:#64748b; margin-top:6px;">Live Image Preview</span>
                  </div>
                </div>

                <!-- Destination Link & Sequence Order -->
                <div style="display:grid; grid-template-columns:2fr 1fr; gap:12px; margin-bottom:14px;">
                  <div class="ap-form-group">
                    <label for="banner-modal-link" class="ap-cms-label" style="display:block; margin-bottom:5px;">Destination Link / Hash</label>
                    <input type="text" id="banner-modal-link" class="ap-input" value="${esc(existingBanner?.link || '#category/Electronics')}" style="width:100%;" />
                  </div>
                  <div class="ap-form-group">
                    <label for="banner-modal-order" class="ap-cms-label" style="display:block; margin-bottom:5px;">Display Order</label>
                    <input type="number" id="banner-modal-order" class="ap-input" value="${existingBanner?.order ?? banners.length}" min="0" style="width:100%;" />
                  </div>
                </div>

                <!-- Active Toggle -->
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px; padding:10px 14px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                  <input type="checkbox" id="banner-modal-active" ${existingBanner?.active !== false ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
                  <label for="banner-modal-active" style="font-size:13px; font-weight:600; color:#0f172a; cursor:pointer;">
                    Publish and make live on storefront immediately
                  </label>
                </div>

                <!-- Actions -->
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                  <button type="button" class="ap-btn ghost" id="ap-banner-modal-cancel">Cancel</button>
                  <button type="button" class="ap-btn primary" id="ap-banner-modal-save" style="padding:8px 22px;">
                    ${isEdit ? 'Save Changes' : 'Publish Banner'}
                  </button>
                </div>
              </div>
            </div>
          `;

          document.body.appendChild(backdrop);

          // Close modal
          const closeModal = () => backdrop.remove();
          backdrop.querySelector('#ap-banner-modal-close')?.addEventListener('click', closeModal);
          backdrop.querySelector('#ap-banner-modal-cancel')?.addEventListener('click', closeModal);
          backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

          // Live Image Preview updates
          const imgInput = backdrop.querySelector('#banner-modal-image');
          const previewImg = backdrop.querySelector('#banner-modal-preview-img');
          imgInput?.addEventListener('input', () => {
            if (previewImg) previewImg.src = imgInput.value.trim() || defaultImg;
          });

          // Preset buttons
          backdrop.querySelectorAll('.ap-preset-pill').forEach(pill => {
            pill.addEventListener('click', () => {
              const targetId = pill.dataset.target;
              const val = pill.dataset.val;
              const targetInput = backdrop.querySelector(`#${targetId}`);
              if (targetInput) {
                targetInput.value = val;
                if (targetId === 'banner-modal-image' && previewImg) {
                  previewImg.src = val;
                }
              }
            });
          });

          // Save Banner
          backdrop.querySelector('#ap-banner-modal-save')?.addEventListener('click', async () => {
            const title = backdrop.querySelector('#banner-modal-title')?.value.trim();
            const subtitle = backdrop.querySelector('#banner-modal-subtitle')?.value.trim();
            const tag = backdrop.querySelector('#banner-modal-tag')?.value.trim() || 'Featured';
            const image = backdrop.querySelector('#banner-modal-image')?.value.trim();
            const link = backdrop.querySelector('#banner-modal-link')?.value.trim() || '#';
            const order = parseInt(backdrop.querySelector('#banner-modal-order')?.value, 10) || 0;
            const active = backdrop.querySelector('#banner-modal-active')?.checked ?? true;

            if (!title) return showToast('Please enter a banner headline.', 'error');
            if (!image) return showToast('Please provide a banner image URL.', 'error');

            const saveBtn = backdrop.querySelector('#ap-banner-modal-save');
            if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

            try {
              if (isEdit) {
                await adminFetch(`/cms/banners/${existingBanner._id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ title, subtitle, tag, image, link, order, active }),
                });
                showToast('Featured banner updated successfully!', 'success');
              } else {
                await adminFetch('/cms/banners', {
                  method: 'POST',
                  body: JSON.stringify({ title, subtitle, tag, image, link, order, active }),
                });
                showToast('New featured banner published!', 'success');
              }
              closeModal();
              load();
            } catch (e) {
              showToast(e.message, 'error');
              if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = isEdit ? 'Save Changes' : 'Publish Banner'; }
            }
          });
        }

        /* ── MODAL: CREATE / EDIT PROMOTIONAL OFFER / VOUCHER / BANK / UPI ── */
        function showPromoModal(existingPromo = null) {
          const isEdit = !!existingPromo;
          const backdrop = document.createElement('div');
          backdrop.className = 'ap-modal-backdrop';

          const currentType = existingPromo?.type || 'voucher';
          const currentScope = existingPromo?.scope || 'storewide';
          let selectedStoreId = existingPromo?.storeId || '';
          let selectedStoreName = existingPromo?.storeName || '';

          backdrop.innerHTML = `
            <div class="ap-modal-dialog" style="max-width:620px;">
              <div class="ap-modal-header" style="background:linear-gradient(135deg, #19324c, #0f172a); color:#ffffff;">
                <div>
                  <h3 class="ap-modal-title" style="color:#ffffff; font-size:15.5px; font-weight:800;">
                    ${isEdit ? 'Edit Promotional Offer / Voucher' : 'Create New Promotional Offer / Voucher'}
                  </h3>
                  <p style="margin:2px 0 0; font-size:11.5px; color:#94a3b8;">Create customer vouchers, bank card discounts, or UPI app cashbacks with store targeting.</p>
                </div>
                <button type="button" class="ap-modal-close-btn" id="ap-promo-modal-close" style="color:#ffffff;">✕</button>
              </div>

              <div class="ap-modal-content" style="padding:22px; max-height:82vh; overflow-y:auto;">
                <!-- Offer Type Selector -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                  <div class="ap-form-group">
                    <label for="promo-modal-type" class="ap-cms-label" style="display:block; margin-bottom:5px;">Offer / Promotion Category</label>
                    <select id="promo-modal-type" class="ap-input" style="width:100%; font-weight:700;">
                      <option value="voucher" ${currentType === 'voucher' ? 'selected' : ''}>🎟️ Storewide / Store Voucher</option>
                      <option value="bank" ${currentType === 'bank' ? 'selected' : ''}>💳 Bank Card Instant Discount</option>
                      <option value="upi" ${currentType === 'upi' ? 'selected' : ''}>📱 UPI App Cashback / Offer</option>
                    </select>
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-scope" class="ap-cms-label" style="display:block; margin-bottom:5px;">Target Scope</label>
                    <select id="promo-modal-scope" class="ap-input" style="width:100%; font-weight:700;">
                      <option value="storewide" ${currentScope === 'storewide' ? 'selected' : ''}>🌐 Storewide (All Stores &amp; Products)</option>
                      <option value="store" ${currentScope === 'store' ? 'selected' : ''}>🏬 Specific Merchant Store</option>
                    </select>
                  </div>
                </div>

                <!-- Conditional Bank Partner Field -->
                <div id="promo-bank-section" class="ap-form-group" style="margin-bottom:14px; display:${currentType === 'bank' ? 'block' : 'none'};">
                  <label for="promo-modal-bank" class="ap-cms-label" style="display:block; margin-bottom:5px;">Bank Partner Name</label>
                  <input type="text" id="promo-modal-bank" class="ap-input" value="${esc(existingPromo?.bankPartner || 'Axis Bank')}" style="width:100%;" />
                  <div class="ap-preset-pills">
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-bank" data-val="Axis Bank">Axis Bank</button>
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-bank" data-val="HDFC Bank">HDFC Bank</button>
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-bank" data-val="ICICI Bank">ICICI Bank</button>
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-bank" data-val="SBI Card">SBI Card</button>
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-bank" data-val="Kotak Mahindra">Kotak Mahindra</button>
                  </div>
                </div>

                <!-- Conditional UPI Provider Field -->
                <div id="promo-upi-section" class="ap-form-group" style="margin-bottom:14px; display:${currentType === 'upi' ? 'block' : 'none'};">
                  <label for="promo-modal-upi" class="ap-cms-label" style="display:block; margin-bottom:5px;">UPI Provider / App</label>
                  <input type="text" id="promo-modal-upi" class="ap-input" value="${esc(existingPromo?.upiProvider || 'Google Pay')}" style="width:100%;" />
                  <div class="ap-preset-pills">
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-upi" data-val="Google Pay">Google Pay</button>
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-upi" data-val="PhonePe">PhonePe</button>
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-upi" data-val="Paytm">Paytm UPI</button>
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-upi" data-val="Cred UPI">Cred UPI</button>
                    <button type="button" class="ap-preset-pill" data-target="promo-modal-upi" data-val="Amazon Pay">Amazon Pay</button>
                  </div>
                </div>

                <!-- DEDICATED STORE SEARCH & SELECTOR (For store-specific promotions) -->
                <div id="promo-store-picker-wrap" class="ap-form-group" style="margin-bottom:14px; display:${currentScope === 'store' ? 'block' : 'none'};">
                  <label for="promo-store-search-field" class="ap-cms-label" style="display:block; margin-bottom:5px;">Search &amp; Select Merchant Store</label>
                  <div class="promo-store-picker-box">
                    <input type="text" id="promo-store-search-field" class="ap-input" style="width:100%;" />
                    <div id="promo-store-dropdown" class="promo-store-results-list" style="display:none;"></div>
                  </div>
                  <div id="promo-selected-store-box" class="promo-selected-store-pill" style="display:${selectedStoreName ? 'flex' : 'none'};">
                    <span>🏬 Targeted Store: <strong id="promo-store-name-display">${esc(selectedStoreName)}</strong></span>
                    <button type="button" id="promo-clear-store-selection" class="ap-btn-tiny" style="background:#065f46; color:#ffffff; border:none; border-radius:4px; padding:2px 8px; cursor:pointer;">Change</button>
                  </div>
                </div>

                <!-- Coupon Code & Title -->
                <div style="display:grid; grid-template-columns:1fr 2fr; gap:12px; margin-bottom:14px;">
                  <div class="ap-form-group">
                    <label for="promo-modal-code" class="ap-cms-label" style="display:block; margin-bottom:5px;">Voucher / Code</label>
                    <input type="text" id="promo-modal-code" class="ap-input" value="${esc(existingPromo?.code || '')}" style="width:100%; text-transform:uppercase; font-family:monospace; font-weight:800; color:#2563eb;" />
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-title" class="ap-cms-label" style="display:block; margin-bottom:5px;">Offer Headline / Display Title</label>
                    <input type="text" id="promo-modal-title" class="ap-input" value="${esc(existingPromo?.title || '')}" style="width:100%;" />
                  </div>
                </div>

                <!-- Discount Type, Discount Value & Min Order -->
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; margin-bottom:14px;">
                  <div class="ap-form-group">
                    <label for="promo-modal-discount-type" class="ap-cms-label" style="display:block; margin-bottom:5px;">Discount Type</label>
                    <select id="promo-modal-discount-type" class="ap-input" style="width:100%; font-weight:600;">
                      <option value="percent" ${existingPromo?.discountType !== 'flat' ? 'selected' : ''}>Percentage (%)</option>
                      <option value="flat" ${existingPromo?.discountType === 'flat' ? 'selected' : ''}>Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-val" class="ap-cms-label" style="display:block; margin-bottom:5px;">Discount Rate</label>
                    <input type="number" id="promo-modal-val" class="ap-input" value="${existingPromo?.discountValue ?? 10}" min="1" style="width:100%;" />
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-min" class="ap-cms-label" style="display:block; margin-bottom:5px;">Min Order (₹)</label>
                    <input type="number" id="promo-modal-min" class="ap-input" value="${existingPromo?.minOrder ?? 499}" min="0" style="width:100%;" />
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-max" class="ap-cms-label" style="display:block; margin-bottom:5px;">Max Cap (₹)</label>
                    <input type="number" id="promo-modal-max" class="ap-input" value="${existingPromo?.maxDiscount ?? 1000}" min="0" style="width:100%;" />
                  </div>
                </div>

                <!-- Description / Terms -->
                <div class="ap-form-group" style="margin-bottom:14px;">
                  <label for="promo-modal-desc" class="ap-cms-label" style="display:block; margin-bottom:5px;">Offer Description &amp; Terms</label>
                  <textarea id="promo-modal-desc" class="ap-input" style="width:100%; height:60px; font-size:12.5px; resize:vertical;">${esc(existingPromo?.description || '')}</textarea>
                </div>

                <!-- Active Toggle -->
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px; padding:10px 14px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                  <input type="checkbox" id="promo-modal-active" ${existingPromo?.active !== false ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
                  <label for="promo-modal-active" style="font-size:13px; font-weight:600; color:#0f172a; cursor:pointer;">
                    Activate offer immediately across customer checkout &amp; top navbar
                  </label>
                </div>

                <!-- Actions -->
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                  <button type="button" class="ap-btn ghost" id="ap-promo-modal-cancel">Cancel</button>
                  <button type="button" class="ap-btn primary" id="ap-promo-modal-save" style="padding:8px 22px; background:#ea580c; border-color:#c2410c;">
                    ${isEdit ? 'Save Offer' : 'Create Offer'}
                  </button>
                </div>
              </div>
            </div>
          `;

          document.body.appendChild(backdrop);

          // Close modal
          const closeModal = () => backdrop.remove();
          backdrop.querySelector('#ap-promo-modal-close')?.addEventListener('click', closeModal);
          backdrop.querySelector('#ap-promo-modal-cancel')?.addEventListener('click', closeModal);
          backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

          // Toggle conditional bank/upi sections
          const typeSelect = backdrop.querySelector('#promo-modal-type');
          const bankSection = backdrop.querySelector('#promo-bank-section');
          const upiSection = backdrop.querySelector('#promo-upi-section');

          typeSelect?.addEventListener('change', () => {
            const val = typeSelect.value;
            if (bankSection) bankSection.style.display = val === 'bank' ? 'block' : 'none';
            if (upiSection) upiSection.style.display = val === 'upi' ? 'block' : 'none';
          });

          // Toggle store picker section
          const scopeSelect = backdrop.querySelector('#promo-modal-scope');
          const storePickerWrap = backdrop.querySelector('#promo-store-picker-wrap');
          scopeSelect?.addEventListener('change', () => {
            const isStore = scopeSelect.value === 'store';
            if (storePickerWrap) storePickerWrap.style.display = isStore ? 'block' : 'none';
            if (!isStore) {
              selectedStoreId = '';
              selectedStoreName = 'Storewide (All Stores)';
            }
          });

          // Preset pills in modal
          backdrop.querySelectorAll('.ap-preset-pill').forEach(pill => {
            pill.addEventListener('click', () => {
              const targetId = pill.dataset.target;
              const val = pill.dataset.val;
              const targetInput = backdrop.querySelector(`#${targetId}`);
              if (targetInput) targetInput.value = val;
            });
          });

          // Store search autocomplete
          const storeSearchField = backdrop.querySelector('#promo-store-search-field');
          const storeDropdown = backdrop.querySelector('#promo-store-dropdown');
          const selectedBox = backdrop.querySelector('#promo-selected-store-box');
          const storeNameDisplay = backdrop.querySelector('#promo-store-name-display');

          let searchDebounce = null;
          storeSearchField?.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(async () => {
              const query = storeSearchField.value.trim();
              try {
                const res = await adminFetch(`/cms/stores?search=${encodeURIComponent(query)}`);
                const stores = res.data?.stores || [];
                if (!stores.length) {
                  if (storeDropdown) {
                    storeDropdown.innerHTML = `<div style="padding:10px 12px; font-size:12px; color:#64748b;">No matching merchant stores found.</div>`;
                    storeDropdown.style.display = 'block';
                  }
                  return;
                }
                if (storeDropdown) {
                  storeDropdown.innerHTML = stores.map(s => `
                    <div class="promo-store-item" data-id="${s.id}" data-name="${esc(s.storeName)}">
                      <div class="promo-store-item-name">🏬 ${esc(s.storeName)}</div>
                      <div class="promo-store-item-sub">${esc(s.bizName || s.email)} ${s.isActive ? '● Active Merchant' : ''}</div>
                    </div>
                  `).join('');
                  storeDropdown.style.display = 'block';

                  storeDropdown.querySelectorAll('.promo-store-item').forEach(item => {
                    item.addEventListener('click', () => {
                      selectedStoreId = item.dataset.id;
                      selectedStoreName = item.dataset.name;
                      if (storeNameDisplay) storeNameDisplay.textContent = selectedStoreName;
                      if (selectedBox) selectedBox.style.display = 'flex';
                      if (storeDropdown) storeDropdown.style.display = 'none';
                      if (storeSearchField) storeSearchField.value = '';
                    });
                  });
                }
              } catch (err) {
                console.warn('Store search failed:', err);
              }
            }, 250);
          });

          backdrop.querySelector('#promo-clear-store-selection')?.addEventListener('click', () => {
            selectedStoreId = '';
            selectedStoreName = '';
            if (selectedBox) selectedBox.style.display = 'none';
            if (storeSearchField) storeSearchField.focus();
          });

          // Save Promo
          backdrop.querySelector('#ap-promo-modal-save')?.addEventListener('click', async () => {
            const type = backdrop.querySelector('#promo-modal-type')?.value;
            const scope = backdrop.querySelector('#promo-modal-scope')?.value;
            const code = backdrop.querySelector('#promo-modal-code')?.value.trim().toUpperCase();
            const title = backdrop.querySelector('#promo-modal-title')?.value.trim();
            const discountType = backdrop.querySelector('#promo-modal-discount-type')?.value;
            const discountValue = parseFloat(backdrop.querySelector('#promo-modal-val')?.value) || 0;
            const minOrder = parseFloat(backdrop.querySelector('#promo-modal-min')?.value) || 0;
            const maxDiscount = parseFloat(backdrop.querySelector('#promo-modal-max')?.value) || 0;
            const description = backdrop.querySelector('#promo-modal-desc')?.value.trim();
            const active = backdrop.querySelector('#promo-modal-active')?.checked ?? true;
            const bankPartner = type === 'bank' ? backdrop.querySelector('#promo-modal-bank')?.value.trim() : '';
            const upiProvider = type === 'upi' ? backdrop.querySelector('#promo-modal-upi')?.value.trim() : '';

            if (!code) return showToast('Please enter a voucher code.', 'error');
            if (!title) return showToast('Please enter an offer headline/title.', 'error');
            if (discountValue <= 0) return showToast('Please enter a valid discount rate.', 'error');
            if (scope === 'store' && !selectedStoreId) {
              return showToast('Please search and select a merchant store for store-specific promotions.', 'error');
            }

            const payload = {
              code,
              title,
              type,
              discountType,
              discountValue,
              minOrder,
              maxDiscount,
              scope,
              storeId: scope === 'store' ? selectedStoreId : null,
              storeName: scope === 'store' ? selectedStoreName : 'Storewide (All Stores)',
              bankPartner,
              upiProvider,
              description,
              active,
            };

            const saveBtn = backdrop.querySelector('#ap-promo-modal-save');
            if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

            try {
              if (isEdit) {
                await adminFetch(`/cms/promotions/${existingPromo._id}`, {
                  method: 'PUT',
                  body: JSON.stringify(payload),
                });
                showToast('Promotional offer updated successfully!', 'success');
              } else {
                await adminFetch('/cms/promotions', {
                  method: 'POST',
                  body: JSON.stringify(payload),
                });
                showToast('New promotional offer created!', 'success');
              }
              closeModal();
              load();
            } catch (e) {
              showToast(e.message, 'error');
              if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = isEdit ? 'Save Offer' : 'Create Offer'; }
            }
          });
        }

      } catch (err) {
        body.innerHTML = emptyHTML('⚠️', `Failed to load CMS: ${err.message}`);
      }
    }
    load();
  }
