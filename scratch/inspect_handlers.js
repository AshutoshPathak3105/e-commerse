const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');

const candidateIds = [
  'ap-dash-quick-refresh',
  'ap-seller-refresh-btn',
  'ap-order-refresh-btn',
  'ap-cs-refresh-btn',
  'ap-payout-refresh-btn',
  'ap-offers-refresh-btn',
  'ap-product-refresh-btn',
  'ap-analytics-refresh-btn',
  'ap-inventory-refresh-btn',
  'ap-reviews-refresh-btn',
  'ap-support-refresh-btn',
  'ap-cms-refresh-btn',
  'ap-staff-refresh-btn'
];

candidateIds.forEach(id => {
  console.log(`\n=================== ${id} ===================`);
  // Find where it's referenced
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes(id)) {
      console.log(`L${i+1}: ${l.trim()}`);
    }
  });
});
