const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /(?:src|href)=["']([^"']+)["']/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  const u = match[1];
  if (!u.startsWith('http://') && !u.startsWith('https://') && !u.startsWith('#') && !u.startsWith('mailto:') && !u.startsWith('tel:') && !u.startsWith('javascript:')) {
    const clean = u.split('?')[0];
    if (!fs.existsSync(clean)) {
      console.log('MISSING:', clean, 'from attr:', u);
    }
  }
}
console.log('Done checking local files.');
