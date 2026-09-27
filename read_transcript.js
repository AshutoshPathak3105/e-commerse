const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf8');
const lines = css.split('\n');
lines.forEach((l, i) => {
  if (l.includes('.ap-content') || l.includes('.ap-view-inner') || l.includes('.ap-body') || l.includes('.ap-main')) {
    console.log(`${i+1}: ${l.trim().slice(0, 100)}`);
  }
});
