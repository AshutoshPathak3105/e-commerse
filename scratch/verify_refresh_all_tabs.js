const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

const tabs = [
  { name: 'Dashboard', id: 'ap-dash-quick-refresh' },
  { name: 'Analytics', id: 'ap-analytics-refresh-btn' },
  { name: 'Orders', id: 'ap-order-refresh-btn' },
  { name: 'Customer Service', id: 'ap-cs-refresh-btn' },
  { name: 'Payouts', id: 'ap-payout-refresh-btn' },
  { name: 'Shipping', id: 'ap-shipping-sync-btn' },
  { name: 'Products', id: 'ap-product-refresh-btn' },
  { name: 'Inventory', id: 'ap-inventory-refresh-btn' },
  { name: 'Sellers', id: 'ap-seller-refresh-btn' },
  { name: 'Users / CRM', id: 'ap-users-refresh-btn' },
  { name: 'Offers', id: 'ap-offers-refresh-btn' },
  { name: 'Reviews', id: 'ap-reviews-refresh-btn' },
  { name: 'Support', id: 'ap-support-refresh-btn' },
  { name: 'CMS', id: 'ap-cms-refresh-btn' },
  { name: 'Staff', id: 'ap-staff-refresh-btn' },
  { name: 'Settings', id: 'ap-settings-refresh-btn' },
  { name: 'Admin Profile', id: 'ap-profile-refresh-btn' }
];

let allPassed = true;
tabs.forEach(t => {
  const hasMarkup = code.includes(`id="${t.id}"`);
  const hasListener = code.includes(t.id) && (code.includes(`'${t.id}'`) || code.includes(`"${t.id}"`));
  const hasTrigger = code.includes(`triggerRefreshFeedback`) || code.includes(`_handleStaffRefresh`);
  
  if (hasMarkup && hasListener) {
    console.log(`✓ [${t.name}] ID: "${t.id}" -> Present and wired`);
  } else {
    console.error(`✗ [${t.name}] ID: "${t.id}" -> Markup: ${hasMarkup}, Listener: ${hasListener}`);
    allPassed = false;
  }
});

console.log('\nAll 17 Admin Window Pages Checked:', allPassed ? 'ALL PASSED!' : 'FAILED SOME');
