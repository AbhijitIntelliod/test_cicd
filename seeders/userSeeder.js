const { User, Role } = require('../config/db.config');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');

const seedUsers = async () => {
  try {
    // Ensure database connection
    await require('../config/db.config').sequelize.authenticate();
    logger.info('Database connection established for user seeding');

    // Get role IDs
    const superAdminRole = await Role.findOne({ where: { type: 'super_admin' } });
    const kycReviewerRole = await Role.findOne({ where: { type: 'kyc_reviewer' } });
    const userRole = await Role.findOne({ where: { type: 'user' } });

    if (!superAdminRole || !kycReviewerRole || !userRole) {
      throw new Error('Required roles not found. Please run role seeder first.');
    }

    // Sample users data
    const users = [
      {
        email: 'admin@example.com',
        fullName: 'System Administrator',
        phoneNumber: '+1234567890',
        roleId: superAdminRole.id,
        status: 'active',
        isKycVerified: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        password: await bcrypt.hash('Admin123!', 12)
      },
      {
        email: 'kyc.reviewer@example.com',
        fullName: 'KYC Reviewer',
        phoneNumber: '+1234567891',
        roleId: kycReviewerRole.id,
        status: 'active',
        isKycVerified: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        password: await bcrypt.hash('KycReviewer123!', 12)
      },
      {
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        phoneNumber: '+1234567892',
        roleId: userRole.id,
        status: 'active',
        isKycVerified: false,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        password: await bcrypt.hash('User123!', 12)
      },
      {
        email: 'jane.smith@example.com',
        fullName: 'Jane Smith',
        phoneNumber: '+1234567893',
        roleId: userRole.id,
        status: 'active',
        isKycVerified: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        password: await bcrypt.hash('User123!', 12)
      },
      {
        email: 'test.user@example.com',
        fullName: 'Test User',
        phoneNumber: '+1234567894',
        roleId: userRole.id,
        status: 'pending_verification',
        isKycVerified: false,
        emailVerifiedAt: null,
        lastLoginAt: null,
        password: await bcrypt.hash('Test123!', 12)
      }
    ];

    let totalUsersProcessed = 0;
    let totalUsersCreated = 0;

    for (const userData of users) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });

      if (created) {
        totalUsersCreated++;
        logger.info(`Created new user: ${user.email} with role: ${userData.roleId}`);
        console.log(`✅ Created user: ${user.email} (${user.fullName})`);
      } else {
        logger.info(`User already exists: ${user.email}`);
        console.log(`⚠️  User already exists: ${user.email}`);
      }

      totalUsersProcessed++;
    }

    logger.info(`User seeding completed successfully. Processed ${totalUsersProcessed} users, created ${totalUsersCreated} new users`);
    console.log(`\n✅ User seeding completed successfully!`);
    console.log(`📊 Summary: ${totalUsersProcessed} users processed, ${totalUsersCreated} new users created`);
    console.log(`\n🔐 Sample Login Credentials:`);
    console.log(`   Admin: admin@example.com / Admin123!`);
    console.log(`   KYC Reviewer: kyc.reviewer@example.com / KycReviewer123!`);
    console.log(`   Regular Users: john.doe@example.com / User123!`);
    console.log(`   Test User: test.user@example.com / Test123! (pending verification)`);

  } catch (error) {
    logger.error('Error seeding users:', error);
    console.error('❌ Error seeding users:', error.message);
    throw error;
  }
};

// Helper function to get user by email
const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        as: 'role'
      }]
    });
    return user;
  } catch (error) {
    logger.error('Error getting user by email:', error);
    return null;
  }
};

// Function to run seeder independently
const runSeeder = async () => {
  try {
    console.log('🚀 Starting user seeding process...');
    await seedUsers();
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

module.exports = { seedUsers, runSeeder, getUserByEmail };

