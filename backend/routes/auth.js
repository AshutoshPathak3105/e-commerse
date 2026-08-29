const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Validation rules ─────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 80 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }
  next();
};

// ── POST /api/auth/register ──────────────────────────────────
router.post(
  '/register',
  registerRules,
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(409);
      throw new Error('An account with this email already exists');
    }

    const user = await User.create({ name, email, password, phone });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        token: generateToken(user._id),
      },
    });
  })
);

// ── POST /api/auth/login ─────────────────────────────────────
router.post(
  '/login',
  loginRules,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        _id:       user._id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        phone:     user.phone,
        avatar:    user.avatar,
        addresses: user.addresses,
        token:     generateToken(user._id),
      },
    });
  })
);

// ── GET /api/auth/me ─────────────────────────────────────────
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('wishlist', 'name price images discount');

    res.json({ success: true, data: user });
  })
);

// ── PUT /api/auth/me ─── Update profile ──────────────────────
router.put(
  '/me',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('phone').optional().trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, phone, avatar } = req.body;
    if (name)   user.name   = name;
    if (phone)  user.phone  = phone;
    if (avatar) user.avatar = avatar;

    const updated = await user.save();

    res.json({
      success: true,
      message: 'Profile updated',
      data: {
        _id:    updated._id,
        name:   updated.name,
        email:  updated.email,
        phone:  updated.phone,
        avatar: updated.avatar,
        role:   updated.role,
      },
    });
  })
);

// ── PUT /api/auth/password ─── Change password ───────────────
router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  })
);

// ── POST /api/auth/address ─── Add address ───────────────────
router.post(
  '/address',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { label, street, city, state, pincode, country, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }

    user.addresses.push({ label, street, city, state, pincode, country, isDefault });
    await user.save();

    res.status(201).json({ success: true, message: 'Address added', data: user.addresses });
  })
);

// ── DELETE /api/auth/address/:id ─── Remove address ─────────
router.delete(
  '/address/:id',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== req.params.id
    );
    await user.save();
    res.json({ success: true, message: 'Address removed', data: user.addresses });
  })
);

module.exports = router;
