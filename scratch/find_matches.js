const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');
const lines = content.split('\n');

console.log('=== 022F43 matches in script.js ===');
lines.forEach((l, idx) => {
  if (/022[fF]43/i.test(l)) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
