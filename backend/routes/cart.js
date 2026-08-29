const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }
  next();
};

// ── GET /api/cart ─── Get user's cart ────────────────────────
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name images price stock isActive'
    );

    if (!cart) {
      return res.json({ success: true, data: { items: [], subtotal: 0, totalItems: 0 } });
    }

    res.json({ success: true, data: cart });
  })
);

// ── POST /api/cart ─── Add item to cart ──────────────────────
router.post(
  '/',
  protect,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404);
      throw new Error('Product not found or unavailable');
    }

    if (product.stock < quantity) {
      res.status(400);
      throw new Error(`Only ${product.stock} units available in stock`);
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIdx = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIdx > -1) {
      const newQty = cart.items[existingIdx].quantity + quantity;
      if (newQty > product.stock) {
        res.status(400);
        throw new Error(`Cannot exceed available stock of ${product.stock}`);
      }
      cart.items[existingIdx].quantity = newQty;
    } else {
      cart.items.push({
        product:  product._id,
        name:     product.name,
        image:    product.images?.[0] || '',
        price:    product.finalPrice || product.price,
        quantity,
      });
    }

    await cart.save();

    res.status(201).json({
      success: true,
      message: `${product.name} added to cart`,
      data: cart,
    });
  })
);

// ── PUT /api/cart/:itemId ─── Update quantity ─────────────────
router.put(
  '/:itemId',
  protect,
  [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')],
  validate,
  asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      res.status(404);
      throw new Error('Item not found in cart');
    }

    const product = await Product.findById(item.product);
    if (product && quantity > product.stock) {
      res.status(400);
      throw new Error(`Only ${product.stock} units available`);
    }

    item.quantity = quantity;
    await cart.save();

    res.json({ success: true, message: 'Cart updated', data: cart });
  })
);

// ── DELETE /api/cart/:itemId ─── Remove single item ──────────
router.delete(
  '/:itemId',
  protect,
  asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    res.json({ success: true, message: 'Item removed from cart', data: cart });
  })
);

// ── DELETE /api/cart ─── Clear entire cart ────────────────────
router.delete(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { new: true }
    );

    res.json({ success: true, message: 'Cart cleared' });
  })
);

module.exports = router;
