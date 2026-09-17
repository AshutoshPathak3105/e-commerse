const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');
const stylesContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');

console.log('updateGlobalScrollLock function defined:', scriptContent.includes('function updateGlobalScrollLock()'));
console.log('MutationObserver defined for scroll lock:', scriptContent.includes('const scrollLockObserver = new MutationObserver'));
console.log('CSS :has selector present in styles.css:', stylesContent.includes('body:has(.xmodal-overlay.is-active)'));
console.log('CSS overflow: hidden !important present:', stylesContent.includes('overflow: hidden !important;'));
