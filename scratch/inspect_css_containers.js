const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf8');
const lines = css.split('\n');

const keywords = ['.ap-shell', '.ap-right-col', '.ap-content', '.ap-view-inner', '.ap-table-card', '#ap-tab-body'];
const results = [];

lines.forEach((line, index) => {
  for (const kw of keywords) {
    if (line.includes(kw) && line.includes('{')) {
      // capture 15 lines of rule
      results.push({ lineNum: index + 1, snippet: lines.slice(index, index + 15).join('\n') });
      break;
    }
  }
});

console.log(`Found ${results.length} rules matching keywords:`);
results.forEach(r => {
  console.log(`\n--- Line ${r.lineNum} ---`);
  console.log(r.snippet);
});
