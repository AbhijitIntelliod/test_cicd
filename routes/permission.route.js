// routes/permissionRoutes.js
const express = require('express');
const permissionController = require('../controllers/permission.controller');
const { authenticate, requirePermission } = require('../middlewares/auth.middleware');
const { 
  validateAddPermission, 
  validateUpdatePermissions, 
  validateGetRolePermissions, 
  validateRemovePermission, 
  validateCheckPermission 
} = require('../middlewares/validators/permission.validator');

const router = express.Router();


// Routes

// GET /api/permissions - Get available permissions
router.get('/',
  authenticate,
  requirePermission('permissions', 'read'),
  permissionController.getAvailablePermissions
);

// GET /api/permissions/roles/:roleId - Get permissions for a role
router.get('/roles/:roleId',
  authenticate,
  requirePermission('permissions', 'read'),
  validateGetRolePermissions,
  permissionController.getRolePermissions
);

// POST /api/permissions/roles/:roleId - Add permission to role
router.post('/roles/:roleId',
  authenticate,
  requirePermission('permissions', 'create'),
  validateAddPermission,
  permissionController.addPermissionToRole
);

// PUT /api/permissions/roles/:roleId - Update all permissions for a role
router.put('/roles/:roleId',
  authenticate,
  requirePermission('permissions', 'update'),
  validateUpdatePermissions,
  permissionController.updateRolePermissions
);

// DELETE /api/permissions/roles/:roleId/:permissionId - Remove permission from role
router.delete('/roles/:roleId/:permissionId',
  authenticate,
  requirePermission('permissions', 'delete'),
  validateRemovePermission,
  permissionController.removePermissionFromRole
);

// GET /api/permissions/check/:userId - Check if user has specific permission
router.get('/check/:userId',
  authenticate,
  requirePermission('users', 'read'), // Need to read user data to check permissions
  validateCheckPermission,
  permissionController.checkUserPermission
);

module.exports = router;