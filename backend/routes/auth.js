const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/authMiddleware');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// ── Validation rules & helpers ────────────────────────────────
const emailValidationRule = body('email')
  .trim()
  .isEmail()
  .withMessage('Please enter a valid email address (e.g. name@example.com)')
  .normalizeEmail();

const phoneValidationRule = body('phone')
  .trim()
  .notEmpty()
  .withMessage('Mobile number is required')
  .custom((value) => {
    const cleaned = value.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleaned) && !/^\d{10}$/.test(cleaned)) {
      throw new Error('Please enter a valid 10-digit mobile number (e.g. 9876543210)');
    }
    return true;
  });

const registerRules = [
  body('name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
  emailValidationRule,
  phoneValidationRule,
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  emailValidationRule,
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

// ── POST /api/auth/register-send-otp ─── Step 1: Send registration OTP
router.post(
  '/register-send-otp',
  registerRules,
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      res.status(409);
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store pending credentials with 15-minute expiry
    await PendingUser.findOneAndUpdate(
      { email: email.toLowerCase() },
      { name, email: email.toLowerCase(), phone, password, otp, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`\n══════════════════════════════════════════════════════`);
    console.log(`🔑 [X-MART REGISTRATION OTP] Email: ${email}`);
    console.log(`👉 CODE: ${otp} (Expires in 15 min)`);
    console.log(`══════════════════════════════════════════════════════\n`);

    // Send Registration OTP Email via Brevo
    sendPasswordResetEmail({ email, name, otp, type: 'register' }).catch(err => {
      console.error('[Brevo Register OTP Failed]:', err);
    });

    res.json({
      success: true,
      message: `Verification code sent to ${email}. Please check your email to complete registration.`,
      data: { email }
    });
  })
);

// ── POST /api/auth/register-verify-otp ── Step 2: Verify OTP & create account
router.post(
  '/register-verify-otp',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const pending = await PendingUser.findOne({ email: email.toLowerCase(), otp });
    if (!pending) {
      res.status(400);
      throw new Error('Invalid or expired verification code. Please request a new code.');
    }

    const exists = await User.findOne({ email: pending.email });
    if (exists) {
      await PendingUser.deleteOne({ _id: pending._id });
      res.status(409);
      throw new Error('An account with this email already exists.');
    }

    // Create the actual user in MongoDB
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      password: pending.password,
    });

    // Delete pending record
    await PendingUser.deleteOne({ _id: pending._id });

    // Send Welcome Email via Brevo asynchronously
    sendWelcomeEmail({ email: user.email, name: user.name }).catch(err => {
      console.error('[Brevo Welcome Email Failed]:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Account verified and created successfully! Welcome to X-Mart.',
      data: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
        token: generateToken(user._id),
      },
    });
  })
);

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

    // Send Welcome Email via Brevo asynchronously (non-blocking)
    sendWelcomeEmail({ email: user.email, name: user.name }).catch(err => {
      console.error('[Brevo Welcome Email Failed]:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
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

// ── POST /api/auth/google ─── Google OAuth 2.0 Login / Registration ──
router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { token, credential, profile } = req.body;
    let email, name, googleId, avatar;

    // Decode Google JWT Credential if sent from Google Identity Services
    if (credential) {
      try {
        const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString('utf8'));
        email = payload.email;
        name = payload.name;
        googleId = payload.sub;
        avatar = payload.picture || '';
      } catch (err) {
        res.status(400);
        throw new Error('Invalid Google credential token');
      }
    } else if (profile) {
      email = profile.email;
      name = profile.name;
      googleId = profile.googleId || profile.id || `google_${Date.now()}`;
      avatar = profile.avatar || profile.picture || '';
    } else if (req.body.email && req.body.name) {
      email = req.body.email;
      name = req.body.name;
      googleId = req.body.googleId || `google_${Date.now()}`;
      avatar = req.body.avatar || '';
    } else {
      res.status(400);
      throw new Error('Google authentication payload is missing required details');
    }

    if (!email) {
      res.status(400);
      throw new Error('Email not provided by Google account');
    }

    // Find existing user by email or googleId
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }]
    });

    if (user) {
      // If user signed up via local before, link their googleId and update avatar if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      // Create new user account via Google OAuth
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        googleId,
        avatar: avatar || '',
        authProvider: 'google',
        role: 'user'
      });
    }

    res.json({
      success: true,
      message: 'Signed in with Google successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        addresses: user.addresses,
        token: generateToken(user._id),
      }
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

// ── POST /api/auth/profile-send-otp ─── Request OTP for profile update
router.post(
  '/profile-send-otp',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
    emailValidationRule,
    phoneValidationRule,
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id).select('+otp +otpExpiry +otpType +pendingProfile');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check if new email is already used by another account
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (emailTaken) {
        res.status(409);
        throw new Error('This email address is already in use by another account.');
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    user.otpType = 'profile';
    user.pendingProfile = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
    };
    await user.save();

    console.log(`\n══════════════════════════════════════════════════════`);
    console.log(`🔑 [X-MART PROFILE UPDATE OTP] User: ${user.email} (Target: ${email})`);
    console.log(`👉 CODE: ${otp} (Expires in 15 min)`);
    console.log(`══════════════════════════════════════════════════════\n`);

    // Send OTP to user's registered email
    const targetEmail = user.email;
    sendPasswordResetEmail({ email: targetEmail, name: user.name, otp, type: 'profile' }).catch(err => {
      console.error('[Brevo Profile OTP Failed]:', err);
    });

    res.json({
      success: true,
      message: `Verification code sent to ${targetEmail}. Enter it to confirm your profile changes.`,
      data: { email: targetEmail }
    });
  })
);

