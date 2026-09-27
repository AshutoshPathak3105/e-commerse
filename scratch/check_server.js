const http = require('http');

// Check what html is served by localhost:8000
http.get('http://localhost:8000', (res) => {
  console.log('HTTP status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTML length:', data.length);
    console.log('Includes script.js:', data.includes('script.js'));
  });
}).on('error', err => console.log('Error:', err.message));
