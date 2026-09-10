const fs = require('fs');
const js = fs.readFileSync('script.js', 'utf8');

const s1 = js.indexOf("if (cleanEp === '/profile')");
const e1 = js.indexOf("// Default generic response", s1);
console.log('Section 1 preview start:\n', js.slice(s1, s1 + 150));
console.log('Section 1 preview end:\n', js.slice(e1 - 100, e1));

const s2 = js.indexOf("async function renderAdminProfile(container)");
const e2 = js.indexOf("function switchTab(tabId)", s2);
console.log('Section 2 preview start:\n', js.slice(s2, s2 + 150));
console.log('Section 2 preview end:\n', js.slice(e2 - 150, e2));
