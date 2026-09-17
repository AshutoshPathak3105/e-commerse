const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');
const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('styles.css cs-subchip-grid 2-column repeat(2, 1fr) present:', cssContent.includes('grid-template-columns: repeat(2, 1fr)'));
console.log('script.js cs-subchip-grid class wrapper present:', scriptContent.includes('class="cs-subchip-grid"'));
