const { spawn } = require('child_process');
const http = require('http');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=scratch/chrome_tmp_test_load',
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  // Wait 1.5s for Chrome to start
  await new Promise(r => setTimeout(r, 1500));

  // Get websocket debugger URL
  const versionData = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    }).on('error', reject);
  });

  console.log('Chrome connected. Browser:', versionData.Browser);

  // Open new target
  const targetData = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/new?http://localhost:8000', res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    }).on('error', reject);
  });

  console.log('Target created:', targetData.id, targetData.webSocketDebuggerUrl);

  const WebSocket = (function() {
    try {
      return require('ws');
    } catch {
      return null;
    }
  })();

  if (!WebSocket) {
    console.log('ws module not found. Killing chrome.');
    chromeProc.kill();
    return;
  }
}

run().catch(console.error);
