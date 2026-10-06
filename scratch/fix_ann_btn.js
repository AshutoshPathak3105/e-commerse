const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'script.js');
let content = fs.readFileSync(file, 'utf8');

// Old button: orange bg, black text, has + icon
const oldStr = [
  '                  <button type="button" class="ap-btn primary" id="ap-cms-add-ann-btn" style="padding:6px 16px; font-size:12px; font-weight:800; background:#ff9400 !important; color:#000000 !important; border:1.5px solid #e08300 !important; border-radius:8px; cursor:pointer; white-space:nowrap;">',
  '                    + Add Announcement',
  '                  </button>'
].join('\n');

// New button: #022f43 bg, white text, no + icon
const newStr = [
  '                  <button type="button" class="ap-btn primary" id="ap-cms-add-ann-btn" style="padding:6px 16px; font-size:12px; font-weight:800; background:#022f43 !important; color:#ffffff !important; border:1.5px solid #022f43 !important; border-radius:8px; cursor:pointer; white-space:nowrap;">',
  '                    Add Announcement',
  '                  </button>'
].join('\n');

if (!content.includes(oldStr)) {
  console.error('Target string NOT FOUND in file');
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(file, content, 'utf8');
console.log('Button fixed successfully!');
