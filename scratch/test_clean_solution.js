const fs = require('fs');
const path = require('path');

// Let's create an html file where we test if the header covers the entire width including scrollbar
const testHtml = `
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="../styles.css">
<style>
  body { margin: 20px; font-family: sans-serif; background: #f8fafc; }
  .box { width: 1000px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
  
  /* Test solution */
  .ap-table-wrap {
    max-height: 300px;
    overflow-y: auto;
    position: relative;
  }
  
  /* If the header is sticky, does it extend over the scrollbar? No, scrollbar is in gutter */
  /* BUT what if we style the scrollbar? */
  .ap-table-wrap::-webkit-scrollbar {
    width: 8px;
    background: #ff9400; /* Orange background in gutter */
  }
  .ap-table-wrap::-webkit-scrollbar-track {
    background: #f1f5f9;
    margin-top: 44px; /* Starts below header */
    border-radius: 4px;
  }
  .ap-table-wrap::-webkit-scrollbar-thumb {
    background: #022f43;
    border-radius: 4px;
  }
</style>
</head>
<body>
<div id="admin-panel-overlay">
  <div class="ap-cms-view">
    <div class="box">
      <div style="background:#022f43; color:#fff; padding:15px; font-weight:bold;">Test Container Header</div>
      <div class="ap-table-wrap">
        <table class="ap-table" style="width:100%; border-collapse:collapse;">
          <thead style="background:#ff9400;">
            <tr style="background:#ff9400;">
              <th style="background:#ff9400; color:#000; padding:12px; position:sticky; top:0; z-index:2;">Preview</th>
              <th style="background:#ff9400; color:#000; padding:12px; position:sticky; top:0; z-index:2;">Title</th>
              <th style="background:#ff9400; color:#000; padding:12px; position:sticky; top:0; z-index:2; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({length: 15}, (_, i) => `
              <tr>
                <td style="padding:12px; border-bottom:1px solid #eee;">Box ${i+1}</td>
                <td style="padding:12px; border-bottom:1px solid #eee;">Sample Item Title Description ${i+1}</td>
                <td style="padding:12px; border-bottom:1px solid #eee; text-align:right;"><button>Edit</button> <button>Delete</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_clean_solution.html', testHtml);
const { execSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'test_clean_solution.png');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1100,500 --screenshot="${outPng}" "file://${path.resolve('scratch/test_clean_solution.html')}"`);
console.log('Done test_clean_solution.png');
