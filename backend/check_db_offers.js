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

    // 2. Clear dummy CMS promotions
    const cmsList = await CmsConfig.find({});
    for (const cms of cmsList) {
      if (Array.isArray(cms.promotions)) {
        cms.promotions = cms.promotions.filter(p => 
          !['SBICARD500', 'AXIS300', 'ALLCARDS200', 'MULTI_CARD_BONANZA'].includes(p.code)
        );
        await cms.save();
      }
    }
    console.log('Cleared dummy CMS promotions in DB.');

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkOffersAndCms();
