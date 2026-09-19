const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }
  next();
};

// ── GET /api/products ────────────────────────────────────────
// Query params: page, limit, category, search, sort, minPrice, maxPrice, featured
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const isBestsellerQuery = req.query.bestseller === 'true';
    const defaultLimit = isBestsellerQuery ? 6 : 24;
    const limit    = Math.min(1000, parseInt(req.query.limit) || defaultLimit);
    const skip     = (page - 1) * limit;

    const filter = { isActive: true };

    if (req.query.category) {
      if (req.query.category.toLowerCase().includes('bestseller')) {
        filter.isBestseller = true;
        filter.seller = { $exists: false };
        filter.sellerEmail = { $exists: false };
      } else {
        filter.category = req.query.category;
      }
    }
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (isBestsellerQuery) {
      filter.isBestseller = true;
      filter.seller = { $exists: false };
      filter.sellerEmail = { $exists: false };
    }
    if (req.query.brand)     filter.brand       = new RegExp(req.query.brand, 'i');

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Robust Partial, Spell Correction & Multi-Keyword Search with Smart Relevance Scoring
    let spellCorrected = null;
    let rawQueryStr = '';
    if (req.query.search) {
      rawQueryStr = req.query.search.trim();
      const lowerRaw = rawQueryStr.toLowerCase();

      const spellMap = {
        'labtop': 'laptop',
        'laptob': 'laptop',
        'leptop': 'laptop',
        'laptp': 'laptop',
        'labtops': 'laptop',
        'moblie': 'mobile',
        'mobiles': 'mobile',
        'phon': 'phone',
        'smartphon': 'smartphone',
        'hedphone': 'headphone',
        'headfone': 'headphone',
        'earpod': 'earbuds',
        'airpod': 'airpods',
        'tshirt': 't-shirt',
        'tshirst': 't-shirt',
        'jean': 'jeans',
        'watchs': 'watch',
        'samson': 'samsung',
        'iphne': 'iphone',
      };

      const q = spellMap[lowerRaw] || lowerRaw;
      if (spellMap[lowerRaw]) spellCorrected = q;

      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');

      // Comprehensive e-commerce search synonyms mapping
      const synonymsMap = {
        'mobile': ['phone', 'smartphone', 'oneplus', 'samsung', 'iphone', 'nord', 'galaxy', '5g', 'redmi', 'realme', 'cellular'],
        'phone': ['mobile', 'smartphone', 'oneplus', 'samsung', 'iphone', 'nord', 'galaxy', 'cellular'],
        'smartphone': ['mobile', 'phone', 'oneplus', 'samsung', 'iphone', 'nord'],
        'laptop': ['computer', 'macbook', 'notebook', 'pc', 'asus', 'dell', 'hp', 'lenovo', 'acer', 'chromebook', 'labtop'],
        'labtop': ['laptop', 'computer', 'macbook', 'notebook', 'dell', 'hp', 'lenovo', 'asus'],
        'computer': ['laptop', 'pc', 'macbook', 'desktop', 'monitor'],
        'headphone': ['earbuds', 'audio', 'earphone', 'headset', 'airpods', 'sony', 'bose', 'sound', 'neckband'],
        'earphone': ['earbuds', 'headphone', 'audio', 'airpods', 'sound', 'neckband', 'wired earphone', 'iem'],
        'earbuds': ['airpods', 'earphones', 'headphones', 'audio', 'buds', 'tws'],
        'airpod': ['airpods', 'earbuds', 'earphones', 'tws', 'apple', 'buds', 'wireless earbuds'],
        'airpods': ['airpod', 'earbuds', 'earphones', 'tws', 'apple', 'buds', 'wireless earbuds'],
        'neckband': ['bluetooth neckband', 'earphones', 'wireless neckband', 'boAt', 'oneplus bullets', 'realme buds'],
        'wired': ['wired earphone', 'in-ear', 'iem', '3.5mm', 'bassheads', 'type-c earphones'],
        'keyboard': ['mechanical keyboard', 'rgb keyboard', 'gaming keyboard', 'wireless keyboard', 'logitech', 'keychron'],
        'mouse': ['wireless mouse', 'gaming mouse', 'optical mouse', 'logitech mouse', 'razer', 'trackball'],
        'watch': ['smartwatch', 'fossil', 'apple watch', 'galaxy watch', 'clock', 'chronograph', 'titan', 'casio', 'watches'],
        'watches': ['watch', 'smartwatch', 'fossil', 'apple watch', 'galaxy watch', 'clock', 'chronograph', 'titan', 'casio'],
        'tshirt': ['t-shirt', 'tee', 'tshirst', 'polo', 'graphic tee', 'oversized tee', 'tshirts'],
        'tshirts': ['tshirt', 't-shirt', 'tee', 'tshirst', 'polo', 'graphic tee', 'oversized tee'],
        'tshirst': ['tshirt', 't-shirt', 'tee', 'polo', 'graphic tee', 'oversized tee'],
        'jean': ['jeans', 'denim', 'pants', 'trousers', 'levis', 'wrangler'],
        'jeans': ['jean', 'denim', 'pants', 'trousers', 'levis', 'wrangler', 'slim fit'],
        'shirt': ['shirts', 'formal shirt', 'casual shirt', 'cotton shirt', 'linen shirt', 'button-down'],
        'shirts': ['shirt', 'formal shirt', 'casual shirt', 'cotton shirt', 'linen shirt', 'button-down'],
        'apparel': ['appeals', 'clothes', 'clothing', 'fashion', 'jacket', 'blazer', 'coat', 'hoodie', 'suit', 'dress'],
        'appeals': ['apparel', 'clothes', 'clothing', 'fashion', 'jacket', 'blazer', 'coat', 'hoodie', 'suit'],
        'kitchen': ['kitchenware', 'cookware', 'cooker', 'pan', 'blender', 'air fryer', 'kettle', 'prestige', 'hawkins'],
        'kitchenware': ['kitchen', 'cookware', 'cooker', 'pan', 'blender', 'air fryer', 'kettle', 'prestige', 'hawkins'],
        'toy': ['toys', 'lego', 'action figure', 'drone', 'board game', 'plushie', 'nerf', 'puzzle', 'rc car'],
        'toys': ['toy', 'lego', 'action figure', 'drone', 'board game', 'plushie', 'nerf', 'puzzle', 'rc car'],
        'bag': ['bags', 'backpack', 'rucksack', 'duffel', 'laptop bag', 'wildcraft', 'tote'],
        'bags': ['bag', 'backpack', 'rucksack', 'duffel', 'laptop bag', 'wildcraft', 'tote'],
        'trolley': ['trolly', 'trollybags', 'trolley bag', 'suitcase', 'luggage', 'american tourister', 'samsonite', 'safari'],
        'trollybag': ['trolley', 'trollybags', 'trolley bag', 'suitcase', 'luggage', 'american tourister', 'samsonite'],
        'trollybags': ['trolley', 'trolley bag', 'suitcase', 'luggage', 'american tourister', 'samsonite', 'safari'],
        'sofa': ['sofas', 'couch', 'sectional', 'recliner', 'sofa set', 'futon', 'living room'],
        'sofas': ['sofa', 'couch', 'sectional', 'recliner', 'sofa set', 'futon', 'living room'],
        'shoe': ['sneaker', 'footwear', 'running', 'boots', 'shoes', 'nike', 'adidas', 'puma', 'clarks', 'woodland'],
        'shoes': ['sneaker', 'footwear', 'running', 'boots', 'shoes', 'nike', 'adidas', 'puma', 'clarks', 'woodland'],
        'beauty': ['skincare', 'perfume', 'makeup', 'serum', 'grooming', 'lipstick', 'dior', 'ordinary'],
        'tv': ['television', 'smart tv', 'oled', 'bravia', 'screen', 'display'],
      };

      const matchedSynonyms = [];
      for (const [key, terms] of Object.entries(synonymsMap)) {
        if (q.includes(key) || key.includes(q)) {
          matchedSynonyms.push(...terms);
        }
      }

      const orList = [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
      ];

      // Add synonym expansions for title & brand matching
      if (matchedSynonyms.length > 0) {
        const synRegex = new RegExp(matchedSynonyms.join('|'), 'i');
        orList.push({ name: synRegex }, { brand: synRegex });
      }

      filter.$or = orList;
    }

    // Fetch matching products
    let [products, total] = await Promise.all([
      Product.find(filter).lean(),
      Product.countDocuments(filter),
    ]);

    // Relevance scoring calculation function & smart accessory exclusion
    if (req.query.search && products.length > 0) {
      const lowerQ = (spellCorrected || req.query.search).toLowerCase().trim();

      // Accessory exclusion: if searching for core device (laptop/phone/mobile) without requesting accessories, filter out accessories
      const queryWantsAccessory = lowerQ.includes('bag') || lowerQ.includes('backpack') || lowerQ.includes('sleeve') || lowerQ.includes('case') || lowerQ.includes('cover') || lowerQ.includes('stand') || lowerQ.includes('charger') || lowerQ.includes('strap') || lowerQ.includes('cable');
      const isLaptopQuery = lowerQ === 'laptop' || lowerQ === 'laptops' || lowerQ === 'labtop' || lowerQ === 'labtops' || lowerQ === 'macbook' || lowerQ === 'notebook';
      const isMobileQuery = lowerQ === 'mobile' || lowerQ === 'phone' || lowerQ === 'smartphone' || lowerQ === 'mobiles' || lowerQ === 'phones';

      if (!queryWantsAccessory) {
        if (isLaptopQuery) {
          products = products.filter(p => {
            const name = (p.name || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            const isBag = cat.includes('bag') || cat.includes('luggage') || name.includes('bag') || name.includes('backpack') || name.includes('sleeve') || name.includes('case') || name.includes('stand') || name.includes('briefcase') || name.includes('rucksack');
            return !isBag;
          });
        } else if (isMobileQuery) {
          products = products.filter(p => {
            const name = (p.name || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            return !name.includes('case') && !name.includes('cover') && !name.includes('protector') && !name.includes('tempered glass');
          });
        }
      }

      products.forEach(p => {
        let score = 0;
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();

        if (name.includes(lowerQ)) score += 100;
        if (cat.includes(lowerQ)) score += 80;
        if (brand.includes(lowerQ)) score += 50;

        if (isLaptopQuery) {
          if (name.includes('laptop') || name.includes('macbook') || name.includes('notebook') || name.includes('chromebook') || name.includes('thinkpad') || name.includes('zenbook') || name.includes('aspire') || name.includes('galaxy book') || name.includes('gaming') || name.includes('copilot+') || name.includes('xps') || name.includes('victus') || name.includes('omen') || name.includes('pavilion') || name.includes('ideapad') || name.includes('legion') || name.includes('loq') || name.includes('predator') || name.includes('nitro') || name.includes('surface') || name.includes('gram')) {
            score += 200;
          }
        }

        if (desc.includes(lowerQ)) score += 5;

        p._relevanceScore = score;
      });

      products.sort((a, b) => (b._relevanceScore || 0) - (a._relevanceScore || 0));

      total = products.length;
      if (skip > 0 || limit < products.length) {
        products = products.slice(skip, skip + limit);
      }
    } else {
      // Sort options
      const sortMap = {
        'price-asc':  { price: 1 },
        'price-desc': { price: -1 },
        'newest':     { createdAt: -1 },
        'rating':     { rating: -1 },
        'popular':    { sold: -1 },
      };
      const sort = sortMap[req.query.sort] || (isBestsellerQuery ? { rating: -1, numReviews: -1 } : { createdAt: -1 });
      products = await Product.find(filter).sort(sort).skip(skip).limit(limit).lean();
      if (isBestsellerQuery) {
        products = products.slice(0, 6);
      }
    }

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  })
);

