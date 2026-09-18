const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('✓ Script contains isPlacedToday check in openSellerOrderSummaryModal:', scriptContent.includes('const isPlacedToday = (dateStr) => {'));
console.log('✓ Script contains todayOrders filter:', scriptContent.includes('const todayOrders = allOrders.filter(o => isPlacedToday(o.orderDate));'));
console.log('✓ Script contains Placed Today badge:', scriptContent.includes('Placed Today'));
console.log('✓ Script contains No Customer Orders Received Today state:', scriptContent.includes('No Customer Orders Received Today'));
console.log('✓ Script contains Today\'s Placed Orders selector:', scriptContent.includes("Today's Placed Orders"));
