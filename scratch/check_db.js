const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const User = require('../backend/models/User');
const Product = require('../backend/models/Product');
const Order = require('../backend/models/Order');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const sellers = await User.find({ sellerProfile: { $ne: null } });
  console.log('Sellers found:', sellers.map(s => ({
    id: s._id,
    name: s.name,
    email: s.email,
    sellerProfile: s.sellerProfile
  })));

  const productsWithSeller = await Product.find({ sellerEmail: { $exists: true, $ne: '' } });
  console.log('Products with sellerEmail count:', productsWithSeller.length);

  const sampleProducts = await Product.find({}).limit(5);
  console.log('Sample products:', sampleProducts.map(p => ({
    id: p._id,
    name: p.name,
    sellerEmail: p.sellerEmail,
    sellerStoreName: p.sellerStoreName
  })));

  const allOrders = await Order.find({});
  console.log('All orders status summary:', allOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {}));

  const deliveredOrders = await Order.find({ status: 'Delivered' });
  console.log('Delivered orders count:', deliveredOrders.length);
  if (deliveredOrders.length > 0) {
    console.log('Delivered order sample:', JSON.stringify(deliveredOrders[0].orderItems, null, 2));
  }

  process.exit(0);
}
test().catch(err => {
  console.error(err);
  process.exit(1);
});