// ── GET /api/products/:id ────────────────────────────────────
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate(
      'reviews.user',
      'name avatar'
    );

    if (!product || !product.isActive) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({ success: true, data: product });
  })
);

// ── POST /api/products ─── Create / List Product (Seller & Admin) ──
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const productData = {
      ...req.body,
      model: req.body.model || req.body.name,
      warranty: req.body.warranty || '1 to 2 Years Manufacturer Warranty',
      deliverySpeed: req.body.deliverySpeed || req.body.deliveryInfo || 'Delivered in 2-4 business days with Prime Express',
      deliveryInfo: req.body.deliveryInfo || req.body.deliverySpeed || 'Delivered in 2-4 business days with Prime Express',
      condition: req.body.condition || 'Brand New • 100% Sealed Original Box',
      specifications: Array.isArray(req.body.specifications) ? req.body.specifications : [],
      stock: req.body.stock !== undefined ? Number(req.body.stock) : 50,
      discount: req.body.discount !== undefined ? Number(req.body.discount) : 10,
      originalPrice: req.body.originalPrice || Math.round(Number(req.body.price) * 1.25),
      angleImages: req.body.angleImages || {
        front: (Array.isArray(req.body.images) && req.body.images[0]) || req.body.img || '',
        left: (Array.isArray(req.body.images) && req.body.images[1]) || '',
        top: (Array.isArray(req.body.images) && req.body.images[2]) || '',
        right: (Array.isArray(req.body.images) && req.body.images[3]) || '',
        back: (Array.isArray(req.body.images) && req.body.images[4]) || '',
      },
      images: Array.isArray(req.body.images) && req.body.images.length > 0 
        ? req.body.images 
        : (req.body.img ? [req.body.img] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500']),
      rating: 4.8,
      numReviews: 1,
      isActive: true
    };

    // Strictly prevent sellers from listing products in the Bestseller category or claiming Bestseller status
    if (productData.category && String(productData.category).toLowerCase().includes('bestseller')) {
      res.status(400);
      throw new Error('Listing products directly in the Bestseller category is not allowed for sellers. Bestseller status is exclusively managed by marketplace administration.');
    }
    productData.isBestseller = false;
    if (Array.isArray(productData.tags)) {
      productData.tags = productData.tags.filter(t => typeof t === 'string' && !t.toLowerCase().includes('bestseller') && !t.toLowerCase().includes('best-seller'));
    }

    // Prevent deactivated seller from listing products
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xmart_secret_key_2024');
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        if (user && user.sellerProfile && user.sellerProfile.isActive === false) {
          res.status(403);
          throw new Error('Your seller account is currently deactivated. You are not eligible to list new products until your storefront is reactivated.');
        }
        if (user) {
          productData.seller = user._id;
          productData.sellerEmail = user.email;
          productData.sellerStoreName = user.sellerProfile?.storeName || productData.brand;
        }
      } catch (authErr) {
        if (authErr.message && authErr.message.includes('deactivated')) throw authErr;
      }
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, message: 'Product successfully listed on X-Mart!', data: product });
  })
);

