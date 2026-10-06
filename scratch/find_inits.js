const fs = require('fs');

const code = fs.readFileSync('script.js', 'utf8');
const lines = code.split('\n');
console.log('--- fetchStorefrontCMS ---');
lines.forEach((l, idx) => {
  if (l.includes('fetchStorefrontCMS')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});
