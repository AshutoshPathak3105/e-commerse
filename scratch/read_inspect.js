const fs = require('fs');
const dump = fs.readFileSync('scratch/dump_inspect.html', 'utf8');
const marker = '<div id="inspect-buttons">';
const idx = dump.indexOf(marker);
if (idx !== -1) {
  const end = dump.indexOf('</div>', idx);
  console.log(dump.slice(idx + marker.length, end));
} else {
  console.log('Not found');
}
