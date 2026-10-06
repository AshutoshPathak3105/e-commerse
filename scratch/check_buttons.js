const fs = require('fs');

const content = fs.readFileSync('script.js', 'utf8');

const adminStart = content.indexOf('function renderShell');
const adminEnd = content.indexOf('window._openAdminPanel = function');
const adminCode = content.slice(adminStart, adminEnd);

const regex = /<button[^>]*>([\s\S]*?)<\/button>/g;
let match;
const buttonsFound = new Map();
while ((match = regex.exec(adminCode)) !== null) {
  const fullTag = match[0];
  const innerText = match[1].replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ');
  const classMatch = fullTag.match(/class=["']([^"']*)["']/);
  const cls = classMatch ? classMatch[1] : '';
  const key = `${innerText.slice(0, 30)} || class: ${cls}`;
  buttonsFound.set(key, (buttonsFound.get(key) || 0) + 1);
}

for (const [k, v] of buttonsFound.entries()) {
  console.log(`${v}x : ${k}`);
}
