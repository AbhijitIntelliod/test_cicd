// controllers/roleController.js
const { Role, RolePermission, User } = require('../models');
const { validationResult } = require('express-validator');

const roleController = {
  // Get all roles
  getAllRoles: async (req, res) => {
    try {
      const roles = await Role.findAll({
        include: [{
          model: RolePermission,
          as: 'permissions'
        }],
        order: [['created_at', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: roles,
        message: 'Roles retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get role by ID
  getRoleById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const role = await Role.findByPk(id, {
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
        data: role,
        message: 'Role retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Create new role
  createRole: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, type, description, permissions } = req.body;

      // Check if role name already exists
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }

      // Create role
      const role = await Role.create({
        name,
        type,
        description,
        is_active: true
      });

      // Add permissions if provided
      if (permissions && Array.isArray(permissions)) {
        const permissionPromises = permissions.map(permission => 
          RolePermission.create({
            role_id: role.id,
            resource: permission.resource,
            action: permission.action
          })
        );
        await Promise.all(permissionPromises);
      }

      // Fetch the created role with permissions
      const createdRole = await Role.findByPk(role.id, {
        include: [{
          model: RolePermission,
          as: 'permissions'
        }]
      });

      res.status(201).json({
        success: true,
        data: createdRole,
        message: 'Role created successfully'
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update role
  updateRole: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { name, type, description, is_active } = req.body;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Check if new name conflicts with existing role
      if (name && name !== role.name) {
        const existingRole = await Role.findOne({ 
          where: { name },
          paranoid: false
        });
        if (existingRole) {
          return res.status(400).json({
            success: false,
            message: 'Role with this name already exists'
          });
        }
      }

      // Update role
      await role.update({
        name: name || role.name,
        type: type || role.type,
        description: description !== undefined ? description : role.description,
        is_active: is_active !== undefined ? is_active : role.is_active
      });

      // Fetch updated role with permissions
      const updatedRole = await Role.findByPk(id, {
        include: [{
          model: RolePermission,
          as: 'permissions'
        }]
      });

      res.status(200).json({
        success: true,
        data: updatedRole,
        message: 'Role updated successfully'
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Delete role
  deleteRole: async (req, res) => {
    try {
      const { id } = req.params;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Check if role is being used by users
      const usersWithRole = await User.count({ where: { role_id: id } });
      if (usersWithRole > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete role. ${usersWithRole} users are assigned to this role`
        });
      }

      await role.destroy();

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Assign role to user
  assignRoleToUser: async (req, res) => {
    try {
      const { userId, roleId } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      if (!role.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign inactive role'
        });
      }

      await user.assignRole(roleId);

      const updatedUser = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'role'
        }]
      });

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Role assigned successfully'
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get users by role
  getUsersByRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const offset = (page - 1) * limit;
      const { count, rows: users } = await User.findAndCountAll({
        where: { role_id: id },
        include: [{
          model: Role,
          as: 'role'
        }],
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalUsers: count,
            hasNext: offset + users.length < count,
            hasPrev: page > 1
          }
        },
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching users by role:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = roleController;