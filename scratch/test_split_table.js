const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');

// Inject a client-side script before </body> that splits all tables in CMS:
const clientScript = `
<script>
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#admin-panel-overlay .ap-cms-view .ap-table-card .ap-table-wrap').forEach(wrap => {
      const table = wrap.querySelector('table.ap-table');
      if (!table) return;
      const thead = table.querySelector('thead');
      const tbody = table.querySelector('tbody');
      if (!thead || !tbody) return;

      // 1. Measure initial rendered column widths
      const ths = Array.from(thead.querySelectorAll('th'));
      const colWidths = ths.map(th => th.getBoundingClientRect().width);
      const totalWidth = colWidths.reduce((a, b) => a + b, 0) || table.offsetWidth;

      // 2. Build colgroup
      const createColgroup = () => {
        const cg = document.createElement('colgroup');
        colWidths.forEach(w => {
          const col = document.createElement('col');
          col.style.width = ((w / totalWidth) * 100).toFixed(2) + '%';
          cg.appendChild(col);
        });
        return cg;
      };

      // 3. Create headerPart
      const headerPart = document.createElement('div');
      headerPart.className = 'ap-table-header-part';
      headerPart.style.cssText = 'background:#ff9400; width:100%; overflow:hidden; border-bottom:1.5px solid #e08300; box-sizing:border-box;';

      const headTable = document.createElement('table');
      headTable.className = table.className;
      headTable.style.cssText = 'width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:0; background:#ff9400;';
      headTable.appendChild(createColgroup());
      headTable.appendChild(thead);
      headerPart.appendChild(headTable);

      // 4. Style body table
      table.style.cssText += '; width:100%; border-collapse:collapse; table-layout:fixed; margin-top:0;';
      table.insertBefore(createColgroup(), tbody);

      // 5. Body wrap
      wrap.classList.add('ap-table-body-scroll');
      wrap.parentNode.insertBefore(headerPart, wrap);

      // 6. Sync scrollbar padding & horizontal scrolling
      const syncHeader = () => {
        const sbWidth = wrap.offsetWidth - wrap.clientWidth;
        headerPart.style.paddingRight = sbWidth > 0 ? sbWidth + 'px' : '0px';
        headerPart.scrollLeft = wrap.scrollLeft;
      };
      wrap.addEventListener('scroll', () => {
        headerPart.scrollLeft = wrap.scrollLeft;
      });
      syncHeader();
      window.addEventListener('resize', syncHeader);
    });
  });
</script>
<style>
  /* Header part should NOT scroll vertically */
  #admin-panel-overlay .ap-cms-view .ap-table-header-part {
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
  }
  #admin-panel-overlay .ap-cms-view .ap-table-header-part table {
    margin-bottom: 0 !important;
  }
  #admin-panel-overlay .ap-cms-view .ap-table-header-part th {
    position: static !important;
  }
  /* Body wrap has the scrollbar */
  #admin-panel-overlay .ap-cms-view .ap-table-body-scroll {
    border-top: none !important;
  }
</style>
`;

html = html.replace('</body>', clientScript + '</body>');
fs.writeFileSync('scratch/test_split_result.html', html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.resolve(__dirname, 'test_split_result.png');
execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1460,1100 --screenshot="${outPng}" "file://${path.resolve('scratch/test_split_result.html')}"`);
console.log('Saved', outPng);
