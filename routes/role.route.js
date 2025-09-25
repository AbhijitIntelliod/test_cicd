const express = require('express');
const roleController = require('../controllers/role.controller');
const { authenticate, requirePermission } = require('../middlewares/auth.middleware');
const { 
  validateCreateRole, 
  validateUpdateRole, 
  validateGetRoleById, 
  validateDeleteRole, 
  validateAssignRole, 
  validateGetUsersByRole 
} = require('../middlewares/validators/role.validator');

const router = express.Router();


// Routes

// GET /api/roles - Get all roles
router.get('/', 
  authenticate,
  requirePermission('roles', 'read'),
  roleController.getAllRoles
);

// GET /api/roles/:id - Get role by ID
router.get('/:id',
  authenticate,
  requirePermission('roles', 'read'),
  validateGetRoleById,
  roleController.getRoleById
);

// POST /api/roles - Create new role
router.post('/',
  authenticate,
  requirePermission('roles', 'create'),
  validateCreateRole,
  roleController.createRole
);

// PUT /api/roles/:id - Update role
router.put('/:id',
  authenticate,
  requirePermission('roles', 'update'),
  validateUpdateRole,
  roleController.updateRole
);

// DELETE /api/roles/:id - Delete role
router.delete('/:id',
  authenticate,
  requirePermission('roles', 'delete'),
  validateDeleteRole,
  roleController.deleteRole
);

// POST /api/roles/assign - Assign role to user
router.post('/assign',
  authenticate,
  requirePermission('roles', 'update'),
  validateAssignRole,
  roleController.assignRoleToUser
);

// GET /api/roles/:id/users - Get users by role
router.get('/:id/users',
  authenticate,
  requirePermission('users', 'read'),
  validateGetUsersByRole,
  roleController.getUsersByRole
);

module.exports = router;