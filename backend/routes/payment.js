const express = require('express');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

const router = express.Router();

const TAX_RATE = 0.18; // 18% GST
const SHIPPING_PRICE = (subtotal) => (subtotal >= 499 ? 0 : 49);

// Helper to get Razorpay instance if configured
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret && keyId !== 'your_razorpay_key_id_here' && keySecret !== 'your_razorpay_key_secret_here') {
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return null;
};

// ── GET /api/payment/config ───────────────────────────────────
// Returns public key for frontend checkout
router.get('/config', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const isConfigured = Boolean(
    keyId &&
    process.env.RAZORPAY_KEY_SECRET &&
    keyId !== 'your_razorpay_key_id_here' &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret_here'
  );

  res.json({
    success: true,
    keyId: isConfigured ? keyId : 'rzp_test_placeholder',
    isConfigured,
    currency: 'INR',
  });
});

// ── POST /api/payment/create-order ────────────────────────────
// Creates a new payment order with Razorpay (or sandbox fallback)
router.post(
  '/create-order',
  protect,
  asyncHandler(async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400);
      throw new Error('Valid order amount is required.');
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const receipt = `rcpt_${Date.now()}_${req.user._id.toString().slice(-4)}`;

    const rzp = getRazorpayInstance();

    if (rzp) {
      try {
        const options = {
          amount: amountInPaise,
          currency: 'INR',
          receipt,
          payment_capture: 1,
        };

        const razorpayOrder = await rzp.orders.create(options);
        return res.status(200).json({
          success: true,
          order: razorpayOrder,
          isSandbox: false,
        });
      } catch (err) {
        console.error('[Razorpay Order Creation Error]:', err);
        res.status(500);
        throw new Error(`Razorpay Error: ${err.error ? err.error.description : err.message}`);
      }
    }

    // Fallback: Developer Sandbox Mode (Free instant testing without API keys)
    const sandboxOrder = {
      id: `order_sandbox_${Date.now()}`,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000),
    };

    return res.status(200).json({
      success: true,
      order: sandboxOrder,
      isSandbox: true,
      message: 'Running in Developer Test Sandbox Mode. You can add your Razorpay keys in backend/.env anytime!',
    });
  })
);

// ── POST /api/payment/verify ──────────────────────────────────
// Verifies payment signature and generates the paid order
router.post(
  '/verify',
  protect,
  asyncHandler(async (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      isSandbox,
      shippingAddress,
      paymentMethod,
      items,
      notes,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400);
      throw new Error('Payment reference IDs are required.');
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isLiveConfig = Boolean(
      keySecret &&
      keySecret !== 'your_razorpay_key_secret_here' &&
      !isSandbox
    );

    if (isLiveConfig) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        res.status(400);
        throw new Error('Payment signature verification failed. Untrusted transaction.');
      }
    }

    // Prepare Items & Prices
    let rawItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      rawItems = items.map((i) => ({
        product: i.productId || i.id || i._id || `prod-${Date.now()}`,
        name: i.name || 'Product',
        image: i.img || i.image || '',
        price: Number(i.price) || 0,
        quantity: Number(i.qty || i.quantity) || 1,
      }));
    } else {
      let cart = await Cart.findOne({ user: req.user._id });
      if (cart && cart.items && cart.items.length > 0) {
        rawItems = cart.items.map((i) => ({
          product: i.product?._id || i.product || `prod-${Date.now()}`,
          name: i.name,
          image: i.image || '',
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 1,
        }));
      }
    }

    if (rawItems.length === 0) {
      res.status(400);
      throw new Error('Cart items cannot be empty.');
    }

    const itemsPrice = rawItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingPrice = SHIPPING_PRICE(itemsPrice);
    const taxPrice = Math.round(itemsPrice * TAX_RATE);
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const orderItems = rawItems.map((item) => ({
      product: item.product || `prod-${Date.now()}`,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    }));

    // Create Order with isPaid = true
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress: shippingAddress || {},
      paymentMethod: paymentMethod || 'Card',
      paymentResult: {
        id: razorpay_payment_id,
        status: 'captured',
        updateTime: new Date().toISOString(),
        email: req.user.email,
      },
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      status: 'Confirmed',
      isPaid: true,
      paidAt: new Date(),
      notes: notes || '',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    // Update Product stock & sales
    try {
      const validOps = orderItems
        .filter((item) => item.product && String(item.product).match(/^[0-9a-fA-F]{24}$/))
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
      console.warn('Stock update notice in payment verify:', e.message);
    }

    // Clear User Cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

    // Send confirmation email asynchronously
    sendOrderConfirmationEmail({
      email: req.user.email,
      name: shippingAddress?.name || req.user.name,
      order: order.toObject(),
    }).catch((err) => {
      console.error('[Order Confirmation Email Notice]:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Payment verified & order placed successfully!',
      data: order,
    });
  })
);

module.exports = router;
