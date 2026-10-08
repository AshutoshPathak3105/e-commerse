const fs = require('fs');
const lines = fs.readFileSync('script.js', 'utf8').split('\n');
const adminCode = lines.slice(4935, 21930).join('\n');

const btnRegex = /<button([\s\S]*?)>([\s\S]*?)<\/button>/gi;
let match;
const allButtons = [];

while ((match = btnRegex.exec(adminCode)) !== null) {
  const attrs = match[1];
  const innerHtml = match[2];
  const charIdx = match.index;
  // Calculate line number
  const lineNum = 4936 + adminCode.slice(0, charIdx).split('\n').length - 1;
  
  // Extract id, class, onclick, data- attributes
  const idM = attrs.match(/id=["']([^"']+)["']/);
  const classM = attrs.match(/class=["']([^"']+)["']/);
  const onclickM = attrs.match(/onclick=["']([^"']+)["']/);
  const typeM = attrs.match(/type=["']([^"']+)["']/);
  
  allButtons.push({
    lineNum,
    id: idM ? idM[1] : null,
    classes: classM ? classM[1].split(/\s+/).filter(Boolean) : [],
    onclick: onclickM ? onclickM[1] : null,
    type: typeM ? typeM[1] : 'button',
    text: innerHtml.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ').slice(0, 40),
    attrs: attrs.trim().replace(/\s+/g, ' ')
  });
}

console.log('Total button elements in admin code: ' + allButtons.length);

// Now for each button, let's check how it's handled:
let handledCount = 0;
const suspectButtons = [];

allButtons.forEach((b, idx) => {
  // If button is inside a form with type="submit", it's handled by form submit
  const isSubmit = b.type === 'submit';
  if (isSubmit) {
    handledCount++;
    return;
  }
  if (b.onclick) {
    handledCount++;
    return;
  }

  // Check if its id is selected with getElementById or querySelector in adminCode
  let isHandled = false;
  if (b.id) {
    const idRegex = new RegExp(`['"\`]\\s*#?${b.id}['"\`]`);
    if (idRegex.test(adminCode) || adminCode.includes(`getElementById('${b.id}')`) || adminCode.includes(`getElementById("${b.id}")`)) {
      isHandled = true;
    }
  }

  // Check if any specific class is selected with querySelector or querySelectorAll
  if (!isHandled && b.classes.length > 0) {
    for (const c of b.classes) {
      if (['btn', 'primary', 'secondary', 'danger', 'warning', 'success', 'ap-btn', 'active', 'is-active'].includes(c)) continue;
      const classRegex = new RegExp(`['"\`]\\s*\\.${c}['"\`]`);
      if (classRegex.test(adminCode)) {
        isHandled = true;
        break;
      }
    }
  }

  if (isHandled) {
    handledCount++;
  } else {
    suspectButtons.push(b);
  }
});

console.log(`Handled: ${handledCount}, Suspect: ${suspectButtons.length}`);
suspectButtons.forEach(s => {
  console.log(`Line ${s.lineNum}: id="${s.id}" class="${s.classes.join(' ')}" text="${s.text}" attrs="${s.attrs}"`);
});
