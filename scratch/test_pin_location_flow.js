const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('pin-modal-fetched-preview element defined:', scriptContent.includes('id="pin-modal-fetched-preview"'));
console.log('setDetectedLocation updates preview card:', scriptContent.includes('titleEl.textContent = `${city}, ${state}`'));
console.log('prefixRules included in fetchLocationFromPin:', scriptContent.includes("prefix: '802', city: 'Buxar'"));
console.log('Header location control updated with city & PIN:', scriptContent.includes("el.textContent = displayText"));
console.log('No auto-save to xmart_saved_addresses in setDetectedLocation:', !scriptContent.slice(scriptContent.indexOf('function setDetectedLocation'), scriptContent.indexOf('function setDetectedLocation') + 400).includes('xmart_saved_addresses'));
