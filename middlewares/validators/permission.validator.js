const { body, param, query, validationResult } = require('express-validator');
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

// Validation for adding permission to role
const validateAddPermission = [
  param('roleId')
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
  body('resource')
    .isIn(['users', 'kyc_verifications', 'roles', 'permissions', 'system_settings', 'reports', 'audit_logs'])
    .withMessage('Invalid resource'),
  body('action')
    .isIn(['create', 'read', 'update', 'delete', 'approve', 'reject', 'export'])
    .withMessage('Invalid action'),
  handleValidationErrors
];

// Validation for updating role permissions
const validateUpdatePermissions = [
  param('roleId')
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*.resource')
    .isIn(['users', 'kyc_verifications', 'roles', 'permissions', 'system_settings', 'reports', 'audit_logs'])
    .withMessage('Invalid resource'),
  body('permissions.*.action')
    .isIn(['create', 'read', 'update', 'delete', 'approve', 'reject', 'export'])
    .withMessage('Invalid action'),
  handleValidationErrors
];

// Validation for getting role permissions
const validateGetRolePermissions = [
  param('roleId')
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
  handleValidationErrors
];

// Validation for removing permission from role
const validateRemovePermission = [
  param('roleId')
    .isInt({ min: 1 })
    .withMessage('Invalid role ID'),
  param('permissionId')
    .isInt({ min: 1 })
    .withMessage('Invalid permission ID'),
  handleValidationErrors
];

// Validation for checking user permission
const validateCheckPermission = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  query('resource')
    .notEmpty()
    .isIn(['users', 'kyc_verifications', 'roles', 'permissions', 'system_settings', 'reports', 'audit_logs'])
    .withMessage('Valid resource is required'),
  query('action')
    .notEmpty()
    .isIn(['create', 'read', 'update', 'delete', 'approve', 'reject', 'export'])
    .withMessage('Valid action is required'),
  handleValidationErrors
];

// Validation for creating a new permission
const validateCreatePermission = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Permission name must be between 2 and 100 characters'),
  body('resource')
    .isIn(['users', 'kyc_verifications', 'roles', 'permissions', 'system_settings', 'reports', 'audit_logs'])
    .withMessage('Invalid resource'),
  body('action')
    .isIn(['create', 'read', 'update', 'delete', 'approve', 'reject', 'export'])
    .withMessage('Invalid action'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

// Validation for updating a permission
const validateUpdatePermission = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid permission ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Permission name must be between 2 and 100 characters'),
  body('resource')
    .optional()
    .isIn(['users', 'kyc_verifications', 'roles', 'permissions', 'system_settings', 'reports', 'audit_logs'])
    .withMessage('Invalid resource'),
  body('action')
    .optional()
    .isIn(['create', 'read', 'update', 'delete', 'approve', 'reject', 'export'])
    .withMessage('Invalid action'),
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

// Validation for getting permission by ID
const validateGetPermissionById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid permission ID'),
  handleValidationErrors
];

// Validation for deleting a permission
const validateDeletePermission = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid permission ID'),
  handleValidationErrors
];

// Validation for permission search/filter parameters
const validatePermissionSearch = [
  body('searchTerm')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  body('resource')
    .optional()
    .isIn(['users', 'kyc_verifications', 'roles', 'permissions', 'system_settings', 'reports', 'audit_logs'])
    .withMessage('Invalid resource'),
  body('action')
    .optional()
    .isIn(['create', 'read', 'update', 'delete', 'approve', 'reject', 'export'])
    .withMessage('Invalid action'),
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

// Validation for bulk permission operations
const validateBulkPermissionOperation = [
  body('permissionIds')
    .isArray({ min: 1 })
    .withMessage('Permission IDs must be a non-empty array'),
  body('permissionIds.*')
    .isInt({ min: 1 })
    .withMessage('Each permission ID must be a positive integer'),
  body('operation')
    .isIn(['activate', 'deactivate', 'delete'])
    .withMessage('Operation must be one of: activate, deactivate, delete'),
  handleValidationErrors
];

module.exports = {
  validateAddPermission,
  validateUpdatePermissions,
  validateGetRolePermissions,
  validateRemovePermission,
  validateCheckPermission,
  validateCreatePermission,
  validateUpdatePermission,
  validateGetPermissionById,
  validateDeletePermission,
  validatePermissionSearch,
  validateBulkPermissionOperation,
  handleValidationErrors
};
