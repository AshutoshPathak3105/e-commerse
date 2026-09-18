const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }
  next();
};

const TAX_RATE       = 0.18; // 18% GST
const SHIPPING_PRICE = (subtotal) => (subtotal >= 499 ? 0 : 49);

// ── POST /api/orders ─── Place order ─────────────────────────
router.post(
  '/',
  protect,
  [
    body('shippingAddress.name').notEmpty().withMessage('Recipient name is required'),
    body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.state').notEmpty().withMessage('State is required'),
    body('shippingAddress.pincode').notEmpty().withMessage('Pincode is required'),
    body('shippingAddress.phone').notEmpty().withMessage('Phone is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    let rawItems = [];
    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      rawItems = req.body.items.map(i => ({
        product: i.productId || i.id || i._id || `prod-${Date.now()}`,
        name: i.name || 'Product',
        image: i.img || i.image || '',
        price: Number(i.price) || 0,
        quantity: Number(i.qty || i.quantity) || 1,
        stock: 999,
        isActive: true
      }));
    } else {
      let cart = await Cart.findOne({ user: req.user._id });
      if (cart && cart.items && cart.items.length > 0) {
        rawItems = cart.items.map(i => ({
          product: i.product?._id || i.product || `prod-${Date.now()}`,
          name: i.name,
          image: i.image || '',
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 1,
          stock: 999,
          isActive: true
        }));
      }
    }

    if (rawItems.length === 0) {
      res.status(400);
      throw new Error('Your cart is empty. Please add items to checkout.');
    }

    // Calculate prices
    const itemsPrice    = rawItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingPrice = SHIPPING_PRICE(itemsPrice);
    const taxPrice      = Math.round(itemsPrice * TAX_RATE);
    const totalPrice    = itemsPrice + shippingPrice + taxPrice;

    // Build order items
    const orderItems = rawItems.map((item) => ({
      product:  item.product || ('prod-' + Date.now()),
      name:     item.name,
      image:    item.image,
      price:    item.price,
      quantity: item.quantity,
    }));

    const order = await Order.create({
      user:            req.user._id,
      orderItems,
      shippingAddress: req.body.shippingAddress,
      paymentMethod:   req.body.paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      notes:           req.body.notes,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 days
    });

    // Decrement stock & increment sold for each product if real product
    try {
      const validOps = orderItems
        .filter(item => item.product && String(item.product).match(/^[0-9a-fA-F]{24}$/))
        .map((item) => ({
          updateOne: {
            filter: { _id: item.product },
            update: {
              $inc: { stock: -item.quantity, sold: item.quantity },
            },
          },
        }));
      if (validOps.length > 0) {
        await Product.bulkWrite(validOps);
      }
    } catch (e) {
      console.warn('Stock update notice:', e.message);
    }

    // Clear the cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

    // Send Purchase / Order Confirmation Invoice Email via Brevo
    sendOrderConfirmationEmail({
      email: req.user.email,
      name: req.body.shippingAddress?.name || req.user.name,
      order: order.toObject()
    }).catch(err => {
      console.error('[Brevo Order Email Failed]:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: order,
    });
  })
);

// ── GET /api/orders ─── User's order history ─────────────────
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

