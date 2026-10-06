const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

// List of all admin tab rendering functions
const tabs = [
  { id: 'dashboard', fn: 'renderDashboard' },
  { id: 'analytics', fn: 'renderAnalytics' },
  { id: 'orders', fn: 'renderOrders' },
  { id: 'customer-service', fn: 'renderCustomerService' },
  { id: 'payouts', fn: 'renderPayouts' },
  { id: 'shipping', fn: 'renderShipping' },
  { id: 'products', fn: 'renderProducts' },
  { id: 'inventory', fn: 'renderInventory' },
  { id: 'sellers', fn: 'renderSellers' },
  { id: 'users', fn: 'renderUsers' },
  { id: 'offers', fn: 'renderOffers' },
  { id: 'reviews', fn: 'renderReviews' },
  { id: 'support', fn: 'renderSupport' },
  { id: 'cms', fn: 'renderCMS' },
  { id: 'staff', fn: 'renderStaff' },
  { id: 'settings', fn: 'renderSettings' },
  { id: 'admin-profile', fn: 'renderAdminProfile' }
];

tabs.forEach(t => {
  const re = new RegExp(`(async\\s+function\\s+${t.fn}|function\\s+${t.fn})\\s*\\(`, 'g');
  const m = re.exec(code);
  if (!m) {
    console.log(`[${t.id}] ${t.fn} NOT FOUND`);
    return;
  }
  const start = m.index;
  // Look at the first 3500 chars to see the header/toolbar HTML
  const headerSlice = code.slice(start, start + 3500);
  
  // Find where .ap-view-header or .ap-view-actions or .ap-dash-header or buttons appear
  const headerMatch = headerSlice.match(/<div class=["'](?:ap-view-header|ap-dash-header|ap-window-header)[^>]*>[\s\S]*?<\/div>\s*<\/div>/);
  const actionsMatch = headerSlice.match(/<div class=["']ap-view-actions["']>[\s\S]*?<\/div>/);
  
  // Check if there is a refresh button in this function
  const fullFnEnd = code.indexOf('\n  async function ', start + 100);
  const fullSlice = code.slice(start, fullFnEnd !== -1 ? fullFnEnd : start + 25000);
  const refreshBtns = [...fullSlice.matchAll(/<button[^>]*id=["']([^"']*refresh[^"']*)["'][^>]*>([\s\S]*?)<\/button>/gi)];

  console.log(`\n================== [TAB: ${t.id}] ==================`);
  if (actionsMatch) {
    console.log('ap-view-actions:', actionsMatch[0].replace(/\s+/g, ' '));
  } else {
    // Check any buttons near the top
    const topBtns = [...headerSlice.matchAll(/<button[^>]*>[\s\S]*?<\/button>/gi)];
    console.log('Top buttons count:', topBtns.length);
    topBtns.forEach(b => console.log('  BTN:', b[0].replace(/\s+/g, ' ').slice(0, 120)));
  }
  
  if (refreshBtns.length > 0) {
    refreshBtns.forEach(b => {
      console.log(`  -> Refresh Button ID: "${b[1]}" | Text: "${b[2].replace(/<[^>]+>/g, '').trim()}"`);
    });
  } else {
    console.log('  -> NO REFRESH BUTTON FOUND!');
  }
});
