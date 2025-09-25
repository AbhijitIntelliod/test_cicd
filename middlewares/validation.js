const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = (rules) => {
	return async (req, res, next) => {
		for (const rule of rules) {
			await rule.run(req);
		}
		const result = validationResult(req);
		if (result.isEmpty()) return next();
		
		const errorMessages = result.array().map(error => error.msg);
		const errorDetails = result.array().map(error => ({
			field: error.path || error.param,
			message: error.msg,
			value: error.value
		}));
		
		// Create a field-based error object for backward compatibility
		const fieldErrors = {};
		for (const err of result.array({ onlyFirstError: true })) {
			fieldErrors[err.path] = err.msg;
		}
		
		return next(new ApiError(400, errorMessages.join(', '), {
			validationErrors: errorDetails,
			field: 'validation',
			code: 'VALIDATION_ERROR',
			fieldErrors // Keep for backward compatibility
		}));
	};
};



