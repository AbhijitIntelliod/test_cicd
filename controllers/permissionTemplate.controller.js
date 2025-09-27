const PermissionService = require('../services/permission.service');
const { Role } = require('../models');

const permissionTemplateController = {
  // Get all available permission templates
  getAvailableTemplates: async (req, res) => {
    try {
      const templates = PermissionService.getAvailableTemplates();
      
      res.status(200).json({
        success: true,
        data: {
          templates,
          count: templates.length
        },
        message: 'Available templates retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get permissions for a specific template
  getTemplatePermissions: async (req, res) => {
    try {
      const { templateName } = req.params;
      const permissions = PermissionService.getTemplatePermissions(templateName);
      
      if (permissions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          templateName,
          permissions,
          count: permissions.length
        },
        message: 'Template permissions retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching template permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Create role with template permissions
  createRoleWithTemplate: async (req, res) => {
    try {
      const { name, type, description, templateName } = req.body;

      // Validate required fields
      if (!name || !type || !templateName) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, and templateName are required'
        });
      }

      const roleData = { name, type, description };
      const role = await PermissionService.createRoleWithTemplate(roleData, templateName);

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created with template permissions successfully'
      });
    } catch (error) {
      console.error('Error creating role with template:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Create role with combined templates
  createRoleWithCombinedTemplates: async (req, res) => {
    try {
      const { name, type, description, templateNames } = req.body;

      // Validate required fields
      if (!name || !type || !templateNames || !Array.isArray(templateNames)) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, and templateNames array are required'
        });
      }

      const roleData = { name, type, description };
      const role = await PermissionService.createRoleWithCombinedTemplates(roleData, templateNames);

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created with combined template permissions successfully'
      });
    } catch (error) {
      console.error('Error creating role with combined templates:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Create role with custom permissions
  createRoleWithCustomPermissions: async (req, res) => {
    try {
      const { name, type, description, permissions } = req.body;

      // Validate required fields
      if (!name || !type || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, and permissions array are required'
        });
      }

      const roleData = { name, type, description };
      const role = await PermissionService.createRoleWithCustomPermissions(roleData, permissions);

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created with custom permissions successfully'
      });
    } catch (error) {
      console.error('Error creating role with custom permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Add template permissions to existing role
  addTemplateToRole: async (req, res) => {
    try {
      const { roleId } = req.params;
      const { templateName } = req.body;

      if (!templateName) {
        return res.status(400).json({
          success: false,
          message: 'Template name is required'
        });
      }

      // Check if role exists
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const permissions = await PermissionService.addTemplateToRole(roleId, templateName);
      const updatedRole = await PermissionService.getRoleWithPermissions(roleId);

      res.status(200).json({
        success: true,
        data: {
          role: updatedRole,
          addedPermissions: permissions
        },
        message: 'Template permissions added to role successfully'
      });
    } catch (error) {
      console.error('Error adding template to role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Clone permissions from one role to another
  cloneRolePermissions: async (req, res) => {
    try {
      const { sourceRoleId, targetRoleId } = req.body;

      if (!sourceRoleId || !targetRoleId) {
        return res.status(400).json({
          success: false,
          message: 'Source role ID and target role ID are required'
        });
      }

      // Check if both roles exist
      const sourceRole = await Role.findByPk(sourceRoleId);
      const targetRole = await Role.findByPk(targetRoleId);

      if (!sourceRole || !targetRole) {
        return res.status(404).json({
          success: false,
          message: 'One or both roles not found'
        });
      }

      const clonedPermissions = await PermissionService.cloneRolePermissions(sourceRoleId, targetRoleId);
      const updatedTargetRole = await PermissionService.getRoleWithPermissions(targetRoleId);

      res.status(200).json({
        success: true,
        data: {
          sourceRole: sourceRole.name,
          targetRole: updatedTargetRole,
          clonedPermissions: clonedPermissions.length
        },
        message: 'Permissions cloned successfully'
      });
    } catch (error) {
      console.error('Error cloning role permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Replace all permissions for a role
  replaceRolePermissions: async (req, res) => {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions array is required'
        });
      }

      // Check if role exists
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const updatedRole = await PermissionService.replaceRolePermissions(roleId, permissions);

      res.status(200).json({
        success: true,
        data: updatedRole,
        message: 'Role permissions replaced successfully'
      });
    } catch (error) {
      console.error('Error replacing role permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = permissionTemplateController;

