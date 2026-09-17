const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');
const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Step 3 return-step-3-action-bar present in script.js:', scriptContent.includes('class="return-step-3-action-bar"'));
console.log('Step 3 btn-step-submit present in script.js:', scriptContent.includes('class="btn-step-submit"'));
console.log('Step 3 CSS responsive rules present in styles.css:', cssContent.includes('.return-step-3-action-bar .btn-step-submit'));
