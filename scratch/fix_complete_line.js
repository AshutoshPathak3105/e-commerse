const fs = require('fs');
const path = require('path');

// 1. Update script.js
const scriptPath = path.join(__dirname, '..', 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

const targetHeaderRegex = /<!-- Global Announcement Ticker Manager -->\s*<div class="ap-table-card"[^>]*id="ap-announcements-section">[\s\S]*?<!-- Filter Toolbar -->/;

const replacementHeader = `<!-- Global Announcement Ticker Manager -->
            <div class="ap-table-card" style="margin-bottom:24px; border-radius:12px; overflow:hidden;" id="ap-announcements-section">
              <div class="ap-card-header" style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.12); background:#022f43; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; position:relative;">
                <div style="width:100%; flex:1 1 100%; min-width:0; position:relative;">
                  <h3 style="margin:0; font-size:15px; font-weight:800; color:#ffffff !important; display:flex; align-items:center; justify-content:space-between; width:100%; gap:8px;">
                    <span style="font-size:14px; font-weight:800; color:#ffffff !important;">Top Navigation Announcement Bar</span>
                    <span class="ap-badge green ap-ann-count-badge-tag" id="ap-ann-count-badge" style="background:#064e3b !important; color:#6ee7b7 !important; border:1px solid #059669 !important; font-weight:800; font-size:10.5px; padding:2.5px 8px; border-radius:20px; width:fit-content; max-width:fit-content; white-space:nowrap; flex-shrink:0; margin-left:auto;">
                      ● \${announcements.filter(a => a.active !== false).length} Live on Production
                    </span>
                  </h3>
                  <p style="margin:6px 0 0; font-size:12px; color:#cbd5e1 !important; font-weight:600; line-height:1.45; width:100% !important; max-width:100% !important; display:block !important; padding:0 !important;">
                    Manage all marquee announcement messages displayed at the top-left utility bar of the customer-facing storefront.
                  </p>
                </div>
                <div class="ap-card-header-actions" style="display:flex; align-items:center; gap:8px; flex-shrink:0; width:100%;">
                  <button type="button" class="ap-btn primary" id="ap-cms-add-ann-btn" style="padding:8px 16px; font-size:12px; font-weight:800; background:#ff9400 !important; background-color:#ff9400 !important; color:#000000 !important; border:1px solid #e08300 !important; border-color:#e08300 !important; border-radius:8px; cursor:pointer; white-space:nowrap;">
                    Add Announcement
                  </button>
                </div>
              </div>


              <!-- Filter Toolbar -->`;

scriptContent = scriptContent.replace(targetHeaderRegex, replacementHeader);
fs.writeFileSync(scriptPath, scriptContent, 'utf8');
console.log('Updated script.js announcement header');

// 2. Update styles.css
const stylesPath = path.join(__dirname, '..', 'styles.css');
let stylesContent = fs.readFileSync(stylesPath, 'utf8');

const oldStylesRegex = /\/\* ── Announcement section: Live badge top-right & compact[\s\S]*$/;

const newStylesBlock = `/* ── Announcement section: Live badge top-right & compact, full-width subtitle, Add Announcement button orange, Edit button navy ── */
#ap-announcements-section .ap-card-header {
  position: relative !important;
}

#ap-announcements-section .ap-card-header > div:first-child {
  width: 100% !important;
  max-width: 100% !important;
  padding-right: 0 !important;
  flex: 1 1 100% !important;
}

#ap-announcements-section .ap-card-header h3 {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  justify-content: space-between !important;
  width: 100% !important;
  max-width: 100% !important;
  gap: 8px !important;
  padding-right: 0 !important;
}

#ap-announcements-section .ap-card-header h3 > span:first-child {
  font-size: 14px !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  flex: 1 1 auto !important;
  display: inline-block !important;
}

/* Small font size text: full width across the complete line (never squished into half line) */
#ap-announcements-section .ap-card-header p,
#admin-panel-overlay #ap-announcements-section .ap-card-header p,
.ap-table-card#ap-announcements-section p {
  width: 100% !important;
  max-width: 100% !important;
  display: block !important;
  white-space: normal !important;
  padding-right: 0 !important;
  margin-top: 6px !important;
  color: #cbd5e1 !important;
  font-size: 12px !important;
  line-height: 1.45 !important;
}

#admin-panel-overlay #ap-announcements-section #ap-ann-count-badge,
#ap-announcements-section #ap-ann-count-badge,
.ap-ann-count-badge-tag {
  background: #064e3b !important;
  background-color: #064e3b !important;
  color: #6ee7b7 !important;
  border: 1px solid #059669 !important;
  font-weight: 800 !important;
  font-size: 10.5px !important;
  padding: 2.5px 8px !important;
  border-radius: 20px !important;
  width: fit-content !important;
  max-width: fit-content !important;
  display: inline-flex !important;
  align-items: center !important;
  white-space: nowrap !important;
  box-sizing: border-box !important;
  margin-left: auto !important;
  flex-shrink: 0 !important;
}

@media (max-width: 600px) {
  #admin-panel-overlay #ap-announcements-section #ap-ann-count-badge,
  #ap-announcements-section #ap-ann-count-badge,
  .ap-ann-count-badge-tag {
    font-size: 10px !important;
    padding: 2px 7px !important;
  }
}

/* On large desktop screens, allow side-by-side header layout if space permits */
@media (min-width: 1025px) {
  #ap-announcements-section .ap-card-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    gap: 16px !important;
  }
  #ap-announcements-section .ap-card-header > div:first-child {
    flex: 1 1 auto !important;
    width: auto !important;
  }
  #ap-announcements-section .ap-card-header-actions {
    flex-shrink: 0 !important;
    width: auto !important;
  }
  #ap-announcements-section #ap-cms-add-ann-btn {
    width: auto !important;
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

stylesContent = stylesContent.replace(oldStylesRegex, newStylesBlock);
fs.writeFileSync(stylesPath, stylesContent, 'utf8');
console.log('Updated styles.css with full-width complete line subtitle');

// 3. Bump cache busting in index.html
const indexPath = path.join(__dirname, '..', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(/styles\.css\?v=[0-9.]+/, 'styles.css?v=189.0');
indexContent = indexContent.replace(/script\.js\?v=[0-9.]+/, 'script.js?v=189.0');
fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('Bumped cache busting versions in index.html to v=189.0');