// ── PUT /api/products/:id ─── Update Product (Seller & Admin) ──
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const updateFields = { ...req.body };
    if (updateFields.price !== undefined) updateFields.price = Number(updateFields.price);
    if (updateFields.stock !== undefined) updateFields.stock = Number(updateFields.stock);
    if (updateFields.discount !== undefined) updateFields.discount = Number(updateFields.discount);
    if (updateFields.originalPrice !== undefined) updateFields.originalPrice = Number(updateFields.originalPrice);

    if (updateFields.category && String(updateFields.category).toLowerCase().includes('bestseller')) {
      res.status(400);
      throw new Error('Products cannot be moved to the Bestseller category by sellers.');
    }
    if (updateFields.isBestseller !== undefined) {
      delete updateFields.isBestseller;
    }
    if (Array.isArray(updateFields.tags)) {
      updateFields.tags = updateFields.tags.filter(t => typeof t === 'string' && !t.toLowerCase().includes('bestseller') && !t.toLowerCase().includes('best-seller'));
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({ success: true, message: 'Product updated successfully', data: product });
  })
);

// ── PUT /api/products/:id/bestseller ─── Toggle Bestseller Status ──
router.put(
  '/:id/bestseller',
  asyncHandler(async (req, res) => {
    const { isBestseller } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const newStatus = isBestseller !== undefined ? Boolean(isBestseller) : !product.isBestseller;
    product.isBestseller = newStatus;
    product.tags = Array.isArray(product.tags) ? product.tags : [];
    if (newStatus && !product.tags.includes('bestseller')) {
      product.tags.push('bestseller');
    } else if (!newStatus) {
      product.tags = product.tags.filter(t => t !== 'bestseller' && t !== 'best-seller' && t !== 'bestsellers');
    }

    await product.save();
    res.json({
      success: true,
      message: `Product ${newStatus ? 'marked as Bestseller' : 'removed from Bestsellers'}`,
      data: product
    });
  })
);

// ── DELETE /api/products/:id ─── Delete / Remove Product ─────
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({ success: true, message: 'Product removed from store' });
  })
);

// ── POST /api/products/:id/reviews ─── Add review ────────────
router.post(
  '/:id/reviews',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().notEmpty().withMessage('Comment is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      res.status(409);
      throw new Error('You have already reviewed this product');
    }

    const review = {
      user:    req.user._id,
      name:    req.user.name,
      rating:  Number(req.body.rating),
      comment: req.body.comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

    await product.save();

    res.status(201).json({ success: true, message: 'Review added', data: review });
  })
);

module.exports = router;
