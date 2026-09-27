const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
  senderName: {
    type: String,
    trim: true,
    default: 'Customer',
  },
  time: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    tier: {
      type: String,
      trim: true,
      default: 'Regular Buyer',
    },
    orderId: {
      type: String,
      trim: true,
      default: '',
    },
    orderAmount: {
      type: Number,
      default: 0,
    },
    orderItem: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General Dispute',
    },
    priority: {
      type: String,
      enum: ['Urgent', 'High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved'],
      default: 'Open',
    },
    slaRemaining: {
      type: String,
      default: '24h remaining',
    },
    assignedAgent: {
      type: String,
      default: 'Support Desk',
    },
    notes: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['order', 'manual'],
      default: 'order',
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
