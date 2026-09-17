const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Complaint handler present:', scriptContent.includes("q.includes('complain')"));
console.log('Ticket ID generation present:', scriptContent.includes('TK-COMP-'));
console.log('localStorage xmart_customer_complaints present:', scriptContent.includes('xmart_customer_complaints'));
console.log('File a Complaint subchip button present:', scriptContent.includes('File a Complaint'));
