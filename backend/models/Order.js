const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:     { type: String, required: true },
  image:    { type: String, default: '' },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const shippingAddressSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  street:  { type: String, required: true },
  city:    { type: String, required: true },
  state:   { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  phone:   { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI', 'Card', 'NetBanking', 'Wallet'],
      default: 'COD',
    },
    paymentResult: {
      id:         String,
      status:     String,
      updateTime: String,
      email:      String,
    },
    itemsPrice:    { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice:      { type: Number, required: true, default: 0 },
    totalPrice:    { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Pending',
    },
    isPaid:       { type: Boolean, default: false },
    paidAt:       Date,
    isDelivered:  { type: Boolean, default: false },
    deliveredAt:  Date,
    trackingNumber: String,
    estimatedDelivery: Date,
    notes: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate human-readable order ID
orderSchema.virtual('orderId').get(function () {
  return `XM-${this._id.toString().slice(-8).toUpperCase()}`;
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
