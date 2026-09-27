const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// We can launch Chrome with --enable-logging --v=1 and run a test page that loads script.js or executes the click
const testHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <div id="admin-panel-overlay" class="ap-open">
    <div id="ap-tab-body"></div>
  </div>
  <script src="../script.js"></script>
  <script>
    window.addEventListener('DOMContentLoaded', async () => {
      console.log('DOM loaded. Waiting for renderReviews...');
      try {
        const body = document.getElementById('ap-tab-body');
        // Check if renderReviews is accessible or simulate clicking reviews tab
        console.log('Testing click on product row...');
      } catch (e) {
        console.error('Test error:', e);
      }
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.resolve(__dirname, 'test_click.html'), testHtml, 'utf8');
console.log('Created test_click.html');
