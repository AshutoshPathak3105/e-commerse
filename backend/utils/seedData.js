/**
 * Comprehensive Database Seed Script
 * Generates 30 detailed products in 22 distinct categories (660 products total)
 * Usage: node utils/seedData.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const User     = require('../models/User');

const electronics = require('./catalog/electronics_gadgets');
const audio       = require('./catalog/audio');
const fashion     = require('./catalog/fashion_clothing');
const homeLiving  = require('./catalog/home_living');
const lifestyle   = require('./catalog/lifestyle_others');

// Map internal key to [Display Category, Tags]
const categoryMappings = {
  // Electronics & Gadgets
  watches:         { category: 'Electronics', tags: ['watches', 'watch', 'smartwatch', 'chronograph', 'accessories'] },
  mobiles:         { category: 'Electronics', tags: ['mobiles', 'mobile', 'phone', 'smartphone', '5g', 'cellular'] },
  laptops:         { category: 'Electronics', tags: ['laptops', 'laptop', 'computer', 'macbook', 'notebook', 'pc', 'labtop'] },
  keyboards:       { category: 'Electronics', tags: ['keyboards', 'keyboard', 'mechanical keyboard', 'gaming', 'rgb', 'wireless'] },
  mouse:           { category: 'Electronics', tags: ['mouse', 'wireless mouse', 'gaming mouse', 'optical mouse', 'esports'] },

  // Audio
  airpods:         { category: 'Electronics', tags: ['airpods', 'airpod', 'earbuds', 'tws', 'true wireless', 'earphones', 'bluetooth'] },
  neckbands:       { category: 'Electronics', tags: ['neckbands', 'neckband', 'wireless earphones', 'bluetooth neckband', 'audio'] },
  wired_earphones: { category: 'Electronics', tags: ['wired earphones', 'wired', 'in-ear', 'iem', '3.5mm', 'type-c', 'bassheads'] },

  // Fashion & Clothing
  apparels:        { category: 'Fashion', tags: ['apparels', 'apparel', 'appeals', 'clothing', 'suits', 'jackets', 'coats', 'dresses'] },
  tshirts:         { category: 'Fashion', tags: ['tshirts', 'tshirt', 't-shirt', 'tee', 'tshirst', 'polo', 'graphic tee', 'oversized'] },
  jeans:           { category: 'Fashion', tags: ['jeans', 'jean', 'denim', 'pants', 'trousers', 'slim fit', 'bottoms'] },
  shirts:          { category: 'Fashion', tags: ['shirts', 'shirt', 'formal shirt', 'casual shirt', 'cotton shirt', 'linen', 'button-down'] },

  // Home, Living & Travel
  kitchenware:     { category: 'Home & Kitchen', tags: ['kitchenware', 'kitchen', 'cookware', 'cooker', 'blender', 'air fryer', 'appliances'] },
  sofas:           { category: 'Home & Kitchen', tags: ['sofas', 'sofa', 'couch', 'sectional', 'recliner', 'furniture', 'living room'] },
  trolley_bags:    { category: 'Bags & Luggage', tags: ['trolley bags', 'trolley', 'trollybags', 'trollybag', 'suitcase', 'luggage', 'travel'] },
  bags:            { category: 'Bags & Luggage', tags: ['bags', 'bag', 'backpack', 'rucksack', 'laptop bag', 'daypack', 'duffel'] },
  toys:            { category: 'Toys', tags: ['toys', 'toy', 'lego', 'action figure', 'drone', 'board game', 'plushie', 'stem'] },

  // Lifestyle & Others
  footwear:        { category: 'Fashion', tags: ['footwear', 'shoes', 'shoe', 'sneakers', 'boots', 'loafers', 'running shoes'] },
  beauty:          { category: 'Beauty & Health', tags: ['beauty', 'skincare', 'perfume', 'grooming', 'makeup', 'serum', 'personal care'] },
  fitness:         { category: 'Sports', tags: ['fitness', 'gym', 'sports', 'treadmill', 'dumbbells', 'yoga mat', 'workout', 'cricket'] },
  grocery:         { category: 'Grocery', tags: ['grocery', 'gourmet', 'dry fruits', 'coffee', 'tea', 'organic', 'honey', 'healthy food'] },
  smarthome:       { category: 'Electronics', tags: ['smart home', 'tv', 'smart tv', 'camera', 'dslr', 'drone', 'audio', 'gaming console'] },
};

const allCatalogData = {
  ...electronics,
  ...audio,
  ...fashion,
  ...homeLiving,
  ...lifestyle,
};

const adminUser = {
  name:     'X-Mart Admin',
  email:    'admin@xmart.com',
  password: 'Admin@12345',
  role:     'admin',
  phone:    '+91 9999999999',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🟢  Connected to MongoDB Atlas');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({ email: adminUser.email });
    console.log('🗑️   Cleared existing products collection');

    // Create admin user
    await User.create(adminUser);
    console.log(`👤  Admin user verified: ${adminUser.email}`);

    // Build 660 rich products (30 per category)
    const allProducts = [];
    let totalCount = 0;

    for (const [key, items] of Object.entries(allCatalogData)) {
      const meta = categoryMappings[key] || { category: 'Other', tags: [key] };

      items.forEach((item, index) => {
        const rating = Number((4.2 + (Math.random() * 0.75)).toFixed(1));
        const numReviews = Math.floor(65 + Math.random() * 950);
        const stock = Math.floor(20 + Math.random() * 150);
        const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7);

        allProducts.push({
          name: item.name,
          slug,
          description: `Experience authentic quality with the ${item.name} by ${item.brand}. Built with premium materials, state-of-the-art craftsmanship, official manufacturer warranty, and designed for outstanding reliability and everyday use.`,
          category: meta.category,
          brand: item.brand,
          price: item.price,
          originalPrice: item.originalPrice,
          discount: item.discount,
          stock,
          images: [item.img],
          rating,
          numReviews,
          tags: [...meta.tags, item.brand.toLowerCase(), 'bestseller', 'verified'],
          isFeatured: index < 5,
          warranty: '1 to 2 Years Official Brand Warranty',
          deliveryInfo: 'Delivered in 2-4 business days with Prime Express',
          isActive: true
        });
        totalCount++;
      });
    }

    const created = await Product.insertMany(allProducts);
    console.log(`\n🎉  Successfully seeded ${created.length} products (30 products across all ${Object.keys(allCatalogData).length} categories)!`);
    console.log(`📦  Categories added (30 items each):`);
    Object.keys(allCatalogData).forEach((cat, i) => {
      console.log(`   ${i + 1}. ${cat.toUpperCase()} (${allCatalogData[cat].length} items)`);
    });
    console.log('─────────────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
