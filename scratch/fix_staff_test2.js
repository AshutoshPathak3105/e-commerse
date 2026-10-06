const fs = require('fs');

const content = fs.readFileSync('scratch/test_staff_mobile.html', 'utf8');

const testScript = `
<pre id="dbg" style="background:#fff; color:#000; font-size:12px; padding:10px;"></pre>
<script>
window.addEventListener('load', () => {
  const row = document.querySelector('.ap-staff-filters-row');
  const items = document.querySelectorAll('.ap-staff-filter-item');
  const sel0 = document.getElementById('ap-staff-filter-role');
  const sel1 = document.getElementById('ap-staff-filter-status');
  const d = {
    rowWidth: row.offsetWidth,
    rowDisplay: getComputedStyle(row).display,
    rowFlexWrap: getComputedStyle(row).flexWrap,
    rowFlexDir: getComputedStyle(row).flexDirection,
    item0: {
      width: items[0].offsetWidth,
      display: getComputedStyle(items[0]).display,
      flex: getComputedStyle(items[0]).flex,
      maxWidth: getComputedStyle(items[0]).maxWidth,
      minWidth: getComputedStyle(items[0]).minWidth
    },
    item1: {
      width: items[1].offsetWidth,
      display: getComputedStyle(items[1]).display,
      flex: getComputedStyle(items[1]).flex,
      maxWidth: getComputedStyle(items[1]).maxWidth,
      minWidth: getComputedStyle(items[1]).minWidth
    }
  };
  document.getElementById('dbg').textContent = JSON.stringify(d, null, 2);
});
</script>
`;

fs.writeFileSync('scratch/test_staff_mobile.html', content.replace(/<pre id="dbg"[\s\S]*?<\/script>/, testScript));
console.log('Written items inspection');
