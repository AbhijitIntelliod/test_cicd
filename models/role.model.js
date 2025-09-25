module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 50]
        }
      },
      type: {
        type: DataTypes.ENUM('admin', 'moderator', 'user', 'kyc_reviewer', 'super_admin'),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'roles',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'idx_roles_type', fields: ['type'] },
        { name: 'idx_roles_is_active', fields: ['is_active'] }
      ]
    });
  
    // Associations
    Role.associate = (models) => {
      Role.hasMany(models.User, {
        foreignKey: 'roleId',
        as: 'users'
      });
  
      Role.hasMany(models.RolePermission, {
        foreignKey: 'roleId',
        as: 'permissions'
      });
    };
  
    // Instance method
    Role.prototype.hasPermission = async function(resource, action) {
      const permission = await this.getPermissions({
        where: { resource, action }
      });
      return permission.length > 0;
    };
  
    // Class methods
    Role.getActiveRoles = function() {
      return this.findAll({
        where: { is_active: true },
        include: [{ model: sequelize.models.RolePermission, as: 'permissions' }]
      });
    };
  
    Role.findByType = function(type) {
      return this.findAll({
        where: { type, is_active: true }
      });
    };
  
    return Role;
  };
  