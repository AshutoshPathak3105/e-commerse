const fs = require('fs');

const js = fs.readFileSync('script.js', 'utf8');

const s1 = js.indexOf("if (cleanEp === '/profile')");
const e1 = js.indexOf("// Default generic response", s1);
console.log('cleanEp section found:', s1, 'to', e1);

const s2 = js.indexOf("async function renderAdminProfile(container)");
const e2 = js.indexOf("/* ══════════════════════════════════════════════════════\n     TAB ROUTER", s2) !== -1
  ? js.indexOf("/* ══════════════════════════════════════════════════════\n     TAB ROUTER", s2)
  : js.indexOf("function switchTab(tabId)", s2);
console.log('renderAdminProfile section found:', s2, 'to', e2);
