const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Newsletter = require('../models/Newsletter');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }
  next();
};

// ── POST /api/newsletter/subscribe ───────────────────────────
router.post(
  '/subscribe',
  [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()],
  validate,
  asyncHandler(async (req, res) => {
    const { email, source } = req.body;

    const existing = await Newsletter.findOne({ email });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        return res.json({
          success: true,
          message: 'Welcome back! You have been re-subscribed.',
        });
      }
      return res.json({
        success: true,
        message: 'You are already subscribed — stay tuned for deals!',
      });
    }

    await Newsletter.create({ email, source: source || 'footer' });

    // Respond with a promo code for new subscribers
    res.status(201).json({
      success: true,
      message: 'Subscribed successfully!',
      data: {
        promoCode: 'XMART10',
        discount: '10%',
        note: 'Use this code on your first order for 10% off!',
      },
    });
  })
);

// ── DELETE /api/newsletter/unsubscribe ────────────────────────
router.delete(
  '/unsubscribe',
  [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()],
  validate,
  asyncHandler(async (req, res) => {
    const subscriber = await Newsletter.findOne({ email: req.body.email });

    if (!subscriber || !subscriber.isActive) {
      return res.json({ success: true, message: 'Email is not subscribed' });
    }

    subscriber.isActive = false;
    await subscriber.save();

    res.json({ success: true, message: 'You have been unsubscribed' });
  })
);

module.exports = router;
