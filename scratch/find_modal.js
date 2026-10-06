const fs = require('fs');
const code = fs.readFileSync('script.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Create customer vouchers') || l.includes('Selected Bank Card Eligibility') || l.includes('ELIGIBLE BANK PARTNER') || l.includes('Edit Promotional Offer')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
