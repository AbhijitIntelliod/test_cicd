class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = Number(statusCode) || 500;
    this.status = this.statusCode;
    if (details) this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

module.exports = ApiError;


