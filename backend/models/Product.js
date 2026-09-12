const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    name:        { type: String, required: true },
    title:       { type: String, default: '' },
    rating:      { type: Number, required: true, min: 1, max: 5 },
    comment:     { type: String, required: true, maxlength: 2000 },
    status:      { type: String, enum: ['Approved', 'Pending', 'Flagged'], default: 'Approved' },
    verified:    { type: Boolean, default: true },
    helpful:     { type: Number, default: 0 },
    adminReply:  { type: String, default: '' },
    flagReason:  { type: String, default: '' },
    sentiment:   { type: String, default: 'Positive' },
    spamScore:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 2000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    brand: {
      type: String,
      default: 'X-Mart',
    },
    images: {
      type: [String],
      default: [],
    },
    angleImages: {
      front: { type: String, default: '' },
      left: { type: String, default: '' },
      top: { type: String, default: '' },
      right: { type: String, default: '' },
      back: { type: String, default: '' },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    tags: [String],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sellerEmail: {
      type: String,
    },
    sellerStoreName: {
      type: String,
    },
    isSellerDeactivated: {
      type: Boolean,
      default: false,
    },
    model: {
      type: String,
      default: '',
    },
    deliveryInfo: {
      type: String,
      default: 'Delivered in 2-4 business days with Prime Express',
    },
    deliverySpeed: {
      type: String,
      default: 'Delivered in 2-4 business days with Prime Express',
    },
    warranty: {
      type: String,
      default: '1 to 2 Years Manufacturer Warranty',
    },
    condition: {
      type: String,
      default: 'Brand New • 100% Sealed Original Box',
    },
    specifications: [
      {
        key: { type: String, default: '' },
        value: { type: String, default: '' },
      },
    ],
    offers: [
      {
        tag: { type: String, default: 'Special Offer' },
        text: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
    strict: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from name
productSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 8);
  }
  next();
});

// Virtual: effective price after discount
productSchema.virtual('finalPrice').get(function () {
  if (this.discount > 0) {
    return Math.round(this.price - (this.price * this.discount) / 100);
  }
  return this.price;
});

// Virtual: in stock
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Product', productSchema);
