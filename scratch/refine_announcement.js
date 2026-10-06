const fs = require('fs');
const path = require('path');

// 1. Update script.js
const scriptPath = path.join(__dirname, '..', 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

const targetHeaderRegex = /<!-- Global Announcement Ticker Manager -->\s*<div class="ap-table-card"[^>]*id="ap-announcements-section">[\s\S]*?<!-- Filter Toolbar -->/;

const replacementHeader = `<!-- Global Announcement Ticker Manager -->
            <div class="ap-table-card" style="margin-bottom:24px; border-radius:12px; overflow:hidden;" id="ap-announcements-section">
              <div class="ap-card-header" style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; position:relative;">
                <div style="flex:1 1 auto; min-width:0;">
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#ffffff !important; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span>Top Navigation Announcement Bar</span>
                    <span class="ap-badge green ap-ann-count-badge-tag" id="ap-ann-count-badge" style="background:#064e3b !important; color:#6ee7b7 !important; border:1px solid #059669 !important; font-weight:800; font-size:11px; padding:2.5px 8px; border-radius:20px; width:fit-content; max-width:fit-content; white-space:nowrap; display:inline-flex; align-items:center;">
                      ● \${announcements.filter(a => a.active !== false).length} Live on Production
                    </span>
                  </h3>
                  <p style="margin:4px 0 0; font-size:12px; color:#cbd5e1 !important; font-weight:600; line-height:1.4;">
                    Manage all marquee announcement messages displayed at the top-left utility bar of the customer-facing storefront.
                  </p>
                </div>
                <div class="ap-card-header-actions" style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                  <button type="button" class="ap-btn primary" id="ap-cms-add-ann-btn" style="padding:6px 16px; font-size:12px; font-weight:800; background:#ff9400 !important; background-color:#ff9400 !important; color:#000000 !important; border:1px solid #e08300 !important; border-color:#e08300 !important; border-radius:8px; cursor:pointer; white-space:nowrap;">
                    Add Announcement
                  </button>
                </div>
              </div>


              <!-- Filter Toolbar -->`;

scriptContent = scriptContent.replace(targetHeaderRegex, replacementHeader);
fs.writeFileSync(scriptPath, scriptContent, 'utf8');
console.log('Updated script.js header');

// 2. Update styles.css
const stylesPath = path.join(__dirname, '..', 'styles.css');
let stylesContent = fs.readFileSync(stylesPath, 'utf8');

const oldBlockRegex = /\/\* ── Announcement section: Live badge top-right & compact[\s\S]*$/;

const newStylesBlock = `/* ── Announcement section: Live badge top-right & compact, Add Announcement button orange, Edit button navy ── */
#ap-announcements-section .ap-card-header {
  position: relative !important;
}

#admin-panel-overlay #ap-announcements-section #ap-ann-count-badge,
#ap-announcements-section #ap-ann-count-badge,
.ap-ann-count-badge-tag {
  background: #064e3b !important;
  background-color: #064e3b !important;
  color: #6ee7b7 !important;
  border: 1px solid #059669 !important;
  font-weight: 800 !important;
  font-size: 11px !important;
  padding: 2.5px 8px !important;
  border-radius: 20px !important;
  width: fit-content !important;
  max-width: fit-content !important;
  display: inline-flex !important;
  align-items: center !important;
  white-space: nowrap !important;
  box-sizing: border-box !important;
}

/* Mobile & Tablet (max-width: 1024px): place badge cleanly in the top-right corner of card header */
@media (max-width: 1024px) {
  #admin-panel-overlay #ap-announcements-section #ap-ann-count-badge,
  #ap-announcements-section #ap-ann-count-badge,
  .ap-ann-count-badge-tag {
    position: absolute !important;
    top: 14px !important;
    right: 16px !important;
    margin: 0 !important;
    font-size: 10.5px !important;
    padding: 2px 7.5px !important;
    z-index: 5 !important;
  }

  #ap-announcements-section .ap-card-header > div:first-child {
    padding-right: 135px !important;
  }
}

@media (max-width: 600px) {
  #admin-panel-overlay #ap-announcements-section #ap-ann-count-badge,
  #ap-announcements-section #ap-ann-count-badge,
  .ap-ann-count-badge-tag {
    top: 12px !important;
    right: 12px !important;
    font-size: 10px !important;
    padding: 2px 7px !important;
  }

  #ap-announcements-section .ap-card-header > div:first-child {
    padding-right: 125px !important;
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

if (oldBlockRegex.test(stylesContent)) {
  stylesContent = stylesContent.replace(oldBlockRegex, newStylesBlock);
} else {
  stylesContent += '\n\n' + newStylesBlock;
}

fs.writeFileSync(stylesPath, stylesContent, 'utf8');
console.log('Updated styles.css');
