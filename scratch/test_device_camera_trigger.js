const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Camera input with capture="environment" present:', scriptContent.includes('id="cs-chat-camera-input" accept="image/*" capture="environment"'));
console.log('Camera button wired to cameraInput.click() present:', scriptContent.includes('cameraInput?.click()'));
console.log('Camera Photo Captured response present:', scriptContent.includes('Camera Photo Captured & Received!'));
