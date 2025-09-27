const express = require('express');
const permissionTemplateController = require('../controllers/permissionTemplate.controller');
const { authenticate, requirePermission } = require('../middlewares/auth.middleware');

const router = express.Router();

// Routes for permission templates

// GET /api/v1/permission-templates - Get all available templates
router.get('/',
  authenticate,
  requirePermission('permissions', 'read'),
  permissionTemplateController.getAvailableTemplates
);

// GET /api/v1/permission-templates/:templateName - Get permissions for a template
router.get('/:templateName',
  authenticate,
  requirePermission('permissions', 'read'),
  permissionTemplateController.getTemplatePermissions
);

// POST /api/v1/permission-templates/roles/with-template - Create role with template
router.post('/roles/with-template',
  authenticate,
  requirePermission('roles', 'create'),
  permissionTemplateController.createRoleWithTemplate
);

// POST /api/v1/permission-templates/roles/with-combined - Create role with combined templates
router.post('/roles/with-combined',
  authenticate,
  requirePermission('roles', 'create'),
  permissionTemplateController.createRoleWithCombinedTemplates
);

// POST /api/v1/permission-templates/roles/with-custom - Create role with custom permissions
router.post('/roles/with-custom',
  authenticate,
  requirePermission('roles', 'create'),
  permissionTemplateController.createRoleWithCustomPermissions
);

// POST /api/v1/permission-templates/roles/:roleId/add-template - Add template to existing role
router.post('/roles/:roleId/add-template',
  authenticate,
  requirePermission('permissions', 'create'),
  permissionTemplateController.addTemplateToRole
);

// POST /api/v1/permission-templates/roles/clone - Clone permissions between roles
router.post('/roles/clone',
  authenticate,
  requirePermission('permissions', 'create'),
  permissionTemplateController.cloneRolePermissions
);

// PUT /api/v1/permission-templates/roles/:roleId/replace - Replace all role permissions
router.put('/roles/:roleId/replace',
  authenticate,
  requirePermission('permissions', 'update'),
  permissionTemplateController.replaceRolePermissions
);

module.exports = router;

