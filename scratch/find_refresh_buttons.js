const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');

const regex = /<button[^>]*>[\s\S]*?refresh[\s\S]*?<\/button>/gi;
let m;
const buttons = [];
while ((m = regex.exec(content)) !== null) {
  buttons.push({ index: m.index, html: m[0] });
}
console.log('Total refresh buttons found:', buttons.length);
buttons.forEach((b, i) => {
  const line = content.substring(0, b.index).split('\n').length;
  const idMatch = b.html.match(/id=['"]([^'"]+)['"]/);
  const classMatch = b.html.match(/class=['"]([^'"]+)['"]/);
  const id = idMatch ? idMatch[1] : null;
  
  // Check if this id has an event listener in script.js
  let listenerFound = false;
  if (id) {
    const listenerRegex = new RegExp(`['"]#?${id}['"]\\)?\\s*\\.addEventListener`, 'i');
    const listenerRegex2 = new RegExp(`getElementById\\(['"]${id}['"]\\)`, 'i');
    const listenerRegex3 = new RegExp(`querySelector\\(['"]#?${id}['"]\\)`, 'i');
    listenerFound = listenerRegex.test(content) || listenerRegex2.test(content) || listenerRegex3.test(content);
  }
  
  console.log(`[${i+1}] Line ${line}: id="${id || 'NONE'}" wired=${listenerFound}`);
});
