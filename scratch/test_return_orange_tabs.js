const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');
const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('styles.css orange active background present:', cssContent.includes('background: #ff9700 !important'));
console.log('styles.css mobile return card responsive rules present:', cssContent.includes('.return-item-card {'));
console.log('script.js activeStyle #ff9700 present:', scriptContent.includes("activeStyle = 'background:#ff9700"));
console.log('script.js return-step-pill class names present:', scriptContent.includes("className = stepNumber === 1 ? 'return-step-pill is-active'"));