// ── POST /api/auth/profile-verify-otp ─── Verify OTP & apply profile updates
router.post(
  '/profile-verify-otp',
  protect,
  [
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const user = await User.findById(req.user._id).select('+otp +otpExpiry +otpType +pendingProfile');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.otp || user.otpType !== 'profile' || !user.pendingProfile) {
      res.status(400);
      throw new Error('No active profile update request found. Please request a new code.');
    }

    if (new Date() > user.otpExpiry) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.otpType = undefined;
      user.pendingProfile = undefined;
      await user.save();
      res.status(400);
      throw new Error('Verification code has expired. Please request a new one.');
    }

    if (user.otp !== otp) {
      res.status(401);
      throw new Error('Incorrect OTP code. Please check your email and try again.');
    }

    // Apply pending profile updates
    const { name, email, phone } = user.pendingProfile;
    if (name)  user.name  = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpType = undefined;
    user.pendingProfile = undefined;

    const updated = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        _id:       updated._id,
        name:      updated.name,
        email:     updated.email,
        phone:     updated.phone,
        avatar:    updated.avatar,
        role:      updated.role,
        addresses: updated.addresses,
        token:     generateToken(updated._id),
      },
    });
  })
);

// ── PUT /api/auth/me ─── Update profile directly (legacy fallback) ──
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

// ── GET /api/auth/seller-profile ─── Retrieve user's verified seller profile
router.get(
  '/seller-profile',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({
      success: true,
      data: user.sellerProfile || null,
      isEligible: !!(user.sellerProfile && user.sellerProfile.isVerified)
    });
  })
);

