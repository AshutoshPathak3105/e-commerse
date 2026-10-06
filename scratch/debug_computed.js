const { execSync } = require('child_process');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outHtmlPath = path.resolve(__dirname, 'test_sellers_table.html');

// Let's inject a script into test_sellers_table.html that logs computed styles to console
