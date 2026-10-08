const fs = require('fs');
const lines = fs.readFileSync('script.js', 'utf8').split('\n');
const adminCode = lines.slice(4935, 21930).join('\n');

const tabs = new Set();
const matches = adminCode.matchAll(/data-tab=["']([^"']+)["']/g);
for (const m of matches) tabs.add(m[1]);
console.log('Admin tabs:', Array.from(tabs));

// Also find all render functions in admin panel
const renderFuncs = [];
const rMatch = adminCode.matchAll(/function (render[A-Za-z0-9_]+)\s*\(/g);
for (const m of rMatch) renderFuncs.push(m[1]);
console.log('Render functions in Admin Panel:', renderFuncs);
