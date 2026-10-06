const fs = require('fs');

const content = fs.readFileSync('script.js', 'utf8');
const lines = content.split('\n');
const btnClasses = new Set();
const buttonTags = [];

for (let i = 5980; i < 20100; i++) {
  const line = lines[i];
  const matches = line.matchAll(/class=["']([^"']*ap-btn[^"']*)["']/g);
  for (const m of matches) {
    btnClasses.add(m[1].trim());
  }
  if (line.includes('<button') && (line.includes('Update') || line.includes('View') || line.includes('Edit') || line.includes('Save'))) {
    buttonTags.push({ line: i + 1, text: line.trim() });
  }
}

console.log('--- ALL AP-BTN CLASSES FOUND ---');
console.log(Array.from(btnClasses).sort().join('\n'));

console.log('\n--- BUTTON TAGS WITH UPDATE/VIEW/EDIT/SAVE ---');
buttonTags.forEach(b => console.log(`${b.line}: ${b.text.slice(0, 120)}`));
