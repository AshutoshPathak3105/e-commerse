const mongoose = require('mongoose');

const heroBannerSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
  tag:      { type: String, default: 'Trending' },
  image:    { type: String, required: true },
  link:     { type: String, default: '#category/Electronics' },
  active:   { type: Boolean, default: true },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

const promotionSchema = new mongoose.Schema({
  code:          { type: String, required: true, uppercase: true, trim: true },
  title:         { type: String, required: true },
  type:          { type: String, enum: ['voucher', 'bank', 'upi'], default: 'voucher' },
  discountType:  { type: String, enum: ['percent', 'flat'], default: 'percent' },
  discountValue: { type: Number, required: true, min: 1 },
  minOrder:      { type: Number, default: 0 },
  maxDiscount:   { type: Number, default: 0 },
  scope:         { type: String, enum: ['storewide', 'store'], default: 'storewide' },
  storeId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  storeName:     { type: String, default: 'Storewide (All Stores)' },
  bankPartner:   { type: String, default: '' },
  bankPartners:  { type: [String], default: [] },
  cardType:      { type: String, enum: ['all', 'debit', 'credit', 'mixed'], default: 'all' },
  bankRules:     [
    {
      bank:     { type: String, default: '' },
      cardType: { type: String, enum: ['all', 'debit', 'credit'], default: 'all' }
    }
  ],
  upiProvider:   { type: String, default: '' },
  upiProviders:  { type: [String], default: [] },
  description:   { type: String, default: '' },
  validFrom:     { type: Date, default: null },
  validUntil:    { type: Date, default: null },
  applicableProducts: { type: [String], default: [] },
  active:        { type: Boolean, default: true },
}, { timestamps: true });

const cmsConfigSchema = new mongoose.Schema({
  singletonKey:       { type: String, default: 'default_storefront_cms', unique: true },
  announcementText:   { type: String, default: 'Mega Festive Super Sale: Up to 60% OFF Across All Electronics & Fashion!' },
  announcementActive: { type: Boolean, default: true },
  heroBanners:        [heroBannerSchema],
  promotions:         [promotionSchema],
}, { timestamps: true });

// Helper to get or create singleton config with initial seed data
cmsConfigSchema.statics.getOrCreate = async function () {
  let config = await this.findOne({ singletonKey: 'default_storefront_cms' });
  if (!config) {
    config = await this.create({
      singletonKey: 'default_storefront_cms',
      announcementText: 'Mega Festive Super Sale: Up to 60% OFF Across All Electronics & Fashion!',
      announcementActive: true,
      heroBanners: [
        {
          title: 'Smart Flagship 5G Smartphones',
          subtitle: 'From ₹12,999 with No Cost EMI & Exchange Offers',
          tag: 'Limited Edition',
          image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80',
          link: '#category/Electronics',
          active: true,
          order: 0,
        },
        {
          title: 'Top Tier Audio & Noise Cancelling Headphones',
          subtitle: 'Sony & Bose with Active ANC up to 45% OFF',
          tag: 'Bestseller',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80',
          link: '#category/Electronics',
          active: true,
          order: 1,
        },
        {
          title: 'Designer Ethnic & Winter Festive Wear',
          subtitle: 'Curated Premium Collections for 2026',
          tag: 'Trending',
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
          link: '#category/Fashion',
          active: true,
          order: 2,
        },
      ],
      promotions: [],
    });
  }
  return config;
};

module.exports = mongoose.model('CmsConfig', cmsConfigSchema);
