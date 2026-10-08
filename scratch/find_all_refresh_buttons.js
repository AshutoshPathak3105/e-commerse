const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');

const regex = /<button[\s\S]*?<\/button>/gi;
let m;
let count = 0;
while ((m = regex.exec(content)) !== null) {
  if (m[0].includes('Refresh') || m[0].includes('refresh')) {
    const line = content.substring(0, m.index).split('\n').length;
    console.log('[L' + line + '] ' + m[0].replace(/\s+/g, ' ').slice(0, 140));
    count++;
  }
}
console.log('Total buttons found with refresh:', count);
