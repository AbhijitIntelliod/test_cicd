module.exports = (sequelize, DataTypes) => {

const KycVerification = sequelize.define('KycVerification', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  documentType: {
    type: DataTypes.ENUM('passport', 'national_id', 'driver_license', 'other'),
    allowNull: false,
    field: 'document_type'
  },
  documentNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'document_number'
  },
  documentFiles: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'document_files',
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Document files must be an array');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'expired'),
    defaultValue: 'pending'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'submitted_at'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reviewed_at'
  },
  reviewedBy: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'reviewed_by'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
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
  tableName: 'kyc_verifications',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['submitted_at'] },
    { fields: ['reviewed_at'] }
  ]
});

// Associations
KycVerification.associate = function(models) {
  KycVerification.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

return KycVerification;
}
