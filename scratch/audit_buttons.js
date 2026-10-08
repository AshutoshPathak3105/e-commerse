const fs = require('fs');
const lines = fs.readFileSync('script.js', 'utf8').split('\n');

const adminLines = lines.slice(4935, 21930);
const adminCode = adminLines.join('\n');

const btnRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
let match;
const buttons = [];

while ((match = btnRegex.exec(adminCode)) !== null) {
  const fullTag = match[0];
  const tagOpen = fullTag.slice(0, fullTag.indexOf('>') + 1);
  const text = match[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  buttons.push({ tag: tagOpen, text: text.slice(0, 40), index: match.index });
}

console.log('Total buttons found in admin section: ' + buttons.length);

const unhandled = [];
buttons.forEach((b, idx) => {
  const idM = b.tag.match(/id=["']([^"']+)["']/);
  const clsM = b.tag.match(/class=["']([^"']+)["']/);
  const onclickM = b.tag.match(/onclick=["']([^"']+)["']/);
  
  const id = idM ? idM[1] : null;
  const classes = clsM ? clsM[1].split(/\s+/).filter(c => c.length > 2) : [];

  let handled = false;
  if (onclickM) handled = true;

  if (id && (
    adminCode.includes(`'#${id}'`) || 
    adminCode.includes(`"${id}"`) || 
    adminCode.includes(`'${id}'`) ||
    adminCode.includes(`\`#${id}\``)
  )) {
    handled = true;
  }

  for (const c of classes) {
    if (
      adminCode.includes(`'.${c}'`) || 
      adminCode.includes(`".${c}"`) || 
      adminCode.includes(`\`${c}\``) ||
      adminCode.includes(`'${c}'`) ||
      adminCode.includes(`"${c}"`)
    ) {
      handled = true;
      break;
    }
  }

  if (!handled) {
    unhandled.push(b);
  }
});

console.log('Potentially unhandled buttons: ' + unhandled.length);
unhandled.forEach(u => console.log('UNHANDLED:', u.tag, 'TEXT:', u.text));
