const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const Product = require('./backend/models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const prods = await Product.find({ name: { $regex: 'Apple Watch Ultra 2', $options: 'i' } }).lean();
  console.log('Count:', prods.length);
  if (prods.length > 0) {
    console.log('_id:', prods[0]._id, typeof prods[0]._id);
    console.log('id:', prods[0].id);
    console.log('productId:', prods[0].productId);
    console.log('keys:', Object.keys(prods[0]));
  }
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
