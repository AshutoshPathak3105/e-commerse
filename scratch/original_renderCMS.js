  async function renderCMS(body) {
    body.innerHTML = loadingHTML();

    function esc(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatDatetimeLocal(val) {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const pad = n => String(n).padStart(2, '0');
      const Y = d.getFullYear();
      const M = pad(d.getMonth() + 1);
      const D = pad(d.getDate());
      const h = pad(d.getHours());
      const m = pad(d.getMinutes());
      return `${Y}-${M}-${D}T${h}:${m}`;
    }

    async function load() {
      try {
        const res = await adminFetch('/cms');
        const cms = res.data || {};
        const banners = cms.heroBanners || [];
        const promotions = cms.promotions || [];
        const quadCards = cms.quadCards || [];
        const heroPromoCards = cms.heroPromoCards || [];
        const quickBrowseItems = cms.quickBrowseItems || [];

        let currentFilter = 'all';
        let storeSearchQuery = '';
        let offerSearchQuery = '';
        let quadRowFilter = 'all';
        let quadSearchQuery = '';

        function getFilteredQuadCards() {
          return quadCards.filter(c => {
            if (quadRowFilter !== 'all' && String(c.row) !== String(quadRowFilter)) {
              return false;
            }
            if (quadSearchQuery) {
              const q = quadSearchQuery.toLowerCase();
              const titleMatch = (c.title || '').toLowerCase().includes(q);
              const itemsMatch = Array.isArray(c.items) && c.items.some(it => (it.title || '').toLowerCase().includes(q) || (it.badge || '').toLowerCase().includes(q));
              if (!titleMatch && !itemsMatch) return false;
            }
            return true;
          });
        }

        function renderQuadCardRows(cardList) {
          if (!cardList || !cardList.length) {
            return `<tr><td colspan="6" style="text-align:center; padding:32px; color:#000000; font-weight:600;">No homepage cards match your filter. Click <strong>"+ Add New Homepage Card"</strong> or <strong>"Reset to Defaults"</strong>.</td></tr>`;
          }
          return cardList.map((c, idx) => {
            const cardId = String(c._id || c.id || idx);
            const items = Array.isArray(c.items) ? c.items : [];
            const thumbsHtml = items.slice(0, 4).map(it => `
              <div style="width:34px; height:34px; border-radius:6px; overflow:hidden; border:1px solid #cbd5e1; background:#ffffff; display:inline-flex; align-items:center; justify-content:center;" title="${esc(it.title || '')} (${esc(it.badge || '')})">
                <img src="${esc(it.image)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';" />
              </div>
            `).join('');

            const itemsSummary = items.map(it => `
              <span style="display:inline-block; font-size:11px; background:#f1f5f9; padding:2px 6px; border-radius:4px; margin:2px 4px 2px 0; color:#334155; font-weight:600;">
                ${esc(it.title || 'Item')}${it.badge ? ` <strong style="color:#dc2626;">(${esc(it.badge)})</strong>` : ''}
              </span>
            `).join('');

            return `
              <tr data-quad-id="${cardId}">
                <td style="width:160px;">
                  <div style="display:flex; gap:4px; flex-wrap:wrap; max-width:80px;">
                    ${thumbsHtml}
                  </div>
                </td>
                <td>
                  <div style="font-weight:800; color:#0f172a; font-size:13.5px;">${esc(c.title)}</div>
                  <div style="margin-top:4px;">${itemsSummary || '<span style="color:#94a3b8; font-size:11px;">No sub-items</span>'}</div>
                </td>
                <td>
                  <div style="display:flex; flex-wrap:wrap; align-items:center; gap:6px;">
                    <span class="ap-badge blue" style="font-weight:700;">Row ${c.row || 1}</span>
                    <span class="ap-badge gray" style="font-weight:600;">#${c.order ?? idx}</span>
                  </div>
                </td>
                <td>
                  <div style="font-size:12px; color:#475569;">
                    Link: <code style="color:#2563eb; font-size:11px;">${esc(c.link || '#deals')}</code>
                  </div>
                  <div style="font-size:11.5px; color:#64748b; margin-top:2px;">
                    Footer: <em>"${esc(c.footerText || 'See more')}"</em>
                  </div>
                </td>
                <td>
                  <button type="button" class="ap-btn-tiny ap-quad-toggle-btn ${c.active !== false ? 'ap-badge green' : 'ap-badge gray'}" data-id="${cardId}" data-active="${c.active !== false}" title="Click to toggle Active / Hidden" style="cursor:pointer; border:none; font-weight:800; padding:4px 10px;">
                    ${c.active !== false ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td style="white-space:nowrap; text-align:right;">
                  <button type="button" class="ap-btn ghost ap-edit-quad-btn" data-id="${cardId}" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
                  <button type="button" class="ap-btn danger ap-delete-quad-btn" data-id="${cardId}" style="padding:4px 10px; font-size:12px;">Delete</button>
                </td>
              </tr>
            `;
          }).join('');
        }

        function renderHeroPromoRows(list) {
          if (!list || !list.length) return `<tr><td colspan="4" style="text-align:center; padding:16px; font-size:12px; color:#64748b;">No top promo cards.</td></tr>`;
          return list.map((c, idx) => {
            const id = String(c._id || c.id || idx);
            return `
              <tr data-hero-id="${id}">
                <td style="width:60px;">
                  <img src="${esc(c.image)}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';" />
                </td>
                <td>
                  <div style="font-weight:800; font-size:12.5px; color:#0f172a;">${esc(c.brand || c.sub || 'Promo Banner')}</div>
                  <div style="font-size:11px; color:#64748b;">${esc(c.badge || '')} • ${esc(c.sub || '')}</div>
                  <div style="font-size:10.5px; color:#0284c7; margin-top:2px;">${esc(c.pill || '')}</div>
                </td>
                <td>
                  <button type="button" class="ap-btn-tiny ap-hero-toggle-btn ${c.active !== false ? 'ap-badge green' : 'ap-badge gray'}" data-id="${id}" data-active="${c.active !== false}" style="cursor:pointer; border:none; padding:2px 8px; font-size:10.5px;">
                    ${c.active !== false ? 'Active' : 'Paused'}
                  </button>
                </td>
                <td style="text-align:right; white-space:nowrap;">
                  <button type="button" class="ap-btn ghost ap-edit-hero-btn" data-id="${id}" style="padding:3px 8px; font-size:11px; margin-right:2px;">Edit</button>
                  <button type="button" class="ap-btn danger ap-del-hero-btn" data-id="${id}" style="padding:3px 8px; font-size:11px;">Del</button>
                </td>
              </tr>
            `;
          }).join('');
        }

        function renderQuickBrowseRows(list) {
          if (!list || !list.length) return `<tr><td colspan="4" style="text-align:center; padding:16px; font-size:12px; color:#64748b;">No quick browse items.</td></tr>`;
          return list.map((it, idx) => {
            const id = String(it._id || it.id || idx);
            return `
              <tr data-quick-id="${id}">
                <td style="width:60px;">
                  <img src="${esc(it.image)}" style="width:44px; height:44px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';" />
                </td>
                <td>
                  <div style="font-weight:800; font-size:12.5px; color:#0f172a;">${esc(it.title || 'Browse Item')}</div>
                  ${it.badge ? `<span style="font-size:10.5px; color:#dc2626; font-weight:700;">${esc(it.badge)}</span>` : ''}
                </td>
                <td>
                  <button type="button" class="ap-btn-tiny ap-quick-toggle-btn ${it.active !== false ? 'ap-badge green' : 'ap-badge gray'}" data-id="${id}" data-active="${it.active !== false}" style="cursor:pointer; border:none; padding:2px 8px; font-size:10.5px;">
                    ${it.active !== false ? 'Active' : 'Paused'}
                  </button>
                </td>
                <td style="text-align:right; white-space:nowrap;">
                  <button type="button" class="ap-btn ghost ap-edit-quick-btn" data-id="${id}" style="padding:3px 8px; font-size:11px; margin-right:2px;">Edit</button>
                  <button type="button" class="ap-btn danger ap-del-quick-btn" data-id="${id}" style="padding:3px 8px; font-size:11px;">Del</button>
                </td>
              </tr>
            `;
          }).join('');
        }

        function renderBannerRows(bannerList) {
          if (!bannerList.length) {
            return `<tr><td colspan="7" style="text-align:center; padding:32px; color:#000000; font-weight:600;">No active featured banners found. Click <strong>"+ Add Featured Banner"</strong> to publish your banner!</td></tr>`;
          }
          return bannerList.map(b => {
            const bannerId = String(b._id || b.id);
            return `
            <tr data-banner-id="${bannerId}">
              <td style="width:100px;">
                <img class="ap-banner-thumb" src="${esc(b.image)}" alt="${esc(b.title)}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200';" />
              </td>
              <td>
                <div style="font-weight:750; color:#000000; font-size:13.5px;">${esc(b.title)}</div>
                <div style="font-size:12px; color:#1e293b; margin-top:2px;">${esc(b.subtitle || '')}</div>
              </td>
              <td><span class="ap-badge blue">${esc(b.tag || 'Featured')}</span></td>
              <td><code style="font-size:11.5px; color:#2563eb; background:#eff6ff; padding:2px 6px; border-radius:4px;">${esc(b.link || '#')}</code></td>
              <td><span class="ap-badge gray" style="font-weight:700;">#${b.order ?? 0}</span></td>
              <td>
                <button type="button" class="ap-btn-tiny ap-banner-toggle-btn ${b.active ? 'ap-badge green' : 'ap-badge gray'}" data-id="${bannerId}" data-active="${b.active}" title="Click to toggle Active / Paused status" style="cursor:pointer; border:none; font-weight:800; padding:3px 8px;">
                  ${b.active ? 'Active' : 'Paused'}
                </button>
              </td>
              <td style="white-space:nowrap; text-align:right;">
                <button type="button" class="ap-btn ghost ap-edit-banner-btn" data-id="${bannerId}" title="Edit banner headline, image, or link" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
                <button type="button" class="ap-btn danger ap-delete-banner-btn" data-id="${bannerId}" title="Delete banner" style="padding:4px 10px; font-size:12px;">Delete</button>
              </td>
            </tr>
          `;
          }).join('');
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

        // ── TOP 10 MOST VALUED BANKS OF INDIA & TOP UPI APPS WITH REAL LOGOS ──
        const TOP_10_INDIAN_BANKS = [
          { id: 'All Banks (Any Debit/Credit Card)', name: 'All Banks (Any Debit/Credit Card)', shortName: 'All Banks (Any Card)', rank: 'Universal • All Banks', logo: 'assets/banks/allbanks.svg', tag: 'Any Bank' },
          { id: 'HDFC Bank', name: 'HDFC Bank', shortName: 'HDFC Bank', rank: '#1 Most Valued (₹12.8L Cr)', logo: 'assets/banks/hdfc.svg', tag: 'Private #1' },
          { id: 'SBI Bank', name: 'State Bank of India (SBI Bank)', shortName: 'SBI Bank', rank: '#2 Most Valued (₹7.6L Cr)', logo: 'assets/banks/sbi.svg', tag: 'PSU #1' },
          { id: 'ICICI Bank', name: 'ICICI Bank', shortName: 'ICICI Bank', rank: '#3 Most Valued (₹8.2L Cr)', logo: 'assets/banks/icici.svg', tag: 'Private #2' },
          { id: 'Axis Bank', name: 'Axis Bank', shortName: 'Axis Bank', rank: '#4 Most Valued (₹3.6L Cr)', logo: 'assets/banks/axis.svg', tag: 'Private #3' },
          { id: 'Kotak Mahindra', name: 'Kotak Mahindra Bank', shortName: 'Kotak Mahindra', rank: '#5 Most Valued (₹3.4L Cr)', logo: 'assets/banks/kotak.svg', tag: 'Private' },
          { id: 'Indian Bank', name: 'Indian Bank', shortName: 'Indian Bank', rank: 'Top PSU Bank', logo: 'assets/banks/indian.svg', tag: 'PSU' },
          { id: 'IndusInd Bank', name: 'IndusInd Bank', shortName: 'IndusInd Bank', rank: '#6 Most Valued (₹1.1L Cr)', logo: 'assets/banks/indusind.svg', tag: 'Private' },
          { id: 'Bank of Baroda', name: 'Bank of Baroda (BoB)', shortName: 'Bank of Baroda', rank: '#7 Most Valued (₹1.3L Cr)', logo: 'assets/banks/bob.svg', tag: 'PSU #2' },
          { id: 'Punjab National Bank', name: 'Punjab National Bank (PNB)', shortName: 'Punjab National Bank', rank: '#8 Most Valued (₹1.2L Cr)', logo: 'assets/banks/pnb.svg', tag: 'PSU #3' },
          { id: 'Canara Bank', name: 'Canara Bank', shortName: 'Canara Bank', rank: '#9 Most Valued (₹1.0L Cr)', logo: 'assets/banks/canara.svg', tag: 'PSU' },
          { id: 'Union Bank of India', name: 'Union Bank of India', shortName: 'Union Bank of India', rank: '#10 Most Valued (₹96,000 Cr)', logo: 'assets/banks/ubi.svg', tag: 'PSU' },
          { id: 'IDFC FIRST Bank', name: 'IDFC FIRST Bank', shortName: 'IDFC FIRST Bank', rank: 'Private Bank', logo: 'assets/banks/idfc.svg', tag: 'Private' },
          { id: 'Federal Bank', name: 'Federal Bank', shortName: 'Federal Bank', rank: 'Private Bank', logo: 'assets/banks/federal.svg', tag: 'Private' },
          { id: 'Yes Bank', name: 'Yes Bank', shortName: 'Yes Bank', rank: 'Private Bank', logo: 'assets/banks/yesbank.svg', tag: 'Private' }
        ];

        const TOP_UPI_APPS = [
          { id: 'All UPI Apps (Any UPI Payment)', name: 'All UPI Apps (Any UPI Payment)', shortName: 'All UPI Apps', rank: 'Universal • Any UPI App', logo: 'assets/upi/upi.svg', tag: 'Any UPI' },
          { id: 'PhonePe', name: 'PhonePe', shortName: 'PhonePe', rank: '#1 in India by Market Share (48%)', logo: 'assets/upi/phonepe.svg', tag: 'Popular' },
          { id: 'Google Pay', name: 'Google Pay (GPay)', shortName: 'Google Pay', rank: '#2 in India by Market Share (37%)', logo: 'assets/upi/gpay.svg', tag: 'Popular' },
          { id: 'Paytm', name: 'Paytm UPI', shortName: 'Paytm', rank: '#3 Top UPI Provider in India', logo: 'assets/upi/paytm.svg', tag: 'Fast' },
          { id: 'BHIM UPI', name: 'BHIM UPI (NPCI)', shortName: 'BHIM UPI', rank: 'Official Govt / NPCI UPI App', logo: 'assets/upi/bhim.svg', tag: 'Official' },
          { id: 'Amazon Pay', name: 'Amazon Pay UPI', shortName: 'Amazon Pay', rank: 'Top E-Commerce Rewards UPI', logo: 'assets/upi/amazonpay.svg', tag: 'Rewards' },
          { id: 'CRED UPI', name: 'CRED UPI', shortName: 'CRED UPI', rank: 'Top Premium & Cardholders UPI', logo: 'assets/upi/cred.svg', tag: 'Premium' },
          { id: 'WhatsApp Pay', name: 'WhatsApp Pay', shortName: 'WhatsApp Pay', rank: 'Seamless In-Chat UPI Payments', logo: 'assets/upi/whatsapp.svg', tag: 'Chat' }
        ];

        function getBankLogoUrl(bankName) {
          if (!bankName) return 'assets/banks/allbanks.svg';
          const str = bankName.toLowerCase();
          if (str.includes('hdfc')) return 'assets/banks/hdfc.svg';
          if (str.includes('sbi') || str.includes('state bank')) return 'assets/banks/sbi.svg';
          if (str.includes('icici')) return 'assets/banks/icici.svg';
          if (str.includes('axis')) return 'assets/banks/axis.svg';
          if (str.includes('kotak')) return 'assets/banks/kotak.svg';
          if (str.includes('indus')) return 'assets/banks/indusind.svg';
          if (str.includes('baroda') || str.includes('bob')) return 'assets/banks/bob.svg';
          if (str.includes('punjab') || str.includes('pnb')) return 'assets/banks/pnb.svg';
          if (str.includes('canara')) return 'assets/banks/canara.svg';
          if (str.includes('union')) return 'assets/banks/ubi.svg';
          if (str.includes('indian')) return 'assets/banks/indian.svg';
          if (str.includes('idfc')) return 'assets/banks/idfc.svg';
          if (str.includes('federal')) return 'assets/banks/federal.svg';
          if (str.includes('yes')) return 'assets/banks/yesbank.svg';
          return 'assets/banks/allbanks.svg';
        }

        function getUpiLogoUrl(appName) {
          if (!appName) return 'assets/upi/upi.svg';
          const str = appName.toLowerCase();
          if (str.includes('phonepe')) return 'assets/upi/phonepe.svg';
          if (str.includes('google') || str.includes('gpay')) return 'assets/upi/gpay.svg';
          if (str.includes('paytm')) return 'assets/upi/paytm.svg';
          if (str.includes('bhim')) return 'assets/upi/bhim.svg';
          if (str.includes('amazon')) return 'assets/upi/amazonpay.svg';
          if (str.includes('cred')) return 'assets/upi/cred.png';
          if (str.includes('whatsapp')) return 'assets/upi/whatsapp.svg';
          return 'assets/upi/upi.svg';
        }

        function renderPromoRows(promoList) {
          if (!promoList.length) {
            return `<tr><td colspan="9" style="text-align:center; padding:32px; color:#000000; font-weight:600;">No promotional offers match your current filter or search criteria.</td></tr>`;
          }
          const now = new Date();
          return promoList.map(p => {
            const typeBadge = p.type === 'voucher'
              ? `<span class="offer-type-tag voucher">Voucher</span>`
              : p.type === 'bank'
                ? `<span class="offer-type-tag bank">Bank Card</span>`
                : `<span class="offer-type-tag upi">UPI Offer</span>`;

            const scopeBadge = p.scope === 'store'
              ? `<span class="ap-badge blue" title="Specific Merchant Store">${esc(p.storeName || 'Store')}</span>`
              : `<span class="ap-badge green" title="Storewide across all sellers">Storewide</span>`;

            const rateStr = p.discountType === 'percent'
              ? `<strong style="color:#000000;">${p.discountValue}% OFF</strong>${p.maxDiscount ? `<div style="font-size:11px; color:#1e293b; font-weight:600;">Max ₹${p.maxDiscount.toLocaleString('en-IN')}</div>` : ''}`
              : `<strong style="color:#000000;">₹${p.discountValue.toLocaleString('en-IN')} FLAT</strong>`;

            let partnerStr = p.bankPartner || p.upiProvider || `<span style="color:#64748b;">—</span>`;
            if (p.type === 'bank') {
              if (Array.isArray(p.bankRules) && p.bankRules.length > 0) {
                partnerStr = `<div style="display:flex; flex-direction:column; gap:5px; min-width:210px;">` +
                  p.bankRules.map(r => {
                    const badgeBg = r.cardType === 'debit' ? '#e0f2fe' : r.cardType === 'credit' ? '#fef3c7' : '#dcfce7';
                    const badgeColor = r.cardType === 'debit' ? '#0369a1' : r.cardType === 'credit' ? '#92400e' : '#15803d';
                    const badgeBorder = r.cardType === 'debit' ? '#bae6fd' : r.cardType === 'credit' ? '#fde68a' : '#86efac';
                    const badgeText = r.cardType === 'debit' ? 'Debit Only' : r.cardType === 'credit' ? 'Credit Only' : 'Debit & Credit';
                    const logoUrl = getBankLogoUrl(r.bank);
                    return `
                      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                          <div style="width:20px; height:20px; border-radius:4px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:1px; flex-shrink:0;">
                            <img src="${logoUrl}" alt="${esc(r.bank)}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
                          </div>
                          <span style="font-weight:700; color:#000000; font-size:12px;">${esc(r.bank)}</span>
                        </div>
                        <span style="font-size:10px; font-weight:800; background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; padding:1px 6px; border-radius:4px; white-space:nowrap;">${badgeText}</span>
                      </div>
                    `;
                  }).join('') + `</div>`;
              } else if (p.bankPartner) {
                const cardLabel = p.cardType === 'debit' ? 'Debit Cards Only' : p.cardType === 'credit' ? 'Credit Cards Only' : 'Debit & Credit Cards';
                const logoUrl = getBankLogoUrl(p.bankPartner);
                partnerStr = `
                  <div style="display:flex; align-items:flex-start; gap:8px;">
                    <div style="width:22px; height:22px; border-radius:4px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:2px; flex-shrink:0; margin-top:2px;">
                      <img src="${logoUrl}" alt="Bank" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
                    </div>
                    <div>
                      <div style="font-weight:700; color:#000000; font-size:12px;">${esc(p.bankPartner)}</div>
                      <span style="font-size:10px; font-weight:800; background:#dcfce7; color:#15803d; padding:1px 6px; border-radius:4px; border:1px solid #86efac; display:inline-block; margin-top:2px;">${cardLabel}</span>
                    </div>
                  </div>
                `;
              }
            } else if (p.type === 'upi' && p.upiProvider) {
              const providers = Array.isArray(p.upiProviders) && p.upiProviders.length > 0
                ? p.upiProviders
                : (p.upiProvider ? p.upiProvider.split(',').map(s => s.trim()).filter(Boolean) : []);
              const upiHtml = providers.map(u => {
                const logoUrl = getUpiLogoUrl(u);
                return `
                  <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px;">
                    <div style="width:18px; height:18px; border-radius:4px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:1px; flex-shrink:0;">
                      <img src="${logoUrl}" alt="${esc(u)}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
                    </div>
                    <span style="font-weight:700; color:#000000; font-size:12px;">${esc(u)}</span>
                  </div>
                `;
              }).join('');
              partnerStr = `
                <div>
                  ${upiHtml || `<div style="font-weight:700; color:#000000; font-size:12px;">${esc(p.upiProvider)}</div>`}
                  <span style="font-size:10px; font-weight:800; background:#e0f2fe; color:#0369a1; padding:1px 6px; border-radius:4px; border:1px solid #bae6fd; display:inline-block; margin-top:2px;">UPI Cashback</span>
                </div>
              `;
            }

            // Expiry & duration calculation
            const isExpired = p.validUntil && new Date(p.validUntil) < now;
            const isScheduled = p.validFrom && new Date(p.validFrom) > now;

            let durationBadge = `<span style="font-size:11.5px; color:#000000; font-weight:600;">Always Active</span>`;
            if (p.validUntil) {
              const untilDate = new Date(p.validUntil);
              const dateStr = untilDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              if (isExpired) {
                durationBadge = `
                  <div>
                    <span class="ap-badge red" style="font-weight:800; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;">Expired</span>
                    <div style="font-size:11px; color:#b91c1c; font-weight:700; margin-top:3px;">Ended: ${esc(dateStr)}</div>
                  </div>
                `;
              } else if (isScheduled) {
                durationBadge = `
                  <div>
                    <span class="ap-badge yellow" style="font-weight:800; background:#fef9c3; color:#854d0e; border:1px solid #fde047;">Scheduled</span>
                    <div style="font-size:11px; color:#000000; font-weight:600; margin-top:3px;">Starts: ${new Date(p.validFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                `;
              } else {
                const diffMs = untilDate.getTime() - now.getTime();
                const diffHours = Math.round(diffMs / (1000 * 60 * 60));
                const timeLeft = diffHours < 24 ? `${diffHours}h left` : `${Math.round(diffHours / 24)}d left`;
                durationBadge = `
                  <div>
                    <span class="ap-badge green" style="font-weight:800; background:#dcfce7; color:#15803d; border:1px solid #86efac;">Active (${timeLeft})</span>
                    <div style="font-size:11px; color:#000000; font-weight:600; margin-top:3px;">Expires: ${esc(dateStr)}</div>
                  </div>
                `;
              }
            } else if (isScheduled) {
              durationBadge = `<span class="ap-badge yellow" style="font-weight:800; background:#fef9c3; color:#854d0e;">Starts Later</span>`;
            }

            let productsBadge = '';
            if (p.applicableProducts && p.applicableProducts.length > 0) {
              productsBadge = `<div style="font-size:11px; color:#000000; font-weight:700; margin-top:4px;" title="Applies to: ${esc(p.applicableProducts.join(', '))}">Applies to: ${p.applicableProducts.slice(0, 2).map(esc).join(', ')}${p.applicableProducts.length > 2 ? ` +${p.applicableProducts.length - 2}` : ''}</div>`;
            }

            const promoId = String(p._id || p.id);
            return `
              <tr data-promo-id="${promoId}">
                <td>
                  <div style="font-family:monospace; font-weight:800; color:#000000; font-size:13.5px; letter-spacing:0.04em;">${esc(p.code)}</div>
                  <div style="margin-top:2px;">${typeBadge}</div>
                </td>
                <td>
                  <div style="font-weight:700; color:#000000; font-size:13px;">${esc(p.title)}</div>
                  <div style="font-size:11.5px; color:#334155; margin-top:2px; max-width:240px; line-height:1.35;">${esc(p.description || '')}</div>
                </td>
                <td>${scopeBadge}</td>
                <td>${rateStr}</td>
                <td><strong style="color:#000000; font-size:12.5px;">₹${(p.minOrder || 0).toLocaleString('en-IN')}</strong></td>
                <td><div style="font-size:12px; color:#000000;">${partnerStr}</div></td>
                <td>${durationBadge}${productsBadge}</td>
                <td>
                  ${isExpired ? `
                    <span class="ap-badge red" style="background:#fee2e2; color:#b91c1c; font-weight:800; border:1px solid #fca5a5;">
                      Expired
                    </span>
                  ` : `
                    <button type="button" class="ap-btn-tiny ap-promo-toggle-btn ${p.active ? 'ap-badge green' : 'ap-badge gray'}" data-id="${promoId}" data-active="${p.active}" style="cursor:pointer; border:none; font-weight:800;">
                      ${p.active ? '● Active' : '○ Paused'}
                    </button>
                  `}
                </td>
                <td style="white-space:nowrap; text-align:right;">
                  <button type="button" class="ap-btn ghost ap-edit-promo-btn" data-id="${promoId}" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>
                  <button type="button" class="ap-btn danger ap-delete-promo-btn" data-id="${promoId}" style="padding:4px 10px; font-size:12px;">Delete</button>
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
                <h2 class="ap-view-title" style="color:#000000;">
                  CMS &amp; Storefront Control
                  <span class="ap-super-badge" style="background:#ecfdf5; color:#059669; border-color:#a7f3d0;">Storefront Live</span>
                </h2>
                <p class="ap-view-sub" style="color:#000000; font-weight:600;">Manage featured hero carousels with custom images, storewide discount vouchers, bank card instant discounts, and UPI app offers.</p>
              </div>
              <div class="ap-view-actions">
                <button class="ap-btn ghost" id="ap-cms-refresh-btn">
                  <svg viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Refresh
                </button>
                <button class="ap-btn primary" id="ap-top-add-quad-btn" style="background:#2563eb; border-color:#1d4ed8; color:#ffffff !important; font-weight:800;">
                  <span>+ Add Homepage Card</span>
                </button>
                <button class="ap-btn primary" id="ap-top-add-banner-btn" style="color:#000000; font-weight:800;">
                  <span style="color:#000000; font-weight:800;">+ Add Featured Banner</span>
                </button>
                <button class="ap-btn primary" id="ap-top-add-promo-btn" style="background:#ea580c; border-color:#c2410c; color:#000000; font-weight:800;">
                  <span style="color:#000000; font-weight:800;">+ Create Offer / Voucher</span>
                </button>
              </div>
            </div>

            <!-- Global Announcement Ticker Manager -->
            <div class="ap-form-card" style="margin-bottom:24px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#000000;">Top Navigation Announcement Bar</h3>
                  <p style="font-size:12px; color:#1e293b; font-weight:600; margin:2px 0 0;">This marquee message is pinned at the top-left utility bar of the customer-facing storefront.</p>
                </div>
                <span class="ap-badge green">● Live on Production</span>
              </div>
              <div class="ap-form-group" style="margin-bottom:12px;">
                <label for="ap-cms-announcement-input" class="ap-cms-label" style="display:block; margin-bottom:6px; color:#000000; font-weight:800;">Ticker Announcement Text</label>
                <input type="text" id="ap-cms-announcement-input" class="ap-input" value="${esc(cms.announcementText || '')}" style="width:100%; font-size:13px; font-weight:700; color:#000000; padding:10px 14px;" />
              </div>
              <div style="display:flex; justify-content:flex-end;">
                <button class="ap-btn primary" id="ap-save-cms-announcement-btn" style="padding:8px 20px;">
                  Save Announcement Bar
                </button>
              </div>
            </div>

            <!-- Homepage 4-Quadrant Category Cards Manager -->
            <div class="ap-table-card" style="margin-bottom:24px;" id="ap-quad-cards-section">
              <div style="padding:16px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#000000; display:flex; align-items:center; gap:8px;">
                    Homepage 4-Quadrant Category Cards
                    <span class="ap-badge blue" id="ap-quad-count-badge" style="font-weight:700;">${quadCards.length} Cards</span>
                  </h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#1e293b; font-weight:600;">Full control over all 4-item category cards on the customer homepage. Change titles, swap images, edit deal badges, and add/remove cards.</p>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <button type="button" class="ap-btn ghost" id="ap-cms-reset-quad-btn" style="padding:6px 14px; font-size:12px; font-weight:700;" title="Restore original factory preset cards">
                    ↺ Reset to Defaults
                  </button>
                  <button type="button" class="ap-btn primary" id="ap-cms-add-quad-btn" style="padding:6px 16px; font-size:12px; font-weight:800; background:#2563eb; color:#ffffff !important;">
                    + Add New Homepage Card
                  </button>
                </div>
              </div>

              <!-- Filter Toolbar with Search & Row Filters -->
              <div class="ap-cms-toolbar" style="padding:12px 20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div class="ap-cms-pills" id="ap-quad-row-pills">
                  <button type="button" class="ap-cms-pill active" data-row="all">All Rows (${quadCards.length})</button>
                  <button type="button" class="ap-cms-pill" data-row="1">Row 1</button>
                  <button type="button" class="ap-cms-pill" data-row="2">Row 2</button>
                  <button type="button" class="ap-cms-pill" data-row="3">Row 3</button>
                  <button type="button" class="ap-cms-pill" data-row="4">Row 4</button>
                  <button type="button" class="ap-cms-pill" data-row="5">Row 5</button>
                  <button type="button" class="ap-cms-pill" data-row="6">Row 6</button>
                  <button type="button" class="ap-cms-pill" data-row="7">Row 7</button>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <input type="text" id="ap-quad-search-input" placeholder="Search cards by title or item..." style="width:240px; padding:6px 12px; font-size:12px; border:1px solid #cbd5e1; border-radius:6px; outline:none;" />
                </div>
              </div>

              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th style="color:#000000; font-weight:800;">4 Tile Preview</th>
                      <th style="color:#000000; font-weight:800;">Card Title &amp; Items Summary</th>
                      <th style="color:#000000; font-weight:800;">Row &amp; Order</th>
                      <th style="color:#000000; font-weight:800;">Destination &amp; Footer</th>
                      <th style="color:#000000; font-weight:800;">Status</th>
                      <th style="text-align:right; color:#000000; font-weight:800;">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="ap-quad-table-body">
                    ${renderQuadCardRows(getFilteredQuadCards())}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Top Hero Promo Cards & Quick Browse Strip Grid -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px;">
              <!-- Top Hero Cards (4 Cards) -->
              <div class="ap-table-card">
                <div style="padding:14px 18px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <h3 style="margin:0; font-size:14px; font-weight:800; color:#000000;">Top Hero Promo Cards</h3>
                    <p style="margin:2px 0 0; font-size:11.5px; color:#1e293b; font-weight:600;">The 4 showcase cards below the main banner slider.</p>
                  </div>
                  <button type="button" class="ap-btn primary" id="ap-add-hero-promo-btn" style="padding:5px 12px; font-size:11.5px; font-weight:800;">+ Add</button>
                </div>
                <div class="ap-table-wrap">
                  <table class="ap-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Details &amp; Badge</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                      </tr>
                    </thead>
                    <tbody id="ap-hero-promo-table-body">
                      ${renderHeroPromoRows(heroPromoCards)}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Quick Browse Items (7 Items) -->
              <div class="ap-table-card">
                <div style="padding:14px 18px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <h3 style="margin:0; font-size:14px; font-weight:800; color:#000000;">Quick-Browse Strip Items</h3>
                    <p style="margin:2px 0 0; font-size:11.5px; color:#1e293b; font-weight:600;">The mini horizontal browse items above the quad grid.</p>
                  </div>
                  <button type="button" class="ap-btn primary" id="ap-add-quick-browse-btn" style="padding:5px 12px; font-size:11.5px; font-weight:800;">+ Add</button>
                </div>
                <div class="ap-table-wrap">
                  <table class="ap-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title &amp; Badge</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                      </tr>
                    </thead>
                    <tbody id="ap-quick-browse-table-body">
                      ${renderQuickBrowseRows(quickBrowseItems)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Active Featured Banners Table Card -->
            <div class="ap-table-card" style="margin-bottom:24px;">
              <div style="padding:16px 20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#000000;">Active Featured Banners</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#1e293b; font-weight:600;">Hero slider images, headlines, and category callouts shown on the homepage.</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="ap-badge gray" id="ap-banner-count-badge" style="font-weight:700; color:#000000;">${banners.length} Banners</span>
                  <button class="ap-btn primary" id="ap-cms-add-banner-btn" style="padding:6px 14px; font-size:12px; color:#ffffff !important; font-weight:800;">
                    + Add Featured Banner
                  </button>
                </div>
              </div>
              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th style="color:#000000; font-weight:800;">Image Preview</th>
                      <th style="color:#000000; font-weight:800;">Banner Headline &amp; Subtitle</th>
                      <th style="color:#000000; font-weight:800;">Tag Badge</th>
                      <th style="color:#000000; font-weight:800;">Destination Link</th>
                      <th style="color:#000000; font-weight:800;">Order</th>
                      <th style="color:#000000; font-weight:800;">Status</th>
                      <th style="text-align:right; color:#000000; font-weight:800;">Actions</th>
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
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#000000;">Promotional Offers, Bank Cards &amp; Vouchers</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:#1e293b; font-weight:600;">Manage storewide vouchers, bank instant discounts, UPI cashback, and store-specific campaigns.</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="ap-badge green" id="ap-promo-count-badge" style="font-weight:700;">${promotions.length} Offers</span>
                  <button class="ap-btn primary" id="ap-cms-add-promo-btn" style="background:#ea580c; border-color:#c2410c; padding:6px 14px; font-size:12px; color:#000000; font-weight:800;">
                    + Create Offer / Voucher
                  </button>
                </div>
              </div>

              <!-- Filter Toolbar with Dedicated Searchbar for Stores -->
              <div class="ap-cms-toolbar">
                <div class="ap-cms-pills">
                  <button type="button" class="ap-cms-pill active" data-filter="all">All Offers (${promotions.length})</button>
                  <button type="button" class="ap-cms-pill" data-filter="voucher">Vouchers (${voucherCount})</button>
                  <button type="button" class="ap-cms-pill" data-filter="bank">Bank Cards (${bankCount})</button>
                  <button type="button" class="ap-cms-pill" data-filter="upi">UPI Offers (${upiCount})</button>
                  <button type="button" class="ap-cms-pill" data-filter="store">Store-Specific (${storeSpecificCount})</button>
                </div>

                <div class="ap-cms-searches">
                  <!-- DEDICATED SEARCHBAR FOR STORES -->
                  <div class="ap-cms-search-field">
                    <label for="ap-cms-store-search-input" class="ap-cms-label" style="color:#000000; font-weight:800;">Search by Store / Merchant</label>
                    <div class="ap-cms-input-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <input type="text" id="ap-cms-store-search-input" style="color:#000000; font-weight:600;" />
                      <button type="button" id="ap-cms-clear-store-search" class="ap-cms-clear-btn" style="display:none;" title="Clear store search">✕</button>
                    </div>
                  </div>

                  <!-- Offer Code & Title Search -->
                  <div class="ap-cms-search-field">
                    <label for="ap-cms-offer-search-input" class="ap-cms-label" style="color:#000000; font-weight:800;">Search Voucher / Code</label>
                    <div class="ap-cms-input-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input type="text" id="ap-cms-offer-search-input" style="color:#000000; font-weight:600;" />
                      <button type="button" id="ap-cms-clear-offer-search" class="ap-cms-clear-btn" style="display:none;" title="Clear search">✕</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="ap-table-wrap">
                <table class="ap-table">
                  <thead>
                    <tr>
                      <th style="color:#000000; font-weight:800;">Voucher Code &amp; Type</th>
                      <th style="color:#000000; font-weight:800;">Offer Title &amp; Terms</th>
                      <th style="color:#000000; font-weight:800;">Scope / Target Store</th>
                      <th style="color:#000000; font-weight:800;">Discount Rate</th>
                      <th style="color:#000000; font-weight:800;">Min Bag Value</th>
                      <th style="color:#000000; font-weight:800;">Bank / UPI Partner</th>
                      <th style="color:#000000; font-weight:800;">Duration / Expiry</th>
                      <th style="color:#000000; font-weight:800;">Status</th>
                      <th style="text-align:right; color:#000000; font-weight:800;">Actions</th>
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
        const refreshBtn = document.getElementById('ap-cms-refresh-btn');
        refreshBtn?.addEventListener('click', async () => {
          if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = `<svg style="width:14px;height:14px;animation:apSpin 0.8s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Refreshing...`;
          }
          await load();
          showToast('Storefront CMS & promotional data refreshed successfully!', 'success');
        });

        // Wire Announcement Bar Update
        document.getElementById('ap-save-cms-announcement-btn')?.addEventListener('click', async () => {
          const announcementInput = document.getElementById('ap-cms-announcement-input');
          const announcementText = announcementInput?.value ?? '';
          const btn = document.getElementById('ap-save-cms-announcement-btn');
          if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
          try {
            await adminFetch('/cms', {
              method: 'PUT',
              body: JSON.stringify({ announcementText, announcementActive: true }),
            });
            showToast('Storefront announcement bar updated successfully!', 'success');
            // Update live ticker across storefront
            document.querySelectorAll('#utility-ticker .ticker-slide, .utility-ticker-text, #store-announcement-bar, .announcement-bar-text').forEach(el => {
              el.textContent = announcementText;
            });
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
          const countBadge = document.getElementById('ap-promo-count-badge');
          const filtered = getFilteredPromotions();
          if (tbody) {
            tbody.innerHTML = renderPromoRows(filtered);
            attachPromoRowHandlers();
          }
          if (countBadge) {
            countBadge.textContent = `${filtered.length} Offer${filtered.length === 1 ? '' : 's'}${filtered.length !== promotions.length ? ` (of ${promotions.length})` : ''}`;
          }
        }

        function updateQuadCardsTable() {
          const tbody = document.getElementById('ap-quad-table-body');
          const countBadge = document.getElementById('ap-quad-count-badge');
          const filtered = getFilteredQuadCards();
          if (tbody) {
            tbody.innerHTML = renderQuadCardRows(filtered);
            attachQuadCardRowHandlers();
          }
          if (countBadge) {
            countBadge.textContent = `${filtered.length} Card${filtered.length === 1 ? '' : 's'}${filtered.length !== quadCards.length ? ` (of ${quadCards.length})` : ''}`;
          }
        }

        // Wire Homepage Quad Card Filters & Search
        document.querySelectorAll('#ap-quad-row-pills .ap-cms-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            document.querySelectorAll('#ap-quad-row-pills .ap-cms-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            quadRowFilter = pill.dataset.row;
            updateQuadCardsTable();
          });
        });

        const quadSearchInput = document.getElementById('ap-quad-search-input');
        quadSearchInput?.addEventListener('input', () => {
          quadSearchQuery = quadSearchInput.value.trim();
          updateQuadCardsTable();
        });

        document.getElementById('ap-cms-reset-quad-btn')?.addEventListener('click', async () => {
          if (!confirm('Are you sure you want to reset all homepage category cards to factory presets? Any custom changes will be restored.')) return;
          try {
            await adminFetch('/cms/home-cards/reset-defaults', { method: 'POST' });
            showToast('All homepage cards restored to defaults!', 'success');
            window._fetchStorefrontCMS?.();
            load();
          } catch (e) {
            showToast(e.message, 'error');
          }
        });

        document.getElementById('ap-top-add-quad-btn')?.addEventListener('click', (e) => {
          e.preventDefault();
          showQuadCardModal(null);
        });
        document.getElementById('ap-cms-add-quad-btn')?.addEventListener('click', (e) => {
          e.preventDefault();
          showQuadCardModal(null);
        });

        document.getElementById('ap-add-hero-promo-btn')?.addEventListener('click', (e) => {
          e.preventDefault();
          showHeroPromoModal(null);
        });

        document.getElementById('ap-add-quick-browse-btn')?.addEventListener('click', (e) => {
          e.preventDefault();
          showQuickBrowseModal(null);
        });

        function attachQuadCardRowHandlers() {
          body.querySelectorAll('.ap-quad-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const curActive = btn.dataset.active === 'true';
              btn.disabled = true;
              try {
                await adminFetch(`/cms/quad-cards/${id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ active: !curActive }),
                });
                showToast(`Card ${!curActive ? 'activated' : 'hidden'} successfully!`, 'success');
                window._fetchStorefrontCMS?.();
                load();
              } catch (err) {
                showToast(err.message, 'error');
                btn.disabled = false;
              }
            });
          });

          body.querySelectorAll('.ap-edit-quad-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const card = quadCards.find(c => String(c._id || c.id) === String(id));
              if (card) showQuadCardModal(card);
              else showToast('Card not found.', 'error');
            });
          });

          body.querySelectorAll('.ap-delete-quad-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const card = quadCards.find(c => String(c._id || c.id) === String(id));
              const title = card?.title || 'this card';

              const confirmBackdrop = document.createElement('div');
              confirmBackdrop.className = 'ap-modal-backdrop';
              confirmBackdrop.style.zIndex = '100060';
              confirmBackdrop.innerHTML = `
                <div class="ap-modal-dialog" style="max-width:440px; text-align:center; padding:24px 20px; background:#ffffff; border-radius:14px; box-shadow:0 25px 60px rgba(15,23,42,0.25);">
                  <div style="width:50px; height:50px; border-radius:50%; background:#fee2e2; color:#ef4444; display:flex; align-items:center; justify-content:center; margin:0 auto 14px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </div>
                  <h4 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 8px;">Delete Homepage Card?</h4>
                  <p style="font-size:12.5px; color:#64748b; margin:0 0 20px; line-height:1.45;">
                    Are you sure you want to permanently remove <strong>"${esc(title)}"</strong>? It will be removed from the customer homepage immediately.
                  </p>
                  <div style="display:flex; justify-content:center; gap:10px;">
                    <button type="button" class="ap-btn ghost" id="ap-del-card-cancel" style="padding:8px 18px; font-size:12.5px; font-weight:700;">Cancel</button>
                    <button type="button" class="ap-btn danger" id="ap-del-card-confirm" style="padding:8px 18px; font-size:12.5px; font-weight:800; background:#dc2626; color:#ffffff !important;">Delete Card</button>
                  </div>
                </div>
              `;
              const mount = document.getElementById('admin-panel-overlay') || document.body;
              mount.appendChild(confirmBackdrop);

              const closeConfirm = () => confirmBackdrop.remove();
              confirmBackdrop.querySelector('#ap-del-card-cancel')?.addEventListener('click', closeConfirm);
              confirmBackdrop.addEventListener('click', ev => { if (ev.target === confirmBackdrop) closeConfirm(); });

              confirmBackdrop.querySelector('#ap-del-card-confirm')?.addEventListener('click', async () => {
                const delBtn = confirmBackdrop.querySelector('#ap-del-card-confirm');
                delBtn.disabled = true;
                delBtn.textContent = 'Deleting...';
                try {
                  await adminFetch(`/cms/quad-cards/${id}`, { method: 'DELETE' });
                  showToast('Homepage card deleted successfully!', 'success');
                  window._fetchStorefrontCMS?.();
                  closeConfirm();
                  load();
                } catch (err) {
                  showToast(err.message, 'error');
                  delBtn.disabled = false;
                  delBtn.textContent = 'Delete Card';
                }
              });
            });
          });
        }

        function showQuadCardModal(existingCard) {
          const isEdit = Boolean(existingCard);
          const rawItems = Array.isArray(existingCard?.items) ? existingCard.items : [];
          const items = [0, 1, 2, 3].map(i => rawItems[i] || { image: '', title: '', badge: '', subText: '', link: '#deals' });

          const backdrop = document.createElement('div');
          backdrop.className = 'ap-modal-backdrop';
          backdrop.style.zIndex = '100050';
          backdrop.innerHTML = `
            <div class="ap-modal-dialog" style="max-width:780px; width:95%; max-height:90vh; overflow-y:auto; background:#ffffff; border-radius:14px; box-shadow:0 25px 60px rgba(15,23,42,0.25); padding:24px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:14px; margin-bottom:18px;">
                <div>
                  <h3 style="margin:0; font-size:17px; font-weight:800; color:#0f172a;">${isEdit ? 'Edit Homepage Category Card' : 'Add New Homepage Category Card'}</h3>
                  <p style="margin:3px 0 0; font-size:12px; color:#64748b;">Configure the 4 tile products, image URLs, discount tags, and destination link.</p>
                </div>
                <button type="button" class="ap-btn ghost" id="ap-quad-modal-close" style="font-size:18px; line-height:1; padding:4px 8px;">✕</button>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:16px;">
                <div style="grid-column: 1 / -1;">
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; color:#0f172a; margin-bottom:4px;">Card Title <span style="color:#ef4444;">*</span></label>
                  <input type="text" id="quad-m-title" class="ap-input" value="${esc(existingCard?.title || '')}" placeholder="e.g. Deals for you, Starting ₹149 | Dry fruits & seeds" style="width:100%; font-weight:700; font-size:13px;" />
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px;">Row Number</label>
                  <select id="quad-m-row" class="ap-input" style="width:100%;">
                    ${[1, 2, 3, 4, 5, 6, 7, 8].map(r => `<option value="${r}" ${existingCard?.row === r ? 'selected' : ''}>Row ${r}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px;">Display Order Index</label>
                  <input type="number" id="quad-m-order" class="ap-input" value="${existingCard?.order ?? quadCards.length}" style="width:100%;" />
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px;">Category / Target Link</label>
                  <input type="text" id="quad-m-link" class="ap-input" value="${esc(existingCard?.link || '#deals')}" placeholder="#deals or #category/Electronics" style="width:100%;" />
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:11.5px; font-weight:700; color:#334155; margin-bottom:4px;">Footer Link Text</label>
                  <input type="text" id="quad-m-footer-text" class="ap-input" value="${esc(existingCard?.footerText || 'See more')}" placeholder="e.g. See all deals" style="width:100%;" />
                </div>
              </div>

              <!-- The 4 Tile Items -->
              <h4 style="font-size:13.5px; font-weight:800; color:#0f172a; margin:16px 0 10px; border-top:1px solid #f1f5f9; padding-top:14px;">
                4 Quadrant Product Tiles (Left to Right, Top to Bottom)
              </h4>

              <div id="quad-items-editor-container">
                ${items.map((it, idx) => `
                  <div class="quad-item-edit-card" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                      <span style="font-size:12px; font-weight:800; color:#1e293b;">Quadrant Tile ${idx + 1}</span>
                      <span style="font-size:10.5px; color:#64748b; font-weight:600;">Position: ${idx === 0 ? 'Top Left' : idx === 1 ? 'Top Right' : idx === 2 ? 'Bottom Left' : 'Bottom Right'}</span>
                    </div>
                    <div style="display:grid; grid-template-columns: 70px 1fr; gap:12px; align-items:start;">
                      <div style="width:70px; height:70px; border-radius:8px; border:1px solid #cbd5e1; overflow:hidden; background:#ffffff; display:flex; align-items:center; justify-content:center;">
                        <img id="item-img-preview-${idx}" src="${esc(it.image)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';" />
                      </div>
                      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                        <div style="grid-column: 1 / -1;">
                          <label class="ap-cms-label" style="font-size:11px; font-weight:700;">Image URL <span style="color:#ef4444;">*</span></label>
                          <input type="text" id="quad-item-img-${idx}" class="ap-input quad-item-img-field" data-index="${idx}" value="${esc(it.image)}" placeholder="https://images.unsplash.com/..." style="width:100%; font-size:11.5px; padding:5px 9px;" />
                        </div>
                        <div>
                          <label class="ap-cms-label" style="font-size:11px; font-weight:700;">Item Title / Name</label>
                          <input type="text" id="quad-item-title-${idx}" class="ap-input" value="${esc(it.title)}" placeholder="e.g. Smartphones" style="width:100%; font-size:11.5px; padding:5px 9px;" />
                        </div>
                        <div>
                          <label class="ap-cms-label" style="font-size:11px; font-weight:700;">Deal Badge</label>
                          <input type="text" id="quad-item-badge-${idx}" class="ap-input" value="${esc(it.badge)}" placeholder="e.g. 50% off or Deal" style="width:100%; font-size:11.5px; padding:5px 9px;" />
                        </div>
                        <div>
                          <label class="ap-cms-label" style="font-size:11px; font-weight:700;">Sub-Text Badge (Optional)</label>
                          <input type="text" id="quad-item-subtext-${idx}" class="ap-input" value="${esc(it.subText)}" placeholder="e.g. Limited deal" style="width:100%; font-size:11.5px; padding:5px 9px;" />
                        </div>
                        <div>
                          <label class="ap-cms-label" style="font-size:11px; font-weight:700;">Item Click Link</label>
                          <input type="text" id="quad-item-link-${idx}" class="ap-input" value="${esc(it.link || '#deals')}" placeholder="#deals" style="width:100%; font-size:11.5px; padding:5px 9px;" />
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Active status -->
              <div style="display:flex; align-items:center; gap:8px; margin:14px 0 18px; padding:10px 14px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                <input type="checkbox" id="quad-m-active" ${existingCard?.active !== false ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
                <label for="quad-m-active" style="font-size:12.5px; font-weight:700; color:#0f172a; cursor:pointer;">
                  Visible &amp; Active on Customer Homepage
                </label>
              </div>

              <!-- Modal Buttons -->
              <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button type="button" class="ap-btn ghost" id="ap-quad-modal-cancel">Cancel</button>
                <button type="button" class="ap-btn primary" id="ap-quad-modal-save" style="padding:8px 24px; background:#2563eb; font-weight:800; color:#ffffff !important;">
                  ${isEdit ? 'Save Changes' : 'Create Homepage Card'}
                </button>
              </div>
            </div>
          `;

          const mount = document.getElementById('admin-panel-overlay') || document.body;
          mount.appendChild(backdrop);

          const closeModal = () => backdrop.remove();
          backdrop.querySelector('#ap-quad-modal-close')?.addEventListener('click', closeModal);
          backdrop.querySelector('#ap-quad-modal-cancel')?.addEventListener('click', closeModal);
          backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

          backdrop.querySelectorAll('.quad-item-img-field').forEach(input => {
            input.addEventListener('input', () => {
              const idx = input.dataset.index;
              const preview = backdrop.querySelector(`#item-img-preview-${idx}`);
              if (preview && input.value.trim()) {
                preview.src = input.value.trim();
              }
            });
          });

          backdrop.querySelector('#ap-quad-modal-save')?.addEventListener('click', async () => {
            const title = backdrop.querySelector('#quad-m-title')?.value.trim();
            if (!title) return showToast('Please enter a card title.', 'error');

            const row = Number(backdrop.querySelector('#quad-m-row')?.value) || 1;
            const order = Number(backdrop.querySelector('#quad-m-order')?.value) || 0;
            const link = backdrop.querySelector('#quad-m-link')?.value.trim() || '#deals';
            const footerText = backdrop.querySelector('#quad-m-footer-text')?.value.trim() || 'See more';
            const footerLink = link;
            const active = backdrop.querySelector('#quad-m-active')?.checked !== false;

            const itemsPayload = [0, 1, 2, 3].map(i => ({
              image: backdrop.querySelector(`#quad-item-img-${i}`)?.value.trim() || '',
              title: backdrop.querySelector(`#quad-item-title-${i}`)?.value.trim() || '',
              badge: backdrop.querySelector(`#quad-item-badge-${i}`)?.value.trim() || '',
              subText: backdrop.querySelector(`#quad-item-subtext-${i}`)?.value.trim() || '',
              link: backdrop.querySelector(`#quad-item-link-${i}`)?.value.trim() || '#deals',
            }));

            const saveBtn = backdrop.querySelector('#ap-quad-modal-save');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            try {
              if (isEdit) {
                await adminFetch(`/cms/quad-cards/${existingCard._id || existingCard.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ title, row, order, link, footerText, footerLink, active, items: itemsPayload }),
                });
                showToast('Homepage card updated successfully!', 'success');
              } else {
                await adminFetch('/cms/quad-cards', {
                  method: 'POST',
                  body: JSON.stringify({ title, row, order, link, footerText, footerLink, active, items: itemsPayload }),
                });
                showToast('New homepage card created successfully!', 'success');
              }
              window._fetchStorefrontCMS?.();
              closeModal();
              load();
            } catch (err) {
              showToast(err.message, 'error');
              saveBtn.disabled = false;
              saveBtn.textContent = isEdit ? 'Save Changes' : 'Create Homepage Card';
            }
          });
        }

        function attachHeroPromoRowHandlers() {
          body.querySelectorAll('.ap-hero-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const curActive = btn.dataset.active === 'true';
              btn.disabled = true;
              try {
                await adminFetch(`/cms/hero-promo-cards/${id}`, { method: 'PUT', body: JSON.stringify({ active: !curActive }) });
                showToast(`Promo card ${!curActive ? 'activated' : 'paused'}!`, 'success');
                window._fetchStorefrontCMS?.();
                load();
              } catch (err) {
                showToast(err.message, 'error');
                btn.disabled = false;
              }
            });
          });

          body.querySelectorAll('.ap-edit-hero-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const card = heroPromoCards.find(c => String(c._id || c.id) === String(id));
              if (card) showHeroPromoModal(card);
            });
          });

          body.querySelectorAll('.ap-del-hero-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              if (!confirm('Delete this top hero promo card?')) return;
              try {
                await adminFetch(`/cms/hero-promo-cards/${btn.dataset.id}`, { method: 'DELETE' });
                showToast('Top promo card deleted!', 'success');
                window._fetchStorefrontCMS?.();
                load();
              } catch (err) {
                showToast(err.message, 'error');
              }
            });
          });
        }

        function showHeroPromoModal(existingCard) {
          const isEdit = Boolean(existingCard);
          const backdrop = document.createElement('div');
          backdrop.className = 'ap-modal-backdrop';
          backdrop.style.zIndex = '100050';
          backdrop.innerHTML = `
            <div class="ap-modal-dialog" style="max-width:520px; background:#ffffff; border-radius:14px; padding:22px; box-shadow:0 25px 60px rgba(15,23,42,0.25);">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                <h3 style="margin:0; font-size:16px; font-weight:800; color:#0f172a;">${isEdit ? 'Edit Top Promo Card' : 'Add Top Promo Card'}</h3>
                <button type="button" class="ap-btn ghost" id="ap-hero-m-close" style="font-size:18px; padding:2px 8px;">✕</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:12px;">
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Image URL <span style="color:#ef4444;">*</span></label>
                  <input type="text" id="hero-m-img" class="ap-input" value="${esc(existingCard?.image || '')}" placeholder="https://images.unsplash.com/..." style="width:100%;" />
                  <div style="margin-top:6px; width:70px; height:70px; border-radius:6px; border:1px solid #cbd5e1; overflow:hidden;">
                    <img id="hero-m-img-preview" src="${esc(existingCard?.image || '')}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';" />
                  </div>
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Badge Offer Headline</label>
                  <input type="text" id="hero-m-badge" class="ap-input" value="${esc(existingCard?.badge || '')}" placeholder="e.g. Min. 50% off" style="width:100%;" />
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Subtitle / Description</label>
                  <input type="text" id="hero-m-sub" class="ap-input" value="${esc(existingCard?.sub || '')}" placeholder="e.g. Fresh finds" style="width:100%;" />
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Brand Name (Optional)</label>
                  <input type="text" id="hero-m-brand" class="ap-input" value="${esc(existingCard?.brand || '')}" placeholder="e.g. SYMBOL PREMIUM" style="width:100%;" />
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Bottom Cashback Pill Text</label>
                  <input type="text" id="hero-m-pill" class="ap-input" value="${esc(existingCard?.pill || 'Unlimited 5% cashback*')}" style="width:100%;" />
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Destination Link</label>
                  <input type="text" id="hero-m-link" class="ap-input" value="${esc(existingCard?.link || '#deals')}" placeholder="#fashion-deals" style="width:100%;" />
                </div>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
                <button type="button" class="ap-btn ghost" id="ap-hero-m-cancel">Cancel</button>
                <button type="button" class="ap-btn primary" id="ap-hero-m-save" style="padding:8px 20px; font-weight:800; color:#ffffff !important;">Save Card</button>
              </div>
            </div>
          `;
          const mount = document.getElementById('admin-panel-overlay') || document.body;
          mount.appendChild(backdrop);
          const closeModal = () => backdrop.remove();
          backdrop.querySelector('#ap-hero-m-close')?.addEventListener('click', closeModal);
          backdrop.querySelector('#ap-hero-m-cancel')?.addEventListener('click', closeModal);
          backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

          const imgInput = backdrop.querySelector('#hero-m-img');
          imgInput?.addEventListener('input', () => {
            const prev = backdrop.querySelector('#hero-m-img-preview');
            if (prev && imgInput.value.trim()) prev.src = imgInput.value.trim();
          });

          backdrop.querySelector('#ap-hero-m-save')?.addEventListener('click', async () => {
            const image = imgInput?.value.trim();
            if (!image) return showToast('Please enter an image URL.', 'error');
            const badge = backdrop.querySelector('#hero-m-badge')?.value.trim() || '';
            const sub = backdrop.querySelector('#hero-m-sub')?.value.trim() || '';
            const brand = backdrop.querySelector('#hero-m-brand')?.value.trim() || '';
            const pill = backdrop.querySelector('#hero-m-pill')?.value.trim() || '';
            const link = backdrop.querySelector('#hero-m-link')?.value.trim() || '#deals';

            try {
              if (isEdit) {
                await adminFetch(`/cms/hero-promo-cards/${existingCard._id || existingCard.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ image, badge, sub, brand, pill, link }),
                });
                showToast('Top promo card updated!', 'success');
              } else {
                await adminFetch('/cms/hero-promo-cards', {
                  method: 'POST',
                  body: JSON.stringify({ image, badge, sub, brand, pill, link }),
                });
                showToast('Top promo card created!', 'success');
              }
              window._fetchStorefrontCMS?.();
              closeModal();
              load();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }

        function attachQuickBrowseRowHandlers() {
          body.querySelectorAll('.ap-quick-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const curActive = btn.dataset.active === 'true';
              btn.disabled = true;
              try {
                await adminFetch(`/cms/quick-browse/${id}`, { method: 'PUT', body: JSON.stringify({ active: !curActive }) });
                showToast(`Quick browse item ${!curActive ? 'activated' : 'paused'}!`, 'success');
                window._fetchStorefrontCMS?.();
                load();
              } catch (err) {
                showToast(err.message, 'error');
                btn.disabled = false;
              }
            });
          });

          body.querySelectorAll('.ap-edit-quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const item = quickBrowseItems.find(c => String(c._id || c.id) === String(id));
              if (item) showQuickBrowseModal(item);
            });
          });

          body.querySelectorAll('.ap-del-quick-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              if (!confirm('Delete this quick browse item?')) return;
              try {
                await adminFetch(`/cms/quick-browse/${btn.dataset.id}`, { method: 'DELETE' });
                showToast('Quick browse item deleted!', 'success');
                window._fetchStorefrontCMS?.();
                load();
              } catch (err) {
                showToast(err.message, 'error');
              }
            });
          });
        }

        function showQuickBrowseModal(existingItem) {
          const isEdit = Boolean(existingItem);
          const backdrop = document.createElement('div');
          backdrop.className = 'ap-modal-backdrop';
          backdrop.style.zIndex = '100050';
          backdrop.innerHTML = `
            <div class="ap-modal-dialog" style="max-width:480px; background:#ffffff; border-radius:14px; padding:22px; box-shadow:0 25px 60px rgba(15,23,42,0.25);">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                <h3 style="margin:0; font-size:16px; font-weight:800; color:#0f172a;">${isEdit ? 'Edit Quick Browse Item' : 'Add Quick Browse Item'}</h3>
                <button type="button" class="ap-btn ghost" id="ap-quick-m-close" style="font-size:18px; padding:2px 8px;">✕</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:12px;">
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Image URL <span style="color:#ef4444;">*</span></label>
                  <input type="text" id="quick-m-img" class="ap-input" value="${esc(existingItem?.image || '')}" placeholder="https://images.unsplash.com/..." style="width:100%;" />
                  <div style="margin-top:6px; width:60px; height:60px; border-radius:6px; border:1px solid #cbd5e1; overflow:hidden;">
                    <img id="quick-m-img-preview" src="${esc(existingItem?.image || '')}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';" />
                  </div>
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Title / Category Label</label>
                  <input type="text" id="quick-m-title" class="ap-input" value="${esc(existingItem?.title || '')}" placeholder="e.g. For you, Keep shopping for" style="width:100%;" />
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Badge (Optional)</label>
                  <input type="text" id="quick-m-badge" class="ap-input" value="${esc(existingItem?.badge || '')}" placeholder="e.g. 42% off" style="width:100%;" />
                </div>
                <div>
                  <label class="ap-cms-label" style="display:block; font-size:12px; font-weight:800; margin-bottom:4px;">Target Link</label>
                  <input type="text" id="quick-m-link" class="ap-input" value="${esc(existingItem?.link || '#deals')}" placeholder="#saved" style="width:100%;" />
                </div>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
                <button type="button" class="ap-btn ghost" id="ap-quick-m-cancel">Cancel</button>
                <button type="button" class="ap-btn primary" id="ap-quick-m-save" style="padding:8px 20px; font-weight:800; color:#ffffff !important;">Save Item</button>
              </div>
            </div>
          `;
          const mount = document.getElementById('admin-panel-overlay') || document.body;
          mount.appendChild(backdrop);
          const closeModal = () => backdrop.remove();
          backdrop.querySelector('#ap-quick-m-close')?.addEventListener('click', closeModal);
          backdrop.querySelector('#ap-quick-m-cancel')?.addEventListener('click', closeModal);
          backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

          const imgInput = backdrop.querySelector('#quick-m-img');
          imgInput?.addEventListener('input', () => {
            const prev = backdrop.querySelector('#quick-m-img-preview');
            if (prev && imgInput.value.trim()) prev.src = imgInput.value.trim();
          });

          backdrop.querySelector('#ap-quick-m-save')?.addEventListener('click', async () => {
            const image = imgInput?.value.trim();
            if (!image) return showToast('Please enter an image URL.', 'error');
            const title = backdrop.querySelector('#quick-m-title')?.value.trim() || '';
            const badge = backdrop.querySelector('#quick-m-badge')?.value.trim() || '';
            const link = backdrop.querySelector('#quick-m-link')?.value.trim() || '#deals';

            try {
              if (isEdit) {
                await adminFetch(`/cms/quick-browse/${existingItem._id || existingItem.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ image, title, badge, link }),
                });
                showToast('Quick browse item updated!', 'success');
              } else {
                await adminFetch('/cms/quick-browse', {
                  method: 'POST',
                  body: JSON.stringify({ image, title, badge, link }),
                });
                showToast('Quick browse item added!', 'success');
              }
              window._fetchStorefrontCMS?.();
              closeModal();
              load();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }

        // Attach initial row handlers for Homepage cards
        attachQuadCardRowHandlers();
        attachHeroPromoRowHandlers();
        attachQuickBrowseRowHandlers();

        // Wire Add Banner Buttons
        document.getElementById('ap-top-add-banner-btn')?.addEventListener('click', (e) => {
          e.preventDefault();
          showBannerModal(null);
        });
        document.getElementById('ap-cms-add-banner-btn')?.addEventListener('click', (e) => {
          e.preventDefault();
          showBannerModal(null);
        });

        // Banner Row Handlers
        function attachBannerRowHandlers() {
          // Toggle Active/Paused status
          body.querySelectorAll('.ap-banner-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const currentActive = btn.dataset.active === 'true';
              btn.disabled = true;
              btn.style.opacity = '0.6';
              try {
                await adminFetch(`/cms/banners/${id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ active: !currentActive }),
                });
                showToast(`Banner ${!currentActive ? 'activated' : 'paused'} successfully!`, 'success');
                load();
              } catch (e) {
                showToast(e.message, 'error');
                btn.disabled = false;
                btn.style.opacity = '1';
              }
            });
          });

          // Edit Banner
          body.querySelectorAll('.ap-edit-banner-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const banner = banners.find(b => String(b._id || b.id) === String(btn.dataset.id));
              if (banner) {
                showBannerModal(banner);
              } else {
                showToast('Banner record not found.', 'error');
              }
            });
          });

          // Delete Banner with In-Overlay Dialog
          body.querySelectorAll('.ap-delete-banner-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const banner = banners.find(b => String(b._id || b.id) === String(id));
              const bannerTitle = banner?.title || 'this featured banner';

              const confirmBackdrop = document.createElement('div');
              confirmBackdrop.className = 'ap-modal-backdrop';
              confirmBackdrop.style.zIndex = '100060';
              confirmBackdrop.innerHTML = `
                <div class="ap-modal-dialog" style="max-width:440px; text-align:center; padding:24px 20px; background:#ffffff; border-radius:14px; box-shadow:0 25px 60px rgba(15,23,42,0.25);">
                  <div style="width:50px; height:50px; border-radius:50%; background:#fee2e2; color:#ef4444; display:flex; align-items:center; justify-content:center; margin:0 auto 14px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </div>
                  <h4 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 8px;">Delete Featured Banner?</h4>
                  <p style="font-size:12.5px; color:#64748b; margin:0 0 20px; line-height:1.45;">
                    Are you sure you want to permanently remove <strong>"${esc(bannerTitle)}"</strong>? This banner will be removed from the homepage hero slider immediately.
                  </p>
                  <div style="display:flex; justify-content:center; gap:10px;">
                    <button type="button" class="ap-btn ghost" id="ap-del-cancel-btn" style="padding:8px 18px; font-size:12.5px; font-weight:700;">Cancel</button>
                    <button type="button" class="ap-btn danger" id="ap-del-confirm-btn" style="padding:8px 18px; font-size:12.5px; font-weight:800; background:#dc2626; color:#ffffff !important;">Delete Banner</button>
                  </div>
                </div>
              `;
              const mount = document.getElementById('admin-panel-overlay') || document.body;
              mount.appendChild(confirmBackdrop);

              const closeConfirm = () => confirmBackdrop.remove();
              confirmBackdrop.querySelector('#ap-del-cancel-btn')?.addEventListener('click', closeConfirm);
              confirmBackdrop.addEventListener('click', (ev) => { if (ev.target === confirmBackdrop) closeConfirm(); });

              confirmBackdrop.querySelector('#ap-del-confirm-btn')?.addEventListener('click', async () => {
                const delBtn = confirmBackdrop.querySelector('#ap-del-confirm-btn');
                if (delBtn) { delBtn.disabled = true; delBtn.textContent = 'Deleting...'; }
                try {
                  await adminFetch(`/cms/banners/${id}`, { method: 'DELETE' });
                  showToast('Banner removed successfully!', 'success'); window._fetchStorefrontCMS?.();
                  closeConfirm();
                  load();
                } catch (err) {
                  showToast(err.message, 'error');
                  closeConfirm();
                }
              });
            });
          });
        }
        attachBannerRowHandlers();

        // Promo Row Handlers
        function attachPromoRowHandlers() {
          // Toggle Promo active
          body.querySelectorAll('.ap-promo-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const currentActive = btn.dataset.active === 'true';
              btn.disabled = true;
              btn.style.opacity = '0.6';
              try {
                await adminFetch(`/cms/promotions/${id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ active: !currentActive }),
                });
                showToast(`Offer ${!currentActive ? 'activated' : 'paused'} successfully!`, 'success');
                load();
              } catch (e) {
                showToast(e.message, 'error');
                btn.disabled = false;
                btn.style.opacity = '1';
              }
            });
          });

          // Edit Promo
          body.querySelectorAll('.ap-edit-promo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const promo = promotions.find(p => String(p._id || p.id) === String(btn.dataset.id));
              if (promo) {
                showPromoModal(promo);
              } else {
                showToast('Promotional offer not found.', 'error');
              }
            });
          });

          // Delete Promo with In-Overlay Dialog
          body.querySelectorAll('.ap-delete-promo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const id = btn.dataset.id;
              const promo = promotions.find(p => String(p._id || p.id) === String(id));
              const promoCode = promo?.code || 'this promotion';

              const confirmBackdrop = document.createElement('div');
              confirmBackdrop.className = 'ap-modal-backdrop';
              confirmBackdrop.style.zIndex = '100060';
              confirmBackdrop.innerHTML = `
                <div class="ap-modal-dialog" style="max-width:440px; text-align:center; padding:24px 20px; background:#ffffff; border-radius:14px; box-shadow:0 25px 60px rgba(15,23,42,0.25);">
                  <div style="width:50px; height:50px; border-radius:50%; background:#fee2e2; color:#ef4444; display:flex; align-items:center; justify-content:center; margin:0 auto 14px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </div>
                  <h4 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 8px;">Delete Promotion?</h4>
                  <p style="font-size:12.5px; color:#64748b; margin:0 0 20px; line-height:1.45;">
                    Are you sure you want to remove code <strong style="font-family:monospace; color:#0284c7;">"${esc(promoCode)}"</strong>? Customers will no longer be able to redeem this coupon at checkout.
                  </p>
                  <div style="display:flex; justify-content:center; gap:10px;">
                    <button type="button" class="ap-btn ghost" id="ap-del-promo-cancel" style="padding:8px 18px; font-size:12.5px; font-weight:700;">Cancel</button>
                    <button type="button" class="ap-btn danger" id="ap-del-promo-confirm" style="padding:8px 18px; font-size:12.5px; font-weight:800; background:#dc2626; color:#ffffff !important;">Delete Offer</button>
                  </div>
                </div>
              `;
              const mount = document.getElementById('admin-panel-overlay') || document.body;
              mount.appendChild(confirmBackdrop);

              const closeConfirm = () => confirmBackdrop.remove();
              confirmBackdrop.querySelector('#ap-del-promo-cancel')?.addEventListener('click', closeConfirm);
              confirmBackdrop.addEventListener('click', (ev) => { if (ev.target === confirmBackdrop) closeConfirm(); });

              confirmBackdrop.querySelector('#ap-del-promo-confirm')?.addEventListener('click', async () => {
                const delBtn = confirmBackdrop.querySelector('#ap-del-promo-confirm');
                if (delBtn) { delBtn.disabled = true; delBtn.textContent = 'Deleting...'; }
                try {
                  await adminFetch(`/cms/promotions/${id}`, { method: 'DELETE' });
                  showToast('Promotion removed successfully!', 'success');
                  closeConfirm();
                  load();
                } catch (err) {
                  showToast(err.message, 'error');
                  closeConfirm();
                }
              });
            });
          });
        }
        attachPromoRowHandlers();

        /* ── MODAL: ADD / EDIT FEATURED BANNER ── */
        function showBannerModal(existingBanner = null) {
          const isEdit = !!existingBanner;
          const backdrop = document.createElement('div');
          backdrop.className = 'ap-modal-backdrop';

          const defaultImg = existingBanner?.image || '';

          backdrop.innerHTML = `
            <div class="ap-modal-dialog" style="max-width:580px;">
              <div class="ap-modal-header" style="background:linear-gradient(135deg, #0b1c30, #1e3a5f); color:#ffffff;">
                <div>
                  <h3 class="ap-modal-title" style="color:#ffffff; font-size:15px; font-weight:800;">
                    ${isEdit ? 'Edit Featured Banner' : 'Add New Featured Banner'}
                  </h3>
                  <p style="margin:2px 0 0; font-size:11.5px; color:#e2e8f0;">Provide banner image URL or upload an image file, headline, and link for customer storefront.</p>
                </div>
                <button type="button" class="ap-modal-close-btn" id="ap-banner-modal-close" style="color:#ffffff;">✕</button>
              </div>

              <div class="ap-modal-content" style="padding:22px; max-height:80vh; overflow-y:auto; color:#000000;">
                <!-- Headline -->
                <div class="ap-form-group" style="margin-bottom:14px;">
                  <label for="banner-modal-title" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Banner Headline</label>
                  <input type="text" id="banner-modal-title" class="ap-input" value="${esc(existingBanner?.title || '')}" style="width:100%; color:#000000; font-weight:600;" placeholder="e.g. Flagship Smartphone Mega Launch" />
                </div>

                <!-- Subtitle -->
                <div class="ap-form-group" style="margin-bottom:14px;">
                  <label for="banner-modal-subtitle" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Subtitle / Tagline</label>
                  <input type="text" id="banner-modal-subtitle" class="ap-input" value="${esc(existingBanner?.subtitle || '')}" style="width:100%; color:#000000; font-weight:600;" placeholder="e.g. Starting from ₹14,999 with No Cost EMI" />
                </div>

                <!-- Category Tag -->
                <div class="ap-form-group" style="margin-bottom:14px;">
                  <label for="banner-modal-tag" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Category Tag / Badge</label>
                  <input type="text" id="banner-modal-tag" class="ap-input" value="${esc(existingBanner?.tag || 'Limited Edition')}" style="width:100%; color:#000000; font-weight:600;" />
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
                  <label for="banner-modal-image" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Banner Image URL</label>
                  <input type="url" id="banner-modal-image" class="ap-input" value="${esc(defaultImg)}" style="width:100%; color:#000000; font-weight:600;" />
                  
                  <div style="margin-top:6px;">
                    <span style="font-size:11.5px; color:#000000; font-weight:800;">One-click high-res presets:</span>
                    <div class="ap-preset-pills">
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80">Flagship Electronics</button>
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80">Audio &amp; Headphones</button>
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80">Designer Fashion</button>
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=80">Modern Living</button>
                      <button type="button" class="ap-preset-pill" data-target="banner-modal-image" data-val="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80">Gaming Battle Station</button>
                    </div>
                  </div>

                  <!-- Live Image Preview Container -->
                  <div class="banner-preview-box">
                    <img id="banner-modal-preview-img" src="${esc(defaultImg)}" alt="Banner Live Preview" onerror="this.src='https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600';" />
                    <span style="font-size:11.5px; color:#000000; font-weight:700; margin-top:6px;">Live Image Preview</span>
                  </div>
                </div>

                <!-- Destination Link & Sequence Order -->
                <div style="display:grid; grid-template-columns:2fr 1fr; gap:12px; margin-bottom:14px;">
                  <div class="ap-form-group">
                    <label for="banner-modal-link" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Destination Link / Hash</label>
                    <input type="text" id="banner-modal-link" class="ap-input" value="${esc(existingBanner?.link || '#category/Electronics')}" style="width:100%; color:#000000;" />
                  </div>
                  <div class="ap-form-group">
                    <label for="banner-modal-order" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Display Order</label>
                    <input type="number" id="banner-modal-order" class="ap-input" value="${existingBanner?.order ?? banners.length}" min="0" style="width:100%; color:#000000;" />
                  </div>
                </div>

                <!-- Active Toggle -->
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px; padding:10px 14px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                  <input type="checkbox" id="banner-modal-active" ${existingBanner?.active !== false ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
                  <label for="banner-modal-active" style="font-size:13px; font-weight:700; color:#000000; cursor:pointer;">
                    Publish and make live on storefront immediately
                  </label>
                </div>

                <!-- Actions -->
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                  <button type="button" class="ap-btn ghost" id="ap-banner-modal-cancel">Cancel</button>
                  <button type="button" class="ap-btn primary" id="ap-banner-modal-save" style="padding:8px 22px; color:#ffffff !important;">
                    ${isEdit ? 'Save Changes' : 'Publish Banner'}
                  </button>
                </div>
              </div>
            </div>
          `;

          backdrop.style.zIndex = '100050';
          const mount = document.getElementById('admin-panel-overlay') || document.body;
          mount.appendChild(backdrop);

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
              const bannerId = existingBanner?._id || existingBanner?.id;
              if (isEdit && bannerId) {
                await adminFetch(`/cms/banners/${bannerId}`, {
                  method: 'PUT',
                  body: JSON.stringify({ title, subtitle, tag, image, link, order, active }),
                });
                showToast('Featured banner updated successfully!', 'success'); window._fetchStorefrontCMS?.();
              } else {
                await adminFetch('/cms/banners', {
                  method: 'POST',
                  body: JSON.stringify({ title, subtitle, tag, image, link, order, active }),
                });
                showToast('New featured banner published!', 'success'); window._fetchStorefrontCMS?.();
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
            <div class="ap-modal-dialog" style="max-width:640px;">
              <div class="ap-modal-header" style="background:linear-gradient(135deg, #19324c, #0f172a); color:#ffffff;">
                <div>
                  <h3 class="ap-modal-title" style="color:#ffffff; font-size:15.5px; font-weight:800;">
                    ${isEdit ? 'Edit Promotional Offer / Voucher' : 'Create New Promotional Offer / Voucher'}
                  </h3>
                  <p style="margin:2px 0 0; font-size:11.5px; color:#e2e8f0;">Create customer vouchers, bank card discounts, or UPI app cashbacks with duration and store targeting.</p>
                </div>
                <button type="button" class="ap-modal-close-btn" id="ap-promo-modal-close" style="color:#ffffff;">✕</button>
              </div>

              <div class="ap-modal-content" style="padding:22px; max-height:82vh; overflow-y:auto; color:#000000;">
                ${!isEdit ? `
                  <div style="background:#fff7ed; border:1.5px solid #fed7aa; border-radius:8px; padding:10px 12px; margin-bottom:14px;">
                    <div style="font-size:12px; color:#000000; font-weight:700; line-height:1.4;">
                      Auto-Replace Active: Creating a new offer will automatically replace and delete any previous offers of the same category (Voucher, Bank Card, or UPI).
                    </div>
                  </div>
                ` : ''}

                <!-- Offer Type Selector -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                  <div class="ap-form-group">
                    <label for="promo-modal-type" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Offer / Promotion Category</label>
                    <select id="promo-modal-type" class="ap-input" style="width:100%; font-weight:700; color:#000000;">
                      <option value="voucher" ${currentType === 'voucher' ? 'selected' : ''}>Storewide / Store Voucher</option>
                      <option value="bank" ${currentType === 'bank' ? 'selected' : ''}>Bank Card Instant Discount</option>
                      <option value="upi" ${currentType === 'upi' ? 'selected' : ''}>UPI App Cashback / Offer</option>
                    </select>
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-scope" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Target Scope</label>
                    <select id="promo-modal-scope" class="ap-input" style="width:100%; font-weight:700; color:#000000;">
                      <option value="storewide" ${currentScope === 'storewide' ? 'selected' : ''}>Storewide (All Stores &amp; Products)</option>
                      <option value="store" ${currentScope === 'store' ? 'selected' : ''}>Specific Merchant Store</option>
                    </select>
                  </div>
                </div>

                <!-- Conditional Bank Partner Field (Multi-Select & Per-Bank Card Eligibility Supported with Top 10 Most Valued Banks Dropdown Window) -->
                <div id="promo-bank-section" class="ap-form-group" style="margin-bottom:14px; display:${currentType === 'bank' ? 'block' : 'none'};">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:5px;">
                    <label class="ap-cms-label" style="color:#000000; font-weight:800;">Eligible Bank Partner(s) — Top 10 Most Valued Banks of India</label>
                    <span style="font-size:11px; color:#475569; font-weight:600;">Select banks from dropdown window below</span>
                  </div>
                  <input type="text" id="promo-modal-bank" class="ap-input" value="${esc(existingPromo?.bankPartner || 'All Banks (Any Debit/Credit Card)')}" style="display:none;" />

                  <!-- Bank Dropdown Window Selector -->
                  <div style="position:relative; margin-bottom:10px;" id="promo-bank-picker-container">
                    <button type="button" id="promo-bank-dropdown-trigger" style="width:100%; display:flex; align-items:center; justify-content:space-between; background:#ffffff; border:1.5px solid #cbd5e1; border-radius:8px; padding:9px 12px; cursor:pointer; font-family:inherit; text-align:left; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                      <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                        <span style="font-size:15px;">🏛️</span>
                        <span id="promo-bank-dropdown-summary" style="font-weight:700; color:#0f172a; font-size:12.5px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">
                          Select Banks (HDFC, SBI, ICICI, Axis, Kotak, IndusInd, BoB, PNB, Canara, Union)...
                        </span>
                      </div>
                      <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                        <span id="promo-bank-count-badge" class="ap-badge blue" style="font-size:11px; font-weight:800; padding:2px 7px;">0 Selected</span>
                        <span style="font-size:11px; color:#64748b;">▼</span>
                      </div>
                    </button>

                    <!-- Floating Dropdown Window with Real Logos -->
                    <div id="promo-bank-dropdown-window" style="display:none; position:absolute; top:calc(100% + 4px); left:0; width:100%; max-height:350px; background:#ffffff; border:1.5px solid #cbd5e1; border-radius:10px; box-shadow:0 12px 30px rgba(0,0,0,0.18); z-index:1050; flex-direction:column;">
                      <div style="padding:8px 10px; border-bottom:1px solid #e2e8f0; background:#f8fafc; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                        <input type="text" id="promo-bank-dropdown-search" placeholder="🔍 Search Top 10 Indian Banks..." style="flex:1; padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px; font-weight:600; outline:none; background:#fff;" />
                        <div style="display:flex; gap:4px; flex-shrink:0;">
                          <button type="button" id="promo-bank-select-all-btn" class="ap-btn-tiny" style="background:#fff; border:1px solid #cbd5e1; color:#0f172a; font-size:10.5px; font-weight:700; padding:3px 7px; border-radius:4px; cursor:pointer;">Select All</button>
                          <button type="button" id="promo-bank-clear-all-btn" class="ap-btn-tiny" style="background:#fff; border:1px solid #cbd5e1; color:#b91c1c; font-size:10.5px; font-weight:700; padding:3px 7px; border-radius:4px; cursor:pointer;">Clear</button>
                        </div>
                      </div>
                      <div id="promo-bank-dropdown-items" style="overflow-y:auto; max-height:280px; padding:6px;">
                        <!-- Generated from TOP_10_INDIAN_BANKS with real logos -->
                      </div>
                    </div>
                  </div>

                  <!-- Per-Bank Card Eligibility Table / Interactive Cards -->
                  <div style="background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:10px; padding:12px; margin-top:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                      <div>
                        <div style="font-weight:800; color:#0f172a; font-size:12.5px;">Selected Bank Card Eligibility:</div>
                        <div style="font-size:11px; color:#475569; font-weight:600;">Set Debit, Credit, or Both for each bank</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:11px; color:#475569; font-weight:700;">Set all to:</span>
                        <div style="display:flex; gap:4px;">
                          <button type="button" id="promo-set-all-cards-both" class="ap-btn-tiny" style="background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; font-weight:700; border-radius:4px; padding:2px 8px; cursor:pointer;">Both</button>
                          <button type="button" id="promo-set-all-cards-debit" class="ap-btn-tiny" style="background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; font-weight:700; border-radius:4px; padding:2px 8px; cursor:pointer;">Debit Only</button>
                          <button type="button" id="promo-set-all-cards-credit" class="ap-btn-tiny" style="background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; font-weight:700; border-radius:4px; padding:2px 8px; cursor:pointer;">Credit Only</button>
                        </div>
                      </div>
                    </div>

                    <!-- Populated dynamically by renderBankRules() with Real Bank Logos -->
                    <div id="promo-bank-rules-list" style="display:flex; flex-direction:column; gap:6px;"></div>
                  </div>
                </div>

                <!-- Conditional UPI Provider Field (Multi-Select Supported with Top UPI Apps Dropdown Window) -->
                <div id="promo-upi-section" class="ap-form-group" style="margin-bottom:14px; display:${currentType === 'upi' ? 'block' : 'none'};">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:5px;">
                    <label class="ap-cms-label" style="color:#000000; font-weight:800;">Eligible UPI Provider(s) — Top Indian UPI Apps</label>
                    <span style="font-size:11px; color:#475569; font-weight:600;">Select UPI apps from dropdown window below</span>
                  </div>
                  <input type="text" id="promo-modal-upi" class="ap-input" value="${esc(existingPromo?.upiProvider || 'Google Pay, PhonePe, Paytm')}" style="display:none;" />

                  <!-- UPI Dropdown Window Selector -->
                  <div style="position:relative; margin-bottom:10px;" id="promo-upi-picker-container">
                    <button type="button" id="promo-upi-dropdown-trigger" style="width:100%; display:flex; align-items:center; justify-content:space-between; background:#ffffff; border:1.5px solid #cbd5e1; border-radius:8px; padding:9px 12px; cursor:pointer; font-family:inherit; text-align:left; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                      <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                        <span style="font-size:15px;">📱</span>
                        <span id="promo-upi-dropdown-summary" style="font-weight:700; color:#0f172a; font-size:12.5px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">
                          Select UPI Apps (PhonePe, Google Pay, Paytm, BHIM, Amazon Pay, CRED)...
                        </span>
                      </div>
                      <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                        <span id="promo-upi-count-badge" class="ap-badge green" style="font-size:11px; font-weight:800; padding:2px 7px;">0 Selected</span>
                        <span style="font-size:11px; color:#64748b;">▼</span>
                      </div>
                    </button>

                    <!-- Floating UPI Dropdown Window with Real Logos -->
                    <div id="promo-upi-dropdown-window" style="display:none; position:absolute; top:calc(100% + 4px); left:0; width:100%; max-height:350px; background:#ffffff; border:1.5px solid #cbd5e1; border-radius:10px; box-shadow:0 12px 30px rgba(0,0,0,0.18); z-index:1050; flex-direction:column;">
                      <div style="padding:8px 10px; border-bottom:1px solid #e2e8f0; background:#f8fafc; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                        <input type="text" id="promo-upi-dropdown-search" placeholder="🔍 Search Top Indian UPI Apps..." style="flex:1; padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:12px; font-weight:600; outline:none; background:#fff;" />
                        <div style="display:flex; gap:4px; flex-shrink:0;">
                          <button type="button" id="promo-upi-select-all-btn" class="ap-btn-tiny" style="background:#fff; border:1px solid #cbd5e1; color:#0f172a; font-size:10.5px; font-weight:700; padding:3px 7px; border-radius:4px; cursor:pointer;">Select All</button>
                          <button type="button" id="promo-upi-clear-all-btn" class="ap-btn-tiny" style="background:#fff; border:1px solid #cbd5e1; color:#b91c1c; font-size:10.5px; font-weight:700; padding:3px 7px; border-radius:4px; cursor:pointer;">Clear</button>
                        </div>
                      </div>
                      <div id="promo-upi-dropdown-items" style="overflow-y:auto; max-height:280px; padding:6px;">
                        <!-- Generated from TOP_UPI_APPS with real logos -->
                      </div>
                    </div>
                  </div>

                  <!-- Selected UPI Apps Chips Container with Real Logos -->
                  <div id="promo-upi-selected-chips-box" style="background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:10px; padding:10px 12px; margin-top:6px;">
                    <div style="font-weight:800; color:#0f172a; font-size:12px; margin-bottom:6px;">Selected UPI Provider(s):</div>
                    <div id="promo-upi-selected-chips" style="display:flex; flex-wrap:wrap; gap:6px;"></div>
                  </div>
                </div>

                <!-- DEDICATED STORE SEARCH & SELECTOR (For store-specific promotions) -->
                <div id="promo-store-picker-wrap" class="ap-form-group" style="margin-bottom:14px; display:${currentScope === 'store' ? 'block' : 'none'};">
                  <label for="promo-store-search-field" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Search &amp; Select Merchant Store</label>
                  <div class="promo-store-picker-box">
                    <input type="text" id="promo-store-search-field" class="ap-input" style="width:100%; color:#000000; font-weight:600;" />
                    <div id="promo-store-dropdown" class="promo-store-results-list" style="display:none;"></div>
                  </div>
                  <div id="promo-selected-store-box" class="promo-selected-store-pill" style="display:${selectedStoreName ? 'flex' : 'none'};">
                    <span>Targeted Store: <strong id="promo-store-name-display">${esc(selectedStoreName)}</strong></span>
                    <button type="button" id="promo-clear-store-selection" class="ap-btn-tiny" style="background:#065f46; color:#ffffff; border:none; border-radius:4px; padding:2px 8px; cursor:pointer;">Change</button>
                  </div>
                </div>

                <!-- Coupon Code & Title -->
                <div style="display:grid; grid-template-columns:1fr 2fr; gap:12px; margin-bottom:14px;">
                  <div class="ap-form-group">
                    <label for="promo-modal-code" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Offer Code / Promo Key</label>
                    <input type="text" id="promo-modal-code" class="ap-input" value="${esc(existingPromo?.code || (currentType === 'bank' ? 'CARDOFF500' : currentType === 'upi' ? 'UPI100' : 'SUPER20'))}" style="width:100%; text-transform:uppercase; font-family:monospace; font-weight:800; color:#2563eb;" />
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-title" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Offer Headline / Display Title</label>
                    <input type="text" id="promo-modal-title" class="ap-input" value="${esc(existingPromo?.title || (currentType === 'bank' ? 'Flat ₹500 Instant Discount on Debit/Credit Cards' : currentType === 'upi' ? 'Flat ₹100 Cashback on UPI' : 'Storewide Discount Voucher'))}" style="width:100%; color:#000000; font-weight:600;" />
                  </div>
                </div>

                <!-- Discount Type, Discount Value & Min Order -->
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; margin-bottom:8px;">
                  <div class="ap-form-group">
                    <label for="promo-modal-discount-type" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Discount Method</label>
                    <select id="promo-modal-discount-type" class="ap-input" style="width:100%; font-weight:700; color:#000000;">
                      <option value="flat" ${(!existingPromo || existingPromo?.discountType === 'flat') ? 'selected' : ''}>Flat Amount (₹ Off)</option>
                      <option value="percent" ${(existingPromo && existingPromo?.discountType === 'percent') ? 'selected' : ''}>Percentage (%)</option>
                    </select>
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-val" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;" id="promo-modal-val-label">Discount Amount (₹)</label>
                    <input type="number" id="promo-modal-val" class="ap-input" value="${existingPromo?.discountValue ?? (currentType === 'bank' ? 500 : currentType === 'upi' ? 100 : 10)}" min="1" style="width:100%; color:#000000; font-weight:800;" />
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-min" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Min Order (₹)</label>
                    <input type="number" id="promo-modal-min" class="ap-input" value="${existingPromo?.minOrder ?? 0}" min="0" style="width:100%; color:#000000; font-weight:700;" />
                  </div>
                  <div class="ap-form-group">
                    <label for="promo-modal-max" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Max Cap (₹)</label>
                    <input type="number" id="promo-modal-max" class="ap-input" value="${existingPromo?.maxDiscount ?? 0}" min="0" style="width:100%; color:#000000; font-weight:700;" />
                  </div>
                </div>

                <!-- Quick Discount Price Presets -->
                <div style="margin-bottom:14px;">
                  <span style="font-size:11px; color:#000000; font-weight:700;">Quick Discount Presets:</span>
                  <div class="ap-preset-pills" id="promo-discount-presets" style="margin-top:4px;">
                    <button type="button" class="ap-preset-pill ap-discount-preset" data-type="flat" data-val="100">₹100 Flat Off</button>
                    <button type="button" class="ap-preset-pill ap-discount-preset" data-type="flat" data-val="250">₹250 Flat Off</button>
                    <button type="button" class="ap-preset-pill ap-discount-preset" data-type="flat" data-val="500">₹500 Flat Off (Recommended)</button>
                    <button type="button" class="ap-preset-pill ap-discount-preset" data-type="flat" data-val="1000">₹1,000 Flat Off</button>
                    <button type="button" class="ap-preset-pill ap-discount-preset" data-type="percent" data-val="10">10% Off</button>
                  </div>
                </div>

                <!-- Description / Terms -->
                <div class="ap-form-group" style="margin-bottom:14px;">
                  <label for="promo-modal-desc" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Offer Description &amp; Terms</label>
                  <textarea id="promo-modal-desc" class="ap-input" style="width:100%; height:55px; font-size:12.5px; color:#000000; font-weight:600; resize:vertical;">${esc(existingPromo?.description || '')}</textarea>
                </div>

                <!-- Promotion Validity Duration & Expiry Schedule -->
                <div style="background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:10px; padding:14px; margin-bottom:14px;">
                  <div style="margin-bottom:10px;">
                    <h4 style="margin:0; font-size:13px; font-weight:800; color:#000000;">Offer Duration &amp; Expiry Schedule</h4>
                    <p style="margin:2px 0 0; font-size:11.5px; color:#1e293b; font-weight:600;">Set validity duration. Once ended, the offer is automatically deactivated and cannot be applied by customers.</p>
                  </div>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
                    <div class="ap-form-group">
                      <label for="promo-modal-valid-from" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Valid From (Start Date &amp; Time)</label>
                      <input type="datetime-local" id="promo-modal-valid-from" class="ap-input" value="${formatDatetimeLocal(existingPromo?.validFrom)}" style="width:100%; color:#000000; font-weight:700;" />
                    </div>
                    <div class="ap-form-group">
                      <label for="promo-modal-valid-until" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Valid Until (Expiry Date &amp; Time)</label>
                      <input type="datetime-local" id="promo-modal-valid-until" class="ap-input" value="${formatDatetimeLocal(existingPromo?.validUntil)}" style="width:100%; color:#000000; font-weight:700;" />
                    </div>
                  </div>

                  <!-- Quick Duration Presets -->
                  <div style="margin-top:6px;">
                    <span style="font-size:11.5px; color:#000000; font-weight:800;">Quick Expiry Presets:</span>
                    <div class="ap-preset-pills" id="promo-duration-presets" style="margin-top:4px;">
                      <button type="button" class="ap-preset-pill ap-duration-preset-btn" data-hours="24">24 Hours</button>
                      <button type="button" class="ap-preset-pill ap-duration-preset-btn" data-hours="72">3 Days</button>
                      <button type="button" class="ap-preset-pill ap-duration-preset-btn" data-hours="168">7 Days</button>
                      <button type="button" class="ap-preset-pill" data-hours="720">30 Days</button>
                      <button type="button" class="ap-preset-pill ap-duration-preset-btn" data-hours="0">No Expiry</button>
                    </div>
                  </div>

                  <!-- Target Products / Categories (Optional) -->
                  <div class="ap-form-group" style="margin-top:12px;">
                    <label for="promo-modal-applicable-products" class="ap-cms-label" style="display:block; margin-bottom:5px; color:#000000; font-weight:800;">Target Products or Categories (Optional)</label>
                    <input type="text" id="promo-modal-applicable-products" class="ap-input" value="${esc((existingPromo?.applicableProducts || []).join(', '))}" placeholder="e.g. Electronics, Smartphone, Fashion (leave empty to show on all products)" style="width:100%; color:#000000; font-weight:600;" />
                    <small style="font-size:11px; color:#1e293b; font-weight:600; display:block; margin-top:3px;">Leave blank to display on all products, or enter comma-separated categories / keywords.</small>
                  </div>
                </div>

                <!-- Active Toggle -->
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px; padding:10px 14px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                  <input type="checkbox" id="promo-modal-active" ${existingPromo?.active !== false ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
                  <label for="promo-modal-active" style="font-size:13px; font-weight:700; color:#000000; cursor:pointer;">
                    Activate offer immediately across customer checkout &amp; top navbar
                  </label>
                </div>

                <!-- Actions -->
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                  <button type="button" class="ap-btn ghost" id="ap-promo-modal-cancel">Cancel</button>
                  <button type="button" class="ap-btn primary" id="ap-promo-modal-save" style="padding:8px 22px; background:#ea580c; border-color:#c2410c; color:#ffffff !important; font-weight:800;">
                    ${isEdit ? 'Save Offer' : 'Create Offer'}
                  </button>
                </div>
              </div>
            </div>
          `;

          backdrop.style.zIndex = '100050';
          const mount = document.getElementById('admin-panel-overlay') || document.body;
          mount.appendChild(backdrop);

          // Close modal
          const closeModal = () => backdrop.remove();
          backdrop.querySelector('#ap-promo-modal-close')?.addEventListener('click', closeModal);
          backdrop.querySelector('#ap-promo-modal-cancel')?.addEventListener('click', closeModal);
          backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });

          // Toggle conditional bank/upi sections
          const typeSelect = backdrop.querySelector('#promo-modal-type');
          const bankSection = backdrop.querySelector('#promo-bank-section');
          const upiSection = backdrop.querySelector('#promo-upi-section');
          const discTypeSelect = backdrop.querySelector('#promo-modal-discount-type');
          const valLabel = backdrop.querySelector('#promo-modal-val-label');
          const valInput = backdrop.querySelector('#promo-modal-val');
          const codeInput = backdrop.querySelector('#promo-modal-code');
          const titleInput = backdrop.querySelector('#promo-modal-title');

          discTypeSelect?.addEventListener('change', () => {
            if (valLabel) {
              valLabel.textContent = discTypeSelect.value === 'flat' ? 'Discount Amount (₹)' : 'Discount Rate (%)';
            }
          });

          typeSelect?.addEventListener('change', () => {
            const val = typeSelect.value;
            if (bankSection) bankSection.style.display = val === 'bank' ? 'block' : 'none';
            if (upiSection) upiSection.style.display = val === 'upi' ? 'block' : 'none';

            if (!isEdit) {
              if (val === 'bank') {
                if (codeInput && (!codeInput.value || codeInput.value === 'UPI100' || codeInput.value === 'SUPER20')) codeInput.value = 'CARDOFF500';
                if (titleInput && (!titleInput.value || titleInput.value.includes('Cashback') || titleInput.value.includes('Voucher'))) titleInput.value = 'Flat ₹500 Instant Discount on Debit/Credit Cards';
                if (discTypeSelect) discTypeSelect.value = 'flat';
                if (valInput) valInput.value = '500';
                if (valLabel) valLabel.textContent = 'Discount Amount (₹)';
              } else if (val === 'upi') {
                if (codeInput && (!codeInput.value || codeInput.value === 'CARDOFF500' || codeInput.value === 'SUPER20')) codeInput.value = 'UPI100';
                if (titleInput && (!titleInput.value || titleInput.value.includes('Cards') || titleInput.value.includes('Voucher'))) titleInput.value = 'Flat ₹100 Cashback on UPI Payment';
                if (discTypeSelect) discTypeSelect.value = 'flat';
                if (valInput) valInput.value = '100';
                if (valLabel) valLabel.textContent = 'Discount Amount (₹)';
              }
            }
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

          // ── Bank Rules Map: Map<bankName, 'all' | 'debit' | 'credit'> ──
          const selectedBankRules = new Map();

          // Initialize bank rules from existingPromo or sensible defaults
          if (existingPromo?.bankRules && Array.isArray(existingPromo.bankRules) && existingPromo.bankRules.length > 0) {
            existingPromo.bankRules.forEach(r => {
              if (r.bank) {
                const normBank = r.bank.toLowerCase().includes('sbi') ? 'SBI Bank' : r.bank;
                selectedBankRules.set(normBank, r.cardType || 'all');
              }
            });
          } else if (existingPromo?.bankPartner) {
            const rawPartners = Array.isArray(existingPromo.bankPartners) && existingPromo.bankPartners.length > 0
              ? existingPromo.bankPartners
              : existingPromo.bankPartner.split(',').map(s => s.trim()).filter(Boolean);
            rawPartners.forEach(b => {
              const normBank = b.toLowerCase().includes('sbi') ? 'SBI Bank' : b.replace(/\s*\(.*?\)/, '').trim();
              if (normBank) selectedBankRules.set(normBank, existingPromo.cardType || 'all');
            });
          } else {
            selectedBankRules.set('All Banks (Any Debit/Credit Card)', 'all');
          }

          // Bank Dropdown Window Elements
          const bankTrigger = backdrop.querySelector('#promo-bank-dropdown-trigger');
          const bankWindow = backdrop.querySelector('#promo-bank-dropdown-window');
          const bankSearchInput = backdrop.querySelector('#promo-bank-dropdown-search');
          const bankItemsList = backdrop.querySelector('#promo-bank-dropdown-items');
          const bankSummary = backdrop.querySelector('#promo-bank-dropdown-summary');
          const bankCountBadge = backdrop.querySelector('#promo-bank-count-badge');
          const bankInput = backdrop.querySelector('#promo-modal-bank');
          const bankRulesList = backdrop.querySelector('#promo-bank-rules-list');

          function renderBankDropdownItems(filter = '') {
            if (!bankItemsList) return;
            const query = (filter || '').toLowerCase().trim();
            const filtered = TOP_10_INDIAN_BANKS.filter(b => {
              if (!query) return true;
              return b.name.toLowerCase().includes(query) || b.shortName.toLowerCase().includes(query) || b.rank.toLowerCase().includes(query);
            });

            if (!filtered.length) {
              bankItemsList.innerHTML = `<div style="padding:16px; text-align:center; font-size:12px; color:#64748b; font-weight:600;">No matching banks found.</div>`;
              return;
            }

            bankItemsList.innerHTML = filtered.map(b => {
              const isSelected = selectedBankRules.has(b.shortName) || selectedBankRules.has(b.name) || (b.shortName === 'SBI Bank' && (selectedBankRules.has('SBI Bank') || selectedBankRules.has('SBI Card')));
              return `
                <div class="promo-bank-option-item" data-id="${esc(b.shortName)}" style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-radius:8px; cursor:pointer; margin-bottom:4px; transition:all 0.15s; background:${isSelected ? '#eff6ff' : '#ffffff'}; border:1px solid ${isSelected ? '#bfdbfe' : '#e2e8f0'};">
                  <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                    <div style="width:34px; height:34px; border-radius:6px; background:#ffffff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:3px; flex-shrink:0; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
                      <img src="${b.logo}" alt="${esc(b.shortName)}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
                    </div>
                    <div style="min-width:0;">
                      <div style="font-weight:800; color:#0f172a; font-size:12.5px; display:flex; align-items:center; gap:6px;">
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(b.name)}</span>
                        <span style="font-size:9.5px; font-weight:700; background:#f1f5f9; color:#475569; padding:1px 5px; border-radius:3px; flex-shrink:0;">${esc(b.tag)}</span>
                      </div>
                      <div style="font-size:11px; color:#64748b; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(b.rank)}</div>
                    </div>
                  </div>
                  <div style="margin-left:8px; flex-shrink:0;">
                    <div style="width:20px; height:20px; border-radius:50%; border:1.5px solid ${isSelected ? '#2563eb' : '#cbd5e1'}; background:${isSelected ? '#2563eb' : '#ffffff'}; color:#ffffff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800;">
                      ${isSelected ? '✓' : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('');

            bankItemsList.querySelectorAll('.promo-bank-option-item').forEach(item => {
              item.addEventListener('click', (e) => {
                e.stopPropagation();
                const bankId = item.dataset.id;
                const isAll = bankId.toLowerCase().startsWith('all');
                if (isAll) {
                  if (selectedBankRules.has('All Banks (Any Debit/Credit Card)')) {
                    selectedBankRules.clear();
                  } else {
                    selectedBankRules.clear();
                    selectedBankRules.set('All Banks (Any Debit/Credit Card)', 'all');
                  }
                } else {
                  selectedBankRules.delete('All Banks (Any Debit/Credit Card)');
                  if (selectedBankRules.has(bankId)) {
                    selectedBankRules.delete(bankId);
                  } else {
                    selectedBankRules.set(bankId, 'all');
                  }
                }
                renderBankRules();
                renderBankDropdownItems(bankSearchInput ? bankSearchInput.value : '');
              });
            });
          }

          function renderBankRules() {
            if (!bankRulesList) return;

            const count = selectedBankRules.size;
            if (bankCountBadge) bankCountBadge.textContent = `${count} Bank${count === 1 ? '' : 's'}`;

            if (count === 0) {
              bankRulesList.innerHTML = `<div style="font-size:12px; color:#64748b; font-style:italic; padding:6px 4px;">No banks selected. Click the dropdown window above to choose banks.</div>`;
              if (bankInput) bankInput.value = '';
              if (bankSummary) bankSummary.textContent = 'Select Banks from Top 10 Most Valued Indian Banks...';
              return;
            }

            const banks = Array.from(selectedBankRules.keys());
            if (bankInput) bankInput.value = banks.join(', ');
            if (bankSummary) {
              bankSummary.textContent = banks.length <= 3 ? banks.join(', ') : `${banks.slice(0, 3).join(', ')} +${banks.length - 3} more`;
            }

            bankRulesList.innerHTML = Array.from(selectedBankRules.entries()).map(([bank, cType]) => {
              const isAll = cType === 'all';
              const isDebit = cType === 'debit';
              const isCredit = cType === 'credit';
              const logoUrl = getBankLogoUrl(bank);
              return `
                <div class="promo-bank-rule-item" data-bank="${esc(bank)}" style="display:flex; align-items:center; justify-content:space-between; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:7px 12px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:28px; height:28px; border-radius:6px; background:#ffffff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:3px; flex-shrink:0; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
                      <img src="${logoUrl}" alt="${esc(bank)}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
                    </div>
                    <div>
                      <strong style="font-size:13px; color:#0f172a;">${esc(bank)}</strong>
                    </div>
                  </div>
                  <div class="rule-type-toggle-group" style="display:flex; align-items:center; gap:4px;">
                    <button type="button" class="rule-type-btn" data-type="all" style="border:1.5px solid ${isAll ? '#86efac' : '#e2e8f0'}; background:${isAll ? '#dcfce7' : '#f8fafc'}; color:${isAll ? '#15803d' : '#475569'}; font-size:11px; font-weight:800; padding:4px 9px; border-radius:6px; cursor:pointer;">Both Cards</button>
                    <button type="button" class="rule-type-btn" data-type="debit" style="border:1.5px solid ${isDebit ? '#7dd3fc' : '#e2e8f0'}; background:${isDebit ? '#e0f2fe' : '#f8fafc'}; color:${isDebit ? '#0369a1' : '#475569'}; font-size:11px; font-weight:800; padding:4px 9px; border-radius:6px; cursor:pointer;">Debit Only</button>
                    <button type="button" class="rule-type-btn" data-type="credit" style="border:1.5px solid ${isCredit ? '#fcd34d' : '#e2e8f0'}; background:${isCredit ? '#fef3c7' : '#f8fafc'}; color:${isCredit ? '#b45309' : '#475569'}; font-size:11px; font-weight:800; padding:4px 9px; border-radius:6px; cursor:pointer;">Credit Only</button>
                    <button type="button" class="rule-bank-remove-btn" title="Remove bank" style="background:transparent; border:none; color:#94a3b8; font-size:15px; font-weight:700; cursor:pointer; padding:0 4px; margin-left:4px; line-height:1;">✕</button>
                  </div>
                </div>
              `;
            }).join('');

            bankRulesList.querySelectorAll('.rule-type-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                const row = btn.closest('.promo-bank-rule-item');
                const bank = row.dataset.bank;
                const newType = btn.dataset.type;
                selectedBankRules.set(bank, newType);
                renderBankRules();
              });
            });

            bankRulesList.querySelectorAll('.rule-bank-remove-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                const row = btn.closest('.promo-bank-rule-item');
                const bank = row.dataset.bank;
                selectedBankRules.delete(bank);
                renderBankRules();
                renderBankDropdownItems(bankSearchInput ? bankSearchInput.value : '');
              });
            });
          }

          // Bank dropdown open/close & search
          bankTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = bankWindow.style.display === 'flex';
            bankWindow.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) {
              if (upiWindow) upiWindow.style.display = 'none';
              renderBankDropdownItems(bankSearchInput ? bankSearchInput.value : '');
              if (bankSearchInput) setTimeout(() => bankSearchInput.focus(), 50);
            }
          });

          bankSearchInput?.addEventListener('input', (e) => {
            renderBankDropdownItems(e.target.value);
          });

          backdrop.querySelector('#promo-bank-select-all-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            TOP_10_INDIAN_BANKS.filter(b => !b.id.toLowerCase().startsWith('all')).forEach(b => {
              selectedBankRules.set(b.shortName, 'all');
            });
            selectedBankRules.delete('All Banks (Any Debit/Credit Card)');
            renderBankRules();
            renderBankDropdownItems(bankSearchInput ? bankSearchInput.value : '');
          });

          backdrop.querySelector('#promo-bank-clear-all-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedBankRules.clear();
            renderBankRules();
            renderBankDropdownItems(bankSearchInput ? bankSearchInput.value : '');
          });

          // "Set all to" quick buttons
          backdrop.querySelector('#promo-set-all-cards-both')?.addEventListener('click', () => {
            for (const k of selectedBankRules.keys()) selectedBankRules.set(k, 'all');
            renderBankRules();
          });
          backdrop.querySelector('#promo-set-all-cards-debit')?.addEventListener('click', () => {
            for (const k of selectedBankRules.keys()) selectedBankRules.set(k, 'debit');
            renderBankRules();
          });
          backdrop.querySelector('#promo-set-all-cards-credit')?.addEventListener('click', () => {
            for (const k of selectedBankRules.keys()) selectedBankRules.set(k, 'credit');
            renderBankRules();
          });

          renderBankRules();

          // ── UPI Apps Set: Set<appName> ──
          const selectedUpiApps = new Set();

          if (existingPromo?.upiProvider) {
            const rawUpi = Array.isArray(existingPromo.upiProviders) && existingPromo.upiProviders.length > 0
              ? existingPromo.upiProviders
              : existingPromo.upiProvider.split(',').map(s => s.trim()).filter(Boolean);
            rawUpi.forEach(u => selectedUpiApps.add(u));
          } else {
            selectedUpiApps.add('PhonePe');
            selectedUpiApps.add('Google Pay');
            selectedUpiApps.add('Paytm');
          }

          // UPI Dropdown Window Elements
          const upiTrigger = backdrop.querySelector('#promo-upi-dropdown-trigger');
          const upiWindow = backdrop.querySelector('#promo-upi-dropdown-window');
          const upiSearchInput = backdrop.querySelector('#promo-upi-dropdown-search');
          const upiItemsList = backdrop.querySelector('#promo-upi-dropdown-items');
          const upiSummary = backdrop.querySelector('#promo-upi-dropdown-summary');
          const upiCountBadge = backdrop.querySelector('#promo-upi-count-badge');
          const upiInput = backdrop.querySelector('#promo-modal-upi');
          const upiChipsBox = backdrop.querySelector('#promo-upi-selected-chips');

          function renderUpiDropdownItems(filter = '') {
            if (!upiItemsList) return;
            const query = (filter || '').toLowerCase().trim();
            const filtered = TOP_UPI_APPS.filter(u => {
              if (!query) return true;
              return u.name.toLowerCase().includes(query) || u.shortName.toLowerCase().includes(query) || u.rank.toLowerCase().includes(query);
            });

            if (!filtered.length) {
              upiItemsList.innerHTML = `<div style="padding:16px; text-align:center; font-size:12px; color:#64748b; font-weight:600;">No matching UPI apps found.</div>`;
              return;
            }

            upiItemsList.innerHTML = filtered.map(u => {
              const isSelected = selectedUpiApps.has(u.shortName) || selectedUpiApps.has(u.name);
              return `
                <div class="promo-upi-option-item" data-id="${esc(u.shortName)}" style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-radius:8px; cursor:pointer; margin-bottom:4px; transition:all 0.15s; background:${isSelected ? '#f0fdf4' : '#ffffff'}; border:1px solid ${isSelected ? '#bbf7d0' : '#e2e8f0'};">
                  <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                    <div style="width:34px; height:34px; border-radius:6px; background:#ffffff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; padding:3px; flex-shrink:0; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
                      <img src="${u.logo}" alt="${esc(u.shortName)}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
                    </div>
                    <div style="min-width:0;">
                      <div style="font-weight:800; color:#0f172a; font-size:12.5px; display:flex; align-items:center; gap:6px;">
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(u.name)}</span>
                        <span style="font-size:9.5px; font-weight:700; background:#f1f5f9; color:#475569; padding:1px 5px; border-radius:3px; flex-shrink:0;">${esc(u.tag)}</span>
                      </div>
                      <div style="font-size:11px; color:#64748b; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(u.rank)}</div>
                    </div>
                  </div>
                  <div style="margin-left:8px; flex-shrink:0;">
                    <div style="width:20px; height:20px; border-radius:50%; border:1.5px solid ${isSelected ? '#16a34a' : '#cbd5e1'}; background:${isSelected ? '#16a34a' : '#ffffff'}; color:#ffffff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800;">
                      ${isSelected ? '✓' : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('');

            upiItemsList.querySelectorAll('.promo-upi-option-item').forEach(item => {
              item.addEventListener('click', (e) => {
                e.stopPropagation();
                const upiId = item.dataset.id;
                const isAll = upiId.toLowerCase().startsWith('all');
                if (isAll) {
                  if (selectedUpiApps.has('All UPI Apps (Any UPI Payment)')) {
                    selectedUpiApps.clear();
                  } else {
                    selectedUpiApps.clear();
                    selectedUpiApps.add('All UPI Apps (Any UPI Payment)');
                  }
                } else {
                  selectedUpiApps.delete('All UPI Apps (Any UPI Payment)');
                  if (selectedUpiApps.has(upiId)) {
                    selectedUpiApps.delete(upiId);
                  } else {
                    selectedUpiApps.add(upiId);
                  }
                }
                renderUpiChips();
                renderUpiDropdownItems(upiSearchInput ? upiSearchInput.value : '');
              });
            });
          }

          function renderUpiChips() {
            if (!upiChipsBox) return;

            const count = selectedUpiApps.size;
            if (upiCountBadge) upiCountBadge.textContent = `${count} Selected`;

            if (count === 0) {
              upiChipsBox.innerHTML = `<div style="font-size:12px; color:#64748b; font-style:italic; padding:4px;">No UPI apps selected. Click the dropdown window above to add apps.</div>`;
              if (upiInput) upiInput.value = '';
              if (upiSummary) upiSummary.textContent = 'Select UPI Apps (PhonePe, Google Pay, Paytm, BHIM...)...';
              return;
            }

            const upiList = Array.from(selectedUpiApps);
            if (upiInput) upiInput.value = upiList.join(', ');
            if (upiSummary) {
              upiSummary.textContent = upiList.length <= 3 ? upiList.join(', ') : `${upiList.slice(0, 3).join(', ')} +${upiList.length - 3} more`;
            }

            upiChipsBox.innerHTML = upiList.map(u => {
              const logoUrl = getUpiLogoUrl(u);
              return `
                <div class="promo-upi-selected-chip" data-upi="${esc(u)}" style="display:inline-flex; align-items:center; gap:6px; background:#ffffff; border:1px solid #cbd5e1; border-radius:20px; padding:4px 10px; font-size:12px; font-weight:700; color:#0f172a; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                  <div style="width:18px; height:18px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <img src="${logoUrl}" alt="${esc(u)}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.src='logo.png'" />
                  </div>
                  <span>${esc(u)}</span>
                  <button type="button" class="promo-upi-chip-remove" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; font-weight:800; padding:0 2px; font-size:13px; line-height:1; margin-left:2px;">✕</button>
                </div>
              `;
            }).join('');

            upiChipsBox.querySelectorAll('.promo-upi-chip-remove').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chip = btn.closest('.promo-upi-selected-chip');
                const upiName = chip.dataset.upi;
                selectedUpiApps.delete(upiName);
                renderUpiChips();
                renderUpiDropdownItems(upiSearchInput ? upiSearchInput.value : '');
              });
            });
          }

          // UPI dropdown open/close & search
          upiTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = upiWindow.style.display === 'flex';
            upiWindow.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) {
              if (bankWindow) bankWindow.style.display = 'none';
              renderUpiDropdownItems(upiSearchInput ? upiSearchInput.value : '');
              if (upiSearchInput) setTimeout(() => upiSearchInput.focus(), 50);
            }
          });

          upiSearchInput?.addEventListener('input', (e) => {
            renderUpiDropdownItems(e.target.value);
          });

          backdrop.querySelector('#promo-upi-select-all-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            TOP_UPI_APPS.filter(u => !u.id.toLowerCase().startsWith('all')).forEach(u => selectedUpiApps.add(u.shortName));
            selectedUpiApps.delete('All UPI Apps (Any UPI Payment)');
            renderUpiChips();
            renderUpiDropdownItems(upiSearchInput ? upiSearchInput.value : '');
          });

          backdrop.querySelector('#promo-upi-clear-all-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedUpiApps.clear();
            renderUpiChips();
            renderUpiDropdownItems(upiSearchInput ? upiSearchInput.value : '');
          });

          renderUpiChips();

          // Close dropdown windows on outside click
          backdrop.addEventListener('click', (e) => {
            if (!e.target.closest('#promo-bank-picker-container')) {
              if (bankWindow) bankWindow.style.display = 'none';
            }
            if (!e.target.closest('#promo-upi-picker-container')) {
              if (upiWindow) upiWindow.style.display = 'none';
            }
          });

          // Discount price presets click
          backdrop.querySelectorAll('.ap-discount-preset').forEach(btn => {
            btn.addEventListener('click', () => {
              const dType = btn.dataset.type;
              const dVal = btn.dataset.val;
              if (discTypeSelect) discTypeSelect.value = dType;
              if (valInput) valInput.value = dVal;
              if (valLabel) valLabel.textContent = dType === 'flat' ? 'Discount Amount (₹)' : 'Discount Rate (%)';
            });
          });

          // Duration preset pills
          backdrop.querySelectorAll('.ap-duration-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const hours = parseInt(btn.dataset.hours, 10);
              const fromInput = backdrop.querySelector('#promo-modal-valid-from');
              const untilInput = backdrop.querySelector('#promo-modal-valid-until');
              if (hours === 0) {
                if (untilInput) untilInput.value = '';
              } else {
                const now = new Date();
                if (fromInput && !fromInput.value) {
                  fromInput.value = formatDatetimeLocal(now);
                }
                const start = fromInput?.value ? new Date(fromInput.value) : now;
                const expiry = new Date(start.getTime() + hours * 60 * 60 * 1000);
                if (untilInput) untilInput.value = formatDatetimeLocal(expiry);
              }
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
                    storeDropdown.innerHTML = `<div style="padding:10px 12px; font-size:12px; color:#000000; font-weight:600;">No matching merchant stores found.</div>`;
                    storeDropdown.style.display = 'block';
                  }
                  return;
                }
                if (storeDropdown) {
                  storeDropdown.innerHTML = stores.map(s => `
                    <div class="promo-store-item" data-id="${s.id}" data-name="${esc(s.storeName)}">
                      <div class="promo-store-item-name" style="color:#000000; font-weight:700;">${esc(s.storeName)}</div>
                      <div class="promo-store-item-sub" style="color:#334155;">${esc(s.bizName || s.email)} ${s.isActive ? '● Active Merchant' : ''}</div>
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
            let bankRules = [];
            let bankPartner = '';
            let bankPartners = [];
            let cardType = 'all';

            if (type === 'bank') {
              bankRules = Array.from(selectedBankRules.entries()).map(([bank, cType]) => ({
                bank,
                cardType: cType
              }));
              bankPartners = bankRules.map(r => r.bank);
              bankPartner = bankRules.map(r => r.bank + (r.cardType === 'all' ? '' : ` (${r.cardType === 'debit' ? 'Debit Only' : 'Credit Only'})`)).join(', ');
              const allTypes = new Set(bankRules.map(r => r.cardType));
              cardType = allTypes.size === 1 ? allTypes.values().next().value : 'all';
            }

            let upiProvider = '';
            let upiProviders = [];
            if (type === 'upi') {
              upiProviders = Array.from(selectedUpiApps);
              upiProvider = upiProviders.join(', ');
            }
            const validFromVal = backdrop.querySelector('#promo-modal-valid-from')?.value || null;
            const validUntilVal = backdrop.querySelector('#promo-modal-valid-until')?.value || null;
            const applicableProductsStr = backdrop.querySelector('#promo-modal-applicable-products')?.value.trim() || '';
            const applicableProducts = applicableProductsStr ? applicableProductsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

            if (!code) return showToast('Please enter a voucher code.', 'error');
            if (!title) return showToast('Please enter an offer headline/title.', 'error');
            if (discountValue <= 0) return showToast('Please enter a valid discount rate.', 'error');
            if (scope === 'store' && !selectedStoreId) {
              return showToast('Please search and select a merchant store for store-specific promotions.', 'error');
            }
            if (validFromVal && validUntilVal && new Date(validUntilVal) <= new Date(validFromVal)) {
              return showToast('Offer expiry date must be after the start date.', 'error');
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
              bankPartners,
              cardType,
              bankRules,
              upiProvider,
              upiProviders,
              description,
              validFrom: validFromVal ? new Date(validFromVal).toISOString() : null,
              validUntil: validUntilVal ? new Date(validUntilVal).toISOString() : null,
              applicableProducts,
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
                showToast(`New ${type.toUpperCase()} promotional offer created successfully!`, 'success');
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
        body.innerHTML = emptyHTML('', `Failed to load CMS: ${err.message}`);
      }
    }
    load();
  }


  /* ══════════════════════════════════════════════════════
     TAB: STAFF & RBAC (PERMISSIONS & ROLES)
     ══════════════════════════════════════════════════════ */