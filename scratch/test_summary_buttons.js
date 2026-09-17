const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('window.openSellerTaxInvoiceModal defined:', scriptContent.includes('window.openSellerTaxInvoiceModal = function'));
console.log('Tax Invoice button onclick handler attached:', scriptContent.includes("onclick=\"if(typeof window.openSellerTaxInvoiceModal==='function')window.openSellerTaxInvoiceModal('${ord.id}')\""));
console.log('Close button onclick handler attached:', scriptContent.includes("onclick=\"document.getElementById('${modalId}')._close()\""));
console.log('Tax Invoice button event listener attached:', scriptContent.includes("summaryModal.querySelector('#btn-print-seller-summary')?.addEventListener"));
console.log('Close button event listener attached:', scriptContent.includes("summaryModal.querySelector('#btn-close-seller-summary')?.addEventListener"));
