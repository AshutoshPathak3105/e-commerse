const fs = require('fs');

const content = fs.readFileSync('styles.css', 'utf8');
const lines = content.split('\n');

for (let i = 25990; i < lines.length; i++) {
  const l = lines[i];
  if (l.toLowerCase().includes('cms') || l.includes('quad') || l.includes('announcement')) {
    console.log(i + 1, l);
  }
}
