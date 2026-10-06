const fs = require('fs');

const css = fs.readFileSync('styles.css', 'utf8');
const lines = css.split(/\r?\n/);

lines.forEach((l, i) => {
  if (l.toLowerCase().includes('#ff9400')) {
    console.log(i + 1, l);
  }
});
