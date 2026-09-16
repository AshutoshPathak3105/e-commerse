const mongoose = require('mongoose');

async function checkOffers() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerse';
    await mongoose.connect(MONGO_URI);
    const Product = require('./models/Product');
    const products = await Product.find({ $or: [{ 'offers.0': { $exists: true } }, { offer: { $exists: true } }] });
    console.log('Products with offers/offer in DB:', products.length);
    products.forEach(p => {
      console.log(p._id, p.name, 'offers:', p.offers, 'offer:', p.offer);
    });
    
    // Clear dummy offers in DB
    const res = await Product.updateMany(
      {},
      { $unset: { offer: '' }, $set: { offers: [] } }
    );
    console.log('Cleared DB offers result:', res);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkOffers();
