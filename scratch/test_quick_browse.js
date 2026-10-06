const fs = require('fs');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../styles.css">
  <style>
    body { margin: 0; padding: 12px; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body>
  <div class="ap-table-card">
    <div class="ap-card-header">
      <div>
        <h3>
          <span>Quick-Browse Strip Items</span>
        </h3>
        <p>The mini horizontal browse items above the quad grid.</p>
      </div>
      <div class="ap-card-header-actions">
        <button type="button" class="ap-btn primary" id="ap-add-quick-browse-btn">+ Add</button>
      </div>
    </div>
    <div style="padding:14px;">
      <table id="ap-quick-browse-table" style="width:100%; border-collapse:collapse;">
        <tbody><tr><td>Table Content</td></tr></tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('scratch/test_quick_browse.html', html);
console.log('test_quick_browse.html written successfully');
