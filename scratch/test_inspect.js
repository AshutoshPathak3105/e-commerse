const fs = require('fs');

let html = fs.readFileSync('scratch/test_applied_fix.html', 'utf8');

const inspectScript = `
<script>
window.addEventListener('load', () => {
  const table = document.getElementById('ap-promos-table');
  const firstRow = table.querySelector('tbody tr');
  const lastTd = firstRow.lastElementChild;
  const editBtn = lastTd.querySelector('.ap-edit-promo-btn');
  const delBtn = lastTd.querySelector('.ap-delete-promo-btn');

  const tdStyle = window.getComputedStyle(lastTd);
  const editStyle = window.getComputedStyle(editBtn);
  const delStyle = window.getComputedStyle(delBtn);

  const res = {
    td: {
      rect: lastTd.getBoundingClientRect(),
      padding: tdStyle.padding,
      textAlign: tdStyle.textAlign,
      whiteSpace: tdStyle.whiteSpace,
      width: tdStyle.width
    },
    editBtn: {
      rect: editBtn.getBoundingClientRect(),
      margin: editStyle.margin,
      display: editStyle.display
    },
    delBtn: {
      rect: delBtn.getBoundingClientRect(),
      margin: delStyle.margin,
      display: delStyle.display
    }
  };

  const d = document.createElement('div');
  d.id = 'inspect-buttons';
  d.textContent = JSON.stringify(res, null, 2);
  document.body.appendChild(d);
});
</script>
`;

html = html.replace('</body>', inspectScript + '</body>');
fs.writeFileSync('scratch/test_inspect.html', html, 'utf8');

const { execSync } = require('child_process');
const path = require('path');
const p = path.resolve('scratch/test_inspect.html').replace(/\\/g, '/');
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=390,1400 --dump-dom "file:///${p}" > scratch/dump_inspect.html`);

const dump = fs.readFileSync('scratch/dump_inspect.html', 'utf8');
const match = dump.match(/<div id="inspect-buttons">([\s\S]*?)<\/div>/);
console.log('INSPECT:\n', match ? match[1] : 'not found');
