const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

// Check setDetectedLocation implementation snippet
const setDetectedIdx = scriptContent.indexOf('function setDetectedLocation');
const setDetectedSnippet = scriptContent.slice(setDetectedIdx, setDetectedIdx + 400);

console.log('setDetectedLocation does NOT save to xmart_saved_addresses:', !setDetectedSnippet.includes("localStorage.setItem('xmart_saved_addresses'"));
console.log('getModalSavedAddresses uses getSavedAddresses:', scriptContent.includes('if (typeof getSavedAddresses === \'function\')'));
