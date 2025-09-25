const { body, validationResult } = require('express-validator');
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

const validateKycSubmission = [
  body('documentType')
    .notEmpty()
    .withMessage('Document type is required')
    .isIn(['passport', 'national_id', 'driver_license', 'other'])
    .withMessage('Invalid document type. Must be one of: passport, national_id, driver_license, other'),
  
  body('documentNumber')
    .notEmpty()
    .withMessage('Document number is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Document number must be between 3 and 50 characters')
    .trim(),

  handleValidationErrors
];

const validateKycReview = [
  body('status')
    .notEmpty()
    .withMessage('Review status is required')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  
  body('rejectionReason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting KYC')
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
    .trim(),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim(),

  handleValidationErrors
];

const validateKycStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['under_review', 'pending'])
    .withMessage('Status must be either under_review or pending'),

  handleValidationErrors
];

const validateDocumentDeletion = [
  body('fileKey')
    .notEmpty()
    .withMessage('File key is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('File key must be between 1 and 500 characters')
    .trim(),

  handleValidationErrors
];

module.exports = {
  validateKycSubmission,
  validateKycReview,
  validateKycStatusUpdate,
  validateDocumentDeletion,
  handleValidationErrors
};
