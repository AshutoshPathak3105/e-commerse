const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('ap-shell') || l.includes('admin-panel') || l.includes('ap-view-inner') || l.includes('ap-tab-cms')) {
    console.log((i+1) + ': ' + l.trim().slice(0, 120));
  }
});
