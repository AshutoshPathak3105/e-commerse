const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('window.openSellerOrderSummaryModal defined:', scriptContent.includes('window.openSellerOrderSummaryModal = function'));
console.log('Hero button present:', scriptContent.includes('id="btn-hero-open-order-summary"'));
console.log('Preview card button present:', scriptContent.includes('id="btn-preview-order-summary"'));
console.log('Hero button listener wired:', scriptContent.includes("pageContainer.querySelector('#btn-hero-open-order-summary')?.addEventListener"));
console.log('Preview button listener wired:', scriptContent.includes("pageContainer.querySelector('#btn-preview-order-summary')?.addEventListener"));
