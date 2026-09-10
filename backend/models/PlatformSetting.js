const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema({
  singletonKey: { type: String, default: 'default_platform_settings', unique: true },

  // Marketplace Financial Rules
  platformFeePct:         { type: Number, default: 8.5, min: 0, max: 50 },
  freeShippingThreshold:  { type: Number, default: 499, min: 0 },
  standardShippingFee:    { type: Number, default: 49, min: 0 },
  codFee:                 { type: Number, default: 40, min: 0 },
  codMaxLimit:            { type: Number, default: 25000, min: 0 },
  codEnabled:             { type: Boolean, default: true },

  // Compliance & Legal Identity
  businessName:           { type: String, default: 'X-Mart Superstore India Pvt. Ltd.' },
  gstin:                  { type: String, default: '27AAECX1234F1Z8', trim: true },
  panNumber:              { type: String, default: 'AAECX1234F', trim: true },
  standardTaxRate:        { type: Number, default: 18, min: 0, max: 28 },
  taxInclusive:           { type: Boolean, default: true },
  autoInvoicing:          { type: Boolean, default: true },

  // Order Fulfillment & Policies
  returnWindowDays:       { type: Number, default: 7, min: 1, max: 60 },
  replacementWindowDays:  { type: Number, default: 7, min: 1, max: 60 },
  unpaidOrderTimeoutHours:{ type: Number, default: 24, min: 1, max: 168 },
  deliveryLeadTime:       { type: String, default: '2 to 4 Business Days' },
  expressCutoffTime:      { type: String, default: '14:00' },
  timezone:               { type: String, default: 'Asia/Kolkata' },

  // Support & Contact Identity
  supportEmail:           { type: String, default: 'care@xmart.in' },
  supportPhone:           { type: String, default: '1800-120-9988' },
  whatsappSupport:        { type: String, default: '+91 98765 43210' },
  grievanceEmail:         { type: String, default: 'grievance@xmart.in' },
  supportHours:           { type: String, default: '24/7 Live Concierge & Assistance' },
  businessAddress:        { type: String, default: 'Tower B, DLF Cyber City, Phase II, Gurugram, Haryana - 122002' },

  // Inventory & Stock Controls
  lowStockThreshold:      { type: Number, default: 5, min: 1 },
  allowBackorders:        { type: Boolean, default: false },
  minOrderQty:            { type: Number, default: 1, min: 1 },
  maxOrderQtyPerItem:     { type: Number, default: 10, min: 1 },

  // System & Security
  maintenanceMode:        { type: Boolean, default: false },
  maintenanceNotice:      { type: String, default: 'We are currently performing scheduled platform enhancements. We will be back shortly!' },
  inactivityTimeoutMinutes:{ type: Number, default: 30, min: 5, max: 240 },
  fraudDetectionMode:     { type: String, default: 'standard', enum: ['standard', 'strict', 'permissive'] },
}, { timestamps: true });

// Static helper to retrieve or seed default configuration singleton
platformSettingSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne({ singletonKey: 'default_platform_settings' });
  if (!doc) {
    doc = await this.create({ singletonKey: 'default_platform_settings' });
  }
  return doc;
};

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
