const fs = require('fs');
const lines = fs.readFileSync('script.js', 'utf8').split('\n');
const adminLines = lines.slice(4935, 21930);
const adminCode = adminLines.join('\n');

const renderers = [
  'renderDashboard',
  'renderUsers',
  'renderSellers',
  'renderOrders',
  'renderCustomerService',
  'renderPayouts',
  'renderOffers',
  'renderProducts',
  'renderAnalytics',
  'renderShipping',
  'renderInventory',
  'renderReviews',
  'renderSupport',
  'renderCMS',
  'renderStaff',
  'renderSettings',
  'renderAdminProfile'
];

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

renderers.forEach(funcName => {
  const startIdx = adminCode.indexOf(`function ${funcName}`);
  if (startIdx === -1) return;
  
  const nextFuncIdx = adminCode.indexOf('function render', startIdx + 20);
  const funcSlice = adminCode.slice(startIdx, nextFuncIdx !== -1 ? nextFuncIdx : startIdx + 50000);

  // Extract all buttons inside this renderer slice
  const btnMatches = funcSlice.matchAll(/<button([\s\S]*?)>([\s\S]*?)<\/button>/gi);
  const missingListeners = [];
  
  for (const bm of btnMatches) {
    const attrs = bm[1];
    const text = bm[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    const idM = attrs.match(/id=["']([^"']+)["']/);
    const clsM = attrs.match(/class=["']([^"']+)["']/);
    const onclickM = attrs.match(/onclick=["']([^"']+)["']/);
    const typeM = attrs.match(/type=["']([^"']+)["']/);

    if (onclickM) continue;
    if (typeM && typeM[1] === 'submit') continue;

    const id = idM ? idM[1] : null;
    const classes = clsM ? clsM[1].split(/\s+/).filter(c => !['btn','primary','secondary','danger','warning','success','ap-btn','ghost','neutral','active','is-active'].includes(c) && !c.includes('${')) : [];

    let isWired = false;
    
    // Check if id has addEventListener or onclick in funcSlice
    if (id && !id.includes('${')) {
      const escapedId = escapeRegex(id);
      const listenerRegex = new RegExp(`['"\`]\\s*#?${escapedId}['"\`][^)]*\\.(addEventListener|onclick)`);
      if (listenerRegex.test(funcSlice) || new RegExp(`getElementById\\(['"\`]${escapedId}['"\`]\\)\\??\\.(addEventListener|onclick)`).test(funcSlice)) {
        isWired = true;
      }
    }

    // Check if class has querySelector / querySelectorAll with addEventListener
    if (!isWired && classes.length > 0) {
      for (const c of classes) {
        const escapedClass = escapeRegex(c);
        const classRegex = new RegExp(`['"\`][^'"]*\\.${escapedClass}[^'"]*['"\`][^;{]*\\.(addEventListener|forEach|onclick)`);
        if (classRegex.test(funcSlice)) {
          isWired = true;
          break;
        }
      }
    }

    if (!isWired) {
      missingListeners.push({ id, classes, text, tag: `<button ${attrs.trim().replace(/\s+/g, ' ')}>` });
    }
  }

  if (missingListeners.length > 0) {
    console.log(`\n=== ${funcName}: ${missingListeners.length} UNWIRED BUTTONS ===`);
    missingListeners.forEach(m => {
      console.log(`  - text: "${m.text}", id: "${m.id}", classes: "${m.classes.join(' ')}"`);
      console.log(`    tag: ${m.tag}`);
    });
  } else {
    console.log(`OK: ${funcName}`);
  }
});
