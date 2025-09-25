module.exports = (sequelize, DataTypes) => {

const LoginOtp = sequelize.define('LoginOtp', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false,
    field: 'otp'
  },
  otpExpiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'otp_expires_at'
  },
  session: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'session'
  },
  consumedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'consumed_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'login_otps',
  timestamps: false,
  indexes: [
    { fields: ['email'] },
    { fields: ['otp'] },
    { fields: ['otp_expires_at'] }
  ]
});

return LoginOtp;
}


