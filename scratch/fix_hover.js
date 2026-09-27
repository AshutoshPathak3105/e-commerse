const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

const target1 = `.ap-crm-table button.ap-open-360:hover,
.ap-crm-table button.ap-receipt-btn:hover,
.ap-crm-table button.ap-ban-btn:hover,
button.ap-open-360:hover,
button.ap-receipt-btn:hover,
button.ap-ban-btn:hover {
  background-color: #e68500 !important;
  background: #e68500 !important;
  color: #000000 !important;
  border-color: #d97706 !important;
  box-shadow: 0 2px 5px rgba(255, 148, 0, 0.38) !important;
}`;

const repl1 = `.ap-crm-table button.ap-open-360:hover,
.ap-crm-table button.ap-receipt-btn:hover,
.ap-crm-table button.ap-ban-btn:hover,
button.ap-open-360:hover,
button.ap-receipt-btn:hover,
button.ap-ban-btn:hover {
  background-color: #ff9400 !important;
  background: #ff9400 !important;
  color: #000000 !important;
  border-color: #e08300 !important;
  box-shadow: 0 1px 2px rgba(255, 148, 0, 0.22) !important;
  transform: none !important;
}`;

const target2 = `.ap-crm-drawer-footer .ap-btn:hover,
#ap-crm-drawer-block-btn:hover,
#ap-crm-drawer-save-btn:hover {
  background-color: #e68500 !important;
  background: #e68500 !important;
  color: #000000 !important;
  border-color: #d97706 !important;
  box-shadow: 0 3px 8px rgba(255, 148, 0, 0.42) !important;
}`;

const repl2 = `.ap-crm-drawer-footer .ap-btn:hover,
#ap-crm-drawer-block-btn:hover,
#ap-crm-drawer-save-btn:hover {
  background-color: #ff9400 !important;
  background: #ff9400 !important;
  color: #000000 !important;
  border-color: #e08300 !important;
  box-shadow: 0 1px 3px rgba(255, 148, 0, 0.25) !important;
  transform: none !important;
}`;

if (css.includes(target1)) {
  css = css.replace(target1, repl1);
  console.log('Replaced target1');
} else {
  console.log('target1 not found');
}

if (css.includes(target2)) {
  css = css.replace(target2, repl2);
  console.log('Replaced target2');
} else {
  console.log('target2 not found');
}

fs.writeFileSync('styles.css', css, 'utf8');
console.log('Finished updating styles.css');
