const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let html = fs.readFileSync('scratch/preview_from_script.html', 'utf8');
const inject = `
<script>
window.addEventListener('load', () => {
  const outer = document.querySelector('.ap-cms-table-outer');
  const inner = outer ? outer.firstElementChild : null;
  const headerDiv = document.querySelector('.ap-cms-table-header');
  const headerTable = headerDiv ? headerDiv.querySelector('table') : null;
  const bodyDiv = document.querySelector('.ap-cms-body-scroll');
  const bodyTable = bodyDiv ? bodyDiv.querySelector('table') : null;

  console.log('OUTER:', outer ? outer.clientWidth : null, outer ? outer.scrollWidth : null);
  console.log('INNER:', inner ? inner.clientWidth : null, inner ? inner.scrollWidth : null);
  console.log('HEADER DIV:', headerDiv ? headerDiv.clientWidth : null, headerDiv ? headerDiv.scrollWidth : null);
  console.log('HEADER TABLE:', headerTable ? headerTable.clientWidth : null, headerTable ? headerTable.scrollWidth : null);
  console.log('BODY DIV:', bodyDiv ? bodyDiv.clientWidth : null, bodyDiv ? bodyDiv.scrollWidth : null);
  console.log('BODY TABLE:', bodyTable ? bodyTable.clientWidth : null, bodyTable ? bodyTable.scrollWidth : null);

  if (headerTable) {
    const ths = Array.from(headerTable.querySelectorAll('th')).map(th => ({ text: th.innerText.trim(), w: th.getBoundingClientRect().width }));
    console.log('THs:', JSON.stringify(ths));
  }

  if (bodyTable) {
    const firstTr = bodyTable.querySelector('tbody tr');
    const tds = firstTr ? Array.from(firstTr.querySelectorAll('td')).map(td => td.getBoundingClientRect().width) : [];
    console.log('TDs:', JSON.stringify(tds));
  }
});
</script>
`;
html = html.replace('</body>', inject + '</body>');

fs.writeFileSync('scratch/test_measure_dom.html', html, 'utf8');
const p = path.resolve('scratch/test_measure_dom.html').replace(/\\/g, '/');
try {
  const res = execSync(`"${chromePath}" --headless=new --disable-gpu --window-size=1460,1100 --enable-logging=stderr "file:///${p}"`, { encoding: 'utf8' });
  console.log('Chrome output:\n', res);
} catch (e) {
  console.log('Chrome output / stderr:\n', e.stdout, e.stderr);
}
