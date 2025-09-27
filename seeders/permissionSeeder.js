const { Role, RolePermission, sequelize } = require('../config/db.config');
const PermissionService = require('../services/permission.service');
const logger = require('../config/logger');

const seedPermissionsAndRoles = async () => {
  try {
    // Ensure database connection
    await sequelize.authenticate();
    logger.info('Database connection established for permission seeding');

    // Example 1: Create role with template permissions
    logger.info('Creating roles with template permissions...');
    
    const contentManagerRole = await PermissionService.createRoleWithTemplate({
      name: 'Content Manager',
      type: 'moderator',
      description: 'Manages content and user interactions'
    }, 'MODERATOR');

    logger.info(`Created Content Manager role with ID: ${contentManagerRole.id}`);

    // Example 2: Create role with combined templates
    const supportManagerRole = await PermissionService.createRoleWithCombinedTemplates({
      name: 'Support Manager',
      type: 'moderator',
      description: 'Manages support team and customer issues'
    }, ['USER_MANAGER', 'REPORT_VIEWER', 'SYSTEM_VIEWER']);

    logger.info(`Created Support Manager role with ID: ${supportManagerRole.id}`);

    // Example 3: Create role with custom permissions
    const eventCoordinatorRole = await PermissionService.createRoleWithCustomPermissions({
      name: 'Event Coordinator',
      type: 'moderator',
      description: 'Coordinates events and manages bookings'
    }, [
      { resource: 'events', action: 'create' },
      { resource: 'events', action: 'read' },
      { resource: 'events', action: 'update' },
      { resource: 'bookings', action: 'read' },
      { resource: 'bookings', action: 'approve' },
      { resource: 'bookings', action: 'reject' },
      { resource: 'reports', action: 'read' }
    ]);

    logger.info(`Created Event Coordinator role with ID: ${eventCoordinatorRole.id}`);

    // Example 4: Add additional permissions to existing role
    logger.info('Adding additional permissions to existing roles...');
    
    // Add KYC permissions to Content Manager
    await PermissionService.addTemplateToRole(contentManagerRole.id, 'KYC_REVIEWER');
    logger.info('Added KYC permissions to Content Manager role');

    // Example 5: Create a role and then modify its permissions
    const analystRole = await Role.create({
      name: 'Data Analyst',
      type: 'user',
      description: 'Analyzes data and generates reports'
    });

    // Add basic permissions
    await PermissionService.addTemplateToRole(analystRole.id, 'REPORT_VIEWER');
    
    // Add custom permissions
    await PermissionService.addPermissionsToRole(analystRole.id, [
      { resource: 'users', action: 'read' },
      { resource: 'system_settings', action: 'read' }
    ]);

    logger.info(`Created Data Analyst role with ID: ${analystRole.id}`);

    // Example 6: Replace all permissions for a role
    const updatedAnalystRole = await PermissionService.replaceRolePermissions(analystRole.id, [
      { resource: 'reports', action: 'read' },
      { resource: 'reports', action: 'export' },
      { resource: 'users', action: 'read' },
      { resource: 'audit_logs', action: 'read' }
    ]);

    logger.info(`Updated Data Analyst role permissions. Total permissions: ${updatedAnalystRole.permissions.length}`);

    // Example 7: Clone permissions from one role to another
    const juniorAnalystRole = await Role.create({
      name: 'Junior Data Analyst',
      type: 'user',
      description: 'Junior level data analysis'
    });

    await PermissionService.cloneRolePermissions(analystRole.id, juniorAnalystRole.id);
    logger.info(`Cloned permissions from Data Analyst to Junior Data Analyst role`);

    // Display summary
    logger.info('=== Permission Seeding Summary ===');
    const allRoles = await Role.findAll({
      include: [{ model: RolePermission, as: 'permissions' }],
      order: [['created_at', 'ASC']]
    });

    allRoles.forEach(role => {
      logger.info(`Role: ${role.name} (${role.type}) - ${role.permissions.length} permissions`);
      role.permissions.forEach(perm => {
        logger.info(`  - ${perm.resource}:${perm.action}`);
      });
    });

    logger.info('Permission seeding completed successfully');

  } catch (error) {
    logger.error('Error during permission seeding:', error);
    throw error;
  }
};

// Run the seeder if called directly
if (require.main === module) {
  seedPermissionsAndRoles()
    .then(() => {
      logger.info('Permission seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Permission seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedPermissionsAndRoles };

