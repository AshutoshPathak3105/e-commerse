const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'script.js');
let content = fs.readFileSync(file, 'utf8');
let changed = 0;

// ── 1. Edit button: add #022f43 bg + white text ──────────────────────────────
const oldEdit = `<button type="button" class="ap-btn ghost ap-edit-ann-btn" data-id="${'${id}'}" style="padding:4px 10px; font-size:12px; margin-right:4px;">Edit</button>`;
const newEdit = `<button type="button" class="ap-btn ghost ap-edit-ann-btn" data-id="${'${id}'}" style="padding:4px 10px; font-size:12px; margin-right:4px; background:#022f43 !important; color:#ffffff !important; border-color:#022f43 !important;">Edit</button>`;

if (content.includes(oldEdit)) { content = content.replace(oldEdit, newEdit); changed++; console.log('Edit button updated'); }
else console.error('Edit button NOT found');

// ── 2. Badge: remove full-width stretch, make it compact, position top-right on mobile ─
const oldBadge = `<span class="ap-badge green" id="ap-ann-count-badge" style="background:#064e3b !important; color:#6ee7b7 !important; border:1px solid #059669 !important; font-weight:800; font-size:11.5px; padding:3px 10px; border-radius:12px;">`;
const newBadge = `<span class="ap-badge green ap-ann-count-badge-tag" id="ap-ann-count-badge" style="background:#064e3b !important; color:#6ee7b7 !important; border:1px solid #059669 !important; font-weight:800; font-size:11px; padding:2px 8px; border-radius:20px; width:fit-content; align-self:flex-start;">`;

if (content.includes(oldBadge)) { content = content.replace(oldBadge, newBadge); changed++; console.log('Badge updated'); }
else console.error('Badge NOT found');

fs.writeFileSync(file, content, 'utf8');
console.log(`Done — ${changed}/2 changes applied`);
