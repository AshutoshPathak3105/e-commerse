const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');

const candidateIds = [
  { id: 'ap-dash-quick-refresh', name: 'Dashboard' },
  { id: 'ap-seller-refresh-btn', name: 'Sellers' },
  { id: 'ap-order-refresh-btn', name: 'Orders' },
  { id: 'ap-cs-refresh-btn', name: 'Customer Service / Returns' },
  { id: 'ap-payout-refresh-btn', name: 'Payouts' },
  { id: 'ap-offers-refresh-btn', name: 'Offers / Marketing' },
  { id: 'ap-product-refresh-btn', name: 'Products / Catalog' },
  { id: 'ap-analytics-refresh-btn', name: 'Analytics' },
  { id: 'ap-inventory-refresh-btn', name: 'Inventory' },
  { id: 'ap-reviews-refresh-btn', name: 'Reviews' },
  { id: 'ap-support-refresh-btn', name: 'Support' },
  { id: 'ap-cms-refresh-btn', name: 'CMS' },
  { id: 'ap-staff-refresh-btn', name: 'Staff' }
];

candidateIds.forEach(item => {
  console.log(`\n=================== [${item.name}] #${item.id} ===================`);
  const lines = content.split('\n');
  let renderLine = -1;
  let listenerLine = -1;
  lines.forEach((l, i) => {
    if (l.includes(`id="${item.id}"`)) renderLine = i + 1;
    if (l.includes(item.id) && (l.includes('addEventListener') || l.includes('onclick') || l.includes('refreshBtn'))) {
      console.log(`L${i+1}: ${l.trim()}`);
    }
  });
  console.log(`Rendered at L${renderLine}`);
});
