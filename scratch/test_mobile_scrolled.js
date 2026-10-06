const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_mobile_overflow_scrolled.html');
const outMobileScrolledPng = path.resolve(__dirname, 'support_table_mobile_scrolled.png');

let content = fs.readFileSync(path.resolve(__dirname, 'test_mobile_overflow.html'), 'utf8');

// Update min-width to 1040px and colgroup percentages
content = content.replace(/min-width:920px/g, 'min-width:1040px');
content = content.replace(
  `<col style="width:16%;">
                  <col style="width:19%;">
                  <col style="width:28%;">
                  <col style="width:11%;">
                  <col style="width:12%;">
                  <col style="width:14%;">`,
  `<col style="width:15%;">
                  <col style="width:18%;">
                  <col style="width:26%;">
                  <col style="width:11%;">
                  <col style="width:12%;">
                  <col style="width:18%;">`
);

content = content.replace(
  `<col style="width:16%;">
                <col style="width:19%;">
                <col style="width:28%;">
                <col style="width:11%;">
                <col style="width:12%;">
                <col style="width:14%;">`,
  `<col style="width:15%;">
                <col style="width:18%;">
                <col style="width:26%;">
                <col style="width:11%;">
                <col style="width:12%;">
                <col style="width:18%;">`
);

content = content.replace('</body>', `
<script>
  window.addEventListener('load', () => {
    const outer = document.querySelector('.ap-support-table-outer');
    if (outer) {
      outer.scrollLeft = 9999;
    }
  });
</script>
</body>`);

fs.writeFileSync(htmlPath, content, 'utf8');

const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,700 --screenshot="${outMobileScrolledPng}" "file://${htmlPath}"`;
execSync(cmd);
console.log('Mobile scrolled screenshot saved to:', outMobileScrolledPng);
