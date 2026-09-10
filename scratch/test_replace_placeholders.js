const fs = require('fs');

const s = fs.readFileSync('script.js', 'utf8');

// Test regex: match \s+placeholder=(?:"[^"]*"|'[^']*')
const re = /\s+placeholder=(?:"[^"]*"|'[^']*')/g;
const matches = s.match(re);
console.log('Total placeholder attributes matched in script.js:', matches?.length);

const sNew = s.replace(re, '');
fs.writeFileSync('scratch/script.test.js', sNew, 'utf8');

const { execSync } = require('child_process');
try {
  execSync('node -c scratch/script.test.js');
  console.log('Syntax check PASSED for modified script!');
} catch (e) {
  console.error('Syntax error:', e.message);
}