// ── POST /api/auth/seller-profile ─── Register and verify seller profile
router.post(
  '/seller-profile',
  protect,
  [
    body('bizName').trim().notEmpty().withMessage('Legal Business Name is required').isLength({ min: 3, max: 100 }).withMessage('Legal business name must be at least 3 characters'),
    body('storeName').trim().notEmpty().withMessage('Store Display Name is required').isLength({ min: 3, max: 60 }).withMessage('Store name must be at least 3 characters'),
    emailValidationRule,
    phoneValidationRule,
    body('gstin').trim().notEmpty().withMessage('GSTIN / Tax ID is required').custom((value) => {
      const cleaned = value.toUpperCase().replace(/\s/g, '');
      if (cleaned.length < 8 || cleaned.length > 18) {
        throw new Error('Please provide a valid GSTIN / Tax Identification ID');
      }
      return true;
    }),
    body('pincode').trim().notEmpty().withMessage('Warehouse PIN code is required').custom((value) => {
      if (!/^[1-9][0-9]{5}$/.test(value.trim())) {
        throw new Error('Please enter a valid 6-digit PIN code');
      }
      return true;
    }),
    body('bankAcc').trim().notEmpty().withMessage('Bank Account Number is required').custom((value) => {
      const cleaned = value.replace(/\s/g, '');
      if (!/^\d{9,18}$/.test(cleaned)) {
        throw new Error('Please enter a valid Bank Account Number (9 to 18 digits)');
      }
      return true;
    }),
    body('bankIfsc').trim().notEmpty().withMessage('Bank IFSC Code is required').custom((value) => {
      const cleaned = value.toUpperCase().replace(/\s/g, '');
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleaned)) {
        throw new Error('Please enter a valid 11-character Bank IFSC Code (e.g. HDFC0001234)');
      }
      return true;
    }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { bizName, storeName, email, phone, gstin, pincode, bankAcc, bankIfsc, category } = req.body;

    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|91|0)/, '');
    const cleanedGstin = gstin.toUpperCase().trim();
    const cleanedIfsc = bankIfsc.toUpperCase().trim();
    const cleanedAcc = bankAcc.trim();

    user.sellerProfile = {
      bizName: bizName.trim(),
      storeName: storeName.trim(),
      email: email.toLowerCase().trim(),
      phone: cleanedPhone,
      gstin: cleanedGstin,
      pincode: pincode.trim(),
      bankAcc: cleanedAcc,
      bankIfsc: cleanedIfsc,
      category: category || 'Electronics',
      isVerified: true,
      verifiedAt: new Date(),
    };

    const updated = await user.save();

    res.json({
      success: true,
      message: `🎉 Merchant account "${user.sellerProfile.storeName}" is verified! You are now eligible to list products on X-Mart.`,
      data: updated.sellerProfile,
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

// ── POST /api/auth/send-otp ─── Send OTP for login or reset ──
// type = 'login'  → user must provide valid email+password first, then gets OTP
// type = 'reset'  → user provides only email
router.post(
  '/send-otp',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('type').isIn(['login', 'reset']).withMessage('OTP type must be login or reset'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password, type } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +otp +otpExpiry');
    if (!user || !user.isActive) {
      res.status(404);
      throw new Error('No account found with this email address');
    }

    // For login OTP: verify credentials first
    if (type === 'login') {
      if (!password) {
        res.status(400);
        throw new Error('Password is required to send a login OTP');
      }
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        res.status(401);
        throw new Error('Invalid email or password');
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryMinutes = type === 'login' ? 10 : 15;
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    user.otpType = type;
    await user.save();

    console.log(`\n══════════════════════════════════════════════════════`);
    console.log(`🔑 [X-MART ${type.toUpperCase()} OTP] Email: ${user.email}`);
    console.log(`👉 CODE: ${otp} (Expires in ${expiryMinutes} min)`);
    console.log(`══════════════════════════════════════════════════════\n`);

    // Send OTP via Brevo
    sendPasswordResetEmail({ email: user.email, name: user.name, otp, type }).catch(err => {
      console.error('[Brevo OTP Email Failed]:', err);
    });

    res.json({
      success: true,
      message: `OTP sent to ${user.email}. Valid for ${expiryMinutes} minutes.`,
      data: { email: user.email }
    });
  })
);

// ── POST /api/auth/verify-otp ─── Verify OTP ─────────────────
// type = 'login'  → completes login and returns JWT
// type = 'reset'  → clears OTP (password reset done separately)
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('type').isIn(['login', 'reset']).withMessage('OTP type must be login or reset'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, otp, type } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+otp +otpExpiry +otpType');
    if (!user) {
      res.status(404);
      throw new Error('No account found with this email');
    }

    if (!user.otp || user.otpType !== type) {
      res.status(400);
      throw new Error('No active OTP found for this account. Please request a new code.');
    }

    if (new Date() > user.otpExpiry) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.otpType = undefined;
      await user.save();
      res.status(400);
      throw new Error('OTP has expired. Please request a new one.');
    }

    if (user.otp !== otp) {
      res.status(401);
      throw new Error('Incorrect OTP. Please check your email and try again.');
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpType = undefined;
    await user.save();

    if (type === 'login') {
      // Complete login
      return res.json({
        success: true,
        message: 'OTP verified. Logged in successfully!',
        data: {
          _id:       user._id,
          name:      user.name,
          email:     user.email,
          role:      user.role,
          phone:     user.phone,
          avatar:    user.avatar,
          addresses: user.addresses,
          token:     generateToken(user._id),
        }
      });
    }

    // For 'reset': return a short-lived reset token so frontend can call reset-password-otp
    const resetToken = generateToken(user._id, '15m');
    return res.json({
      success: true,
      message: 'OTP verified. You may now set a new password.',
      data: { email: user.email, resetToken }
    });
  })
);

// ── POST /api/auth/reset-password-otp ─── Set new password after OTP ─
router.post(
  '/reset-password-otp',
  protect,
  [body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')],
  validate,
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      data: {
        _id:       user._id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        phone:     user.phone,
        avatar:    user.avatar,
        addresses: user.addresses,
        token:     generateToken(user._id),
      }
    });
  })
);

// ── POST /api/auth/forgot-password ─── Legacy: kept for compatibility ─
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()],
  validate,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) {
      res.status(404);
      throw new Error('No account found with this email address');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    user.otpType = 'reset';
    await user.save();

    sendPasswordResetEmail({ email: user.email, name: user.name, otp, type: 'reset' }).catch(err => {
      console.error('[Brevo Reset Email Failed]:', err);
    });

    res.json({
      success: true,
      message: 'Password reset code sent to your email address.',
      data: { email: user.email }
    });
  })
);

// ── POST /api/auth/reset-password ─── Legacy: kept for compatibility ─
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('No account found with this email address');
    }
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        addresses: user.addresses,
        token: generateToken(user._id),
      }
    });
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

// ── DELETE /api/auth/account & /api/auth/profile ── Permanent account deletion
const deleteAccountHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Delete user from MongoDB Atlas
  await User.findByIdAndDelete(userId);

  // 2. Delete user's active carts
  const Cart = require('../models/Cart');
  await Cart.deleteMany({ user: userId });

  // 3. Delete user's pending registrations/OTP data if any
  if (req.user.email) {
    await PendingUser.deleteMany({ email: req.user.email.toLowerCase() });
  }

  // 4. Delete user's orders if any
  const Order = require('../models/Order');
  await Order.deleteMany({ user: userId });

  res.json({
    success: true,
    message: 'Your account and all associated data have been permanently deleted.'
  });
});

router.delete('/account', protect, deleteAccountHandler);
router.delete('/profile', protect, deleteAccountHandler);

module.exports = router;
