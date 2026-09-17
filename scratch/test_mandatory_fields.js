const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Issue Details label optional tag removed:', !scriptContent.includes('Issue Details & Additional Comments (Optional)'));
console.log('Upload Product Photos label optional tag removed:', !scriptContent.includes('Upload Product Photos / Proof (Optional)'));
console.log('Mandatory red asterisk present on labels:', scriptContent.includes('<span style="color:#e11d48;">*</span>'));
console.log('Comments validation check present:', scriptContent.includes("showToast('Please enter issue details & comments before proceeding'"));
console.log('Photo upload validation check present:', scriptContent.includes("showToast('Please upload at least 1 product photo / proof image before proceeding'"));
