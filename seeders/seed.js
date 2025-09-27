#!/usr/bin/env node

const db = require('../config/db.config');
const logger = require('../config/logger');
const { seedRoles } = require('./roleSeeder');
const { seedUsers } = require('./userSeeder');


/**
 * Main database seeding function
 * Runs all available seeders in the correct order
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding process...\n');
    
    // Ensure database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established for seeding');
    console.log('✅ Database connection established');

    // Sync database models (create tables if they don't exist)
    await db.sequelize.sync({ force: true });
    console.log('✅ Database models synchronized');
    
    // Run seeders in order
    console.log('\n📦 Running seeders...\n');
    
    //Seed roles and permissions (must be first)
    console.log('1️⃣ Seeding roles and permissions...');
    await seedRoles();
    
    //Seed users (must be after roles)
    console.log('2️⃣ Seeding users...');
    await seedUsers();

    // Add more seeders here as needed
    // Example:
    // console.log('3️⃣ Seeding other data...');
    // await seedOtherData();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 All seeders have been executed');
    
  } catch (error) {
    logger.error('Database seeding failed:', error);
    console.error('❌ Database seeding failed:', error.message);
    console.error('\n🔍 Error details:', error);
    throw error;
  }
};

/**
 * Reset database function
 * WARNING: This will drop all tables and recreate them
 */
const resetDatabase = async () => {
  try {
    console.log('⚠️  WARNING: This will reset the entire database!');
    console.log('🗑️  Dropping all tables...');
    
    await db.sequelize.drop();
    console.log('✅ All tables dropped');
    
    await db.sequelize.sync({ force: true });
    console.log('✅ Database schema recreated');
    
    console.log('\n🌱 Running seeders after reset...');
    await seedDatabase();
    
  } catch (error) {
    logger.error('Database reset failed:', error);
    console.error('❌ Database reset failed:', error.message);
    throw error;
  }
};

/**
 * Check database status
 */
const checkDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connection: OK');
    
    // Check if tables exist
    const tables = await db.sequelize.getQueryInterface().showAllTables();
    console.log(`📊 Found ${tables.length} tables:`, tables.join(', '));
    
    // Check roles
    const { Role, RolePermission } = db;
    const roleCount = await Role.count();
    const permissionCount = await RolePermission.count();
    
    console.log(`👥 Roles: ${roleCount}`);
    console.log(`🔐 Permissions: ${permissionCount}`);
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    throw error;
  }
};

// CLI interface
const main = async () => {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'seed':
        await seedDatabase();
        break;
      case 'reset':
        await resetDatabase();
        break;
      case 'check':
        await checkDatabase();
        break;
      case 'roles':
        console.log('🔐 Seeding roles only...');
        await db.sequelize.authenticate();
        await db.sequelize.sync({ alter: true });
        await seedRoles();
        break;
      case 'users':
        console.log('👥 Seeding users only...');
        await db.sequelize.authenticate();
        await db.sequelize.sync({ alter: true });
        await seedUsers();
        break;
      default:
        console.log('📖 Usage:');
        console.log('  node seeders/seed.js seed    - Run all seeders');
        // console.log('  node seeders/seed.js reset   - Reset database and run seeders');
        console.log('  node seeders/seed.js check   - Check database status');
        console.log('  node seeders/seed.js roles   - Seed roles only');
        console.log('  node seeders/seed.js users   - Seed users only');
        console.log('');
        console.log('💡 You can also run: npm run seed');
        process.exit(0);
    }
    
    console.log('\n✨ Operation completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Operation failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    if (db.sequelize) {
      await db.sequelize.close();
    }
  }
};

// Export functions for use in other files
module.exports = {
  seedDatabase,
  resetDatabase,
  checkDatabase
};

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}
