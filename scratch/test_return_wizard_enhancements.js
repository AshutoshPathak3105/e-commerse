const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');
const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Product image upload card present:', scriptContent.includes('id="return-image-upload-card"'));
console.log('Multi-image input present:', scriptContent.includes('id="return-multi-image-input"'));
console.log('See more addresses toggle present:', scriptContent.includes('id="btn-see-more-addresses"'));
console.log('Extra saved addresses collapsible wrapper present:', scriptContent.includes('id="extra-saved-addresses-wrapper"'));
console.log('Reduced size buttons CSS present in styles.css:', cssContent.includes('.return-step-2-action-bar .btn-step-back'));
