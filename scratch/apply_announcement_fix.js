const fs = require('fs');
const path = require('path');

// 1. Update script.js
const scriptPath = path.join(__dirname, '..', 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Find and replace the announcement card header block in script.js
const targetHeaderRegex = /<!-- Global Announcement Ticker Manager -->\s*<div class="ap-table-card"[^>]*id="ap-announcements-section">[\s\S]*?<!-- Filter Toolbar -->/;

const replacementHeader = `<!-- Global Announcement Ticker Manager -->
            <div class="ap-table-card" style="margin-bottom:24px; border-radius:12px; overflow:hidden;" id="ap-announcements-section">
              <div class="ap-card-header" style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; position:relative;">
                <div style="flex:1 1 auto; min-width:0; padding-right:140px;">
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#ffffff !important; display:flex; align-items:center; gap:8px;">
                    <span>Top Navigation Announcement Bar</span>
                  </h3>
                  <p style="margin:4px 0 0; font-size:12px; color:#cbd5e1 !important; font-weight:600; line-height:1.4;">
                    Manage all marquee announcement messages displayed at the top-left utility bar of the customer-facing storefront.
                  </p>
                </div>
                <span class="ap-badge green ap-ann-count-badge-tag" id="ap-ann-count-badge" style="background:#064e3b !important; color:#6ee7b7 !important; border:1px solid #059669 !important; font-weight:800; font-size:10.5px; padding:2.5px 8px; border-radius:20px; width:fit-content; max-width:fit-content; white-space:nowrap; position:absolute; top:16px; right:20px; z-index:2; align-self:flex-start;">
                  ● \${announcements.filter(a => a.active !== false).length} Live on Production
                </span>
                <div class="ap-card-header-actions" style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                  <button type="button" class="ap-btn primary" id="ap-cms-add-ann-btn" style="padding:6px 16px; font-size:12px; font-weight:800; background:#ff9400 !important; background-color:#ff9400 !important; color:#000000 !important; border:1px solid #e08300 !important; border-color:#e08300 !important; border-radius:8px; cursor:pointer; white-space:nowrap;">
                    Add Announcement
                  </button>
                </div>
              </div>


              <!-- Filter Toolbar -->`;

if (!targetHeaderRegex.test(scriptContent)) {
  console.error('Could not match targetHeaderRegex in script.js');
  process.exit(1);
}

scriptContent = scriptContent.replace(targetHeaderRegex, replacementHeader);

// Ensure the search wrapper has class ap-ann-search-wrap
scriptContent = scriptContent.replace(
  '<div style="display:flex; align-items:center; gap:8px; width:100%; max-width:320px;">\n                  <input type="text" id="ap-ann-search-input"',
  '<div class="ap-ann-search-wrap" style="display:flex; align-items:center; gap:8px; width:100%; max-width:320px;">\n                  <input type="text" id="ap-ann-search-input"'
);

// Ensure renderAnnouncementRows Edit button has #022f43 bg and #ffffff color
const oldEditRegex = /<button type="button" class="ap-btn ghost ap-edit-ann-btn"[^>]*>Edit<\/button>/;
const newEdit = `<button type="button" class="ap-btn ghost ap-edit-ann-btn" data-id="\${id}" style="padding:4px 10px; font-size:12px; margin-right:4px; background:#022f43 !important; background-color:#022f43 !important; color:#ffffff !important; border:1px solid #022f43 !important; border-color:#022f43 !important; border-radius:6px; font-weight:700;">Edit</button>`;

if (oldEditRegex.test(scriptContent)) {
  scriptContent = scriptContent.replace(oldEditRegex, newEdit);
  console.log('Updated Edit button in renderAnnouncementRows');
}

// Ensure both button IDs are wired
if (scriptContent.includes("document.getElementById('ap-cms-add-ann-btn')?.addEventListener")) {
  scriptContent = scriptContent.replace(
    "document.getElementById('ap-cms-add-ann-btn')?.addEventListener('click', (e) => {\n          e.preventDefault();\n          showAnnouncementModal(null);\n        });",
    "['ap-cms-add-ann-btn', 'ap-cms-add-announcement-btn'].forEach(btnId => {\n          document.getElementById(btnId)?.addEventListener('click', (e) => {\n            e.preventDefault();\n            showAnnouncementModal(null);\n          });\n        });"
  );
  console.log('Updated click listeners for Add Announcement buttons');
}

fs.writeFileSync(scriptPath, scriptContent, 'utf8');
console.log('Successfully updated script.js');

// 2. Update styles.css
const stylesPath = path.join(__dirname, '..', 'styles.css');
let stylesContent = fs.readFileSync(stylesPath, 'utf8');

// Replace the end of styles.css where the badge CSS was appended earlier
const oldBadgeCSSRegex = /\/\* ── Announcement badge: compact \+ top-right on mobile\/tablet ── \*\/[\s\S]*$/;

const newStylesBlock = `/* ── Announcement section: Live badge top-right & compact, Add Announcement button orange, Edit button navy ── */
#ap-announcements-section .ap-card-header {
  position: relative !important;
}

#admin-panel-overlay #ap-announcements-section #ap-ann-count-badge,
#ap-announcements-section #ap-ann-count-badge,
.ap-ann-count-badge-tag {
  position: absolute !important;
  top: 16px !important;
  right: 20px !important;
  margin: 0 !important;
  font-size: 10.5px !important;
  font-weight: 800 !important;
  padding: 2.5px 8px !important;
  border-radius: 20px !important;
  width: fit-content !important;
  max-width: fit-content !important;
  display: inline-flex !important;
  align-items: center !important;
  white-space: nowrap !important;
  z-index: 5 !important;
  background: #064e3b !important;
  background-color: #064e3b !important;
  color: #6ee7b7 !important;
  border: 1px solid #059669 !important;
  box-sizing: border-box !important;
}

@media (max-width: 768px) {
  #admin-panel-overlay #ap-announcements-section #ap-ann-count-badge,
  #ap-announcements-section #ap-ann-count-badge,
  .ap-ann-count-badge-tag {
    top: 14px !important;
    right: 14px !important;
    font-size: 10px !important;
    padding: 2px 7px !important;
  }
}

/* Add Announcement Button: #ff9400 background, black font, 800 weight */
#admin-panel-overlay #ap-cms-add-ann-btn,
#admin-panel-overlay #ap-cms-add-announcement-btn,
#ap-announcements-section #ap-cms-add-ann-btn,
#ap-announcements-section #ap-cms-add-announcement-btn,
#ap-cms-add-ann-btn,
#ap-cms-add-announcement-btn {
  color: #000000 !important;
  background: #ff9400 !important;
  background-color: #ff9400 !important;
  border: 1px solid #e08300 !important;
  border-color: #e08300 !important;
  font-weight: 800 !important;
}
#admin-panel-overlay #ap-cms-add-ann-btn:hover,
#admin-panel-overlay #ap-cms-add-announcement-btn:hover,
#ap-announcements-section #ap-cms-add-ann-btn:hover,
#ap-announcements-section #ap-cms-add-announcement-btn:hover,
#ap-cms-add-ann-btn:hover,
#ap-cms-add-announcement-btn:hover {
  color: #000000 !important;
  background: #e08300 !important;
  background-color: #e08300 !important;
  border-color: #e08300 !important;
}

/* Edit Announcement button in table: #022f43 background, white font */
#admin-panel-overlay .ap-edit-ann-btn,
#admin-panel-overlay .ap-table .ap-edit-ann-btn,
#ap-ann-table .ap-edit-ann-btn,
.ap-edit-ann-btn {
  background: #022f43 !important;
  background-color: #022f43 !important;
  color: #ffffff !important;
  border: 1px solid #022f43 !important;
  border-color: #022f43 !important;
  font-weight: 700 !important;
}
#admin-panel-overlay .ap-edit-ann-btn:hover,
#admin-panel-overlay .ap-table .ap-edit-ann-btn:hover,
#ap-ann-table .ap-edit-ann-btn:hover,
.ap-edit-ann-btn:hover {
  background: #034460 !important;
  background-color: #034460 !important;
  color: #ffffff !important;
  border-color: #034460 !important;
}

/* Announcement search bar: 100% width on mobile / tablet */
@media (max-width: 1024px) {
  #ap-announcements-section .ap-cms-toolbar > div:last-child,
  #ap-announcements-section .ap-ann-search-wrap {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 100% !important;
  }
  #ap-ann-search-input {
    width: 100% !important;
  }
}
`;

if (oldBadgeCSSRegex.test(stylesContent)) {
  stylesContent = stylesContent.replace(oldBadgeCSSRegex, newStylesBlock);
} else {
  stylesContent += '\n\n' + newStylesBlock;
}

fs.writeFileSync(stylesPath, stylesContent, 'utf8');
console.log('Successfully updated styles.css');

// 3. Update index.html cache busting versions
const indexPath = path.join(__dirname, '..', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(/styles\.css\?v=[0-9.]+/, 'styles.css?v=188.0');
indexContent = indexContent.replace(/script\.js\?v=[0-9.]+/, 'script.js?v=188.0');
fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('Successfully updated cache busting in index.html');
