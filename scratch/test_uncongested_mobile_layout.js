const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');
const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Mobile media query (@media max-width: 768px) present:', cssContent.includes('@media (max-width: 768px)'));
console.log('text-overflow ellipsis for select present:', cssContent.includes('text-overflow: ellipsis'));
console.log('Fluid form card container padding present:', scriptContent.includes('padding:12px 10px'));
console.log('Clean select option label present:', scriptContent.includes('Damaged / Defective Item'));
