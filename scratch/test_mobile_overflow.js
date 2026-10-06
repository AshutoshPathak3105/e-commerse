const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_mobile_overflow.html');
const outMobilePng = path.resolve(__dirname, 'support_table_mobile.png');
const outTabletPng = path.resolve(__dirname, 'support_table_tablet.png');
const outDesktopPng = path.resolve(__dirname, 'support_table_desktop.png');

const mockRows = Array.from({ length: 8 }, (_, i) => `
  <tr style="cursor:pointer;" class="ap-ticket-row">
    <td>
      <div style="display:flex;flex-direction:column;gap:3px;">
        <span style="font-family:monospace;font-weight:800;color:#2563eb;font-size:12.5px;">TKT - XMCC1351C${i}</span>
        <div style="font-size:11px;color:#64748b;">25 Sept 2026</div>
        <span style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;background:#ecfdf5;color:#059669;width:fit-content;">Resolved</span>
      </div>
    </td>
    <td>
      <div style="display:flex;flex-direction:column;gap:2px;">
        <div style="font-weight:700;color:#0f172a;font-size:13px;display:flex;align-items:center;gap:6px;">
          Ashutosh Pathak <span style="font-size:10px;padding:1px 6px;border-radius:99px;background:#f1f5f9;color:#475569;font-weight:600;">Regular</span>
        </div>
        <div style="font-size:11.5px;color:#64748b;">ashutoshbxr03@gmail.com</div>
        <div style="font-size:11px;color:#94a3b8;">1234567890</div>
      </div>
    </td>
    <td style="max-width:320px;">
      <div style="display:flex;flex-direction:column;gap:4px;">
        <span style="font-size:11px;background:#f8fafc;color:#334155;border:1px solid #e2e8f0;padding:2px 7px;border-radius:4px;font-weight:700;display:inline-block;width:fit-content;">Order Cancellation</span>
        <div style="font-weight:700;color:#0f172a;font-size:12.5px;line-height:1.35;">Order Cancellation Request</div>
        <div style="font-size:11px;color:#2563eb;font-weight:600;display:flex;align-items:center;gap:4px;">XM-CC135200 · ₹3,539</div>
      </div>
    </td>
    <td><span class="ap-badge orange" style="font-weight:700;background:#fffbeb;color:#b45309;padding:3px 8px;border-radius:99px;border:1px solid #fde68a;font-size:11px;">• Medium</span></td>
    <td><span class="ap-badge green ap-badge-resolved" style="background:#dcfce7 !important; color:#15803d !important; font-weight:800; border:1px solid #86efac; padding:3px 9px; border-radius:99px; display:inline-flex; align-items:center; gap:5px; font-size:11.5px;"><span style="width:6px;height:6px;border-radius:50%;background:#16a34a;display:inline-block;"></span> ✓ Resolved</span></td>
    <td>
      <button class="ap-btn primary ap-view-ticket-btn" style="padding:6px 14px;font-size:11.5px;font-weight:700;white-space:nowrap;background:#022f43 !important;color:#ffffff !important;border-radius:6px;border:none;cursor:pointer;box-shadow:0 1px 3px rgba(2,47,67,0.25);">
        Manage / Respond
      </button>
    </td>
  </tr>
`).join('');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 12px; font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; }
  </style>
</head>
<body>
  <div id="ap-tab-body">
    <div class="ap-view-inner" style="width:100%; margin: 0 auto;">
      <!-- Tickets Data Table Card -->
      <div class="ap-table-card" style="margin-top:16px; border-radius:12px; border:1px solid #e2e8f0; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.05); overflow:hidden;">
        <!-- Outer wrapper: Handles horizontal scrolling smoothly across both header and body -->
        <div class="ap-table-wrap ap-support-table-outer" style="overflow-x:auto; -webkit-overflow-scrolling:touch; width:100%; background:#ffffff !important; padding:0 !important; border:none !important;">
          <div style="min-width:920px; width:100%;">
            <!-- Pinned Header Part (Pure Orange #FF9400, strictly NO vertical scrollbar in this header section) -->
            <div class="ap-table-header-part" style="background:#ff9400; width:100%; overflow:hidden; border-bottom:2px solid #e08300; box-sizing:border-box;">
              <table class="ap-table ap-support-table" style="width:100%; min-width:920px; border-collapse:collapse; table-layout:fixed; margin-bottom:0; background:#ff9400;">
                <colgroup>
                  <col style="width:16%;">
                  <col style="width:19%;">
                  <col style="width:28%;">
                  <col style="width:11%;">
                  <col style="width:12%;">
                  <col style="width:14%;">
                </colgroup>
                <thead>
                  <tr style="background:#ff9400 !important;">
                    <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; font-size:11px; padding:12px 16px; text-transform:uppercase; letter-spacing:0.05em; border:none; text-align:left; white-space:nowrap;">Ticket ID &amp; Date</th>
                    <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; font-size:11px; padding:12px 16px; text-transform:uppercase; letter-spacing:0.05em; border:none; text-align:left; white-space:nowrap;">Customer Account</th>
                    <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; font-size:11px; padding:12px 16px; text-transform:uppercase; letter-spacing:0.05em; border:none; text-align:left; white-space:nowrap;">Dispute Subject &amp; Order</th>
                    <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; font-size:11px; padding:12px 16px; text-transform:uppercase; letter-spacing:0.05em; border:none; text-align:left; white-space:nowrap;">Priority</th>
                    <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; font-size:11px; padding:12px 16px; text-transform:uppercase; letter-spacing:0.05em; border:none; text-align:left; white-space:nowrap;">Status</th>
                    <th style="background:#ff9400 !important; color:#000000 !important; font-weight:800; font-size:11px; padding:12px 16px; text-transform:uppercase; letter-spacing:0.05em; border:none; text-align:left; white-space:nowrap;">Action</th>
                  </tr>
                </thead>
              </table>
            </div>

            <!-- Scrollable Body Part: Vertical scrollbar slider is strictly BELOW the orange header section! -->
            <div class="ap-table-wrap ap-support-body-scroll" style="overflow-y:auto; overflow-x:hidden; max-height:480px; -webkit-overflow-scrolling:touch; width:100%; background:#ffffff;">
              <table class="ap-table ap-support-table" id="ap-support-table" style="width:100%; min-width:920px; border-collapse:collapse; table-layout:fixed; margin-top:0; background:#ffffff;">
                <colgroup>
                  <col style="width:16%;">
                  <col style="width:19%;">
                  <col style="width:28%;">
                  <col style="width:11%;">
                  <col style="width:12%;">
                  <col style="width:14%;">
                </colgroup>
                <tbody>
                  ${mockRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="ap-table-footer ap-support-table-footer" style="padding:12px 16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
          <span style="font-size:12px; color:#475569;">Showing <strong>8</strong> of <strong>8</strong> support disputes</span>
          <span style="font-size:11px; color:#94a3b8;">X-Mart CRM Customer Escalations Suite v4.2</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');

// Screenshot 1: Mobile (390 x 844)
const cmdMobile = `"${chromePath}" --headless=new --disable-gpu --window-size=390,700 --screenshot="${outMobilePng}" "file://${htmlPath}"`;
execSync(cmdMobile);
console.log('Mobile screenshot saved to:', outMobilePng);

// Check scroll metrics
const scrollTestScript = `
  const { execSync } = require('child_process');
  // We can verify scrollWidth vs clientWidth
`;
