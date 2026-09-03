const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a user.
 * @param {string} id - MongoDB user _id
 * @param {string} [expiresIn] - Optional expiry override (e.g. '15m', '7d')
 * @returns {string} JWT token
 */
const generateToken = (id, expiresIn) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
