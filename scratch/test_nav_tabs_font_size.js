const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');

console.log('Mobile tab font-size increased to 12.5px:', cssContent.includes('font-size: 12.5px !important;'));
console.log('Mobile tab font-size increased to 11.5px (380px):', cssContent.includes('font-size: 11.5px !important;'));
console.log('White-space nowrap enforced for single row alignment:', cssContent.includes('white-space: nowrap !important;'));
