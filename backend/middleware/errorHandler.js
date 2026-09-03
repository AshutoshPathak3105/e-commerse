/**
 * Global error handler — must be registered as the LAST middleware.
 * Converts thrown errors into structured JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose: bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found — invalid ID: ${err.value}`;
  }

  // Mongoose: duplicate key (e.g. unique email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `A record with this ${field} already exists`;
  }

  // Mongoose: validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
