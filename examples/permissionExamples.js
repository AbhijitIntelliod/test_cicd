/**
 * Permission Management Examples
 * 
 * This file demonstrates various ways to create and manage permissions
 * in the roles and permissions system.
 */

const PermissionService = require('../services/permission.service');
const { Role, RolePermission } = require('../config/db.config');

class PermissionExamples {
  
  /**
   * Example 1: Create permissions using templates
   */
  static async createRolesWithTemplates() {
    console.log('\n=== Example 1: Creating Roles with Templates ===');
    
    // Create a role with a predefined template
    const moderatorRole = await PermissionService.createRoleWithTemplate({
      name: 'Content Moderator',
      type: 'moderator',
      description: 'Moderates content and manages user interactions'
    }, 'MODERATOR');
    
    console.log(`Created role: ${moderatorRole.name}`);
    console.log(`Permissions: ${moderatorRole.permissions.length}`);
    
    // Create a role with admin template
    const adminRole = await PermissionService.createRoleWithTemplate({
      name: 'System Administrator',
      type: 'admin',
      description: 'Full system administration access'
    }, 'ADMIN');
    
    console.log(`Created role: ${adminRole.name}`);
    console.log(`Permissions: ${adminRole.permissions.length}`);
  }

  /**
   * Example 2: Create permissions using combined templates
   */
  static async createRolesWithCombinedTemplates() {
    console.log('\n=== Example 2: Creating Roles with Combined Templates ===');
    
    // Combine multiple templates
    const managerRole = await PermissionService.createRoleWithCombinedTemplates({
      name: 'Operations Manager',
      type: 'moderator',
      description: 'Manages operations with user and reporting access'
    }, ['USER_MANAGER', 'REPORT_MANAGER', 'SYSTEM_VIEWER']);
    
    console.log(`Created role: ${managerRole.name}`);
    console.log(`Permissions: ${managerRole.permissions.length}`);
    
    // Show the permissions
    managerRole.permissions.forEach(perm => {
      console.log(`  - ${perm.resource}:${perm.action}`);
    });
  }

  /**
   * Example 3: Create permissions with custom permission sets
   */
  static async createRolesWithCustomPermissions() {
    console.log('\n=== Example 3: Creating Roles with Custom Permissions ===');
    
    // Define custom permissions for an event coordinator
    const eventPermissions = [
      { resource: 'events', action: 'create' },
      { resource: 'events', action: 'read' },
      { resource: 'events', action: 'update' },
      { resource: 'bookings', action: 'read' },
      { resource: 'bookings', action: 'approve' },
      { resource: 'bookings', action: 'reject' },
      { resource: 'reports', action: 'read' },
      { resource: 'reports', action: 'export' }
    ];
    
    const eventCoordinatorRole = await PermissionService.createRoleWithCustomPermissions({
      name: 'Event Coordinator',
      type: 'moderator',
      description: 'Coordinates events and manages bookings'
    }, eventPermissions);
    
    console.log(`Created role: ${eventCoordinatorRole.name}`);
    console.log(`Custom permissions: ${eventCoordinatorRole.permissions.length}`);
    
    // Show the permissions
    eventCoordinatorRole.permissions.forEach(perm => {
      console.log(`  - ${perm.resource}:${perm.action}`);
    });
  }

  /**
   * Example 4: Add permissions to existing roles
   */
  static async addPermissionsToExistingRoles() {
    console.log('\n=== Example 4: Adding Permissions to Existing Roles ===');
    
    // Find an existing role
    const existingRole = await Role.findOne({ where: { name: 'Content Moderator' } });
    
    if (existingRole) {
      // Add KYC permissions to the existing role
      await PermissionService.addTemplateToRole(existingRole.id, 'KYC_REVIEWER');
      
      // Add custom permissions
      await PermissionService.addPermissionsToRole(existingRole.id, [
        { resource: 'audit_logs', action: 'read' },
        { resource: 'system_settings', action: 'read' }
      ]);
      
      // Get updated role
      const updatedRole = await PermissionService.getRoleWithPermissions(existingRole.id);
      
      console.log(`Updated role: ${updatedRole.name}`);
      console.log(`Total permissions: ${updatedRole.permissions.length}`);
    }
  }

