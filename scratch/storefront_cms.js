/* ══════════════════════════════════════════════════════
   STOREFRONT CMS INTEGRATION (OFFERS PILL, TICKER, HERO BANNERS & CHECKOUT VOUCHERS)
   ══════════════════════════════════════════════════════ */
(function initStorefrontCMS() {
  let cmsData = null;
  let appliedCoupon = null;

  async function fetchStorefrontCMS() {
    try {
      const res = await fetch('/api/cms');
      const json = await res.json();
      if (!json.success || !json.data) return;
      cmsData = json.data;
      window._storefrontCMS = cmsData;

      updateTopNavbarOffers();
      updateHeroSliderFromCMS();
    } catch (err) {
      console.warn('[Storefront CMS]: Could not fetch CMS data:', err.message);
    }
  }

  function updateTopNavbarOffers() {
    if (!cmsData) return;
    const promos = (cmsData.promotions || []).filter(p => p.active !== false);
    const countBadge = document.getElementById('topbar-offers-count');
    if (countBadge) {
      countBadge.textContent = `${promos.length} Live`;
    }

    // Populate Utility Ticker with CMS announcement and offers
    const ticker = document.getElementById('utility-ticker');
    if (ticker) {
      const slides = [];
      if (cmsData.announcementText && cmsData.announcementActive !== false) {
        slides.push(`<div class="ticker-slide is-active">${cmsData.announcementText}</div>`);
      }
      promos.forEach(p => {
        if (p.type === 'bank') {
          slides.push(`<div class="ticker-slide">💳 <strong>${p.bankPartner || 'Bank Card'}:</strong> ${p.discountValue}% Instant Discount with code <strong>${p.code}</strong> (Min. ₹${p.minOrder})</div>`);
        } else if (p.type === 'upi') {
          slides.push(`<div class="ticker-slide">📱 <strong>${p.upiProvider || 'UPI'}:</strong> Flat ₹${p.discountValue} Cashback with code <strong>${p.code}</strong> (Min. ₹${p.minOrder})</div>`);
        } else {
          slides.push(`<div class="ticker-slide">🎟️ <strong>Voucher:</strong> Extra ${p.discountValue}% OFF with code <strong>${p.code}</strong> (Min. ₹${p.minOrder})</div>`);
        }
      });
      if (slides.length > 0) {
        ticker.innerHTML = slides.join('');
      }
    }
  }

  function openOffersModal() {
    if (!cmsData) return;
    const promos = (cmsData.promotions || []).filter(p => p.active !== false);
    const existing = document.getElementById('offers-customer-modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'offers-customer-modal-backdrop';
    backdrop.className = 'offers-modal-backdrop';

    const cardsHtml = promos.length ? promos.map(p => {
      const typeClass = p.type === 'bank' ? 'bank' : p.type === 'upi' ? 'upi' : 'voucher';
      const typeLabel = p.type === 'bank' ? '💳 Bank Card Offer' : p.type === 'upi' ? '📱 UPI App Offer' : '🎟️ Store Voucher';
      const scopeLabel = p.scope === 'store' ? `🏬 ${p.storeName || 'Merchant Store'}` : '🌐 Storewide';
      const discountText = p.discountType === 'percent'
        ? `${p.discountValue}% Instant Discount${p.maxDiscount ? ` (Up to ₹${p.maxDiscount.toLocaleString('en-IN')})` : ''}`
        : `Flat ₹${p.discountValue.toLocaleString('en-IN')} Instant Discount`;

      return `
        <div class="offer-card ${typeClass}">
          <div class="offer-card-details">
            <span class="offer-type-tag ${typeClass}">${typeLabel} &bull; ${scopeLabel}</span>
            <h4 class="offer-title">${p.title}</h4>
            <p class="offer-desc">${p.description || discountText}</p>
            <div class="offer-meta-row">
              <span class="offer-meta-item">Min Order: <strong>₹${(p.minOrder || 0).toLocaleString('en-IN')}</strong></span>
              ${p.bankPartner ? `<span class="offer-meta-item">Partner: <strong>${p.bankPartner}</strong></span>` : ''}
              ${p.upiProvider ? `<span class="offer-meta-item">App: <strong>${p.upiProvider}</strong></span>` : ''}
            </div>
          </div>
          <div class="offer-action-col">
            <span class="offer-code-pill">${p.code}</span>
            <button type="button" class="offer-copy-btn" data-code="${p.code}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>Copy</span>
            </button>
          </div>
        </div>
      `;
    }).join('') : `<div style="text-align:center; padding:30px; color:#64748b;">No active promotions at the moment. Check back soon!</div>`;

    backdrop.innerHTML = `
      <div class="offers-modal-dialog">
        <div class="offers-modal-header">
          <div>
            <h3 class="offers-modal-title">🏷️ Active Store Offers &amp; Vouchers</h3>
            <p class="offers-modal-sub">Apply these discount codes during checkout to save big on your orders.</p>
          </div>
          <button type="button" class="ap-modal-close-btn" id="offers-customer-modal-close" style="color:#ffffff;">✕</button>
        </div>
        <div class="offers-modal-body">
          ${cardsHtml}
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeModal = () => backdrop.remove();
    backdrop.querySelector('#offers-customer-modal-close')?.addEventListener('click', closeModal);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

    // Copy Code handler
    backdrop.querySelectorAll('.offer-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        navigator.clipboard.writeText(code).then(() => {
          btn.classList.add('copied');
          btn.innerHTML = '✓ Copied!';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>`;
          }, 2000);
          if (typeof showToast === 'function') {
            showToast(`Coupon code ${code} copied to clipboard!`, 'success');
          }
        }).catch(() => {
          if (typeof showToast === 'function') showToast(`Code: ${code}`, 'info');
        });
      });
    });
  }

  function updateHeroSliderFromCMS() {
    if (!cmsData) return;
    const banners = (cmsData.heroBanners || []).filter(b => b.active !== false);
    if (!banners.length) return;

    const track = document.getElementById('hero-slider-track');
    const indicators = document.getElementById('hero-slider-indicators');
    if (!track) return;

    // Render dynamic hero slides
    track.innerHTML = banners.map((b, i) => `
      <div class="hero-slide${i === 0 ? ' is-active' : ''}" data-slide="${i}" style="display:${i === 0 ? 'block' : 'none'};">
        <img class="hero-slide-img" src="${b.image}" alt="${b.title}" loading="${i === 0 ? 'eager' : 'lazy'}" onerror="this.src='https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80';" />
        <div class="hero-slide-overlay">
          <div class="hero-slide-content">
            <span style="display:inline-block; background:#ff9700; color:#000000; font-size:11px; font-weight:800; text-transform:uppercase; padding:3px 10px; border-radius:999px; margin-bottom:10px; letter-spacing:0.04em;">${b.tag || 'Featured'}</span>
            <h2 class="hero-slide-title">${b.title}</h2>
            <p class="hero-slide-desc">${b.subtitle || ''}</p>
            <a href="${b.link || '#deals'}" class="hero-slide-cta">Shop Now <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>
        </div>
      </div>
    `).join('');

    // Rebuild indicators
    if (indicators) {
      indicators.innerHTML = banners.map((_, i) =>
        `<button class="hero-slider-dot${i === 0 ? ' is-active' : ''}" data-slide="${i}" aria-label="Go to slide ${i+1}"></button>`
      ).join('');
    }
  }

  // Hook up checkout coupon apply
  function initCheckoutCouponHandler() {
    document.addEventListener('click', (e) => {
      const applyBtn = e.target.closest('#chk-coupon-apply-btn');
      if (!applyBtn) return;

      const input = document.getElementById('chk-coupon-input');
      if (!input) return;
      const enteredCode = input.value.trim().toUpperCase();
      if (!enteredCode) {
        if (typeof showToast === 'function') showToast('Please enter a coupon code.', 'error');
        return;
      }

      const activePromos = (cmsData?.promotions || []).filter(p => p.active !== false);
      const match = activePromos.find(p => p.code.toUpperCase() === enteredCode);

      if (!match) {
        if (typeof showToast === 'function') showToast(`Invalid coupon code "${enteredCode}".`, 'error');
        return;
      }

      // Calculate discount
      const subtotalEl = document.getElementById('chk-step1-subtotal');
      let subtotal = 0;
      if (subtotalEl) {
        subtotal = parseFloat(subtotalEl.textContent.replace(/[^0-9.]/g, '')) || 0;
      }

      if (subtotal < (match.minOrder || 0)) {
        if (typeof showToast === 'function') {
          showToast(`Coupon ${match.code} requires a minimum bag value of ₹${match.minOrder.toLocaleString('en-IN')}.`, 'error');
        }
        return;
      }

      let discountAmount = 0;
      if (match.discountType === 'percent') {
        discountAmount = Math.round((subtotal * match.discountValue) / 100);
        if (match.maxDiscount && discountAmount > match.maxDiscount) {
          discountAmount = match.maxDiscount;
        }
      } else {
        discountAmount = match.discountValue;
      }

      appliedCoupon = { ...match, discountAmount };
      input.disabled = true;
      applyBtn.disabled = true;
      applyBtn.textContent = 'Applied ✓';
      applyBtn.style.background = '#16a34a';

      // Update grand total display if element exists
      const discountRow = document.getElementById('chk-step1-discount');
      if (discountRow) discountRow.textContent = `-₹${discountAmount.toLocaleString('en-IN')}`;

      const grandTotalEl = document.getElementById('chk-step1-grand-total');
      if (grandTotalEl) {
        const currentTotal = parseFloat(grandTotalEl.textContent.replace(/[^0-9.]/g, '')) || subtotal;
        const newTotal = Math.max(0, currentTotal - discountAmount);
        grandTotalEl.textContent = `₹${newTotal.toLocaleString('en-IN')}`;
      }

      if (typeof showToast === 'function') {
        showToast(`Coupon "${match.code}" applied! You saved ₹${discountAmount.toLocaleString('en-IN')}.`, 'success');
      }
    });
  }

  // Bind top navbar offers button
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('topbar-offers-btn')?.addEventListener('click', openOffersModal);
    fetchStorefrontCMS();
    initCheckoutCouponHandler();
  });

  // Also trigger if DOM is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    document.getElementById('topbar-offers-btn')?.addEventListener('click', openOffersModal);
    fetchStorefrontCMS();
    initCheckoutCouponHandler();
  }
})();
