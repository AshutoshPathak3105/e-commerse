const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Auto-display in _openSellerPortal present:', scriptContent.includes("window.openSellerOrderSummaryModal(sellerOrders[0].id)"));
console.log('Auto-display on order placement present:', scriptContent.includes("window.openSellerOrderSummaryModal(orderId)"));
