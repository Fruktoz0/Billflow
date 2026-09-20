/**
 * Centralized error handling middleware.
 * Standardizes API error responses and hides internal stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Sequelize validation error handling
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({ field: e.path, message: e.message }))
    });
  }

  return res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = errorHandler;
