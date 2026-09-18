const mongoose = require('./node_modules/mongoose');

async function checkOffersAndCms() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerse';
    await mongoose.connect(MONGO_URI);
    const Product = require('./models/Product');
    const CmsConfig = require('./models/CmsConfig');

    // 1. Clear dummy product offers
    const prodRes = await Product.updateMany(
      {},
      { $unset: { offer: '' }, $set: { offers: [] } }
    );
    console.log('Cleared DB Product offers result:', prodRes);

    // 2. Clear all dummy CMS promotions
    const cmsList = await CmsConfig.find({});
    for (const cms of cmsList) {
      cms.promotions = [];
      await cms.save();
    }
    console.log('Cleared all dummy CMS promotions in DB completely.');

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkOffersAndCms();
