const fs = require('fs');

function checkFile(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n');
  console.log(`\n=== Scanning ${filename} ===`);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.toLowerCase().includes('022f43')) {
      const isBtn = l.includes('btn') || l.includes('button') || l.includes('preset') || l.includes('pill') || l.includes('refresh') || l.includes('ops');
      // Also check previous 5 lines for button selectors
      let context = '';
      for (let j = Math.max(0, i - 8); j <= i; j++) {
        context += lines[j] + '\n';
      }
      if (isBtn || context.includes('btn') || context.includes('button') || context.includes('.ap-')) {
        console.log(`L${i + 1}: ${l.trim()}`);
      }
    }
  }
}

checkFile('styles.css');
checkFile('script.js');