// ── GET /api/orders/track/:query ─── Public Live Order Tracking ────────
router.get(
  '/track/:query',
  asyncHandler(async (req, res) => {
    const rawQuery = (req.params.query || '').trim();
    if (!rawQuery) {
      res.status(400);
      throw new Error('Please provide an Order ID or AWB Tracking Number');
    }

    const cleanQuery = rawQuery.replace(/^(XM-|AWB-|DEL-|BLU-)/i, '').trim();

    let order = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(rawQuery)) {
      order = await Order.findById(rawQuery).populate('user', 'name email phone');
    }

    if (!order) {
      order = await Order.findOne({
        $or: [
          { trackingNo: new RegExp(rawQuery, 'i') },
          { trackingNumber: new RegExp(rawQuery, 'i') },
          { trackingNo: new RegExp(cleanQuery, 'i') },
        ]
      }).populate('user', 'name email phone');
    }

    if (!order) {
      const allRecent = await Order.find({}).sort({ createdAt: -1 }).limit(50).populate('user', 'name email phone');
      order = allRecent.find(o => {
        const fullId = (o.orderId || `XM-${o._id.toString().slice(-8).toUpperCase()}`).toLowerCase();
        const raw = rawQuery.toLowerCase();
        const clean = cleanQuery.toLowerCase();
        return fullId.includes(raw) || fullId.includes(clean) || o._id.toString().endsWith(clean);
      });
    }

    function buildTrackingData(o) {
      const city = o?.shippingAddress?.city || 'Delhi';
      const state = o?.shippingAddress?.state || 'DL';
      const carrier = o?.carrier || (o?.totalPrice > 10000 ? 'BlueDart Air Apex' : 'Delhivery Express');
      const awb = o?.trackingNo || o?.trackingNumber || `DEL-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const date = o?.createdAt || new Date();

      const cityCoords = {
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'delhi': { lat: 28.6139, lng: 77.2090 },
        'new delhi': { lat: 28.6139, lng: 77.2090 },
        'bengaluru': { lat: 12.9716, lng: 77.5946 },
        'bangalore': { lat: 12.9716, lng: 77.5946 },
        'hyderabad': { lat: 17.3850, lng: 78.4867 },
        'pune': { lat: 18.5204, lng: 73.8567 },
        'chennai': { lat: 13.0827, lng: 80.2707 },
        'kolkata': { lat: 22.5726, lng: 88.3639 }
      };
      const normCity = city.toLowerCase().trim();
      const destCoord = cityCoords[normCity] || { lat: 28.6139, lng: 77.2090 };
      const originCoord = { lat: 19.0760, lng: 72.8777 };

      const isOutForDelivery = o?.status === 'Out for Delivery' || o?.currentStage === 4;
      const isDelivered = o?.status === 'Delivered' || o?.currentStage === 5 || o?.isDelivered === true;
      const isShipped = ['Shipped', 'Delivered', 'Out for Delivery'].includes(o?.status) || (o?.currentStage && o.currentStage >= 3);

      // Strict OTP Workflow:
      // 1. When "Out for Delivery": OTP is active and shown
      // 2. When "Delivered": OTP is auto-deleted / erased
      // 3. Any earlier stage (Pending, Confirmed, Shipped, In-Transit): OTP is null (hidden)
      let activeOtp = null;
      if (isOutForDelivery && !isDelivered) {
        activeOtp = o?.deliveryOtp || '4892';
      } else if (isDelivered) {
        activeOtp = null; // Auto-deleted on delivery
      } else {
        activeOtp = null; // Not ready yet
      }

      // Flipkart/Amazon-style location resolution
      let currentLocationTitle = '';
      let currentLocationDesc = '';

      if (isDelivered) {
        currentLocationTitle = `${city} Doorstep Destination`;
        currentLocationDesc = `Package successfully delivered to ${o?.shippingAddress?.street || 'recipient address'}, ${city}.`;
      } else if (isOutForDelivery) {
        currentLocationTitle = `${city} Local Distribution Center`;
        currentLocationDesc = `Courier executive Vikram Singh is delivering in your sector today.`;
      } else if (isShipped) {
        currentLocationTitle = `${city} Regional Cargo Sorting Facility`;
        currentLocationDesc = `Consignment scanned and sorted for last-mile delivery route dispatch.`;
      } else {
        currentLocationTitle = `Central Fulfillment Center, Bhiwandi Bay 4A`;
        currentLocationDesc = `Package verified, boxed, and handed over to ${carrier}.`;
      }

      const checkpoints = (o?.checkpoints && o.checkpoints.length) ? o.checkpoints : [
        {
          status: 'Order Placed & Verified',
          location: 'X-Mart Cloud Gateway, Mumbai',
          description: 'Payment verified and inventory allocated from warehouse',
          timestamp: new Date(new Date(date).getTime() + 1800000),
          completed: true,
        },
        {
          status: 'Consignment Packed & Sealed',
          location: 'Central Fulfillment Hub, Bhiwandi Bay 4A',
          description: 'Package weighed, barcoded, and tamper-proof bagged',
          timestamp: new Date(new Date(date).getTime() + 7200000),
          completed: true,
        },
        {
          status: `Handed Over to ${carrier}`,
          location: `Bhiwandi Hub (AWB: ${awb})`,
          description: 'Manifest signed and dispatched on surface express vehicle',
          timestamp: new Date(new Date(date).getTime() + 14400000),
          completed: isShipped || isDelivered || isOutForDelivery,
        },
        {
          status: `In-Transit: Reached Regional Hub (${city})`,
          location: `${city} Air Cargo Sorting Facility`,
          description: 'Consignment scanned and sorted into delivery route bag',
          timestamp: new Date(new Date(date).getTime() + 28800000),
          completed: isShipped || isDelivered || isOutForDelivery,
        },
        {
          status: 'Out for Delivery: Courier Assigned',
          location: `${city} Central Distribution Center`,
          description: 'Executive Vikram Singh (+91 98201 44821) is delivering today',
          timestamp: new Date(new Date(date).getTime() + 43200000),
          completed: isOutForDelivery || isDelivered,
        },
        {
          status: 'Consignment Delivered Successfully',
          location: `${o?.shippingAddress?.street || 'Doorstep'}, ${city}`,
          description: 'Delivered to recipient with digital OTP clearance',
          timestamp: new Date(new Date(date).getTime() + 50400000),
          completed: isDelivered,
        }
      ];

      return {
        orderId: o?.orderId || `XM-${(o?._id || '9842104').toString().slice(-8).toUpperCase()}`,
        _id: o?._id || 'demo_order',
        customerName: o?.user?.name || o?.shippingAddress?.name || o?.shippingAddress?.fullName || 'Customer',
        recipientCity: city,
        recipientState: state,
        destinationAddress: o?.shippingAddress?.street || `${city}, ${state}`,
        carrier,
        awb,
        status: isDelivered ? 'Delivered' : (isOutForDelivery ? 'Out for Delivery' : (o?.status || 'Shipped')),
        isOutForDelivery,
        isDelivered,
        currentLocationTitle,
        currentLocationDesc,
        deliveryOtp: activeOtp,
        deliveryExecutive: {
          name: 'Vikram Singh',
          phone: '+91 98201 44821',
          vehicle: 'Express Courier Van (MH-04-EV-8421)',
          rating: '4.9 ★'
        },
        estimatedDelivery: o?.estimatedDelivery || new Date(new Date(date).getTime() + 86400000 * 2),
        checkpoints,
        items: o?.orderItems || [
          { name: 'Apple MacBook Air M3 (16GB, 512GB)', quantity: 1, price: 134900, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300' }
        ],
        totalPrice: o?.totalPrice || 134900
      };
    }

    if (order) {
      res.json({
        success: true,
        data: buildTrackingData(order),
      });
    } else {
      const mockOrder = {
        _id: '98421',
        orderId: `XM-${rawQuery.slice(-8).toUpperCase()}`,
        status: 'Shipped',
        carrier: 'Delhivery Express',
        trackingNo: rawQuery.startsWith('DEL-') ? rawQuery : `DEL-${rawQuery.slice(-8)}`,
        shippingAddress: { city: 'Delhi', state: 'DL', street: 'Sector 14, Ring Road' },
        user: { name: 'Customer' },
        createdAt: new Date(Date.now() - 86400000)
      };
      res.json({
        success: true,
        data: buildTrackingData(mockOrder),
      });
    }
  })
);

// ── POST /api/orders/public-sync ─── Cross-device Order Sync ────────────────
router.post(
  '/public-sync',
  asyncHandler(async (req, res) => {
    const {
      id,
      orderId,
      orderDate,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      totalAmount,
      paymentMethod,
      fulfillmentStatus,
      trackingNumber,
      courier
    } = req.body;

    const oId = String(id || orderId || `XM-${Date.now().toString().slice(-8).toUpperCase()}`);

    let order = await Order.findOne({
      $or: [
        { trackingNo: oId },
        { trackingNumber: oId },
        { notes: `SYNC_ID:${oId}` }
      ]
    });

    const itemsFormatted = (items || []).map(i => ({
      product: i.id || i._id || i.productId || `prod-${Date.now()}`,
      name: i.name || 'Catalog Item',
      image: i.image || i.img || '',
      price: Number(i.price) || 0,
      quantity: Number(i.quantity || i.qty) || 1,
    }));

    const addr = shippingAddress || {};
    const shippingFormatted = {
      name: customerName || addr.name || 'Valued Customer',
      street: addr.street || addr.addressLine1 || addr.address || 'Standard Address',
      city: addr.city || 'Delhi',
      state: addr.state || 'Delhi',
      pincode: addr.pincode || '110001',
      phone: customerPhone || addr.phone || '9876543210'
    };

    let pMethod = 'COD';
    if (paymentMethod) {
      const pmUpper = String(paymentMethod).toUpperCase();
      if (pmUpper.includes('UPI')) pMethod = 'UPI';
      else if (pmUpper.includes('CARD')) pMethod = 'Card';
      else if (pmUpper.includes('WALLET')) pMethod = 'Wallet';
      else if (pmUpper.includes('NET')) pMethod = 'NetBanking';
    }

    let fStatus = 'Pending';
    if (fulfillmentStatus) {
      if (fulfillmentStatus === 'Pending Dispatch') fStatus = 'Pending';
      else if (['In-Transit', 'Shipped', 'Delivered', 'Cancelled'].includes(fulfillmentStatus)) {
        fStatus = fulfillmentStatus === 'In-Transit' ? 'Shipped' : fulfillmentStatus;
      }
    }

    if (!order) {
      order = await Order.create({
        orderItems: itemsFormatted,
        shippingAddress: shippingFormatted,
        paymentMethod: pMethod,
        itemsPrice: Number(totalAmount) || 0,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: Number(totalAmount) || 0,
        status: fStatus,
        trackingNumber: trackingNumber || `FBX-EXP-${Date.now().toString().slice(-6)}`,
        trackingNo: oId,
        carrier: courier || 'FBX Express Air Logistics',
        notes: `SYNC_ID:${oId}`,
        createdAt: orderDate ? new Date(orderDate) : new Date()
      });
    } else {
      order.status = fStatus;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      await order.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order synced successfully across devices',
      data: order
    });
  })
);

// ── GET /api/orders/public-all ─── Fetch All Orders for Cross-device Sync ──
router.get(
  '/public-all',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formatted = orders.map(o => {
      let syncId = o.trackingNo;
      if (o.notes && o.notes.includes('SYNC_ID:')) {
        syncId = o.notes.split('SYNC_ID:')[1].trim();
      }
      if (!syncId) {
        syncId = `XM-${o._id.toString().slice(-8).toUpperCase()}`;
      }

      const addr = o.shippingAddress || {};
      const st = addr.street || addr.addressLine1 || addr.address || 'Standard Delivery Address';

      return {
        id: syncId,
        orderDate: o.createdAt || new Date().toISOString(),
        customerName: addr.name || (o.user ? o.user.name : 'Valued Customer'),
        customerEmail: o.user ? o.user.email : '',
        customerPhone: addr.phone || '',
        shippingAddress: {
          street: st,
          address: st,
          city: addr.city || 'Delhi',
          state: addr.state || 'Delhi',
          pincode: addr.pincode || '110001'
        },
        items: (o.orderItems || []).map(it => ({
          id: String(it.product || it._id || ''),
          name: it.name || 'Catalog Item',
          price: it.price || 0,
          quantity: it.quantity || 1,
          image: it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
          sku: `SKU-${(it.name || 'XMT').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
        })),
        totalAmount: o.totalPrice || 0,
        paymentMethod: o.paymentMethod ? (o.paymentMethod.includes('COD') ? 'Cash on Delivery (COD)' : `Prepaid (${o.paymentMethod})`) : 'Cash on Delivery (COD)',
        fulfillmentStatus: o.status === 'Delivered' ? 'Delivered' : (o.status === 'Cancelled' ? 'Cancelled' : (o.status === 'Shipped' ? 'In-Transit' : 'Pending Dispatch')),
        trackingNumber: o.trackingNumber || `FBX-EXP-${Date.now().toString().slice(-6)}`,
        courier: o.carrier || 'FBX Express Air Logistics'
      };
    });

    res.json({
      success: true,
      data: formatted
    });
  })
);

