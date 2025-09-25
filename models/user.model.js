// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [1, 255]
      }
    },
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'full_name',
      validate: {
        len: [1, 200]
      }
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,// make not nullable
      unique: true,
      field: 'phone_number',
      validate: {
        len: [10, 20],
        is: /^[\+]?[1-9][\d]{0,15}$/ // E.164-like regex
      }
    },
    isKycVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_kyc_verified'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_verification'),
      defaultValue: 'pending_verification'
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      field: 'email_verified_at'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at'
    },
    roleId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'role_id'
    },
    cognitoSub: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'cognito_sub'
    },
    cognitoUsername: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'cognito_username'
    },
    cognitoServicePassword: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'cognito_service_password'
    },
    cognitoTokens: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'cognito_tokens'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [8, 255]
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['email'] },
      { fields: ['full_name'] },
      { fields: ['phone_number'] },
      { fields: ['status'] },
      { fields: ['is_kyc_verified'] },
      { fields: ['role_id'] },
      { fields: ['cognito_sub'] },
      { fields: ['cognito_username'] }
    ]
  });

  // Associations
  User.associate = function(models) {
    User.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    User.hasMany(models.KycVerification, {
      foreignKey: 'userId',
      as: 'kycVerifications'
    });

  };

  // Instance methods
  User.prototype.hasPermission = async function(resource, action) {
    if (!this.roleId) return false;
    
    const role = await this.getRole({
      include: [{
        model: sequelize.models.RolePermission,
        as: 'permissions',
        where: { resource, action },
        required: false
      }]
    });

    return role && role.permissions && role.permissions.length > 0;
  };

  User.prototype.getRolePermissions = async function() {
    if (!this.roleId) return [];
    
    const role = await this.getRole({
      include: [{
        model: sequelize.models.RolePermission,
        as: 'permissions'
      }]
    });

    return role ? role.permissions : [];
  };

  User.prototype.assignRole = async function(roleId) {
    this.roleId = roleId;
    return await this.save();
  };

  User.prototype.isAdmin = async function() {
    const role = await this.getRole();
    return role && ['admin', 'super_admin'].includes(role.type);
  };

  User.prototype.isSuperAdmin = async function() {
    const role = await this.getRole();
    return role && role.type === 'super_admin';
  };

  User.prototype.isKycReviewer = async function() {
    const role = await this.getRole();
    return role && ['kyc_reviewer', 'admin', 'super_admin'].includes(role.type);
  };

  // Cognito-related methods
  User.prototype.hasCognitoAccount = function() {
    return !!this.cognitoSub;
  };

  User.prototype.updateCognitoTokens = async function(tokens) {
    this.cognitoTokens = tokens;
    return await this.save();
  };

  User.prototype.clearCognitoTokens = async function() {
    this.cognitoTokens = null;
    return await this.save();
  };

  return User;
};
