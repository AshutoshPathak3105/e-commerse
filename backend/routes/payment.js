const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const { validatePaymentOffer, BANK_ISSUER_MAP } = require('../utils/offerValidator');

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
    const { amount, notes } = req.body;

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
        if (notes && typeof notes === 'object') {
          options.notes = notes;
        }

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

    let rzpPayment = null;
    let actualCardIssuer = '';
    let actualCardType = '';
    let actualBank = req.body.bank || '';

    const rzp = getRazorpayInstance();
    if (rzp) {
      try {
        rzpPayment = await rzp.payments.fetch(razorpay_payment_id);
        if (rzpPayment) {
          if (rzpPayment.card) {
            actualCardIssuer = (rzpPayment.card.issuer || '').toUpperCase();
            actualCardType = (rzpPayment.card.type || '').toLowerCase();
            if (actualCardIssuer && BANK_ISSUER_MAP[actualCardIssuer]) {
              actualBank = BANK_ISSUER_MAP[actualCardIssuer];
            }
          }
          if (rzpPayment.bank) {
            actualBank = rzpPayment.bank;
          }
        }
      } catch (fetchErr) {
        console.warn('[Razorpay Payment Fetch Warning]:', fetchErr.message);
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
    const rawTotalPrice = itemsPrice + shippingPrice + taxPrice;

    // Server-side Payment Offer & Discount Validation
    const rawOffer = req.body.paymentOffer || (req.body.offerDiscount ? {
      partner: req.body.offerPartner || req.body.bank || req.body.upiApp || '',
      method: req.body.paymentMethod,
      discountValue: req.body.offerDiscount,
      discountType: req.body.offerDiscountType || 'flat',
      appliedDiscount: req.body.offerDiscount,
      cardBank: req.body.bank,
      cardType: req.body.cardType,
      upiId: req.body.upiId,
      upiApp: req.body.upiApp
    } : null);

    let paymentOfferRecord = null;
    let offerSavings = 0;

    if (rawOffer) {
      const offerResult = validatePaymentOffer({
        paymentMethod: req.body.paymentMethod,
        paymentOffer: rawOffer,
        bank: actualBank || rawOffer.cardBank,
        cardType: req.body.cardType || rawOffer.cardType || actualCardType,
        cardIssuer: actualCardIssuer,
        upiId: req.body.upiId || rawOffer.upiId,
        upiApp: req.body.upiApp || rawOffer.upiApp,
        subtotal: itemsPrice
      });

      // If user claimed/requested an offer discount, but validation failed (e.g. PNB card used for Indian Bank discount):
      if (!offerResult.verified && (Number(rawOffer.appliedDiscount) > 0 || Number(rawOffer.discountValue) > 0)) {
        if (rzp && rzpPayment && rzpPayment.status === 'captured') {
          try {
            await rzp.payments.refund(razorpay_payment_id, {
              amount: rzpPayment.amount,
              notes: {
                reason: `Offer mismatch: ${offerResult.message}`
              }
            });
            console.warn(`[Auto Refund Triggered] Payment ${razorpay_payment_id} refunded due to offer mismatch: ${offerResult.message}`);
          } catch (refundErr) {
            console.error('[Auto Refund Error]:', refundErr.message);
          }
        }
        res.status(400);
        throw new Error(offerResult.message || 'Payment rejected: The card or payment provider used does not qualify for the selected bank offer. Transaction refunded.');
      }

      offerSavings = offerResult.discount;
      paymentOfferRecord = {
        partner: rawOffer.partner || '',
        method: req.body.paymentMethod,
        discountType: rawOffer.discountType || 'flat',
        discountValue: Number(rawOffer.discountValue) || offerSavings,
        appliedDiscount: offerSavings,
        verified: offerResult.verified,
        validationMessage: offerResult.message,
        cardBank: actualBank || rawOffer.cardBank || '',
        cardType: req.body.cardType || rawOffer.cardType || actualCardType || '',
        cardIssuer: actualCardIssuer,
        upiId: req.body.upiId || rawOffer.upiId || '',
        upiApp: req.body.upiApp || rawOffer.upiApp || ''
      };
    }

    const couponSavings = Math.max(0, Number(req.body.couponDiscount) || 0);
    const totalPrice = Math.max(0, rawTotalPrice - couponSavings - offerSavings);

    // Lookup product details for accurate originalPrice & image
    const pIds = rawItems.map(i => i.product).filter(id => mongoose.isValidObjectId(id));
    const dbProducts = await Product.find({ _id: { $in: pIds } }).lean();
    const pMap = new Map(dbProducts.map(p => [String(p._id), p]));

    const orderItems = rawItems.map((item) => {
      const p = pMap.get(String(item.product));
      const origP = (p && p.originalPrice && p.originalPrice > item.price)
        ? p.originalPrice
        : (item.originalPrice && item.originalPrice > item.price)
          ? item.originalPrice
          : Math.round(item.price * 1.25);
      const disc = (p && p.discount) ? p.discount : Math.round(((origP - item.price) / origP) * 100);
      const img = item.image || (p && p.images && p.images[0]) || '';
      return {
        product:       item.product || `prod-${Date.now()}`,
        name:          item.name,
        image:         img,
        price:         item.price,
        originalPrice: origP,
        discount:      disc,
        quantity:      item.quantity,
      };
    });

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
        bank: req.body.bank || (paymentOfferRecord && paymentOfferRecord.cardBank) || '',
        cardType: req.body.cardType || (paymentOfferRecord && paymentOfferRecord.cardType) || '',
        upiId: req.body.upiId || (paymentOfferRecord && paymentOfferRecord.upiId) || '',
        upiApp: req.body.upiApp || (paymentOfferRecord && paymentOfferRecord.upiApp) || '',
      },
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      originalTotalPrice: rawTotalPrice,
      savingsAmount: couponSavings + offerSavings,
      paymentOffer: paymentOfferRecord,
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

// ── POST /api/payment/verify-offer ───────────────────────────
// Lightweight check: given a completed razorpay_payment_id and the
// applied offer details, verify if the actual card/UPI matches the offer.
// Does NOT create an order — purely used by the frontend to decide whether
// to strip the offer discount from the UI before proceeding.
router.post(
  '/verify-offer',
  protect,
  asyncHandler(async (req, res) => {
    const { razorpay_payment_id, paymentOffer, paymentMethod, isSandbox } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({ success: false, matched: false, message: 'Payment ID is required.' });
    }

    // If no offer was applied there is nothing to cross-check
    if (!paymentOffer || (!paymentOffer.partner && !paymentOffer.discountValue)) {
      return res.status(200).json({ success: true, matched: true, message: 'No offer applied — nothing to verify.' });
    }

    let actualCardIssuer = '';
    let actualBank = '';         // NEVER default to the request body bank — that is the offer bank, not the real bank
    let actualCardType = '';
    let actualUpiId = '';
    let gotRealData = false;     // Did Razorpay return verifiable real payment data?

    const rzp = getRazorpayInstance();
    if (rzp) {
      try {
        const rzpPayment = await rzp.payments.fetch(razorpay_payment_id);
        if (rzpPayment) {
          if (rzpPayment.card) {
            actualCardIssuer = (rzpPayment.card.issuer || '').toUpperCase();
            actualCardType   = (rzpPayment.card.type   || '').toLowerCase();
            // Map Razorpay issuer code → friendly bank name (e.g. PUNB → "Punjab National Bank")
            if (actualCardIssuer && BANK_ISSUER_MAP[actualCardIssuer]) {
              actualBank = BANK_ISSUER_MAP[actualCardIssuer];
            } else if (rzpPayment.card.name) {
              actualBank = rzpPayment.card.name; // card network name fallback
            }
            gotRealData = true;
          }
          if (rzpPayment.bank) {
            actualBank  = rzpPayment.bank;
            gotRealData = true;
          }
          if (rzpPayment.method === 'upi') {
            actualUpiId = rzpPayment.vpa || rzpPayment.upi?.vpa || '';
            gotRealData = Boolean(actualUpiId);
          }
        }
      } catch (fetchErr) {
        console.warn('[verify-offer fetch warning]:', fetchErr.message);
        // Razorpay API failed — cannot confirm the actual card, deny the offer
        return res.status(200).json({
          success: true,
          matched: false,
          offerPartner: paymentOffer.partner || '',
          actualBank: '',
          actualIssuer: '',
          discount: 0,
          message: 'Could not verify actual card/bank from Razorpay — offer not confirmed.'
        });
      }
    }

    // If we got no real data from Razorpay (sandbox card with no issuer, etc.)
    // we conservatively deny the offer to prevent false matches
    if (!gotRealData && paymentMethod === 'Card') {
      console.warn('[verify-offer] No real card data from Razorpay. Denying offer to prevent false match.', {
        payment_id: razorpay_payment_id,
        partner: paymentOffer.partner,
        isSandbox
      });
      return res.status(200).json({
        success: true,
        matched: false,
        offerPartner: paymentOffer.partner || '',
        actualBank: 'Unknown',
        actualIssuer: '',
        discount: 0,
        message: 'Actual card bank could not be verified — offer not applied.'
      });
    }

    const offerResult = validatePaymentOffer({
      paymentMethod: paymentMethod || paymentOffer.method || 'Card',
      paymentOffer,
      bank: actualBank,            // ONLY from Razorpay — no fallback to request body
      cardType: actualCardType,    // ONLY from Razorpay
      cardIssuer: actualCardIssuer,
      upiId: actualUpiId,          // ONLY from Razorpay
      upiApp: '',                  // Let validator derive from upiId
      subtotal: Number(paymentOffer.subtotal) || 1000
    });

    return res.status(200).json({
      success: true,
      matched: offerResult.verified,
      offerPartner: paymentOffer.partner || '',
      actualBank: actualBank || '',
      actualIssuer: actualCardIssuer || '',
      discount: offerResult.discount,
      message: offerResult.message
    });
  })
);

module.exports = router;

