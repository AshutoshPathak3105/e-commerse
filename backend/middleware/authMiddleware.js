const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * Protect: verifies Bearer JWT and attaches req.user
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized — no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user || !req.user.isActive) {
      res.status(401);
      throw new Error('Not authorized — user not found or deactivated');
    }

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      res.status(401);
      throw new Error('Not authorized — invalid token');
    }
    if (err.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Not authorized — token has expired');
    }
    throw err;
  }
});

module.exports = { protect };
