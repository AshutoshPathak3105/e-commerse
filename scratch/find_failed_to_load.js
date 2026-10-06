const fs = require('fs');
const path = require('path');

const targets = ['script.js', 'index.html', 'backend/server.js', 'admin-crm.css', 'style.css'];

targets.forEach(rel => {
  const file = path.join(__dirname, '..', rel);
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      if (/failed to load/i.test(line)) {
        console.log(`${rel}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
