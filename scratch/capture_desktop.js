const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'test_mobile_overflow.html');
const outDesktopPng = path.resolve(__dirname, 'support_table_desktop.png');

let content = fs.readFileSync(htmlPath, 'utf8');
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

fs.writeFileSync(htmlPath, content, 'utf8');

const cmdDesktop = `"${chromePath}" --headless=new --disable-gpu --window-size=1200,750 --screenshot="${outDesktopPng}" "file://${htmlPath}"`;
execSync(cmdDesktop);
console.log('Desktop screenshot saved to:', outDesktopPng);
