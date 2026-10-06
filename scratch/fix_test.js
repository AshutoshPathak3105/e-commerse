const fs = require('fs');

const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../styles.css">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 10px; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .mobile-frame { width: 360px; max-width: 100%; margin: 0 auto; border: 1px dashed #cbd5e1; padding: 8px; background: #f1f5f9; }
  </style>
</head>
<body>
  <div class="mobile-frame">
    <div style="font-weight:bold; font-size:12px; margin-bottom:8px; color:#475569;">Simulated 360px Mobile Screen</div>
    
    <!-- Top Hero Promo Cards -->
    <div class="ap-table-card" style="border-radius:14px; overflow:hidden; border:1px solid rgba(2,47,67,0.12); box-shadow:0 4px 16px -2px rgba(2,47,67,0.08); background:#ffffff; width:100%; margin-bottom:16px;">
      <div class="ap-card-header" style="padding:14px 18px; border-bottom:2.5px solid #FF9400; background:linear-gradient(135deg, #022F43 0%, #043e5a 100%); display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:nowrap; gap:10px; width:100%;">
        <div style="flex:1 1 auto; min-width:0; max-width:calc(100% - 75px); padding-right:4px;">
          <h3 style="margin:0; font-size:14px; font-weight:800; color:#ffffff !important; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            <span>Top Hero Promo Cards</span>
          </h3>
          <p style="margin:3px 0 0; font-size:11.5px; color:#cbd5e1 !important; font-weight:600; line-height:1.4;">The 4 showcase cards below the main banner slider.</p>
        </div>
        <div class="ap-card-header-actions" style="display:flex; align-items:center; gap:8px; flex:0 0 auto; margin-left:auto;">
          <button type="button" class="ap-btn primary" id="ap-add-hero-promo-btn" style="padding:5px 14px; font-size:11.5px; font-weight:800; background:#FF9400 !important; border-color:#FF9400 !important; color:#000000 !important; border-radius:6px; white-space:nowrap;">+ Add</button>
        </div>
      </div>
      <div class="ap-table-wrap" style="max-height:120px; overflow-y:auto; overflow-x:auto !important; padding:10px;">
        <table class="ap-table" id="ap-hero-promo-table" style="width:100%; min-width:580px;">
          <tbody><tr><td>Promo 1</td></tr></tbody>
        </table>
      </div>
    </div>

    <!-- Quick Browse Items -->
    <div class="ap-table-card" style="border-radius:14px; overflow:hidden; border:1px solid rgba(2,47,67,0.12); box-shadow:0 4px 16px -2px rgba(2,47,67,0.08); background:#ffffff; width:100%;">
      <div class="ap-card-header" style="padding:14px 18px; border-bottom:2.5px solid #FF9400; background:linear-gradient(135deg, #022F43 0%, #043e5a 100%); display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:nowrap; gap:10px; width:100%;">
        <div style="flex:1 1 auto; min-width:0; max-width:calc(100% - 75px); padding-right:4px;">
          <h3 style="margin:0; font-size:14px; font-weight:800; color:#ffffff !important; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            <span>Quick-Browse Strip Items</span>
          </h3>
          <p style="margin:3px 0 0; font-size:11.5px; color:#cbd5e1 !important; font-weight:600; line-height:1.4;">The mini horizontal browse items above the quad grid.</p>
        </div>
        <div class="ap-card-header-actions" style="display:flex; align-items:center; gap:8px; flex:0 0 auto; margin-left:auto;">
          <button type="button" class="ap-btn primary" id="ap-add-quick-browse-btn" style="padding:5px 14px; font-size:11.5px; font-weight:800; background:#FF9400 !important; border-color:#FF9400 !important; color:#000000 !important; border-radius:6px; white-space:nowrap;">+ Add</button>
        </div>
      </div>
      <div class="ap-table-wrap" style="max-height:120px; overflow-y:auto; overflow-x:auto !important; padding:10px;">
        <table class="ap-table" id="ap-quick-browse-table" style="width:100%; min-width:580px;">
          <tbody><tr><td>Browse 1</td></tr></tbody>
        </table>
      </div>
    </div>

  </div>
</body>
</html>`;

fs.writeFileSync('scratch/test_quick_browse.html', content);
console.log('Written 360px mobile preview test_quick_browse.html');
