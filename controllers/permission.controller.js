// controllers/permissionController.js
const { Role, RolePermission } = require('../models');
const { validationResult } = require('express-validator');

const permissionController = {
  // Get all permissions for a role
  getRolePermissions: async (req, res) => {
    try {
      const { roleId } = req.params;

      const role = await Role.findByPk(roleId, {
        include: [{
          model: RolePermission,
          as: 'permissions'
        }]
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          role: {
            id: role.id,
            name: role.name,
            type: role.type
          },
          permissions: role.permissions
        },
        message: 'Role permissions retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Add permission to role
  addPermissionToRole: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { roleId } = req.params;
      const { resource, action } = req.body;

      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Check if permission already exists
      const existingPermission = await RolePermission.findOne({
        where: {
          role_id: roleId,
          resource,
          action
        }
      });

      if (existingPermission) {
        return res.status(400).json({
          success: false,
          message: 'Permission already exists for this role'
        });
      }

      const permission = await RolePermission.create({
        role_id: roleId,
        resource,
        action
      });

      res.status(201).json({
        success: true,
        data: permission,
        message: 'Permission added successfully'
      });
    } catch (error) {
      console.error('Error adding permission:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Remove permission from role
  removePermissionFromRole: async (req, res) => {
    try {
      const { roleId, permissionId } = req.params;

      const permission = await RolePermission.findOne({
        where: {
          id: permissionId,
          role_id: roleId
        }
      });

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found for this role'
        });
      }

      await permission.destroy();

      res.status(200).json({
        success: true,
        message: 'Permission removed successfully'
      });
    } catch (error) {
      console.error('Error removing permission:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Bulk update role permissions
  updateRolePermissions: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { roleId } = req.params;
      const { permissions } = req.body; // Array of {resource, action}

      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Remove all existing permissions for this role
      await RolePermission.destroy({
        where: { role_id: roleId }
      });

      // Add new permissions
      if (permissions && Array.isArray(permissions)) {
        const permissionPromises = permissions.map(permission => 
          RolePermission.create({
            role_id: roleId,
            resource: permission.resource,
            action: permission.action
          })
        );
        await Promise.all(permissionPromises);
      }

      // Fetch updated role with permissions
      const updatedRole = await Role.findByPk(roleId, {
        include: [{
          model: RolePermission,
          as: 'permissions'
        }]
      });

      res.status(200).json({
        success: true,
        data: updatedRole,
        message: 'Role permissions updated successfully'
      });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get available resources and actions
  getAvailablePermissions: async (req, res) => {
    try {
      const resources = [
        'users', 
        'kyc_verifications', 
        'roles', 
        'permissions', 
        'system_settings',
        'reports',
        'audit_logs'
      ];

      const actions = [
        'create', 
        'read', 
        'update', 
        'delete', 
        'approve', 
        'reject',
        'export'
      ];

      const permissionMatrix = resources.map(resource => ({
        resource,
        availableActions: actions
      }));

      res.status(200).json({
        success: true,
        data: {
          resources,
          actions,
          permissionMatrix
        },
        message: 'Available permissions retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching available permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Check if user has specific permission
  checkUserPermission: async (req, res) => {
    try {
      const { userId } = req.params;
      const { resource, action } = req.query;

      if (!resource || !action) {
        return res.status(400).json({
          success: false,
          message: 'Resource and action are required'
        });
      }

      const { User } = require('../models');
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const hasPermission = await user.hasPermission(resource, action);

      res.status(200).json({
        success: true,
        data: {
          userId,
          resource,
          action,
          hasPermission
        },
        message: 'Permission check completed'
      });
    } catch (error) {
      console.error('Error checking user permission:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = permissionController;