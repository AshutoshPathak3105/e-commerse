const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'styles.css');
let content = fs.readFileSync(file, 'utf8');

const newCSS = `
/* ── Announcement badge: compact + top-right on mobile/tablet ── */
@media (max-width: 1024px) {
  #ap-announcements-section .ap-card-header {
    position: relative !important;
  }
  #ap-ann-count-badge,
  .ap-ann-count-badge-tag {
    position: absolute !important;
    top: 12px !important;
    right: 14px !important;
    font-size: 10.5px !important;
    padding: 2px 8px !important;
    border-radius: 20px !important;
    width: auto !important;
    max-width: 160px !important;
    white-space: nowrap !important;
  }
}
`;

content = content.trimEnd() + '\n' + newCSS + '\n';
fs.writeFileSync(file, content, 'utf8');
console.log('Badge CSS appended to styles.css');
