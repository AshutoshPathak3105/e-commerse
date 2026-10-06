const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf8');
const lines = css.split('\n');

lines.forEach((line, index) => {
  if (line.includes('ap-cms-reset-quad-btn') || line.includes('ap-cms-add-quad-btn')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
