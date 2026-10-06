const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

const refreshIds = [
  'ap-dash-quick-refresh',
  'ap-analytics-refresh-btn',
  'ap-order-refresh-btn',
  'ap-cs-refresh-btn',
  'ap-payout-refresh-btn',
  'ap-product-refresh-btn',
  'ap-inventory-refresh-btn',
  'ap-seller-refresh-btn',
  'ap-offers-refresh-btn',
  'ap-reviews-refresh-btn',
  'ap-support-refresh-btn',
  'ap-cms-refresh-btn',
  'ap-staff-refresh-btn'
];

refreshIds.forEach(id => {
  const idx = code.indexOf(id);
  console.log(`\n================ ID: ${id} ================`);
  if (idx === -1) {
    console.log('NOT FOUND');
    return;
  }
  
  // Find event listeners for this ID
  let searchIdx = 0;
  let found = 0;
  while ((searchIdx = code.indexOf(id, searchIdx)) !== -1) {
    // Look at surrounding 300 characters
    const snippet = code.slice(Math.max(0, searchIdx - 50), searchIdx + 400);
    if (snippet.includes('addEventListener') || snippet.includes('onclick') || snippet.includes('.click(')) {
      console.log('LISTENER SNIPPET:\n' + snippet.replace(/\r\n/g, '\n').slice(0, 300));
      found++;
    }
    searchIdx += id.length;
  }
  if (found === 0) {
    console.log('NO EVENT LISTENER FOUND for ' + id);
  }
});
