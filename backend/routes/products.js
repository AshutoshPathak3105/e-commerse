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
    const limit    = Math.min(50, parseInt(req.query.limit) || 12);
    const skip     = (page - 1) * limit;

    const filter = { isActive: true };

    if (req.query.category)  filter.category   = req.query.category;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.brand)     filter.brand       = new RegExp(req.query.brand, 'i');

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Robust Partial & Multi-Keyword Search with Smart Synonyms
    if (req.query.search) {
      const q = req.query.search.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');

      // Common e-commerce search synonyms mapping
      const synonymsMap = {
        'mobile': ['phone', 'smartphone', 'oneplus', 'samsung', 'iphone', 'nord', 'galaxy', '5g', 'redmi', 'realme'],
        'phone': ['mobile', 'smartphone', 'oneplus', 'samsung', 'iphone', 'nord', 'galaxy', 'cellular'],
        'smartphone': ['mobile', 'phone', 'oneplus', 'samsung', 'iphone', 'nord'],
        'laptop': ['computer', 'macbook', 'notebook', 'pc', 'asus', 'dell', 'hp', 'lenovo'],
        'computer': ['laptop', 'pc', 'macbook', 'desktop', 'monitor'],
        'headphone': ['earbuds', 'audio', 'earphone', 'headset', 'airpods', 'sony', 'bose', 'sound'],
        'earphone': ['earbuds', 'headphone', 'audio', 'airpods', 'sound'],
        'earbuds': ['airpods', 'earphones', 'headphones', 'audio', 'buds'],
        'shoe': ['sneaker', 'footwear', 'running', 'boots', 'shoes', 'nike', 'adidas', 'puma'],
        'shoes': ['sneaker', 'footwear', 'running', 'boots', 'shoes', 'nike', 'adidas', 'puma', 'woodland'],
        'cloth': ['shirt', 't-shirt', 'dress', 'top', 'fashion', 'jeans', 'pant', 'suit', 'jacket', 'saree'],
        'clothes': ['shirt', 't-shirt', 'dress', 'top', 'fashion', 'jeans', 'pant', 'suit', 'jacket', 'saree'],
        'dress': ['saree', 'kurta', 'maxi', 'top', 'women', 'suit', 'fashion'],
        'watch': ['smartwatch', 'fossil', 'apple watch', 'galaxy watch', 'clock'],
        'tv': ['television', 'smart tv', 'oled', 'bravia', 'screen', 'display'],
      };

      const lower = q.toLowerCase();
      const matchedSynonyms = [];
      for (const [key, terms] of Object.entries(synonymsMap)) {
        if (lower.includes(key) || key.includes(lower)) {
          matchedSynonyms.push(...terms);
        }
      }

      const orList = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
      ];

      // Also split multi-word queries for broader matching
      const words = q.split(/\s+/).filter(w => w.length >= 2);
      if (words.length > 1) {
        words.forEach(word => {
          const wRegex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          orList.push({ name: wRegex }, { brand: wRegex }, { category: wRegex });
        });
      }

      // Add synonym expansions
      if (matchedSynonyms.length > 0) {
        const synRegex = new RegExp(matchedSynonyms.join('|'), 'i');
        orList.push({ name: synRegex }, { brand: synRegex }, { description: synRegex });
      }

      filter.$or = orList;
    }

    // Sort options
    const sortMap = {
      'price-asc':  { price: 1 },
      'price-desc': { price: -1 },
      'newest':     { createdAt: -1 },
      'rating':     { rating: -1 },
      'popular':    { sold: -1 },
    };
    const sort = sortMap[req.query.sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

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
      stock: req.body.stock !== undefined ? Number(req.body.stock) : 50,
      discount: req.body.discount !== undefined ? Number(req.body.discount) : 10,
      originalPrice: req.body.originalPrice || Math.round(Number(req.body.price) * 1.25),
      images: Array.isArray(req.body.images) && req.body.images.length > 0 
        ? req.body.images 
        : (req.body.img ? [req.body.img] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500']),
      rating: 4.8,
      numReviews: 1,
      isActive: true
    };

    const product = await Product.create(productData);
    res.status(201).json({ success: true, message: '🎉 Product successfully listed on X-Mart!', data: product });
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
