const fs = require('fs');
const path = require('path');

const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

console.log('Gate 1 has onSuccess callback:', scriptContent.includes("window._openAuth('signin', false, () => {"));
console.log('Mock login redirects seller:', scriptContent.includes("setTimeout(() => window._openSellerPortal?.(true, true), 150);"));
console.log('Seller session authentication saved:', scriptContent.includes("sessionStorage.setItem('xmart_seller_session_authenticated', 'true');"));
