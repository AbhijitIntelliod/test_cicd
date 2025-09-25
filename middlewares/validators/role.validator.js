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

// Validation for creating a new role
const validateCreateRole = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),
  body('type')
    .isIn(['admin', 'moderator', 'user', 'kyc_reviewer', 'super_admin'])
    .withMessage('Invalid role type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*.resource')
    .optional()
    .isIn(['users', 'kyc_verifications', 'roles', 'permissions', 'system_settings', 'reports', 'audit_logs'])
    .withMessage('Invalid resource'),
  body('permissions.*.action')
    .optional()
    .isIn(['create', 'read', 'update', 'delete', 'approve', 'reject', 'export'])
    .withMessage('Invalid action'),
  handleValidationErrors
];

// Validation for updating a role
const validateUpdateRole = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),
  body('type')
    .optional()
    .isIn(['admin', 'moderator', 'user', 'kyc_reviewer', 'super_admin'])
    .withMessage('Invalid role type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  handleValidationErrors
];

// Validation for getting role by ID
const validateGetRoleById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
  handleValidationErrors
];

// Validation for deleting a role
const validateDeleteRole = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
  handleValidationErrors
];

// Validation for assigning role to user
const validateAssignRole = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
  handleValidationErrors
];

// Validation for getting users by role
const validateGetUsersByRole = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
  handleValidationErrors
];

// Validation for role search/filter parameters
const validateRoleSearch = [
  body('searchTerm')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  body('type')
    .optional()
    .isIn(['admin', 'moderator', 'user', 'kyc_reviewer', 'super_admin'])
    .withMessage('Invalid role type'),
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

// Validation for bulk role operations
const validateBulkRoleOperation = [
  body('roleIds')
    .isArray({ min: 1 })
    .withMessage('Role IDs must be a non-empty array'),
  body('roleIds.*')
    .isInt({ min: 1 })
    .withMessage('Each role ID must be a positive integer'),
  body('operation')
    .isIn(['activate', 'deactivate', 'delete'])
    .withMessage('Operation must be one of: activate, deactivate, delete'),
  handleValidationErrors
];

module.exports = {
  validateCreateRole,
  validateUpdateRole,
  validateGetRoleById,
  validateDeleteRole,
  validateAssignRole,
  validateGetUsersByRole,
  validateRoleSearch,
  validateBulkRoleOperation,
  handleValidationErrors
};
