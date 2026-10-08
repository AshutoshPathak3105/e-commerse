const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');

// Search for all occurrences of 'Refresh' in buttons
const lines = content.split('\n');
const refreshBtns = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/Refresh/i.test(line) && /<button|<a/i.test(line)) {
    // Collect context around this line
    const start = Math.max(0, i - 5);
    const end = Math.min(lines.length - 1, i + 5);
    const snippet = lines.slice(start, end + 1).join('\n');
    refreshBtns.push({ lineNum: i + 1, line, snippet });
  } else if (/id=["'][^"']*refresh[^"']*["']/i.test(line)) {
    const start = Math.max(0, i - 2);
    const end = Math.min(lines.length - 1, i + 2);
    const snippet = lines.slice(start, end + 1).join('\n');
    refreshBtns.push({ lineNum: i + 1, line, snippet });
  }
}

console.log('Found candidates:', refreshBtns.length);
refreshBtns.forEach((b, idx) => {
  console.log(`\n--- Candidate #${idx + 1} (Line ${b.lineNum}) ---`);
  console.log(b.line.trim());
});
