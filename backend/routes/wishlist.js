const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── GET /api/wishlist ─── Get user's wishlist ─────────────────
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate(
      'wishlist',
      'name images price discount rating numReviews stock isActive'
    );

    res.json({ success: true, data: user.wishlist });
  })
);

// ── POST /api/wishlist ─── Add product to wishlist ────────────
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404);
      throw new Error('Product not found');
    }

    const user = await User.findById(req.user._id);
    if (user.wishlist.map((id) => id.toString()).includes(productId)) {
      return res.json({ success: true, message: 'Already in wishlist', data: user.wishlist });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(201).json({
      success: true,
      message: `${product.name} added to wishlist`,
      data: user.wishlist,
    });
  })
);

// ── DELETE /api/wishlist/:productId ─── Remove from wishlist ──
router.delete(
  '/:productId',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== req.params.productId
    );
    await user.save();

    res.json({ success: true, message: 'Removed from wishlist', data: user.wishlist });
  })
);

module.exports = router;
