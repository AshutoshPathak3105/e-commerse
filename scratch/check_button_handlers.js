const fs = require('fs');
const code = fs.readFileSync('script.js', 'utf8');

// Let's search for buttons with # or class in each render function and check their click handlers
const tabs = [
  'renderDashboard', 'renderAnalytics', 'renderOrders', 'renderCustomerService',
  'renderPayouts', 'renderShipping', 'renderProducts', 'renderInventory',
  'renderSellers', 'renderUsers', 'renderOffers', 'renderReviews',
  'renderSupport', 'renderCMS', 'renderStaff', 'renderSettings', 'renderAdminProfile'
];

tabs.forEach(tabName => {
  const idx = code.indexOf('function ' + tabName);
  if (idx === -1) return;
  // get next function
  let nextIdx = code.indexOf('\n  function render', idx + 10);
  if (nextIdx === -1) nextIdx = code.indexOf('\n  function switchTab', idx + 10);
  if (nextIdx === -1) nextIdx = idx + 40000;
  const chunk = code.substring(idx, nextIdx);

  // find all <button ...> in chunk
  const matches = chunk.match(/<button\b[^>]*>/g) || [];
  console.log(`\n=== ${tabName}: ${matches.length} buttons ===`);
  
  // check for alert, TODO, or empty handler
  matches.forEach(btn => {
    const id = (btn.match(/id=["']([^"']+)["']/) || [])[1];
    const cls = (btn.match(/class=["']([^"']+)["']/) || [])[1];
    const title = (btn.match(/title=["']([^"']+)["']/) || [])[1] || '';
    const text = btn.replace(/<[^>]+>/g, '').trim();

    // Check how it's handled in chunk
    let handlerFound = false;
    if (id && !id.includes('$')) {
      const hRegex = new RegExp(`['"]#?${id}['"][^;]*?addEventListener\\s*\\(\\s*['"]click['"]\\s*,\\s*([^;]+)`);
      const hMatch = chunk.match(hRegex);
      if (hMatch) {
        handlerFound = true;
        const handlerBody = hMatch[0].slice(0, 80);
        // check if dummy
        if (handlerBody.includes('alert(') || handlerBody.includes('console.log') || handlerBody.includes('TODO')) {
          console.log(`  [DUMMY/INCOMPLETE] ID: ${id} -> ${handlerBody}`);
        }
      } else {
        console.log(`  [NO HANDLER FOUND] ID: ${id} (${title || text})`);
      }
    }
  });
});
