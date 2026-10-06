const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

const tabs = [
  'dashboard', 'analytics', 'orders', 'customer-service', 'payouts',
  'shipping', 'products', 'inventory', 'sellers', 'users',
  'offers', 'reviews', 'support', 'cms', 'staff', 'settings', 'admin-profile'
];

tabs.forEach(t => {
  const funcName = 'render' + t.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const regex = new RegExp('function\\s+' + funcName + '\\s*\\(', 'g');
  const match = regex.exec(code);
  if (match) {
    const startIdx = match.index;
    // Find the end of the function roughly or next 8000 chars
    const chunk = code.slice(startIdx, startIdx + 8000);
    const btnMatches = chunk.match(/<button[^>]*id=["'][^"']*refresh[^"']*["'][^>]*>[\s\S]*?<\/button>/gi) ||
                      chunk.match(/<button[^>]*>[\s\S]*?refresh[\s\S]*?<\/button>/gi);
    
    // Also check event listener wiring
    const listenerMatches = chunk.match(/getElementById\(['"][^'"]*refresh[^'"]*['"]\)[^;]+/gi) ||
                           chunk.match(/querySelector\(['"][^'"]*refresh[^'"]*['"]\)[^;]+/gi);

    console.log(`\n=== TAB: ${t} (${funcName}) ===`);
    if (btnMatches) {
      btnMatches.forEach(b => console.log('  BTN:', b.replace(/\s+/g, ' ').slice(0, 150)));
    } else {
      console.log('  BTN: NONE');
    }
    if (listenerMatches) {
      listenerMatches.forEach(l => console.log('  LISTENER:', l.replace(/\s+/g, ' ').slice(0, 150)));
    } else {
      console.log('  LISTENER: NONE');
    }
  } else {
    console.log(`\n=== TAB: ${t} === (NOT FOUND)`);
  }
});
