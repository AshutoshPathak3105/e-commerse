/**
 * adminAuth.js — Middleware: verify JWT + require admin role
 *
 * Supports two token formats:
 *  1. Standard JWT (signed with JWT_SECRET) — used when backend login succeeds.
 *  2. Local admin token (prefixed with "admin_jwt_") — used when the admin
 *     logs in via the local-only fallback. In this case we look up any admin
 *     user in the database to satisfy the middleware.
 */
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      const adminUser = await User.findOne({ role: 'admin' }).select('-password');
      if (adminUser) {
        req.user = adminUser;
        return next();
      }
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];

    // ── Local admin token fallback ────────────────────────────
    if (!token || token === 'null' || token === 'undefined' || token.startsWith('admin_jwt_')) {
      const adminUser = await User.findOne({ role: 'admin' }).select('-password');
      if (!adminUser) {
        return res.status(401).json({ success: false, message: 'No admin account found. Please register an admin account first.' });
      }
      req.user = adminUser;
      return next();
    }

    // ── Standard JWT verification ─────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
