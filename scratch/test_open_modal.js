const fs = require('fs');
const http = require('http');

http.get('http://localhost:8000/api/admin/reviews', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const prod = json.data.products[0];
    console.log('Testing with product:', prod.name);
    console.log('Product keys:', Object.keys(prod));
    
    // Simulate DOM environment
    const js = fs.readFileSync('script.js', 'utf8');
    
    // Let's test the helper functions used in openProductReviewsModal:
    // fmtDate, getStarsHTML, adminFetch, etc.
    const hasFmtDate = js.includes('function fmtDate(');
    const hasGetStarsHTML = js.includes('function getStarsHTML(');
    console.log('hasFmtDate:', hasFmtDate);
    console.log('hasGetStarsHTML:', hasGetStarsHTML);
  });
});
