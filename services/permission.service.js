const { Role, RolePermission } = require('../config/db.config');
const { 
  getPermissionTemplate, 
  getAvailableTemplates, 
  combineTemplates, 
  createCustomPermissions 
} = require('../utils/permissionTemplates');

class PermissionService {
  /**
   * Create a role with permissions from a template
   * @param {Object} roleData - Role data
   * @param {string} templateName - Permission template name
   * @returns {Object} Created role with permissions
   */
  static async createRoleWithTemplate(roleData, templateName) {
    const role = await Role.create(roleData);
    const permissions = getPermissionTemplate(templateName);
    
    await this.addPermissionsToRole(role.id, permissions);
    
    return await this.getRoleWithPermissions(role.id);
  }

  /**
   * Create a role with combined templates
   * @param {Object} roleData - Role data
   * @param {Array} templateNames - Array of template names
   * @returns {Object} Created role with permissions
   */
  static async createRoleWithCombinedTemplates(roleData, templateNames) {
    const role = await Role.create(roleData);
    const permissions = combineTemplates(templateNames);
    
    await this.addPermissionsToRole(role.id, permissions);
    
    return await this.getRoleWithPermissions(role.id);
  }

  /**
   * Create a role with custom permissions
   * @param {Object} roleData - Role data
   * @param {Array} permissions - Array of permission objects
   * @returns {Object} Created role with permissions
   */
  static async createRoleWithCustomPermissions(roleData, permissions) {
    const role = await Role.create(roleData);
    const uniquePermissions = createCustomPermissions(permissions);
    
    await this.addPermissionsToRole(role.id, uniquePermissions);
    
    return await this.getRoleWithPermissions(role.id);
  }

  /**
   * Add permissions to an existing role
   * @param {number} roleId - Role ID
   * @param {Array} permissions - Array of permission objects
   * @returns {Array} Created permissions
   */
  static async addPermissionsToRole(roleId, permissions) {
    const createdPermissions = [];
    
    for (const permission of permissions) {
      try {
        const created = await RolePermission.create({
          role_id: roleId,
          resource: permission.resource,
          action: permission.action
        });
        createdPermissions.push(created);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`Permission ${permission.resource}:${permission.action} already exists for role ${roleId}`);
        } else {
          throw error;
        }
      }
    }
    
    return createdPermissions;
  }

  /**
   * Add template permissions to an existing role
   * @param {number} roleId - Role ID
   * @param {string} templateName - Template name
   * @returns {Array} Created permissions
   */
  static async addTemplateToRole(roleId, templateName) {
    const permissions = getPermissionTemplate(templateName);
    return await this.addPermissionsToRole(roleId, permissions);
  }

  /**
   * Replace all permissions for a role
   * @param {number} roleId - Role ID
   * @param {Array} permissions - New permissions array
   * @returns {Object} Updated role with permissions
   */
  static async replaceRolePermissions(roleId, permissions) {
    // Remove existing permissions
    await RolePermission.destroy({
      where: { role_id: roleId }
    });

    // Add new permissions
    const uniquePermissions = createCustomPermissions(permissions);
    await this.addPermissionsToRole(roleId, uniquePermissions);

    return await this.getRoleWithPermissions(roleId);
  }

  /**
   * Get role with all its permissions
   * @param {number} roleId - Role ID
   * @returns {Object} Role with permissions
   */
  static async getRoleWithPermissions(roleId) {
    return await Role.findByPk(roleId, {
      include: [{
        model: RolePermission,
        as: 'permissions'
      }]
    });
  }

  /**
   * Get all available permission templates
   * @returns {Array} Template names
   */
  static getAvailableTemplates() {
    return getAvailableTemplates();
  }

  /**
   * Get permissions from a template
   * @param {string} templateName - Template name
   * @returns {Array} Permissions array
   */
  static getTemplatePermissions(templateName) {
    return getPermissionTemplate(templateName);
  }

  /**
   * Check if a role has specific permission
   * @param {number} roleId - Role ID
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {boolean} Has permission
   */
  static async roleHasPermission(roleId, resource, action) {
    const permission = await RolePermission.findOne({
      where: {
        role_id: roleId,
        resource,
        action
      }
    });
    
    return !!permission;
  }

  /**
   * Get all permissions for a role
   * @param {number} roleId - Role ID
   * @returns {Array} Permissions array
   */
  static async getRolePermissions(roleId) {
    return await RolePermission.findAll({
      where: { role_id: roleId }
    });
  }

  /**
   * Remove specific permission from role
   * @param {number} roleId - Role ID
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {boolean} Success status
   */
  static async removePermissionFromRole(roleId, resource, action) {
    const result = await RolePermission.destroy({
      where: {
        role_id: roleId,
        resource,
        action
      }
    });
    
    return result > 0;
  }

  /**
   * Clone permissions from one role to another
   * @param {number} sourceRoleId - Source role ID
   * @param {number} targetRoleId - Target role ID
   * @returns {Array} Created permissions
   */
  static async cloneRolePermissions(sourceRoleId, targetRoleId) {
    const sourcePermissions = await this.getRolePermissions(sourceRoleId);
    const permissions = sourcePermissions.map(perm => ({
      resource: perm.resource,
      action: perm.action
    }));
    
    return await this.addPermissionsToRole(targetRoleId, permissions);
  }
}

module.exports = PermissionService;

