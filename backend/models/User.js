const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home' },
  street:   { type: String, required: true },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true },
  country:  { type: String, default: 'India' },
  isDefault:{ type: Boolean, default: false },
}, { _id: true });

const sellerProfileSchema = new mongoose.Schema({
  bizName:    { type: String, trim: true, required: true },
  storeName:  { type: String, trim: true, required: true },
  email:      { type: String, trim: true, lowercase: true, required: true },
  phone:      { type: String, trim: true, required: true },
  gstin:      { type: String, trim: true, uppercase: true, required: true },
  pincode:    { type: String, trim: true, required: true },
  bankAcc:    { type: String, trim: true, required: true },
  bankIfsc:   { type: String, trim: true, uppercase: true, required: true },
  category:   { type: String, default: 'Electronics' },
  isVerified: { type: Boolean, default: true },
  verifiedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^\+?[\d\s\-]{7,15}$/, 'Enter a valid phone number'],
    },
    password: {
      type: String,
      required: function() { return !this.googleId && this.authProvider === 'local'; },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default
    },
    googleId: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
    addresses: [addressSchema],
    sellerProfile: {
      type: sellerProfileSchema,
      default: null,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    otpType: {
      type: String,
      enum: ['login', 'reset', 'profile'],
      select: false,
    },
    pendingProfile: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual: full name alias
userSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

module.exports = mongoose.model('User', userSchema);
