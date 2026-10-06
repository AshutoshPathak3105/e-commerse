const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const script = fs.readFileSync('script.js', 'utf8');

const startFunc = script.indexOf('function showPromoModal');
const backdropMatch = script.indexOf('backdrop.innerHTML = `', startFunc);
const endMatch = script.indexOf('`;', backdropMatch);

let modalHtml = script.slice(backdropMatch + 'backdrop.innerHTML = `'.length, endMatch);
modalHtml = modalHtml.replace(/\$\{isEdit \? '[^']*' : '([^']*)'\}/g, '$1');
modalHtml = modalHtml.replace(/\$\{existingPromo\?[^}]*\}/g, '');
modalHtml = modalHtml.replace(/\$\{esc\([^)]*\)\}/g, '');
modalHtml = modalHtml.replace(/\$\{currentType === 'bank' \? 'block' : 'none'\}/g, 'none');
modalHtml = modalHtml.replace(/\$\{currentType === 'upi' \? 'block' : 'none'\}/g, 'none');
modalHtml = modalHtml.replace(/\$\{!isEdit \? `[\s\S]*?` : ''\}/g, '');

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promo Modal Phone Test</title>
  <link rel="stylesheet" href="../styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 20px;
      background: #022F43;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .phone-simulator {
      width: 375px;
      height: 700px;
      background: #ffffff;
      border-radius: 28px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      border: 4px solid #334155;
    }
    .phone-simulator .ap-modal-dialog {
      width: 100% !important;
      max-width: 100% !important;
      height: 100% !important;
      max-height: 100% !important;
      border-radius: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .phone-simulator .ap-modal-content {
      flex: 1 1 auto !important;
      max-height: none !important;
      overflow-y: auto !important;
    }
  </style>
</head>
<body id="admin-panel-overlay" class="ap-open">
  <div class="phone-simulator">
    ${modalHtml}
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      const content = document.querySelector('.ap-modal-content');
      if (content) {
        content.scrollTop = content.scrollHeight;
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('scratch/promo_phone_frame.html', fullHtml, 'utf8');

const testHtmlPath = path.resolve('scratch/promo_phone_frame.html').replace(/\\/g, '/');
const snapOut = path.resolve('scratch/promo_phone_snapshot.png').replace(/\\/g, '/');

execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --window-size=600,850 --screenshot="${snapOut}" "file:///${testHtmlPath}"`);

console.log('Phone snapshot captured!');
