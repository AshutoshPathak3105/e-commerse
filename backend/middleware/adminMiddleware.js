/**
 * Admin gate — must be used AFTER protect middleware.
 * Allows only users with role === 'admin'.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403);
  throw new Error('Access denied — admin role required');
};

module.exports = { adminOnly };
