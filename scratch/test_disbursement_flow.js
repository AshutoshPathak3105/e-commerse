const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  const token = 'admin_jwt_master';

  console.log('1. Fetching payouts...');
  const res1 = await get('/api/admin/payouts', token);
  console.log('Payouts status:', res1.status);
  const seller = res1.data?.data?.payouts?.[0];
  console.log('Seller:', seller?.storeName, 'Net Escrow:', seller?.currentEscrowBalance);

  if (!seller) {
    console.error('No seller found!');
    return;
  }

  console.log('2. Testing disbursement of ₹5,000 to bank account...');
  const disburseRes = await post('/api/admin/payouts/disburse', {
    sellerId: seller._id,
    amount: 5000,
    transferMode: 'IMPS',
    remarks: 'Escrow Settlement Trial Transfer',
  }, token);

  console.log('Disbursement response:', disburseRes.status, disburseRes.data);

  console.log('3. Re-fetching payouts to check updated escrow & ledger...');
  const res2 = await get('/api/admin/payouts', token);
  const updatedSeller = res2.data?.data?.payouts?.[0];
  console.log('Updated seller net escrow:', updatedSeller?.currentEscrowBalance, 'Total Settled:', updatedSeller?.totalSettled);
  console.log('Recent disbursements count:', res2.data?.data?.recentDisbursements?.length);
}

test().catch(console.error);
