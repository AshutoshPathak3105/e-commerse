const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  const pubCms = await request('/api/cms');
  console.log('Public CMS response:', JSON.stringify(pubCms.body, null, 2));

  const stores = await request('/api/admin/cms/stores');
  console.log('Stores response:', JSON.stringify(stores.body, null, 2));
}

test().catch(console.error);
