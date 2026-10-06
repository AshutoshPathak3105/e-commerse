const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_crm_modals.html');
const out360Png = path.resolve(__dirname, 'crm_360_verified.png');
const outLedgerPng = path.resolve(__dirname, 'crm_ledger_verified.png');

const fullScript = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

// Extract the openOrderLedger and openCustomer360 functions
const ledgerMatch = fullScript.match(/function openOrderLedger\([\s\S]*?\n    \}/);
const c360Match = fullScript.match(/function openCustomer360\([\s\S]*?\n    \}/);

const testHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="../styles.css">
  <style>
    body { margin:0; padding:20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#0f172a; }
    #admin-panel-overlay { display: block !important; position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; }
  </style>
</head>
<body>
  <div id="admin-panel-overlay" style="display:block; position:relative; min-height:800px; width:1000px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden;">
    <div id="ap-crm-drawer-mount"></div>
    <div id="ap-crm-ledger-mount"></div>
  </div>

  <script>
    const allUsersData = [{
      _id: 'cust-12345',
      name: 'Johnathan Doe',
      email: 'john.doe@example.com',
      role: 'customer',
      isActive: true,
      ordersCount: 4,
      totalSpend: 1249.50,
      createdAt: '2025-02-14T10:00:00Z',
      phone: '+1 (555) 234-5678',
      city: 'Seattle, WA',
      lifetimeValue: 1249.50
    }];

    function fmtPrice(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
    function showToast(m, t) { console.log('Toast:', m, t); }
    async function adminFetch(u, o) { return { ok: true, json: async () => ({}) }; }
    let activeTag = 'customers';

    ${ledgerMatch ? ledgerMatch[0] : ''}
    ${c360Match ? c360Match[0] : ''}

    // Open 360 view by default
    openCustomer360('cust-12345');
  </script>
</body>
</html>`;

fs.writeFileSync(htmlPath, testHtml, 'utf8');

// Screenshot 360
execSync(`"${chromePath}" --headless --disable-gpu --virtual-time-budget=1500 --screenshot="${out360Png}" --window-size=1200,800 "${htmlPath}"`, { stdio: 'inherit' });
console.log('360 Screenshot saved:', out360Png, fs.statSync(out360Png).size);

// Now test ledger view
const testLedgerHtml = testHtml.replace("openCustomer360('cust-12345');", "openOrderLedger('cust-12345');");
fs.writeFileSync(htmlPath, testLedgerHtml, 'utf8');
execSync(`"${chromePath}" --headless --disable-gpu --virtual-time-budget=1500 --screenshot="${outLedgerPng}" --window-size=1200,800 "${htmlPath}"`, { stdio: 'inherit' });
console.log('Ledger Screenshot saved:', outLedgerPng, fs.statSync(outLedgerPng).size);
