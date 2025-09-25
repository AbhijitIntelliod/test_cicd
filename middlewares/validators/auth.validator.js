const { body, validationResult } = require('express-validator');
const ApiError = require('../../utils/ApiError');

// Helper function to format phone number to E.164 format
const formatPhoneToE164 = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add +1 for US numbers (you can modify this logic)
  if (!cleaned.startsWith('+')) {
    // If it starts with 1 and has 11 digits, it's likely a US number
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 10) {
      // Assume US number if 10 digits
      cleaned = '+1' + cleaned;
    } else {
      // For other cases, you might want to add a default country code
      cleaned = '+1' + cleaned;
    }
  }
  
  return cleaned;
};

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

const validateSignup = [
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
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim(),
  
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      // Format the phone number to E.164 format
      const formattedPhone = formatPhoneToE164(value);
      
      // AWS Cognito requires phone numbers in E.164 format (+1234567890)
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(formattedPhone)) {
        throw new Error('Please provide a valid phone number (e.g., +1234567890 or 1234567890)');
      }
      
      // Store the formatted phone number in the request body
      return true;
    })
    .customSanitizer((value) => {
      // Sanitize and format the phone number
      return formatPhoneToE164(value);
    })
    .withMessage('Please provide a valid phone number'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  

  handleValidationErrors
];

const validateVerifyEmail = [
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
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),

  handleValidationErrors
];

const validateSendLoginOtp = [
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

  handleValidationErrors
];

const validateVerifyLoginOtp = [
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
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),

  handleValidationErrors
];

const validateLogin = [
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

  handleValidationErrors
];

const validatePasswordReset = [
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
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  handleValidationErrors
];

const validateRefreshCognito = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isLength({ min: 10 })
    .withMessage('Refresh token appears to be invalid')
    .custom((value) => {
      // Cognito refresh tokens are opaque tokens, not JWT format
      // They should be non-empty strings with reasonable length
      if (typeof value !== 'string' || value.trim().length < 10) {
        throw new Error('Invalid refresh token format');
      }
      return true;
    }),

  handleValidationErrors
];

const validateSigninViaPassword = [
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

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),

  handleValidationErrors
];

const validateSendPasswordResetOtp = [
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

  handleValidationErrors
];

module.exports = {
  validateSignup,
  validateVerifyEmail,
  validateSendLoginOtp,
  validateVerifyLoginOtp,
  validateLogin,
  validatePasswordReset,
  validateRefreshCognito,
  validateSigninViaPassword,
  validateSendPasswordResetOtp,
  formatPhoneToE164,
  handleValidationErrors
};
