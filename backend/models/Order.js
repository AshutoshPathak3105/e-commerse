const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.Mixed, required: false },
  name:          { type: String, required: true },
  image:         { type: String, default: '' },
  price:         { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  quantity:      { type: Number, required: true, min: 1 },
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

const returnRequestSchema = new mongoose.Schema(
  {
    rmaNumber:     { type: String },
    requestType:   { type: String, enum: ['return', 'replacement'], default: 'return' },
    reason:        { type: String },
    comments:      { type: String },
    photos:        [{ type: String }],
    pickupAddress: { type: mongoose.Schema.Types.Mixed },
    refundMethod:  { type: String, default: 'wallet' },
    bankDetails:   {
      accountHolder: { type: String },
      accountNumber: { type: String },
      ifscCode:      { type: String },
      bankName:      { type: String },
      upiId:         { type: String },
    },
    items:         [{ type: mongoose.Schema.Types.Mixed }],
    status:        {
      type: String,
      enum: ['Requested', 'Approved', 'Item_Picked_Up', 'Refunded', 'Rejected'],
      default: 'Requested',
    },
    reverseAwb:    { type: String },
    reverseCourier:{ type: String, default: 'Blue Dart Express' },
    refundAmount:  { type: Number },
    deductionAmount:{ type: Number, default: 0 },
    qcGrade:       { type: String },
    qcNotes:       { type: String },
    refundUtr:     { type: String },
    refundedAt:    { type: Date },
    adminNotes:    { type: String },
    requestedAt:   { type: Date, default: Date.now },
    timeline:      [
      {
        stage:       { type: String },
        action:      { type: String },
        title:       { type: String },
        description: { type: String },
        timestamp:   { type: Date, default: Date.now },
        actor:       { type: String, default: 'Admin' },
        utr:         { type: String },
        amount:      { type: Number },
        emailSent:   { type: Boolean, default: false },
      },
    ],
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
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
    originalTotalPrice: { type: Number, default: 0 },
    savingsAmount:      { type: Number, default: 0 },
    paymentOffer: {
      partner:           { type: String },
      method:            { type: String },
      discountType:      { type: String },
      discountValue:     { type: Number, default: 0 },
      appliedDiscount:   { type: Number, default: 0 },
      verified:          { type: Boolean, default: false },
      validationMessage: { type: String },
      cardBank:          { type: String },
      cardType:          { type: String },
      upiId:             { type: String },
      upiApp:            { type: String },
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Return Requested', 'Refunded'],
      default: 'Pending',
    },
    isPaid:         { type: Boolean, default: false },
    paidAt:         Date,
    isDelivered:    { type: Boolean, default: false },
    deliveredAt:    Date,
    trackingNumber: String,
    trackingNo:     String,
    carrier:        { type: String, default: 'Delhivery Express' },
    estimatedDelivery: Date,
    dispatchedAt:   Date,
    deliveryOtp:    { type: String, default: '4892' },
    liveCoordinates: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.2090 },
      hubName: { type: String, default: 'Sorting Facility' },
    },
    checkpoints: [
      {
        status:      { type: String, required: true },
        location:    { type: String, default: '' },
        description: { type: String, default: '' },
        timestamp:   { type: Date, default: Date.now },
        completed:   { type: Boolean, default: true },
      },
    ],
    notes:          { type: String, maxlength: 500 },
    returnRequest:  returnRequestSchema,
    refundApproved: { type: Boolean, default: false },
    refundAt:       Date,
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
