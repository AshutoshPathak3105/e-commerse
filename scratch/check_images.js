require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const Product = require('./backend/models/Product');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const prods = await Product.find().select('name images category').limit(10);
  for (const p of prods) {
    console.log(p.name, '-> images:', p.images);
  }
  process.exit(0);
}
check();