  /**
   * Example 5: Clone permissions between roles
   */
  static async clonePermissionsBetweenRoles() {
    console.log('\n=== Example 5: Cloning Permissions Between Roles ===');
    
    // Create a source role
    const sourceRole = await PermissionService.createRoleWithTemplate({
      name: 'Senior Manager',
      type: 'admin',
      description: 'Senior management role'
    }, 'MANAGER');
    
    // Create a target role
    const targetRole = await Role.create({
      name: 'Junior Manager',
      type: 'moderator',
      description: 'Junior management role'
    });
    
    // Clone permissions from source to target
    await PermissionService.cloneRolePermissions(sourceRole.id, targetRole.id);
    
    const updatedTargetRole = await PermissionService.getRoleWithPermissions(targetRole.id);
    
    console.log(`Source role: ${sourceRole.name} (${sourceRole.permissions.length} permissions)`);
    console.log(`Target role: ${updatedTargetRole.name} (${updatedTargetRole.permissions.length} permissions)`);
  }

  /**
   * Example 6: Replace all permissions for a role
   */
  static async replaceRolePermissions() {
    console.log('\n=== Example 6: Replacing All Role Permissions ===');
    
    // Find an existing role
    const role = await Role.findOne({ where: { name: 'Junior Manager' } });
    
    if (role) {
      // Define new permission set
      const newPermissions = [
        { resource: 'users', action: 'read' },
        { resource: 'reports', action: 'read' },
        { resource: 'system_settings', action: 'read' }
      ];
      
      // Replace all permissions
      const updatedRole = await PermissionService.replaceRolePermissions(role.id, newPermissions);
      
      console.log(`Replaced permissions for role: ${updatedRole.name}`);
      console.log(`New permissions: ${updatedRole.permissions.length}`);
      
      updatedRole.permissions.forEach(perm => {
        console.log(`  - ${perm.resource}:${perm.action}`);
      });
    }
  }

  /**
   * Example 7: Check permissions and validate access
   */
  static async checkPermissionsAndAccess() {
    console.log('\n=== Example 7: Checking Permissions and Access ===');
    
    const roles = await Role.findAll({
      include: [{ model: RolePermission, as: 'permissions' }]
    });
    
    for (const role of roles) {
      console.log(`\nRole: ${role.name} (${role.type})`);
      
      // Check specific permissions
      const canReadUsers = await PermissionService.roleHasPermission(role.id, 'users', 'read');
      const canCreateUsers = await PermissionService.roleHasPermission(role.id, 'users', 'create');
      const canDeleteUsers = await PermissionService.roleHasPermission(role.id, 'users', 'delete');
      
      console.log(`  Can read users: ${canReadUsers}`);
      console.log(`  Can create users: ${canCreateUsers}`);
      console.log(`  Can delete users: ${canDeleteUsers}`);
      
      // Show all permissions
      console.log(`  Total permissions: ${role.permissions.length}`);
      role.permissions.forEach(perm => {
        console.log(`    - ${perm.resource}:${perm.action}`);
      });
    }
  }

  /**
   * Example 8: Working with permission templates
   */
  static async workWithPermissionTemplates() {
    console.log('\n=== Example 8: Working with Permission Templates ===');
    
    // Get all available templates
    const templates = PermissionService.getAvailableTemplates();
    console.log('Available templates:', templates);
    
    // Get permissions for specific templates
    const userManagerPerms = PermissionService.getTemplatePermissions('USER_MANAGER');
    console.log('\nUSER_MANAGER template permissions:');
    userManagerPerms.forEach(perm => {
      console.log(`  - ${perm.resource}:${perm.action}`);
    });
    
    const adminPerms = PermissionService.getTemplatePermissions('ADMIN');
    console.log('\nADMIN template permissions:');
    adminPerms.forEach(perm => {
      console.log(`  - ${perm.resource}:${perm.action}`);
    });
  }

  /**
   * Run all examples
   */
  static async runAllExamples() {
    try {
      console.log('🚀 Starting Permission Management Examples...\n');
      
      await this.createRolesWithTemplates();
      await this.createRolesWithCombinedTemplates();
      await this.createRolesWithCustomPermissions();
      await this.addPermissionsToExistingRoles();
      await this.clonePermissionsBetweenRoles();
      await this.replaceRolePermissions();
      await this.checkPermissionsAndAccess();
      await this.workWithPermissionTemplates();
      
      console.log('\n✅ All examples completed successfully!');
      
    } catch (error) {
      console.error('❌ Error running examples:', error);
    }
  }
}

// Export for use in other files
module.exports = PermissionExamples;

// Run examples if called directly
if (require.main === module) {
  PermissionExamples.runAllExamples()
    .then(() => {
      console.log('Examples completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Examples failed:', error);
      process.exit(1);
    });
}

