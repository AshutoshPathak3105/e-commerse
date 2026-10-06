const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf8');
const lines = css.split('\n');

lines.forEach((line, index) => {
  if (line.includes('overflow-x: hidden') || line.includes('overflow-x:hidden')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
