const fs = require('fs');
const s = fs.readFileSync('scratch/dump_scroll_fix.html', 'utf8');
const marker = '<pre id="scroll-check">';
const start = s.indexOf(marker);
if (start !== -1) {
  const end = s.indexOf('</pre>', start);
  console.log(s.slice(start + marker.length, end));
} else {
  console.log('Not found');
}
