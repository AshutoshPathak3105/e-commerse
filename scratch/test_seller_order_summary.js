const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Includes openSellerOrderSummaryModal function:', scriptContent.includes('function openSellerOrderSummaryModal('));
console.log('Includes btn-view-summary button in table:', scriptContent.includes('btn-view-summary'));
console.log('Includes Customer Details section:', scriptContent.includes('Customer Details'));
console.log('Includes Shipping Address section:', scriptContent.includes('Shipping Address'));
console.log('Includes Financial Settlement Summary section:', scriptContent.includes('Financial Settlement & Payout Summary'));
console.log('Includes Order Items Summary section:', scriptContent.includes('Order Items Summary'));
