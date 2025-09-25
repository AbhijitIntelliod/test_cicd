require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");


// Initialize sequelize
const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: "postgres",
    logging: process.env.NODE_ENV === 'test' ? false : console.log,
    dialectOptions: {
      ssl: process.env.PGSSLMODE === 'require' ? {
        require: true,
        rejectUnauthorized: false,
      } : false,
    },
  }
);

// Import models
const User = require("../models/user.model")(sequelize, DataTypes);
const Recommendation = require("../models/recommendation.model")(sequelize, DataTypes);
const CorporateCommunity = require("../models/corporate_community.model")(sequelize, DataTypes);
const IndividualProfessional = require("../models/individual_professional.model")(sequelize, DataTypes);
const Event = require("../models/event.model")(sequelize, DataTypes);
const Ticket = require("../models/ticket.model")(sequelize, DataTypes);
const SlaLog = require("../models/sla_log.model")(sequelize, DataTypes);
const Role = require("../models/role.model")(sequelize, DataTypes);
const RolePermission = require("../models/role_permission.model")(sequelize, DataTypes);
const KycVerification = require('../models/kyc_verification.model')(sequelize, DataTypes);
const LoginOtp = require('../models/login_otp.model')(sequelize, DataTypes);


// Note: Associations are now handled in individual model files via the associate method

const UserPreferences = require("../models/user_preferences.model")(sequelize, DataTypes);
const Like = require("../models/like.model")(sequelize, DataTypes);
const Booking = require("../models/booking.model")(sequelize, DataTypes);
const Discovery = require("../models/discovery.model")(sequelize, DataTypes);


// Set up model associations
const models = {
  User, Recommendation, CorporateCommunity, 
  IndividualProfessional, Event, Ticket, SlaLog, UserPreferences, Like, Booking, Discovery,
  Role, RolePermission, KycVerification, LoginOtp
};

// Call associate methods if they exist
Object.keys(models).forEach(modelName => {
  if (models[modelName] && models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Ticket relations
if (Ticket && SlaLog) {
  Ticket.hasMany(SlaLog, { foreignKey: 'ticket_id', as: 'sla_logs', onDelete: 'CASCADE' });
  SlaLog.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
}

// Export both sequelize and models
module.exports = { 
  sequelize, 
  User, 
  Recommendation,
  CorporateCommunity, 
  IndividualProfessional, 
  Event, 
  Ticket, 
  SlaLog, UserPreferences, Like, Booking, Discovery,
  KycVerification,
  Role,
  RolePermission,
  LoginOtp
};