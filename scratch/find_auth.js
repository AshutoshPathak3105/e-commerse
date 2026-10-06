const fs = require('fs');
const code = fs.readFileSync('script.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('getUser:') || l.includes('getUser =')) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
