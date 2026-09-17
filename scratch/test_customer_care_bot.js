const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

const csIdx = scriptContent.indexOf('window._openCustomerServicePage = (push = true)');
const csCode = scriptContent.slice(csIdx, csIdx + 12000);

console.log('Top recommendation bar (cs-quick-chips) removed:', !csCode.includes('cs-quick-chips'));
console.log('Greeting handler for "hii"/"hi"/"hello" still active:', csCode.includes("q === 'hii'") || csCode.includes("q === 'hi'"));
console.log('Subchip click binding present:', csCode.includes('cs-chat-subchip'));
