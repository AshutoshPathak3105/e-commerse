const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }
  next();
};

const TAX_RATE       = 0.18; // 18% GST
const SHIPPING_PRICE = (subtotal) => (subtotal >= 499 ? 0 : 49);

// ── POST /api/orders ─── Place order ─────────────────────────
router.post(
  '/',
  protect,
  [
    body('shippingAddress.name').notEmpty().withMessage('Recipient name is required'),
    body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.state').notEmpty().withMessage('State is required'),
    body('shippingAddress.pincode').notEmpty().withMessage('Pincode is required'),
    body('shippingAddress.phone').notEmpty().withMessage('Phone is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    let rawItems = [];
    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      rawItems = req.body.items.map(i => ({
        product: i.productId || i.id || i._id || `prod-${Date.now()}`,
        name: i.name || 'Product',
        image: i.img || i.image || '',
        price: Number(i.price) || 0,
        quantity: Number(i.qty || i.quantity) || 1,
        stock: 999,
        isActive: true
      }));
    } else {
      let cart = await Cart.findOne({ user: req.user._id });
      if (cart && cart.items && cart.items.length > 0) {
        rawItems = cart.items.map(i => ({
          product: i.product?._id || i.product || `prod-${Date.now()}`,
          name: i.name,
          image: i.image || '',
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 1,
          stock: 999,
          isActive: true
        }));
      }
    }

    if (rawItems.length === 0) {
      res.status(400);
      throw new Error('Your cart is empty. Please add items to checkout.');
    }

    // Calculate prices
    const itemsPrice    = rawItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingPrice = SHIPPING_PRICE(itemsPrice);
    const taxPrice      = Math.round(itemsPrice * TAX_RATE);
    const totalPrice    = itemsPrice + shippingPrice + taxPrice;

    // Build order items
    const orderItems = rawItems.map((item) => ({
      product:  item.product || ('prod-' + Date.now()),
      name:     item.name,
      image:    item.image,
      price:    item.price,
      quantity: item.quantity,
    }));

    const order = await Order.create({
      user:            req.user._id,
      orderItems,
      shippingAddress: req.body.shippingAddress,
      paymentMethod:   req.body.paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      notes:           req.body.notes,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 days
    });

    // Decrement stock & increment sold for each product if real product
    try {
      const validOps = orderItems
        .filter(item => item.product && String(item.product).match(/^[0-9a-fA-F]{24}$/))
        .map((item) => ({
          updateOne: {
            filter: { _id: item.product },
            update: {
              $inc: { stock: -item.quantity, sold: item.quantity },
            },
          },
        }));
      if (validOps.length > 0) {
        await Product.bulkWrite(validOps);
      }
    } catch (e) {
      console.warn('Stock update notice:', e.message);
    }

    // Clear the cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

    // Send Purchase / Order Confirmation Invoice Email via Brevo
    sendOrderConfirmationEmail({
      email: req.user.email,
      name: req.body.shippingAddress?.name || req.user.name,
      order: order.toObject()
    }).catch(err => {
      console.error('[Brevo Order Email Failed]:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: order,
    });
  })
);

// ── GET /api/orders ─── User's order history ─────────────────
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

// ── GET /api/orders/:id ─── Order detail ─────────────────────
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email phone'
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Owners or admins only
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }

    res.json({ success: true, data: order });
  })
);

// ── PUT /api/orders/:id/cancel ─── Cancel order (user) ───────
router.put(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    if (!['Pending', 'Confirmed'].includes(order.status)) {
      res.status(400);
      throw new Error(`Cannot cancel an order with status: ${order.status}`);
    }

    order.status = 'Cancelled';
    await order.save();

    // Restore stock
    const bulkOps = order.orderItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity, sold: -item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps);

    res.json({ success: true, message: 'Order cancelled', data: order });
  })
);

// ── PUT /api/orders/:id/status ─── Update status (Admin) ─────
router.put(
  '/:id/status',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status, trackingNumber } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          ...(trackingNumber && { trackingNumber }),
          ...(status === 'Delivered' && { isDelivered: true, deliveredAt: new Date() }),
        },
      },
      { new: true }
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    res.json({ success: true, message: `Order status updated to ${status}`, data: order });
  })
);

// ── GET /api/orders/admin/all ─── All orders (Admin) ─────────
router.get(
  '/admin/all',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;
    const filter = {};

    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  })
);

module.exports = router;
