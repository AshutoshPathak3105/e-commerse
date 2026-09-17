const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Plus icon button (#cs-btn-plus) present:', scriptContent.includes('id="cs-btn-plus"'));
console.log('Camera icon button (#cs-btn-camera) present:', scriptContent.includes('id="cs-btn-camera"'));
console.log('Hidden file input (#cs-chat-file-input) present:', scriptContent.includes('id="cs-chat-file-input"'));
console.log('FileReader onload event handler present:', scriptContent.includes('reader.readAsDataURL(file)'));
console.log('Bot Document / Photo Receipt response present:', scriptContent.includes('Document / Product Photo Received!'));
