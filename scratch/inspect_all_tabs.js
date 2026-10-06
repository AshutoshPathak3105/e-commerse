const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

const tabs = [
  'dashboard', 'analytics', 'orders', 'customer-service', 'payouts',
  'shipping', 'products', 'inventory', 'sellers', 'users',
  'offers', 'reviews', 'support', 'cms', 'staff', 'settings', 'admin-profile'
];

tabs.forEach(tab => {
  // Find where this tab is rendered
  // e.g., renderShipping, renderUsers, renderSettings, etc.
  const fnName = 'render' + tab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const idx = code.indexOf('async function ' + fnName) !== -1 ? code.indexOf('async function ' + fnName) : code.indexOf('function ' + fnName);
  
  if (idx === -1) {
    console.log(`Tab: ${tab} -> function ${fnName} NOT FOUND`);
    return;
  }
  
  // Find next function or 15000 chars
  const slice = code.slice(idx, idx + 12000);
  
  // Find refresh button
  const hasRefreshBtn = /refresh/i.test(slice) && /<button[^>]*id=["'][^"']*refresh[^"']*["']/i.test(slice);
  
  // Find any refresh btn ID
  const btnIdMatch = slice.match(/id=["'](ap-[^"']*refresh[^"']*)["']/i);
  
  // Find load / fetch calls
  const fetchMatches = [...slice.matchAll(/adminFetch\(['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
  
  console.log(`Tab: ${tab} (${fnName})`);
  console.log(`  Has Refresh Button: ${hasRefreshBtn ? 'YES (' + (btnIdMatch ? btnIdMatch[1] : 'unknown id') + ')' : 'NO'}`);
  console.log(`  Endpoints: ${fetchMatches.slice(0, 5).join(', ')}`);
});
