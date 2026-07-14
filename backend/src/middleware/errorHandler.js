const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (!err.isOperational) {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
  } else {
    logger.warn(err.message);
  }

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Internal server error.',
  });
}

module.exports = { AppError, notFoundHandler, errorHandler };
