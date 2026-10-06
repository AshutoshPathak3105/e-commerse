const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf8');
const lines = css.split(/\r?\n/);

lines.forEach((l, i) => {
  if (l.includes('#FF9400') || l.includes('#ff9400')) {
    // print selector preceding it
    for (let j = Math.max(0, i - 15); j <= i; j++) {
      if (lines[j].includes('{')) {
        console.log(`Line ${i + 1}: ${lines.slice(Math.max(0, j - 5), i + 2).join(' ')}`);
        break;
      }
    }
  }
});
