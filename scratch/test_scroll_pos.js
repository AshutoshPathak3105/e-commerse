const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Let's inspect the actual HTML of the Quad table and others
const scriptContent = fs.readFileSync('script.js', 'utf8');

// How is ap-table styled?
