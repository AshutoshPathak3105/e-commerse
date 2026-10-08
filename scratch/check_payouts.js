const fs = require('fs');
const s = fs.readFileSync('script.js', 'utf8');
const idx = s.indexOf('function renderPayouts');
if (idx !== -1) {
  const code = s.slice(idx, idx + 8000);
  const m = code.match(/<div class="[^"]*(?:table-wrap|scroll|card)[^"]*"/g);
  console.log('Payouts wrappers:', m);
}

const idxShip = s.indexOf('function renderShipping');
if (idxShip !== -1) {
  const code = s.slice(idxShip, idxShip + 8000);
  const m = code.match(/<div class="[^"]*(?:table-wrap|scroll|card)[^"]*"/g);
  console.log('Shipping wrappers:', m);
}
