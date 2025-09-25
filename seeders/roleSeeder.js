const { Role, RolePermission, sequelize } = require('../config/db.config');
const logger = require('../config/logger');

const seedRoles = async () => {
  try {
    // Ensure database connection
    await sequelize.authenticate();
    logger.info('Database connection established for role seeding');

    // Create roles if they don't exist
    const roles = [
      {
        name: 'Super Admin',
        type: 'super_admin',
        description: 'Full system access',
        permissions: [
          { resource: 'users', action: 'create' },
          { resource: 'users', action: 'read' },
          { resource: 'users', action: 'update' },
          { resource: 'users', action: 'delete' },
          { resource: 'roles', action: 'create' },
          { resource: 'roles', action: 'read' },
          { resource: 'roles', action: 'update' },
          { resource: 'roles', action: 'delete' },
          { resource: 'permissions', action: 'create' },
          { resource: 'permissions', action: 'read' },
          { resource: 'permissions', action: 'update' },
          { resource: 'permissions', action: 'delete' },
          { resource: 'kyc_verifications', action: 'read' },
          { resource: 'kyc_verifications', action: 'approve' },
          { resource: 'kyc_verifications', action: 'reject' },
    
        
        ]
      },
      {
        name: 'KYC Reviewer',
        type: 'kyc_reviewer',
        description: 'Can review and approve KYC documents',
        permissions: [
          { resource: 'users', action: 'read' },
          { resource: 'kyc_verifications', action: 'read' },
          { resource: 'kyc_verifications', action: 'approve' },
          { resource: 'kyc_verifications', action: 'reject' }
        ]
      },
      {
        name: 'Regular User',
        type: 'user',
        description: 'Standard user permissions',
        permissions: [
          { resource: 'users', action: 'read' } // Can read own profile
        ]
      }
    ];

    let totalRolesProcessed = 0;
    let totalPermissionsAdded = 0;

    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: {
          type: roleData.type,
          description: roleData.description
        }
      });

      if (created) {
        logger.info(`Created new role: ${role.name}`);
      } else {
        logger.info(`Role already exists: ${role.name}`);
      }

      // Check if permissions need to be added
      const existingPermissions = await RolePermission.count({
        where: { roleId: role.id }
      });

      if (created || existingPermissions === 0) {
        // Add permissions
        for (const permission of roleData.permissions) {
          const [rolePermission, permissionCreated] = await RolePermission.findOrCreate({
            where: {
              roleId: role.id,
              resource: permission.resource,
              action: permission.action
            },
            defaults: {
              roleId: role.id,
              resource: permission.resource,
              action: permission.action
            }
          });

          if (permissionCreated) {
            totalPermissionsAdded++;
            logger.info(`Added permission: ${permission.resource}:${permission.action} to role ${role.name}`);
          }
        }
      } else {
        logger.info(`Permissions already exist for role: ${role.name}`);
      }

      totalRolesProcessed++;
      console.log(`Role ${role.name} seeded successfully`);
    }

    // Set default role for users table if it doesn't have a default
    try {
      const defaultUserRole = await Role.findOne({ where: { type: 'user' } });
      if (defaultUserRole) {
        // Update the users table to set the default role_id
        await sequelize.query(`
          ALTER TABLE users ALTER COLUMN role_id SET DEFAULT ${defaultUserRole.id}
        `);
        console.log(`✅ Set default role_id to ${defaultUserRole.id} for users table`);
      }
    } catch (error) {
      console.log('⚠️  Could not set default role_id (this is normal if roles are already seeded)');
    }
                                                                          
    logger.info(`Role seeding completed successfully. Processed ${totalRolesProcessed} roles, added ${totalPermissionsAdded} permissions`);
    console.log(`\n✅ Role seeding completed successfully!`);
    console.log(`📊 Summary: ${totalRolesProcessed} roles processed, ${totalPermissionsAdded} new permissions added`);

  } catch (error) {
    logger.error('Error seeding roles:', error);
    console.error('❌ Error seeding roles:', error.message);
    throw error;
  }
};

// Helper function to get default user role ID
const getDefaultUserRoleId = async () => {
  try {
    const userRole = await Role.findOne({
      where: { type: 'user' }
    });
    return userRole ? userRole.id : null;
  } catch (error) {
    logger.error('Error getting default user role:', error);
    return null;
  }
};

// Function to run seeder independently
const runSeeder = async () => {
  try {
    console.log('🚀 Starting role seeding process...');
    await seedRoles();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Allow running this file directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedRoles, runSeeder, getDefaultUserRoleId };