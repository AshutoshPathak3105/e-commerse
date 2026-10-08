const fs = require('fs');
const s = fs.readFileSync('script.js', 'utf8');

const regex = /function (render[A-Za-z0-9_]+)/g;
let m;
const renderFuncs = [];
while ((m = regex.exec(s)) !== null) {
  if (m[1].startsWith('renderAdmin') || ['renderDashboard', 'renderOrders', 'renderSellers', 'renderProducts', 'renderInventory', 'renderReviews', 'renderCustomerService', 'renderCMS', 'renderShipping', 'renderPayouts', 'renderStaff', 'renderSettings'].includes(m[1])) {
    renderFuncs.push(m[1]);
  }
}

console.log('Found render functions:', renderFuncs);

renderFuncs.forEach(fn => {
  const idx = s.indexOf('function ' + fn);
  if (idx === -1) return;
  const chunk = s.slice(idx, idx + 10000);
  const bodyScrolls = chunk.match(/class="[^"]*body-scroll[^"]*"/g) || [];
  const tableWraps = chunk.match(/class="[^"]*table-wrap[^"]*"/g) || [];
  if (bodyScrolls.length || tableWraps.length) {
    console.log(`\n=== ${fn} ===`);
    console.log('bodyScrolls:', bodyScrolls);
    console.log('tableWraps:', tableWraps);
  }
});
