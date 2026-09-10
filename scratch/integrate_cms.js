const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptPath = path.resolve(__dirname, '../script.js');
const cmsCodePath = path.resolve(__dirname, 'cms_render_code.js');
const storefrontCodePath = path.resolve(__dirname, 'storefront_cms.js');

const scriptContent = fs.readFileSync(scriptPath, 'utf8');
const cmsCode = fs.readFileSync(cmsCodePath, 'utf8');
const storefrontCode = fs.readFileSync(storefrontCodePath, 'utf8');

const lines = scriptContent.split('\n');

// Find start line of renderCMS
const startIndex = lines.findIndex(line => line.includes('async function renderCMS(body) {'));
if (startIndex === -1) {
  console.error('Could not find renderCMS start line');
  process.exit(1);
}

// Find start of renderStaff
const staffIndex = lines.findIndex(line => line.includes('TAB: STAFF & RBAC (PERMISSIONS & ROLES)'));
if (staffIndex === -1) {
  console.error('Could not find renderStaff start line');
  process.exit(1);
}

// The end of renderCMS is the last non-empty line before TAB: STAFF & RBAC comment
let endIndex = -1;
for (let i = staffIndex - 1; i > startIndex; i--) {
  if (lines[i].trim() === '}') {
    endIndex = i;
    break;
  }
}

if (endIndex === -1) {
  console.error('Could not find renderCMS end line');
  process.exit(1);
}

console.log(`Found renderCMS from line ${startIndex + 1} to line ${endIndex + 1}`);

// Backup script.js
fs.writeFileSync(scriptPath + '.bak', scriptContent, 'utf8');

const newLines = [
  ...lines.slice(0, startIndex),
  cmsCode,
  ...lines.slice(endIndex + 1),
  '\n\n' + storefrontCode
];

fs.writeFileSync(scriptPath, newLines.join('\n'), 'utf8');
console.log('Successfully updated script.js. Testing syntax...');

try {
  execSync(`node -c "${scriptPath}"`, { stdio: 'inherit' });
  console.log('node -c passed successfully!');
} catch (e) {
  console.error('Syntax check failed! Restoring backup...');
  fs.copyFileSync(scriptPath + '.bak', scriptPath);
  process.exit(1);
}
