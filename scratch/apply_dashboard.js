const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '../script.js');
const replacementPath = path.join(__dirname, 'dash_replacement.js');

let scriptContent = fs.readFileSync(scriptPath, 'utf8');
let replacementContent = fs.readFileSync(replacementPath, 'utf8');

const startMarker = "let _dashFilter = { timeframe: 'day', range: 'all', startDate: '', endDate: '' };";
const nextTabMarker = "/* ══════════════════════════════════════════════════════\r\n     TAB: CUSTOMER ACCOUNTS & SEGMENTATION (CRM SUITE)";
const nextTabMarkerLF = "/* ══════════════════════════════════════════════════════\n     TAB: CUSTOMER ACCOUNTS & SEGMENTATION (CRM SUITE)";

const startIndex = scriptContent.indexOf(startMarker);
if (startIndex === -1) {
  console.error("Start marker not found!");
  process.exit(1);
}

let nextTabIdx = scriptContent.indexOf(nextTabMarker, startIndex);
if (nextTabIdx === -1) {
  nextTabIdx = scriptContent.indexOf(nextTabMarkerLF, startIndex);
}
if (nextTabIdx === -1) {
  console.error("Next tab marker not found!");
  process.exit(1);
}

// Convert replacementContent line endings to match scriptContent
const isCRLF = scriptContent.includes('\r\n');
if (isCRLF) {
  replacementContent = replacementContent.replace(/\r?\n/g, '\r\n') + '\r\n  ';
} else {
  replacementContent = replacementContent.replace(/\r?\n/g, '\n') + '\n  ';
}

console.log(`Replacing block from index ${startIndex} to ${nextTabIdx}`);
const newContent = scriptContent.slice(0, startIndex) + replacementContent + scriptContent.slice(nextTabIdx);

fs.writeFileSync(scriptPath, newContent, 'utf8');
console.log("Successfully replaced renderDashboard in script.js!");
