const fs = require('fs');

let script = fs.readFileSync('script.js', 'utf8');
let originalCMS = fs.readFileSync('scratch/original_renderCMS.js', 'utf8');

// Normalize line endings
const lines = script.split(/\r?\n/);
const origLines = originalCMS.split(/\r?\n/);

const startIndex = lines.findIndex(l => l.includes('async function renderCMS(body)'));
const endIndex = lines.findIndex(l => l.includes('async function renderStaff(body)'));

console.log({ startIndex, endIndex });

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find start or end line');
  process.exit(1);
}

// Find comment banner before renderStaff if any
let commentStart = endIndex;
while (commentStart > startIndex && (lines[commentStart - 1].trim().startsWith('/*') || lines[commentStart - 1].trim().startsWith('*') || lines[commentStart - 1].trim().startsWith('*/') || lines[commentStart - 1].trim().includes('TAB: STAFF') || lines[commentStart - 1].trim() === '')) {
  commentStart--;
}

const newLines = [
  ...lines.slice(0, startIndex),
  ...origLines,
  '',
  ...lines.slice(commentStart)
];

fs.writeFileSync('script.js', newLines.join('\n'));
console.log('Successfully replaced renderCMS in script.js! Line count before:', lines.length, 'after:', newLines.length);
