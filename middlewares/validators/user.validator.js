const { body, param, validationResult } = require('express-validator');
const ApiError = require('../../utils/ApiError');

// Helper function to handle validation errors consistently
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    throw new ApiError(400, errorMessages.join(', '), {
      validationErrors: errorDetails,
      field: 'validation',
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

// Validation for changing user role
const validateChangeUserRole = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  handleValidationErrors
];

// Validation for getting user by ID
const validateGetUserById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  handleValidationErrors
];

// Validation for updating user profile
const validateUpdateUserProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phoneNumber')
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      
      // Basic phone number validation
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }),
  handleValidationErrors
];

// Validation for creating a new user (admin only)
const validateCreateUser = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }),
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      // Basic phone number validation
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
];

// Validation for user search/filter parameters
const validateUserSearch = [
  body('searchTerm')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  body('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  validateChangeUserRole,
  validateGetUserById,
  validateUpdateUserProfile,
  validateCreateUser,
  validateUserSearch,
  handleValidationErrors
};
