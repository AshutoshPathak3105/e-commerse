const fs = require('fs');

['index.html', 'script.js', 'styles.css'].forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/placeholder/i.test(line)) {
      console.log(`${file}:${idx + 1}: ${line.trim().slice(0, 100)}`);
    }
  });
});
