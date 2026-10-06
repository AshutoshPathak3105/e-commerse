const fs = require('fs');

const css = fs.readFileSync('styles.css', 'utf8');
const lines = css.split(/\r?\n/);

console.log('Total lines in styles.css:', lines.length);

// 1. Find block: CMS & Storefront Control Buttons (#FF9400 bg, black font)
const block1Start = lines.findIndex(l => l.includes('CMS & Storefront Control Buttons (#FF9400 bg, black font)'));
console.log('block1Start:', block1Start);

// 2. Find block: .ap-table-card > div:first-child...
const block2Start = lines.findIndex(l => l.includes('.ap-table-card > div:first-child:not(.ap-table-wrap)'));
console.log('block2Start:', block2Start);

// 3. Find block: CMS ADMIN PANEL — MOBILE RESPONSIVE CARD & TABLE LAYOUT
const block3Start = lines.findIndex(l => l.includes('CMS ADMIN PANEL — MOBILE RESPONSIVE CARD & TABLE LAYOUT'));
console.log('block3Start:', block3Start);
