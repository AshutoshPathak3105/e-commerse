const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let html = fs.readFileSync(path.join(__dirname, 'test_crm_drawer.html'), 'utf8');

const debugScript = `
<script>
window.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.querySelector('.ap-crm-drawer-backdrop');
  const drawer = document.querySelector('.ap-crm-drawer');
  const result = {
    windowInnerWidth: window.innerWidth,
    backdropRect: backdrop ? backdrop.getBoundingClientRect() : null,
    backdropComputed: backdrop ? {
      width: getComputedStyle(backdrop).width,
      padding: getComputedStyle(backdrop).padding,
      display: getComputedStyle(backdrop).display,
      justifyContent: getComputedStyle(backdrop).justifyContent,
      alignItems: getComputedStyle(backdrop).alignItems
    } : null,
    drawerRect: drawer ? drawer.getBoundingClientRect() : null,
    drawerComputed: drawer ? {
      width: getComputedStyle(drawer).width,
      maxWidth: getComputedStyle(drawer).maxWidth,
      margin: getComputedStyle(drawer).margin,
      transform: getComputedStyle(drawer).transform,
      animation: getComputedStyle(drawer).animation
    } : null,
    overflowingElements: []
  };

  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.right > window.innerWidth || r.width > window.innerWidth) {
      result.overflowingElements.push({
        tag: el.tagName,
        class: el.className,
        id: el.id,
        width: r.width,
        left: r.left,
        right: r.right
      });
    }
  });

  const debugDiv = document.createElement('div');
  debugDiv.id = 'debug-out';
  debugDiv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,0.9);color:#0f0;font-size:10px;z-index:999999;max-height:200px;overflow:auto;padding:8px;font-family:monospace;white-space:pre-wrap;';
  debugDiv.textContent = JSON.stringify(result, null, 2);
  document.body.appendChild(debugDiv);
});
</script>
`;

html = html.replace('</body>', debugScript + '</body>');
fs.writeFileSync(path.join(__dirname, 'test_crm_drawer_debug.html'), html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outPng = path.join(__dirname, 'debug_screenshot.png');
const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=390,844 --screenshot="${outPng}" --dump-dom "file://${path.join(__dirname, 'test_crm_drawer_debug.html')}"`;

const dom = execSync(cmd, { encoding: 'utf8' });
const match = dom.match(/<div id="debug-out"[^>]*>([\s\S]*?)<\/div>/);
if (match) {
  console.log('DEBUG OUTPUT:');
  console.log(match[1]);
} else {
  console.log('Could not find debug output in DOM');
}
