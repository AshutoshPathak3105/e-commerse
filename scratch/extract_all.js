const fs = require('fs');

const scriptContent = fs.readFileSync('script.js', 'utf8');
const scriptLines = scriptContent.split('\n');

const matches022 = [];
scriptLines.forEach((l, idx) => {
  if (/022[fF]43/i.test(l)) {
    matches022.push({ line: idx + 1, text: l.trim() });
  }
});

fs.writeFileSync('scratch/all_022.json', JSON.stringify(matches022, null, 2));
console.log('Total 022 matches in script.js:', matches022.length);

// Also check lines mentioned in compaction: 14092, 15206, 15261, 15291, 15317, 15349, 15417
const checkLines = [14092, 15206, 15261, 15291, 15317, 15349, 15417];
checkLines.forEach(ln => {
  if (ln <= scriptLines.length) {
    console.log(`Line ${ln}:`, scriptLines[ln - 1].trim().substring(0, 160));
  }
});
