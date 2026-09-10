const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storeName: {
      type: String,
      trim: true,
      required: true,
    },
    bizName: {
      type: String,
      trim: true,
      default: '',
    },
    sellerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    beneficiaryName: {
      type: String,
      trim: true,
      required: true,
    },
    bankAcc: {
      type: String,
      trim: true,
      required: true,
    },
    bankIfsc: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
    },
    bankName: {
      type: String,
      trim: true,
      default: 'HDFC Bank Limited',
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionPct: {
      type: Number,
      default: 8.5,
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    netDisbursed: {
      type: Number,
      required: true,
      min: 0,
    },
    transferMode: {
      type: String,
      enum: ['IMPS', 'NEFT', 'RTGS', 'UPI'],
      default: 'IMPS',
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Processing', 'Settled', 'Failed'],
      default: 'Settled',
    },
    remarks: {
      type: String,
      trim: true,
      default: 'Marketplace Vendor Escrow Settlement',
    },
    authorizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    disbursedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payout', payoutSchema);
