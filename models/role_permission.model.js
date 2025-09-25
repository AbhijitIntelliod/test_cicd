module.exports = (sequelize, DataTypes) => {
    const RolePermission = sequelize.define('RolePermission', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      roleId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'role_id',
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      resource: {
        type: DataTypes.ENUM(
          'users',
          'kyc_verifications',
          'roles',
          'permissions',
          'system_settings',
          'reports',
          'audit_logs'
        ),
        allowNull: false
      },
      action: {
        type: DataTypes.ENUM(
          'create',
          'read',
          'update',
          'delete',
          'approve',
          'reject',
          'export'
        ),
        allowNull: false
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
      tableName: 'role_permissions',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'idx_role_permissions_role_id', fields: ['role_id'] },
        { name: 'idx_role_permissions_resource', fields: ['resource'] },
        { name: 'idx_role_permissions_action', fields: ['action'] },
        { unique: true, fields: ['role_id', 'resource', 'action'] }
      ]
    });
  
    // Associations
    RolePermission.associate = (models) => {
      RolePermission.belongsTo(models.Role, {
        foreignKey: 'roleId',
        as: 'role'
      });
    };
  
    // Class methods
    RolePermission.getPermissionsByRole = function(roleId) {
      return this.findAll({
        where: { roleId: roleId },
        include: [{ model: sequelize.models.Role, as: 'role' }]
      });
    };
  
    RolePermission.checkPermission = function(roleId, resource, action) {
      return this.findOne({
        where: { roleId: roleId, resource, action }
      });
    };
  
    RolePermission.addPermission = async function(roleId, resource, action) {
      try {
        return await this.create({ roleId: roleId, resource, action });
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          throw new Error('Permission already exists for this role');
        }
        throw error;
      }
    };
  
    RolePermission.removePermission = function(roleId, resource, action) {
      return this.destroy({
        where: { roleId: roleId, resource, action }
      });
    };
  
    return RolePermission;
  };
  