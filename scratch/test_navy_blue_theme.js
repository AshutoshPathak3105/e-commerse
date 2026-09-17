const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');

console.log('Curved Speech Bubble border-radius (20px 20px 20px 4px):', cssContent.includes('20px 20px 20px 4px'));
console.log('Glassmorphism backdrop-filter present:', cssContent.includes('backdrop-filter: blur'));
console.log('Option Pills border-radius (24px):', cssContent.includes('border-radius: 24px'));
console.log('Option Pills Hover background (#ff9700):', cssContent.includes('background: #ff9700'));
