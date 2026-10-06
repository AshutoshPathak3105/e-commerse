const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf8');
const lines = css.split('\n');

const lineNumbers = [23125, 23134, 23239, 23247, 23544, 23806, 23862, 23998, 24357, 27357];
lineNumbers.forEach(ln => {
  console.log(`\n=== Line ${ln} ===`);
  const start = Math.max(0, ln - 4);
  const end = Math.min(lines.length, ln + 4);
  for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
});
