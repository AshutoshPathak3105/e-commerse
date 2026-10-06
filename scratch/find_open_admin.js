const fs = require('fs');
const code = fs.readFileSync('script.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('admin-panel-overlay') || l.includes('openAdmin') || l.includes('showAdmin') || l.includes('launchAdmin')) {
    console.log((idx+1) + ': ' + l.trim().substring(0, 100));
  }
});
