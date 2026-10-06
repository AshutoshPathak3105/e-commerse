const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_promo_cards.html');
const outPng = path.resolve(__dirname, 'promo_cards_test.png');

const css = fs.readFileSync(path.resolve(__dirname, '../styles.css'), 'utf8');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${css}
body { background: #f1f5f9; padding: 24px; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
</style>
</head>
<body>
  <div class="ap-hero-quick-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px; width:100%; box-sizing:border-box;">
    <!-- Top Hero Cards (4 Cards) -->
    <div class="ap-table-card" style="border-radius:14px; overflow:hidden; border:1px solid rgba(2,47,67,0.12); box-shadow:0 4px 16px -2px rgba(2,47,67,0.08), 0 2px 6px -1px rgba(0,0,0,0.04); background:#ffffff; width:100%; box-sizing:border-box;">
      <div class="ap-card-header ap-compact-action-header" style="padding:14px 18px; border-bottom:2.5px solid #FF9400; background:linear-gradient(135deg, #022F43 0%, #043e5a 100%); display:flex; justify-content:space-between; align-items:flex-start; gap:10px; width:100%; box-sizing:border-box;">
        <div>
          <h3 style="margin:0; font-size:14px; font-weight:800; color:#ffffff !important;">Top Hero Promo Cards</h3>
          <p style="margin:3px 0 0; font-size:11.5px; color:#cbd5e1 !important; font-weight:600;">The 4 showcase cards below the main banner slider.</p>
        </div>
        <button type="button" class="ap-btn primary" style="padding:5px 14px; font-size:11.5px; font-weight:800; background:#FF9400 !important; color:#000000 !important; border-radius:6px;">+ Add</button>
      </div>

      <!-- Outer wrapper: horizontal scroll without vertical scroll in header -->
      <div class="ap-table-wrap ap-cms-table-outer" style="overflow-x:auto; -webkit-overflow-scrolling:touch; width:100%; background:#ffffff !important; padding:0 !important; border:none !important;">
        <div style="min-width:580px; width:100%;">
          <!-- Pinned Header: STRICTLY NO vertical scrollbar here! -->
          <div class="ap-table-header-part" style="background:#ff9400; width:100%; overflow:hidden; border-bottom:2px solid #e08300; box-sizing:border-box;">
            <table class="ap-table" style="width:100%; min-width:580px; table-layout:fixed; border-collapse:collapse; margin-bottom:0; background:#ff9400;">
              <colgroup>
                <col style="width:80px;">
                <col style="min-width:240px;">
                <col style="width:95px;">
                <col style="width:135px;">
              </colgroup>
              <thead>
                <tr style="background:#ff9400 !important;">
                  <th style="background:#FF9400 !important; color:#000000 !important; text-align:center; padding:10px 8px; font-weight:800; white-space:nowrap; border:none;">IMAGE</th>
                  <th style="background:#FF9400 !important; color:#000000 !important; text-align:left; padding:10px 12px; font-weight:800; white-space:nowrap; border:none;">DETAILS &amp; BADGE</th>
                  <th style="background:#FF9400 !important; color:#000000 !important; text-align:center; padding:10px 8px; font-weight:800; white-space:nowrap; border:none;">STATUS</th>
                  <th style="background:#FF9400 !important; color:#000000 !important; text-align:center; padding:10px 8px; font-weight:800; white-space:nowrap; border:none;">ACTIONS</th>
                </tr>
              </thead>
            </table>
          </div>

          <!-- Scrollable Body Part: Vertical scrollbar thumb starts strictly BELOW orange header! -->
          <div class="ap-table-wrap ap-cms-body-scroll" style="overflow-y:auto; overflow-x:hidden; max-height:220px; -webkit-overflow-scrolling:touch; width:100%; background:#ffffff;">
            <table class="ap-table" id="ap-hero-promo-table" style="width:100%; min-width:580px; table-layout:fixed; border-collapse:collapse; margin-top:0; background:#ffffff;">
              <colgroup>
                <col style="width:80px;">
                <col style="min-width:240px;">
                <col style="width:95px;">
                <col style="width:135px;">
              </colgroup>
              <tbody id="ap-hero-promo-table-body">
                <tr>
                  <td style="text-align:center;"><img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100" style="width:48px;height:48px;object-fit:cover;border-radius:6px;"></td>
                  <td>
                    <div style="font-weight:800; font-size:12.5px; color:#0f172a;">SYMBOL PREMIUM</div>
                    <div style="font-size:11px; color:#64748b;">Min. 50% off • Fresh finds</div>
                    <div style="font-size:10.5px; color:#0284c7; margin-top:2px;">Save Extra with No Cost EMI &amp; Cashback</div>
                  </td>
                  <td style="text-align:center;"><span class="ap-badge green">● Active</span></td>
                  <td style="text-align:center;">
                    <button class="ap-btn ghost" style="padding:4px 10px; font-size:11.5px; background:#FF9400 !important; color:#000000 !important; font-weight:800;">Edit</button>
                    <button class="ap-btn danger" style="padding:4px 10px; font-size:11.5px; background:#ef4444 !important; color:#ffffff !important; font-weight:800;">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;"><img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100" style="width:48px;height:48px;object-fit:cover;border-radius:6px;"></td>
                  <td>
                    <div style="font-weight:800; font-size:12.5px; color:#0f172a;">ONEPLUS NORD</div>
                    <div style="font-size:11px; color:#64748b;">₹28,999 ₹21,499* • Power that lasts up to 2.5 days*</div>
                    <div style="font-size:10.5px; color:#0284c7; margin-top:2px;">Unlimited 5% cashback*</div>
                  </td>
                  <td style="text-align:center;"><span class="ap-badge green">● Active</span></td>
                  <td style="text-align:center;">
                    <button class="ap-btn ghost" style="padding:4px 10px; font-size:11.5px; background:#FF9400 !important; color:#000000 !important; font-weight:800;">Edit</button>
                    <button class="ap-btn danger" style="padding:4px 10px; font-size:11.5px; background:#ef4444 !important; color:#ffffff !important; font-weight:800;">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;"><img src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=100" style="width:48px;height:48px;object-fit:cover;border-radius:6px;"></td>
                  <td>
                    <div style="font-weight:800; font-size:12.5px; color:#0f172a;">SALTY CLARK</div>
                    <div style="font-size:11px; color:#64748b;">Min. 70% off • Men's classic jewellery</div>
                  </td>
                  <td style="text-align:center;"><span class="ap-badge green">● Active</span></td>
                  <td style="text-align:center;">
                    <button class="ap-btn ghost" style="padding:4px 10px; font-size:11.5px; background:#FF9400 !important; color:#000000 !important; font-weight:800;">Edit</button>
                    <button class="ap-btn danger" style="padding:4px 10px; font-size:11.5px; background:#ef4444 !important; color:#ffffff !important; font-weight:800;">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;"><img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100" style="width:48px;height:48px;object-fit:cover;border-radius:6px;"></td>
                  <td>
                    <div style="font-weight:800; font-size:12.5px; color:#0f172a;">LAKME FASHION</div>
                    <div style="font-size:11px; color:#64748b;">Flat 40% off • Winter Glamour</div>
                  </td>
                  <td style="text-align:center;"><span class="ap-badge green">● Active</span></td>
                  <td style="text-align:center;">
                    <button class="ap-btn ghost" style="padding:4px 10px; font-size:11.5px; background:#FF9400 !important; color:#000000 !important; font-weight:800;">Edit</button>
                    <button class="ap-btn danger" style="padding:4px 10px; font-size:11.5px; background:#ef4444 !important; color:#ffffff !important; font-weight:800;">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Browse Items (7 Items) -->
    <div class="ap-table-card" style="border-radius:14px; overflow:hidden; border:1px solid rgba(2,47,67,0.12); box-shadow:0 4px 16px -2px rgba(2,47,67,0.08), 0 2px 6px -1px rgba(0,0,0,0.04); background:#ffffff; width:100%; box-sizing:border-box;">
      <div class="ap-card-header ap-compact-action-header" style="padding:14px 18px; border-bottom:2.5px solid #FF9400; background:linear-gradient(135deg, #022F43 0%, #043e5a 100%); display:flex; justify-content:space-between; align-items:flex-start; gap:10px; width:100%; box-sizing:border-box;">
        <div>
          <h3 style="margin:0; font-size:14px; font-weight:800; color:#ffffff !important;">Quick-Browse Strip Items</h3>
          <p style="margin:3px 0 0; font-size:11.5px; color:#cbd5e1 !important; font-weight:600;">The mini horizontal browse items above the quad grid.</p>
        </div>
        <button type="button" class="ap-btn primary" style="padding:5px 14px; font-size:11.5px; font-weight:800; background:#FF9400 !important; color:#000000 !important; border-radius:6px;">+ Add</button>
      </div>

      <div class="ap-table-wrap ap-cms-table-outer" style="overflow-x:auto; -webkit-overflow-scrolling:touch; width:100%; background:#ffffff !important; padding:0 !important; border:none !important;">
        <div style="min-width:580px; width:100%;">
          <!-- Pinned Header -->
          <div class="ap-table-header-part" style="background:#ff9400; width:100%; overflow:hidden; border-bottom:2px solid #e08300; box-sizing:border-box;">
            <table class="ap-table" style="width:100%; min-width:580px; table-layout:fixed; border-collapse:collapse; margin-bottom:0; background:#ff9400;">
              <colgroup>
                <col style="width:80px;">
                <col style="min-width:240px;">
                <col style="width:95px;">
                <col style="width:135px;">
              </colgroup>
              <thead>
                <tr style="background:#ff9400 !important;">
                  <th style="background:#FF9400 !important; color:#000000 !important; text-align:center; padding:10px 8px; font-weight:800; white-space:nowrap; border:none;">IMAGE</th>
                  <th style="background:#FF9400 !important; color:#000000 !important; text-align:left; padding:10px 12px; font-weight:800; white-space:nowrap; border:none;">TITLE &amp; BADGE</th>
                  <th style="background:#FF9400 !important; color:#000000 !important; text-align:center; padding:10px 8px; font-weight:800; white-space:nowrap; border:none;">STATUS</th>
                  <th style="background:#FF9400 !important; color:#000000 !important; text-align:center; padding:10px 8px; font-weight:800; white-space:nowrap; border:none;">ACTIONS</th>
                </tr>
              </thead>
            </table>
          </div>

          <!-- Scrollable Body Part -->
          <div class="ap-table-wrap ap-cms-body-scroll" style="overflow-y:auto; overflow-x:hidden; max-height:220px; -webkit-overflow-scrolling:touch; width:100%; background:#ffffff;">
            <table class="ap-table" id="ap-quick-browse-table" style="width:100%; min-width:580px; table-layout:fixed; border-collapse:collapse; margin-top:0; background:#ffffff;">
              <colgroup>
                <col style="width:80px;">
                <col style="min-width:240px;">
                <col style="width:95px;">
                <col style="width:135px;">
              </colgroup>
              <tbody id="ap-quick-browse-table-body">
                <tr>
                  <td style="text-align:center;"><img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100" style="width:44px;height:44px;object-fit:cover;border-radius:6px;"></td>
                  <td>
                    <div style="font-weight:800; font-size:12.5px; color:#0f172a;">For you</div>
                  </td>
                  <td style="text-align:center;"><span class="ap-badge green">● Active</span></td>
                  <td style="text-align:center;">
                    <button class="ap-btn ghost" style="padding:4px 10px; font-size:11.5px; background:#FF9400 !important; color:#000000 !important; font-weight:800;">Edit</button>
                    <button class="ap-btn danger" style="padding:4px 10px; font-size:11.5px; background:#ef4444 !important; color:#ffffff !important; font-weight:800;">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;"><img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100" style="width:44px;height:44px;object-fit:cover;border-radius:6px;"></td>
                  <td>
                    <div style="font-weight:800; font-size:12.5px; color:#0f172a;">Keep shopping for</div>
                  </td>
                  <td style="text-align:center;"><span class="ap-badge green">● Active</span></td>
                  <td style="text-align:center;">
                    <button class="ap-btn ghost" style="padding:4px 10px; font-size:11.5px; background:#FF9400 !important; color:#000000 !important; font-weight:800;">Edit</button>
                    <button class="ap-btn danger" style="padding:4px 10px; font-size:11.5px; background:#ef4444 !important; color:#ffffff !important; font-weight:800;">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;"><img src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100" style="width:44px;height:44px;object-fit:cover;border-radius:6px;"></td>
                  <td>
                    <div style="font-weight:800; font-size:12.5px; color:#0f172a;">Buy it again</div>
                  </td>
                  <td style="text-align:center;"><span class="ap-badge green">● Active</span></td>
                  <td style="text-align:center;">
                    <button class="ap-btn ghost" style="padding:4px 10px; font-size:11.5px; background:#FF9400 !important; color:#000000 !important; font-weight:800;">Edit</button>
                    <button class="ap-btn danger" style="padding:4px 10px; font-size:11.5px; background:#ef4444 !important; color:#ffffff !important; font-weight:800;">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;"><img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100" style="width:44px;height:44px;object-fit:cover;border-radius:6px;"></td>
                  <td>
                    <div style="font-weight:800; font-size:12.5px; color:#0f172a;">Trending now</div>
                  </td>
                  <td style="text-align:center;"><span class="ap-badge green">● Active</span></td>
                  <td style="text-align:center;">
                    <button class="ap-btn ghost" style="padding:4px 10px; font-size:11.5px; background:#FF9400 !important; color:#000000 !important; font-weight:800;">Edit</button>
                    <button class="ap-btn danger" style="padding:4px 10px; font-size:11.5px; background:#ef4444 !important; color:#ffffff !important; font-weight:800;">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function syncGaps() {
      document.querySelectorAll('.ap-cms-table-outer').forEach(outer => {
        const h = outer.querySelector('.ap-table-header-part');
        const b = outer.querySelector('.ap-cms-body-scroll');
        if (h && b) {
          const gap = b.offsetWidth - b.clientWidth;
          h.style.paddingRight = gap > 0 ? gap + 'px' : '0px';
        }
      });
    }
    window.addEventListener('DOMContentLoaded', syncGaps);
    window.addEventListener('resize', syncGaps);
  </script>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=1280,600 --screenshot="${outPng}" "file://${htmlPath}"`;
console.log('Capturing test promo cards screenshot...');
execSync(cmd);
console.log('Saved to', outPng);
