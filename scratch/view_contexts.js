const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const lines = code.split('\n');

function showContext(lineNum, radius = 5) {
  const start = Math.max(0, lineNum - radius - 1);
  const end = Math.min(lines.length, lineNum + radius);
  return lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
}

console.log('=== 1. Dashboard (lines 6360-6375 and 6760-6772) ===');
console.log(showContext(6366, 4));
console.log('--- listener ---');
console.log(showContext(6766, 3));

console.log('\n=== 2. Users (CRM) (lines 6950-6960 and 7210-7220) ===');
console.log(showContext(6955, 4));
console.log('--- listener ---');
console.log(showContext(7215, 3));

console.log('\n=== 3. Shipping (lines 11140-11155 and 11230-11245) ===');
console.log(showContext(11147, 4));
console.log('--- listener ---');
console.log(showContext(11237, 4));

console.log('\n=== 4. Settings (lines 18595-18610 and 19010-19020) ===');
console.log(showContext(18600, 4));
console.log('--- listener ---');
console.log(showContext(19015, 3));

console.log('\n=== 5. Admin Profile (lines 19115-19125 and 19460-19475) ===');
console.log(showContext(19120, 4));
console.log('--- listener ---');
console.log(showContext(19466, 4));