// ── GET /api/orders/:id ─── Order detail ─────────────────────
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email phone'
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Owners or admins only
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }

    res.json({ success: true, data: order });
  })
);

// ── PUT /api/orders/:id/cancel ─── Cancel order (user) ───────
router.put(
  '/:id/cancel',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    if (!['Pending', 'Confirmed'].includes(order.status)) {
      res.status(400);
      throw new Error(`Cannot cancel an order with status: ${order.status}`);
    }

    order.status = 'Cancelled';
    await order.save();

    // Restore stock
    const bulkOps = order.orderItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity, sold: -item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps);

    res.json({ success: true, message: 'Order cancelled', data: order });
  })
);

// ── POST /api/orders/:id/return ─── Request Return / Replacement ───────
router.post(
  '/:id/return',
  protect,
  asyncHandler(async (req, res) => {
    const { reason, comments, pickupAddress, refundMethod } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to return this order');
    }
    if (['Cancelled', 'Returned'].includes(order.status)) {
      res.status(400);
      throw new Error(`Order is already ${order.status}`);
    }

    const rmaNumber = `RMA-XM-${Math.floor(10000000 + Math.random() * 90000000)}`;

    order.returnRequest = {
      rmaNumber,
      reason: reason || 'Item defective or not working',
      comments: comments || '',
      pickupAddress: pickupAddress || order.shippingAddress,
      refundMethod: refundMethod || 'wallet',
      status: 'Requested',
      requestedAt: new Date(),
    };
    order.status = 'Return Requested';
    await order.save();

    res.json({
      success: true,
      message: 'Return request submitted successfully.',
      data: {
        orderId: order._id,
        rmaNumber,
        status: order.status,
        returnRequest: order.returnRequest,
      },
    });
  })
);

// ── PUT /api/orders/:id/status ─── Update status (Admin) ─────
router.put(
  '/:id/status',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status, trackingNumber } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          ...(trackingNumber && { trackingNumber }),
          ...(status === 'Delivered' && { isDelivered: true, deliveredAt: new Date() }),
        },
      },
      { new: true }
    );

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    res.json({ success: true, message: `Order status updated to ${status}`, data: order });
  })
);

// ── GET /api/orders/admin/all ─── All orders (Admin) ─────────
router.get(
  '/admin/all',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;
    const filter = {};

    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  })
);

module.exports = router;

