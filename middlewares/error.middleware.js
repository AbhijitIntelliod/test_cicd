const logger = require('../config/logger');

module.exports = function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  logger.error(`[ERR ${requestId}] ${req.method} ${req.originalUrl} status=${status} msg=${err.message}`);

  // Include stack only in non-production
  if (!isProd && err.stack) {
    logger.debug(err.stack);
  }

  const response = {
    error: isProd ? 'Internal Server Error' : err.message,
    requestId,
  };
  if (!isProd && err.details) response.details = err.details;

  res.status(status).json(response);
};


