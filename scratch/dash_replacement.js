  let _dashFilter = { timeframe: 'day', range: 'all', startDate: '', endDate: '' };
  let _dashShowBreakdown = false;
  let _dashOrderStatusFilter = 'all'; // 'all','Pending','Confirmed','Processing','Shipped','Delivered','Cancelled','Returned'
  let _dashOrderSearch = '';
  let _dashCharts = { revenue: null, channels: null };

  async function renderDashboard(container) {
    container.innerHTML = `<div class="ap-dash-inner">${loadingHTML()}</div>`;
    try {
      const q = new URLSearchParams();
      if (_dashFilter.timeframe) q.set('timeframe', _dashFilter.timeframe);
      if (_dashFilter.range) q.set('range', _dashFilter.range);
      if (_dashFilter.range === 'custom') {
        if (_dashFilter.startDate) q.set('startDate', _dashFilter.startDate);
        if (_dashFilter.endDate) q.set('endDate', _dashFilter.endDate);
      }

      const res = await adminFetch(`/dashboard?${q.toString()}`);
      const {
        activeFilter = {},
        kpis = {},
        sparkline = [],
        breakdown = [],
        paymentMethods = [],
        categoryDistribution = [],
        topProducts = [],
        topCustomers = [],
        usersList = [],
        adminsList = [],
        supportStats = { total: 0, byStatus: [] },
        payoutsStats = { total: 0, totalAmount: 0, byStatus: [] },
        comparison = {},
        recentOrders = []
      } = res.data || {};

      const user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
      const greeting = (() => {
        const h = new Date().getHours();
        return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      })();
      const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      /* ── Authentic Database Metrics ───────────────────────── */
      const totalRevenue = kpis.totalRevenue || 0;
      const revFormatted = totalRevenue >= 100000 ? `₹${(totalRevenue / 100000).toFixed(2)} Lakhs` : fmtPrice(totalRevenue);
      const totalOrders = kpis.totalOrders || 0;
      const aov = kpis.aov || (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0);
      const totalUsers = kpis.totalUsers || 0;
      const totalAdmins = kpis.totalAdmins || adminsList.length || 0;
      const totalSellers = kpis.totalSellers || 0;
      const totalProducts = kpis.totalProducts || 0;
      const inStock = kpis.inStock || totalProducts;
      const lowStock = kpis.lowStock || 0;
      const outOfStock = kpis.outOfStock || 0;

      const pendingOrders = kpis.pendingOrders || 0;
      const pendingRevenue = kpis.pendingRevenue || 0;
      const confirmedOrders = kpis.confirmedOrders || 0;
      const processingOrders = kpis.processingOrders || 0;
      const deliveredOrders = kpis.deliveredOrders || 0;
      const cancelledOrReturned = kpis.cancelledOrReturned || 0;

      // Month-over-month / Period-over-period Comparisons
      const revenueGrowth = comparison.revenueGrowth !== undefined ? comparison.revenueGrowth : (kpis.revenueGrowth || 0);
      const ordersGrowth = comparison.ordersGrowth !== undefined ? comparison.ordersGrowth : (kpis.ordersGrowth || 0);
      const aovGrowth = comparison.aovGrowth !== undefined ? comparison.aovGrowth : (kpis.aovGrowth || 0);
      const prevPeriodLabel = comparison.prevPeriodLabel || activeFilter.prevPeriodLabel || 'vs Prior Window';
      const revenueDelta = comparison.revenueDelta !== undefined ? comparison.revenueDelta : 0;
      const ordersDelta = comparison.ordersDelta !== undefined ? comparison.ordersDelta : 0;

      /* ── Timeline Points for Charts ───────────────────────── */
      const chartPoints = (sparkline && sparkline.length > 0) ? sparkline : [
        { _id: new Date().toISOString().slice(0, 10), revenue: totalRevenue, orders: totalOrders }
      ];

      const pts = chartPoints.map((d, i) => {
        let dateStr = d._id || `Point ${i + 1}`;
        if (_dashFilter.timeframe === 'year') {
          dateStr = `Year ${d._id}`;
        } else if (_dashFilter.timeframe === 'month') {
          if (d._id && d._id.includes('-')) {
            const [y, m] = d._id.split('-');
            const dt = new Date(parseInt(y), parseInt(m) - 1, 1);
            dateStr = dt.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
          }
        } else {
          if (d._id && d._id.includes('-')) {
            const dt = new Date(`${d._id}T00:00:00`);
            dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          }
        }
        return { d, dateStr };
      });

      /* ── Authentic Recent Orders Filtered ── */
      const _ordStat = _dashOrderStatusFilter || 'all';
      const _ordSrch = (_dashOrderSearch || '').trim().toLowerCase();
      const filteredOrders = recentOrders.filter(o => {
        if (_ordStat !== 'all' && o.status !== _ordStat) return false;
        if (_ordSrch) {
          const ordId = (o.orderId || '').toLowerCase();
          const nm = (o.user?.name || '').toLowerCase();
          const em = (o.user?.email || '').toLowerCase();
          const cy = (o.city || '').toLowerCase();
          if (!ordId.includes(_ordSrch) && !nm.includes(_ordSrch) && !em.includes(_ordSrch) && !cy.includes(_ordSrch)) return false;
        }
        return true;
      });
      const statusOptions = ['all','Pending','Confirmed','Processing','Shipped','Delivered','Cancelled','Returned'];

      /* ── Timeframe Pills Builder ─────────────────────────── */
      const tf = _dashFilter.timeframe || 'day';
      const rng = _dashFilter.range || 'all';

      let pillsHTML = '';
      if (tf === 'day') {
        pillsHTML = `
          <button type="button" class="ap-timeframe-pill ${rng === 'all' ? 'active' : ''}" data-rng="all">All Time</button>
          <button type="button" class="ap-timeframe-pill ${rng === 'today' ? 'active' : ''}" data-rng="today">Today</button>
          <button type="button" class="ap-timeframe-pill highlight-prev ${rng === 'yesterday' ? 'active' : ''}" data-rng="yesterday" title="Track previous day's metrics">
            Yesterday (Previous Day)
          </button>
          <button type="button" class="ap-timeframe-pill ${rng === '7d' ? 'active' : ''}" data-rng="7d">Last 7 Days</button>
          <button type="button" class="ap-timeframe-pill ${rng === '30d' ? 'active' : ''}" data-rng="30d">Last 30 Days</button>
          <button type="button" class="ap-timeframe-pill ${rng === 'custom' ? 'active' : ''}" data-rng="custom" id="ap-pill-custom">
            Custom Date / Range
          </button>
        `;
      } else if (tf === 'month') {
        pillsHTML = `
          <button type="button" class="ap-timeframe-pill ${rng === 'all' ? 'active' : ''}" data-rng="all">All Months</button>
          <button type="button" class="ap-timeframe-pill ${rng === 'this_month' ? 'active' : ''}" data-rng="this_month">This Month</button>
          <button type="button" class="ap-timeframe-pill highlight-prev ${rng === 'last_month' ? 'active' : ''}" data-rng="last_month" title="Track previous month's metrics">
            Last Month (Previous Month)
          </button>
          <button type="button" class="ap-timeframe-pill ${rng === '6m' ? 'active' : ''}" data-rng="6m">Last 6 Months</button>
          <button type="button" class="ap-timeframe-pill ${rng === 'this_year' ? 'active' : ''}" data-rng="this_year">This Year</button>
        `;
      } else {
        pillsHTML = `
          <button type="button" class="ap-timeframe-pill ${rng === 'all' ? 'active' : ''}" data-rng="all">All Years</button>
          <button type="button" class="ap-timeframe-pill ${rng === 'this_year' ? 'active' : ''}" data-rng="this_year">This Year (${new Date().getFullYear()})</button>
          <button type="button" class="ap-timeframe-pill highlight-prev ${rng === 'last_year' ? 'active' : ''}" data-rng="last_year" title="Track previous year's metrics">
            Last Year (${new Date().getFullYear() - 1})
          </button>
        `;
      }

      /* ── Growth Badges Helper ───────────────────────────── */
      const growthBadge = (val, label) => {
        if (val === undefined || val === null) return '';
        const isPos = val > 0;
        const isNeg = val < 0;
        const sign = isPos ? '+' : '';
        const arrow = isPos ? '▲ ' : isNeg ? '▼ ' : '';
        return `
          <span class="dash-highlight-badge" title="${esc(label || prevPeriodLabel)}">
            ${arrow}${sign}${val}%
          </span>
        `;
      };

      /* ── Build Recent Orders Table Rows ──────────────────── */
      const ordersHTML = `
        <div class="ap-dash-orders-toolbar">
          <div class="ap-dash-orders-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="ap-dash-order-search" class="ap-dash-order-search-input" placeholder="Search by order ID, customer, city…" value="${esc(_dashOrderSearch)}" />
          </div>
          <select id="ap-dash-order-status-filter" class="ap-dash-order-status-select">
            ${statusOptions.map(s => `<option value="${s}" ${_ordStat === s ? 'selected' : ''}>${s === 'all' ? 'All Statuses' : s}</option>`).join('')}
          </select>
          <button class="ap-btn ghost" id="ap-dash-export-csv" style="font-size:11.5px; font-weight:700; display:flex; align-items:center; gap:5px;" title="Export filtered orders to CSV">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button class="ap-btn ghost" id="ap-dash-view-all-orders" style="font-size:11.5px; font-weight:700;">
            View All Orders &rarr;
          </button>
        </div>
        <div class="dash-scrollable-body" style="max-height: 380px;">
          <table class="ap-table" style="margin: 0;">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Items Preview</th>
                <th>City</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
                <th style="text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.length ? filteredOrders.map(o => {
                const name = o.user?.name || 'Customer';
                const initials = name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'C';
                const ordId = o.orderId || `XM-${(o._id||'').slice(-8).toUpperCase()}`;
                const statusBadgeClass = o.status === 'Delivered' ? 'green' : o.status === 'Confirmed' ? 'blue' : (o.status === 'Cancelled' || o.status === 'Returned') ? 'red' : 'orange';
                const payColor = (o.paymentMethod||'').toLowerCase().includes('cod') ? '#f59e0b' : (o.paymentMethod||'').toLowerCase().includes('upi') ? '#10b981' : (o.paymentMethod||'').toLowerCase().includes('card') ? '#2563eb' : '#7c3aed';
                const itemChips = (o.orderItems || []).slice(0, 2).map(it => `<span class="ap-dash-item-chip" title="${esc(it.name)}"><img src="${esc(it.image||'logo-square.png')}" onerror="this.src='logo-square.png'" />${esc(it.name.slice(0,14))}${it.name.length>14?'…':''} ×${it.qty||1}</span>`).join('');
                const moreChips = (o.orderItems||[]).length > 2 ? `<span class="ap-dash-item-chip" style="background:#f1f5f9;color:#475569;">+${(o.orderItems.length-2)} more</span>` : '';
                return `
                  <tr>
                    <td>
                      <span style="font-family:monospace; font-weight:800; color:#022f43; font-size:12px;">${ordId}</span>
                      <div style="font-size:10.5px; color:#94a3b8; margin-top:2px;">${fmtDate(o.date)}</div>
                    </td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px;">
                        <div class="ap-dash-avatar" style="background:#022f43;">${initials}</div>
                        <div style="min-width:0;">
                          <div style="font-weight:700; color:#0f172a; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;">${esc(name)}</div>
                          <div style="font-size:10.5px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;">${esc(o.user?.email || '')}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="ap-dash-item-chips">${itemChips}${moreChips}</div>
                    </td>
                    <td>
                      <span style="font-size:11.5px; font-weight:600; color:#334155;">${esc(o.city||'—')}</span>
                    </td>
                    <td>
                      <span style="font-size:11.5px; font-weight:700; color:${payColor}; background:${payColor}18; padding:2px 8px; border-radius:6px; display:inline-block; white-space:nowrap;">
                        ${esc(o.paymentMethod || 'Online')}
                      </span>
                    </td>
                    <td>
                      <div style="font-weight:800; color:#022f43; font-size:13px;">${fmtPrice(o.total || 0)}</div>
                    </td>
                    <td>
                      <span class="ap-badge ${statusBadgeClass}">${o.status || 'Pending'}</span>
                    </td>
                    <td style="text-align:right;">
                      <button class="ap-btn ghost ap-dash-inspect-order" data-id="${ordId}" style="padding:4px 9px; font-size:11px; font-weight:700;">
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="8" style="text-align:center; padding:36px; color:#94a3b8; font-weight:600;">
                    ${recentOrders.length ? 'No orders match the current filter.' : 'No customer orders in this time window.'}
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      `;

      /* ── Build Users List Table Rows ─────────────────────── */
      const usersRows = usersList.length ? usersList.map(u => {
        const initials = (u.name || 'User').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
        const roleBadge = u.isSeller
          ? `<span class="dash-highlight-badge" style="font-size:10px;">Seller: ${esc(u.sellerStore || 'Store')}</span>`
          : `<span class="ap-badge blue" style="font-size:10px;">Customer</span>`;
        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <div class="ap-dash-avatar" style="background:#022f43;">${initials}</div>
                <div>
                  <div style="font-weight:700; color:#0f172a; font-size:12px;">${esc(u.name || 'Customer')}</div>
                  <div style="font-size:10.5px; color:#64748b;">${esc(u.email || '')}</div>
                </div>
              </div>
            </td>
            <td>${roleBadge}</td>
            <td>
              <span style="font-size:11px; color:#64748b;">${fmtDate(u.createdAt)}</span>
            </td>
            <td style="text-align:right;">
              <button class="ap-btn ghost ap-dash-open-user" style="padding:3px 8px; font-size:10.5px; font-weight:700;" onclick="switchTab('users')">
                View &rarr;
              </button>
            </td>
          </tr>
        `;
      }).join('') : `
        <tr>
          <td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">No registered customers loaded.</td>
        </tr>
      `;

      /* ── Build Admins List Table Rows ────────────────────── */
      const adminsRows = adminsList.length ? adminsList.map(a => {
        const initials = (a.name || 'Admin').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'A';
        const isSuper = (a.role === 'admin');
        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <div class="ap-dash-avatar" style="background:#ff9400; color:#000000; font-weight:800;">${initials}</div>
                <div>
                  <div style="font-weight:700; color:#0f172a; font-size:12px;">${esc(a.name || 'Admin Staff')}</div>
                  <div style="font-size:10.5px; color:#64748b;">${esc(a.email || '')}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="dash-highlight-badge" style="font-size:10px;">${isSuper ? 'Super Admin' : 'Admin Staff'}</span>
            </td>
            <td>
              <span style="font-size:11px; color:#64748b;">${fmtDate(a.createdAt)}</span>
            </td>
            <td style="text-align:right;">
              <span class="ap-badge green" style="font-size:10px;">Active</span>
            </td>
          </tr>
        `;
      }).join('') : `
        <tr>
          <td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">No administrator accounts found.</td>
        </tr>
      `;

      /* ── Build Top Customers Table Rows ──────────────────── */
      const topCustomersRows = topCustomers.length ? topCustomers.map((c, idx) => {
        return `
          <tr>
            <td>
              <span class="dash-highlight-badge" style="padding:2px 6px; font-size:10.5px;">#${idx + 1}</span>
            </td>
            <td>
              <div style="font-weight:700; color:#0f172a; font-size:12px;">${esc(c.name || 'Customer')}</div>
              <div style="font-size:10.5px; color:#64748b;">${esc(c.email || 'N/A')}</div>
            </td>
            <td>
              <span class="ap-badge blue" style="font-size:11px; font-weight:700;">${c.ordersCount || 0} orders</span>
            </td>
            <td>
              <span style="font-weight:800; color:#022f43; font-size:13px;">${fmtPrice(c.totalSpent || 0)}</span>
            </td>
            <td style="font-size:11px; color:#64748b;">
              ${fmtDate(c.lastOrder)}
            </td>
          </tr>
        `;
      }).join('') : `
        <tr>
          <td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No customer purchase data available.</td>
        </tr>
      `;

      /* ── Build Support Ticket Status Cards ───────────────── */
      const supportByStatus = supportStats.byStatus || [];
      const supportStatusHTML = supportByStatus.length ? supportByStatus.map(st => `
        <div class="dash-status-item">
          <span style="font-weight:700; color:#022f43;">● ${esc(st._id || 'Open')}</span>
          <span class="dash-highlight-badge">${st.count} tickets</span>
        </div>
      `).join('') : `
        <div style="font-size:12px; color:#94a3b8; text-align:center; padding:12px;">No active support tickets.</div>
      `;

      /* ── Build Payouts Breakdown Cards ───────────────────── */
      const payoutsByStatus = payoutsStats.byStatus || [];
      const payoutsStatusHTML = payoutsByStatus.length ? payoutsByStatus.map(p => `
        <div class="dash-status-item">
          <div>
            <span style="font-weight:700; color:#022f43;">● ${esc(p._id || 'Pending')}</span>
            <span style="font-size:11px; color:#64748b; margin-left:4px;">(${p.count} records)</span>
          </div>
          <span class="dash-highlight-badge">${fmtPrice(p.total || 0)}</span>
        </div>
      `).join('') : `
        <div style="font-size:12px; color:#94a3b8; text-align:center; padding:12px;">No payouts recorded.</div>
      `;

      /* ── Assemble Full Modern Dashboard HTML ─────────────── */
      container.innerHTML = `
        <div class="dash-modern-container">
          <!-- 1. Header Command Banner (#022f43 background, #ff9400 highlight) -->
          <div class="dash-command-banner">
            <div>
              <h2>
                <span>${greeting}, ${(user?.name || 'Admin').split(' ')[0]}</span>
                <span class="dash-highlight-badge">Super Admin Console</span>
              </h2>
              <p>
                Enterprise Command Intelligence &amp; Live Operations. Real-time metrics powered 100% by active database telemetry.
              </p>
            </div>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.1); padding:6px 12px; border-radius:8px; font-size:12px; color:#ffffff;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>${todayStr}</span>
              </div>
              <button class="ap-btn ghost" id="ap-dash-quick-prod" style="font-size:12px; font-weight:700; color:#ffffff; border-color:rgba(255,255,255,0.3);">
                + Add Product
              </button>
              <button class="ap-btn ghost" id="ap-dash-quick-orders" style="font-size:12px; font-weight:700; color:#ffffff; border-color:rgba(255,255,255,0.3);">
                Manage Orders
              </button>
              <button class="dash-highlight-badge" id="ap-dash-quick-refresh" style="font-size:12px; padding:7px 14px; cursor:pointer;">
                ↻ Refresh Live Data
              </button>
            </div>
          </div>

          <!-- 2. Interactive Timeframe & Historical Analytics Controller -->
          <div class="dash-timeframe-container">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <!-- Mode Tabs -->
              <div class="ap-timeframe-modes">
                <button type="button" class="ap-timeframe-mode-btn ${tf === 'day' ? 'active' : ''}" data-tf="day">Day-wise</button>
                <button type="button" class="ap-timeframe-mode-btn ${tf === 'month' ? 'active' : ''}" data-tf="month">Month-wise</button>
                <button type="button" class="ap-timeframe-mode-btn ${tf === 'year' ? 'active' : ''}" data-tf="year">Year-wise</button>
              </div>

              <!-- Filter Pills -->
              <div class="ap-timeframe-pills">
                ${pillsHTML}
              </div>
            </div>

            <!-- Custom Date Range Box (If custom selected) -->
            <div class="ap-custom-date-box ${rng === 'custom' ? 'is-open' : ''}" id="ap-custom-date-container">
              <span style="font-size:12px; font-weight:700; color:#022f43;">Pick Date / Range:</span>
              <label style="font-size:11.5px; color:#64748b; display:flex; align-items:center; gap:4px;">
                From: <input type="date" class="ap-custom-date-input" id="ap-custom-date-start" value="${_dashFilter.startDate || ''}" />
              </label>
              <label style="font-size:11.5px; color:#64748b; display:flex; align-items:center; gap:4px;">
                To: <input type="date" class="ap-custom-date-input" id="ap-custom-date-end" value="${_dashFilter.endDate || ''}" />
              </label>
              <button type="button" class="dash-highlight-badge" id="ap-custom-date-apply" style="padding:6px 12px; cursor:pointer;">
                Apply Range
              </button>
            </div>

            <!-- Active Filter Comparison Banner -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding-top:6px; border-top:1px solid #f1f5f9; font-size:12px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span class="dash-highlight-badge">${tf.toUpperCase()}WISE</span>
                <span style="color:#022f43; font-weight:700;">Active Window: ${esc(activeFilter.label || 'All Time History')}</span>
                <span style="color:#94a3b8;">•</span>
                <span>Revenue Growth: ${growthBadge(revenueGrowth, prevPeriodLabel)}</span>
                <span style="color:#94a3b8;">•</span>
                <span>Orders Growth: ${growthBadge(ordersGrowth, prevPeriodLabel)}</span>
                <span style="color:#94a3b8;">•</span>
                <span>Delta: <strong style="color:#022f43;">${revenueDelta >= 0 ? '+' : ''}${fmtPrice(revenueDelta)}</strong></span>
              </div>
              ${rng !== 'all' || tf !== 'day' ? `
                <button type="button" class="ap-btn ghost" id="ap-timeframe-reset-btn" style="padding:2px 8px; font-size:11px; font-weight:700;">
                  Reset to All Time ✕
                </button>
              ` : ''}
            </div>
          </div>

          <!-- 3. Primary 8-KPI Cards Grid (#022f43 & #ff9400 accents) -->
          <div class="dash-grid-4">
            <!-- Card 1: Gross Sales GMV -->
            <div class="dash-kpi-card highlight">
              <div class="dash-kpi-top">
                <span class="dash-kpi-title">Gross Revenue (GMV)</span>
                <div class="dash-kpi-icon" style="background:#ff9400; color:#000000;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>
              <div class="dash-kpi-val">${revFormatted}</div>
              <div class="dash-kpi-footer">
                <span>AOV: <strong>${fmtPrice(aov)}</strong></span>
                <span style="margin-left:auto;">${growthBadge(revenueGrowth)}</span>
              </div>
            </div>

            <!-- Card 2: Total Orders Placed -->
            <div class="dash-kpi-card">
              <div class="dash-kpi-top">
                <span class="dash-kpi-title">Total Orders</span>
                <div class="dash-kpi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
              </div>
              <div class="dash-kpi-val">${totalOrders.toLocaleString('en-IN')}</div>
              <div class="dash-kpi-footer">
                <span>${pendingOrders} Pending • ${confirmedOrders} Confirmed</span>
                <span style="margin-left:auto;">${growthBadge(ordersGrowth)}</span>
              </div>
            </div>

            <!-- Card 3: Average Order Value -->
            <div class="dash-kpi-card">
              <div class="dash-kpi-top">
                <span class="dash-kpi-title">Avg Order Value (AOV)</span>
                <div class="dash-kpi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
              </div>
              <div class="dash-kpi-val">${fmtPrice(aov)}</div>
              <div class="dash-kpi-footer">
                <span>Per transaction spend</span>
                <span style="margin-left:auto;">${growthBadge(aovGrowth)}</span>
              </div>
            </div>

            <!-- Card 4: Registered Customers -->
            <div class="dash-kpi-card">
              <div class="dash-kpi-top">
                <span class="dash-kpi-title">Total Customers</span>
                <div class="dash-kpi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
              <div class="dash-kpi-val">${totalUsers.toLocaleString('en-IN')}</div>
              <div class="dash-kpi-footer">
                <span>Active buyer community</span>
                <span class="dash-highlight-badge" style="margin-left:auto;">${usersList.length} Active</span>
              </div>
            </div>

            <!-- Card 5: Admin & Privileged Staff -->
            <div class="dash-kpi-card">
              <div class="dash-kpi-top">
                <span class="dash-kpi-title">Admins &amp; Staff</span>
                <div class="dash-kpi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/></svg>
                </div>
              </div>
              <div class="dash-kpi-val">${totalAdmins.toLocaleString('en-IN')}</div>
              <div class="dash-kpi-footer">
                <span>Enterprise access granted</span>
                <span class="dash-highlight-badge" style="margin-left:auto;">Full Access</span>
              </div>
            </div>

            <!-- Card 6: Verified Marketplace Sellers -->
            <div class="dash-kpi-card">
              <div class="dash-kpi-top">
                <span class="dash-kpi-title">Active Sellers</span>
                <div class="dash-kpi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
              </div>
              <div class="dash-kpi-val">${totalSellers.toLocaleString('en-IN')}</div>
              <div class="dash-kpi-footer">
                <span>Store merchants on platform</span>
                <span class="ap-badge green" style="margin-left:auto;">Verified</span>
              </div>
            </div>

            <!-- Card 7: Catalog Inventory -->
            <div class="dash-kpi-card">
              <div class="dash-kpi-top">
                <span class="dash-kpi-title">Catalog SKUs</span>
                <div class="dash-kpi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                </div>
              </div>
              <div class="dash-kpi-val">${totalProducts.toLocaleString('en-IN')}</div>
              <div class="dash-kpi-footer">
                <span>${inStock} in stock • ${lowStock} low</span>
                <span class="ap-badge ${outOfStock > 0 ? 'red' : 'green'}" style="margin-left:auto;">${outOfStock} OOS</span>
              </div>
            </div>

            <!-- Card 8: Pending Revenue (At Risk) -->
            <div class="dash-kpi-card highlight">
              <div class="dash-kpi-top">
                <span class="dash-kpi-title">Pending Revenue</span>
                <div class="dash-kpi-icon" style="background:#ff9400; color:#000000;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
              </div>
              <div class="dash-kpi-val" style="color:#ff9400;">${pendingRevenue >= 100000 ? '₹'+(pendingRevenue/100000).toFixed(2)+' L' : fmtPrice(pendingRevenue)}</div>
              <div class="dash-kpi-footer">
                <span>${pendingOrders} orders awaiting fulfillment</span>
                <span class="dash-highlight-badge" style="margin-left:auto;">In Queue</span>
              </div>
            </div>
          </div>

          <!-- 4. Interactive Chart.js Visualizations (Dual-Chart Section) -->
          <div class="dash-grid-2">
            <!-- Left Chart: Revenue & Orders Timeline -->
            <div class="dash-panel">
              <div class="dash-panel-header">
                <h3>Sales Velocity &amp; Revenue Trajectory</h3>
                <span class="dash-highlight-badge">Chart.js Analytics</span>
              </div>
              <div class="dash-chart-card-body">
                <canvas id="ap-dash-chart-revenue" style="width:100%; height:260px;"></canvas>
              </div>
            </div>

            <!-- Right Chart: Payment Channels & Operations Mix -->
            <div class="dash-panel">
              <div class="dash-panel-header">
                <h3>Payment Methods &amp; Order Mix</h3>
                <span class="dash-highlight-badge">Distribution</span>
              </div>
              <div class="dash-chart-card-body">
                <canvas id="ap-dash-chart-channels" style="width:100%; height:260px;"></canvas>
              </div>
            </div>
          </div>

          <!-- 5. Support Tickets & Marketplace Payouts Status Command Center -->
          <div class="dash-grid-2">
            <!-- Left: Support Desk Status -->
            <div class="dash-panel">
              <div class="dash-panel-header">
                <h3>Support Desk Intelligence</h3>
                <span class="dash-highlight-badge">${supportStats.total || 0} Total Tickets</span>
              </div>
              <div class="dash-scrollable-body" style="padding:16px; display:flex; flex-direction:column; gap:10px; max-height:260px;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#475569; margin-bottom:4px;">
                  <span>Live Resolution Status</span>
                  <span style="font-weight:700; color:#022f43;">${supportStats.total || 0} Customer Tickets</span>
                </div>
                ${supportStatusHTML}
                <div style="margin-top:auto; padding-top:8px; display:flex; justify-content:flex-end;">
                  <button class="ap-btn ghost" onclick="switchTab('support')" style="font-size:11.5px; font-weight:700;">
                    Open Support Desk &rarr;
                  </button>
                </div>
              </div>
            </div>

            <!-- Right: Seller Payouts Disbursals -->
            <div class="dash-panel">
              <div class="dash-panel-header">
                <h3>Seller Payouts &amp; Disbursal Status</h3>
                <span class="dash-highlight-badge">${payoutsStats.total || 0} Payouts</span>
              </div>
              <div class="dash-scrollable-body" style="padding:16px; display:flex; flex-direction:column; gap:10px; max-height:260px;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#475569; margin-bottom:4px;">
                  <span>Financial Settlement Status</span>
                  <span style="font-weight:700; color:#022f43;">Total: ${fmtPrice(payoutsStats.totalAmount || 0)}</span>
                </div>
                ${payoutsStatusHTML}
                <div style="margin-top:auto; padding-top:8px; display:flex; justify-content:flex-end;">
                  <button class="ap-btn ghost" onclick="switchTab('payouts')" style="font-size:11.5px; font-weight:700;">
                    Inspect Payouts Ledger &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 6. User and Admin Directory Grids with overflow-y: auto -->
          <div class="dash-grid-2">
            <!-- Left: Admins and Privileged Staff -->
            <div class="dash-panel">
              <div class="dash-panel-header">
                <h3>Administrators &amp; Privileged Staff</h3>
                <span class="dash-highlight-badge">${adminsList.length} Active Admins</span>
              </div>
              <div class="dash-scrollable-body" style="max-height: 310px;">
                <table class="ap-table" style="margin:0;">
                  <thead>
                    <tr>
                      <th>Administrator</th>
                      <th>Access Tier</th>
                      <th>Created</th>
                      <th style="text-align:right;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${adminsRows}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Right: Registered Customers -->
            <div class="dash-panel">
              <div class="dash-panel-header">
                <h3>Registered Customers &amp; Merchants</h3>
                <span class="dash-highlight-badge">${usersList.length} Accounts</span>
              </div>
              <div class="dash-scrollable-body" style="max-height: 310px;">
                <table class="ap-table" style="margin:0;">
                  <thead>
                    <tr>
                      <th>Customer Profile</th>
                      <th>Account Role</th>
                      <th>Joined</th>
                      <th style="text-align:right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${usersRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 7. High-Value Customers & Live Orders Stream -->
          <div class="dash-grid-2">
            <!-- Left: Top High-Value Customers (LTV) -->
            <div class="dash-panel">
              <div class="dash-panel-header">
                <h3>Top Spending Customers</h3>
                <span class="dash-highlight-badge">High Lifetime Value</span>
              </div>
              <div class="dash-scrollable-body" style="max-height: 440px;">
                <table class="ap-table" style="margin:0;">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Customer</th>
                      <th>Orders</th>
                      <th>Total Spend</th>
                      <th>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${topCustomersRows}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Right: Top Selling Products & Catalog Health -->
            <div class="dash-panel">
              <div class="dash-panel-header">
                <h3>Top Selling Catalog Products</h3>
                <span class="dash-highlight-badge">By Revenue</span>
              </div>
              <div class="dash-scrollable-body" style="padding:16px 20px; max-height:440px;">
                <div style="display:flex; flex-direction:column; gap:12px;">
                  ${topProducts.length ? (() => {
                    const maxRev2 = Math.max(...topProducts.map(p => p.revenue || 0), 1);
                    return topProducts.map((p, idx) => `
                      <div class="ap-dash-top-prod-row">
                        <span class="dash-highlight-badge" style="width:24px; justify-content:center;">#${idx + 1}</span>
                        <img src="${esc(p.image || 'logo-square.png')}" alt="${esc(p.name)}" class="ap-dash-prod-img" onerror="this.src='logo-square.png'" />
                        <div style="flex:1; min-width:0;">
                          <div style="font-size:12.5px; font-weight:700; color:#022f43; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(p.name)}</div>
                          <div style="margin-top:4px; height:5px; background:#f1f5f9; border-radius:99px; overflow:hidden;">
                            <div style="width:${Math.round((p.revenue/maxRev2)*100)}%; height:100%; background:linear-gradient(90deg, #022f43, #ff9400); border-radius:99px;"></div>
                          </div>
                          <div style="font-size:10.5px; color:#64748b; margin-top:2px;">${p.count} unit${p.count>1?'s':''} sold</div>
                        </div>
                        <div style="font-weight:800; font-size:13px; color:#022f43; white-space:nowrap; margin-left:8px;">${fmtPrice(p.revenue)}</div>
                      </div>
                    `).join('');
                  })() : `<div style="font-size:12px; color:#94a3b8; text-align:center; padding:12px;">No sales data in this window.</div>`}
                </div>
              </div>
            </div>
          </div>

          <!-- 8. Live Customer Order Stream (Full width, with overflow-y: auto) -->
          <div class="dash-panel">
            <div class="dash-panel-header">
              <h3>Live Customer Order Stream</h3>
              <span class="dash-highlight-badge">${filteredOrders.length} of ${recentOrders.length} Orders</span>
            </div>
            ${ordersHTML}
          </div>
        </div>
      `;

      /* ── Initialize Chart.js Instances ─────────────────────── */
      if (_dashCharts.revenue) { try { _dashCharts.revenue.destroy(); } catch(e){} }
      if (_dashCharts.channels) { try { _dashCharts.channels.destroy(); } catch(e){} }

      function initDashCharts() {
        if (typeof Chart === 'undefined') {
          return;
        }

        // 1. Revenue & Order Trajectory Chart
        const revCanvas = container.querySelector('#ap-dash-chart-revenue');
        if (revCanvas) {
          const revCtx = revCanvas.getContext('2d');
          const labels = pts.map(p => p.dateStr);
          const revData = pts.map(p => p.d?.revenue || 0);
          const ordData = pts.map(p => p.d?.orders || 0);

          _dashCharts.revenue = new Chart(revCtx, {
            type: 'bar',
            data: {
              labels,
              datasets: [
                {
                  type: 'line',
                  label: 'Gross Sales (₹)',
                  data: revData,
                  borderColor: '#022f43',
                  backgroundColor: 'rgba(2, 47, 67, 0.08)',
                  borderWidth: 2.5,
                  fill: true,
                  tension: 0.35,
                  yAxisID: 'y',
                  pointBackgroundColor: '#ff9400',
                  pointBorderColor: '#022f43',
                  pointRadius: 4,
                  pointHoverRadius: 6
                },
                {
                  type: 'bar',
                  label: 'Order Volume',
                  data: ordData,
                  backgroundColor: 'rgba(255, 148, 0, 0.65)',
                  borderColor: '#ff9400',
                  borderWidth: 1.5,
                  borderRadius: 4,
                  yAxisID: 'y1'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: {
                  position: 'top',
                  labels: { font: { weight: 'bold', size: 11 } }
                },
                tooltip: {
                  callbacks: {
                    label: function(ctx) {
                      if (ctx.dataset.yAxisID === 'y') {
                        return ' Gross Sales: ₹' + Number(ctx.raw || 0).toLocaleString('en-IN');
                      }
                      return ' Order Volume: ' + ctx.raw + ' orders';
                    }
                  }
                }
              },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: {
                  type: 'linear',
                  position: 'left',
                  ticks: {
                    callback: v => v >= 100000 ? '₹' + (v/100000).toFixed(1) + 'L' : v >= 1000 ? '₹' + (v/1000).toFixed(0) + 'k' : '₹' + v,
                    font: { size: 10 }
                  }
                },
                y1: {
                  type: 'linear',
                  position: 'right',
                  grid: { drawOnChartArea: false },
                  ticks: { font: { size: 10 }, stepSize: 1 }
                }
              }
            }
          });
        }

        // 2. Payment & Pipeline Mix Chart
        const chanCanvas = container.querySelector('#ap-dash-chart-channels');
        if (chanCanvas) {
          const chanCtx = chanCanvas.getContext('2d');
          const pmLabels = paymentMethods.map(p => p.method);
          const pmData = paymentMethods.map(p => p.count);
          _dashCharts.channels = new Chart(chanCtx, {
            type: 'doughnut',
            data: {
              labels: pmLabels.length ? pmLabels : ['Online', 'COD'],
              datasets: [{
                data: pmData.length ? pmData : [1, 0],
                backgroundColor: ['#022f43', '#ff9400', '#10b981', '#2563eb', '#7c3aed', '#ef4444'],
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } }
                }
              }
            }
          });
        }
      }

      setTimeout(initDashCharts, 60);

      /* ── Interactive Action Handlers ─────────────────────── */
      container.querySelector('#ap-dash-quick-prod')?.addEventListener('click', () => switchTab('products'));
      container.querySelector('#ap-dash-quick-orders')?.addEventListener('click', () => switchTab('orders'));
      container.querySelector('#ap-dash-quick-refresh')?.addEventListener('click', () => renderDashboard(container));
      container.querySelector('#ap-dash-view-all-orders')?.addEventListener('click', () => switchTab('orders'));

      // Export filtered orders to CSV
      container.querySelector('#ap-dash-export-csv')?.addEventListener('click', () => {
        if (!filteredOrders.length) {
          showToast('No orders available to export', 'info');
          return;
        }
        const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Items', 'City', 'Payment Method', 'Total', 'Status'];
        const rows = filteredOrders.map(o => [
          o.orderId || o._id,
          o.date ? new Date(o.date).toISOString().slice(0, 10) : '',
          `"${(o.user?.name || 'Customer').replace(/"/g, '""')}"`,
          `"${(o.user?.email || '').replace(/"/g, '""')}"`,
          `"${(o.orderItems || []).map(it => `${it.name} (x${it.qty})`).join('; ').replace(/"/g, '""')}"`,
          `"${(o.city || '').replace(/"/g, '""')}"`,
          `"${(o.paymentMethod || 'Online').replace(/"/g, '""')}"`,
          o.total || 0,
          `"${(o.status || 'Pending').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `xmart-orders-${_dashFilter.timeframe || 'day'}-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Exported ${filteredOrders.length} orders to CSV`, 'success');
      });

      // Timeframe Mode Switching (Day-wise / Month-wise / Year-wise)
      container.querySelectorAll('.ap-timeframe-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.ap-timeframe-mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const newTf = btn.dataset.tf;
          if (newTf !== _dashFilter.timeframe) {
            _dashFilter.timeframe = newTf;
            _dashFilter.range = 'all';
            _dashFilter.startDate = '';
            _dashFilter.endDate = '';
            renderDashboard(container);
          }
        });
      });

      // Quick Period Pills
      container.querySelectorAll('.ap-timeframe-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.ap-timeframe-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const rng = btn.dataset.rng;
          if (rng === 'custom') {
            const box = container.querySelector('#ap-custom-date-container');
            if (box) {
              const isOpen = box.classList.toggle('is-open');
              btn.classList.toggle('active', isOpen);
            }
          } else {
            _dashFilter.range = rng;
            _dashFilter.startDate = '';
            _dashFilter.endDate = '';
            renderDashboard(container);
          }
        });
      });

      // Custom Date Range Apply
      container.querySelector('#ap-custom-date-apply')?.addEventListener('click', () => {
        const startVal = container.querySelector('#ap-custom-date-start')?.value;
        const endVal = container.querySelector('#ap-custom-date-end')?.value;
        if (!startVal) {
          showNotification('Please select a start date', 'warning');
          return;
        }
        _dashFilter.range = 'custom';
        _dashFilter.startDate = startVal;
        _dashFilter.endDate = endVal || startVal;
        renderDashboard(container);
      });

      // Reset Filter Button
      container.querySelector('#ap-timeframe-reset-btn')?.addEventListener('click', () => {
        _dashFilter = { timeframe: 'day', range: 'all', startDate: '', endDate: '' };
        renderDashboard(container);
      });

      // Inspect order button
      container.querySelectorAll('.ap-dash-inspect-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const ordId = btn.dataset.id;
          switchTab('orders');
          setTimeout(() => {
            const input = _overlay.querySelector('#ap-order-search-input');
            if (input) {
              input.value = ordId;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }, 300);
        });
      });

      // Inline order search in dashboard
      const dashOrderSearch = container.querySelector('#ap-dash-order-search');
      if (dashOrderSearch) {
        let _searchDebounce;
        dashOrderSearch.addEventListener('input', () => {
          clearTimeout(_searchDebounce);
          _searchDebounce = setTimeout(() => {
            _dashOrderSearch = dashOrderSearch.value;
            const statSel = container.querySelector('#ap-dash-order-status-filter');
            if (statSel) _dashOrderStatusFilter = statSel.value;
            renderDashboard(container);
          }, 380);
        });
      }

      // Status filter select in dashboard orders
      const dashStatusSel = container.querySelector('#ap-dash-order-status-filter');
      if (dashStatusSel) {
        dashStatusSel.addEventListener('change', () => {
          _dashOrderStatusFilter = dashStatusSel.value;
          const srch = container.querySelector('#ap-dash-order-search');
          if (srch) _dashOrderSearch = srch.value;
          renderDashboard(container);
        });
      }

    } catch (err) {
      container.innerHTML = `<div class="ap-dash-inner">${emptyHTML('', `Failed to load dashboard: ${err.message}`)}</div>`;
    }
  }
