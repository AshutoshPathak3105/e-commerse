const http = require('http');

function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:8000' + path, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error('Invalid JSON: ' + raw.slice(0, 100)));
        }
      });
    }).on('error', reject);
  });
}

function fmtPrice(amt) {
  return `₹${Number(amt || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function statusBadge(s) {
  return `<span class="badge">${s}</span>`;
}

async function testAll() {
  console.log('Testing dashboard...');
  const dashRes = await fetchJSON('/api/admin/dashboard');
  const {
    activeFilter = {},
    kpis = {},
    sparkline = [],
    breakdown = [],
    paymentMethods = [],
    categoryDistribution = [],
    topProducts = [],
    recentOrders = []
  } = dashRes.data || {};

  // Test mobile orders render in dashboard
  const mobileCards = recentOrders.map(o => {
    const name = o.user?.name || 'Customer';
    const initials = name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'C';
    const ordId = o.orderId || `XM-${(o._id||'').slice(-8).toUpperCase()}`;
    const statusBadgeClass = o.status === 'Delivered' ? 'green' : o.status === 'Confirmed' ? 'blue' : (o.status === 'Cancelled' || o.status === 'Returned') ? 'red' : 'orange';
    return { ordId, name, initials, total: fmtPrice(o.total || 0) };
  });
  console.log('Dashboard mobile recentOrders OK, count:', mobileCards.length);

  // Test top products render
  const topProdHTML = topProducts.map((p, idx) => {
    return { name: p.name, units: `${p.count} units sold`, rev: fmtPrice(p.revenue) };
  });
  console.log('Dashboard topProducts OK, count:', topProdHTML.length);

  // Test payment methods
  const payHTML = paymentMethods.map(pm => {
    const barColor = pm.method.toLowerCase().includes('cod') ? '#f59e0b' : '#2563eb';
    return { method: pm.method, pct: pm.percentage };
  });
  console.log('Dashboard paymentMethods OK, count:', payHTML.length);

  // Test orders pipeline
  console.log('\nTesting orders pipeline...');
  const ordRes = await fetchJSON('/api/admin/orders');
  const orders = ordRes.data?.orders || [];
  const mobilePipeline = orders.map((o, idx) => {
    const itemsCount = (o.items || []).length;
    const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
    return {
      id: o.orderId,
      user: o.user?.name,
      itemsCount
    };
  });
  console.log('Orders pipeline mobile OK, count:', mobilePipeline.length);

  // Test customer-service / returns
  console.log('\nTesting customer service...');
  const csRes = await fetchJSON('/api/admin/customer-service');
  const returnOrders = csRes.data?.returnOrders || [];
  const mobileReturns = returnOrders.map(o => {
    const rr = o.returnRequest || {};
    const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
    return {
      id: o.orderId,
      rma: rr.rmaNumber,
      itemsSummary
    };
  });
  console.log('Customer service mobile returns OK, count:', mobileReturns.length);
}

testAll().catch(e => console.error('FATAL TEST ERROR:', e));
