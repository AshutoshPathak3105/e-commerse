const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('Fetching /api/admin/profile with Bearer admin_jwt_master...');
  const profileRes = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/profile',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer admin_jwt_master'
    }
  });

  console.log('Profile status:', profileRes.status);
  console.log('Admin Profile Data:\n', JSON.stringify(profileRes.data, null, 2));
}

run().catch(console.error);
