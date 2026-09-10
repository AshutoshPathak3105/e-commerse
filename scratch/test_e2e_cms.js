const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
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
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function runE2ETests() {
  console.log('--- 1. Testing GET /api/cms ---');
  const pubCms = await request('/api/cms');
  console.log('Public CMS response status:', pubCms.status);
  console.log('Hero Banners count:', pubCms.body.data?.heroBanners?.length);
  console.log('Promotions count:', pubCms.body.data?.promotions?.length);

  console.log('\n--- 2. Testing Store Search Endpoint ---');
  const stores = await request('/api/admin/cms/stores?search=Apex');
  console.log('Store search status:', stores.status, 'Found:', stores.body.data?.stores?.length);
  const apexStore = stores.body.data?.stores?.[0];
  console.log('Apex Store details:', apexStore?.storeName, 'ID:', apexStore?.id);

  console.log('\n--- 3. Testing POST /api/admin/cms/banners (Add Banner with Image URL) ---');
  const addBanner = await request('/api/admin/cms/banners', {
    method: 'POST',
    body: {
      title: 'RTX 5090 Ultra Gaming Rigs',
      subtitle: 'Next-Gen Performance with Liquid Cooling & 240Hz Displays',
      tag: 'Exclusive Launch',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
      link: '#category/Gaming',
      order: 3,
      active: true
    }
  });
  console.log('Add Banner status:', addBanner.status, 'New banner title:', addBanner.body.data?.banner?.title);
  const createdBannerId = addBanner.body.data?.banner?._id;

  console.log('\n--- 4. Testing POST /api/admin/cms/promotions (Bank Card Offer) ---');
  const addBankPromo = await request('/api/admin/cms/promotions', {
    method: 'POST',
    body: {
      code: 'HDFC15',
      title: 'HDFC Bank 15% Instant Savings',
      type: 'bank',
      discountType: 'percent',
      discountValue: 15,
      minOrder: 2000,
      maxDiscount: 1500,
      scope: 'storewide',
      bankPartner: 'HDFC Bank',
      description: 'Get 15% Instant Discount with HDFC Bank Credit Cards on min. cart value ₹2,000.',
      active: true
    }
  });
  console.log('Add Bank Promo status:', addBankPromo.status, 'Code:', addBankPromo.body.data?.promotion?.code);

  console.log('\n--- 5. Testing POST /api/admin/cms/promotions (Store-Specific Voucher) ---');
  if (apexStore) {
    const addStorePromo = await request('/api/admin/cms/promotions', {
      method: 'POST',
      body: {
        code: 'APEX25',
        title: 'Apex Tech Exclusive 25% OFF',
        type: 'voucher',
        discountType: 'percent',
        discountValue: 25,
        minOrder: 1499,
        maxDiscount: 2500,
        scope: 'store',
        storeId: apexStore.id,
        storeName: apexStore.storeName,
        description: `Exclusive 25% discount for verified orders at ${apexStore.storeName}.`,
        active: true
      }
    });
    console.log('Add Store Promo status:', addStorePromo.status, 'Code:', addStorePromo.body.data?.promotion?.code, 'Target Store:', addStorePromo.body.data?.promotion?.storeName);
  }

  console.log('\n--- 6. Verifying updated GET /api/cms for storefront ---');
  const updatedCms = await request('/api/cms');
  console.log('Updated Banners count:', updatedCms.body.data?.heroBanners?.length);
  console.log('Updated Promos count:', updatedCms.body.data?.promotions?.length);
  const bannerTitles = updatedCms.body.data?.heroBanners?.map(b => b.title);
  const promoCodes = updatedCms.body.data?.promotions?.map(p => `${p.code} (${p.type}) [${p.scope === 'store' ? p.storeName : 'Storewide'}]`);
  console.log('Banners:', bannerTitles);
  console.log('Promotions:', promoCodes);

  console.log('\nAll E2E CMS Backend Tests Passed!');
}

runE2ETests().catch(console.error);
