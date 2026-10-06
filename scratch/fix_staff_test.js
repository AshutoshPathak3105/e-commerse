const fs = require('fs');

const content = fs.readFileSync('scratch/test_staff_mobile.html', 'utf8');

const debugScript = `
<pre id="dbg" style="background:#fff; color:#000; font-size:11px; padding:10px;"></pre>
<script>
window.addEventListener('load', () => {
  const row = document.querySelector('.ap-staff-filters-row');
  const matched = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.cssRules) {
          for (const subRule of rule.cssRules) {
            if (subRule.selectorText && subRule.selectorText.includes('ap-staff-filters-row')) {
              matched.push({ sel: subRule.selectorText, cssText: subRule.cssText });
            }
          }
        } else if (rule.selectorText && rule.selectorText.includes('ap-staff-filters-row')) {
          matched.push({ sel: rule.selectorText, cssText: rule.cssText });
        }
      }
    } catch(e) {
      matched.push('Error reading sheet: ' + e.message);
    }
  }
  document.getElementById('dbg').textContent = JSON.stringify({
    matchedRules: matched,
    computed: {
      display: getComputedStyle(row).display,
      flexWrap: getComputedStyle(row).flexWrap
    }
  }, null, 2);
});
</script>
`;

fs.writeFileSync('scratch/test_staff_mobile.html', content.replace(/<pre id="dbg"[\s\S]*?<\/script>/, debugScript));
console.log('Updated test_staff_mobile.html with rule inspector');
