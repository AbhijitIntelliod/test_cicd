module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('Ticket', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    subject: { type: DataTypes.STRING(500), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('open', 'in_progress', 'pending', 'resolved', 'closed'), defaultValue: 'open' },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
    sla_deadline: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'tickets',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['created_at'] },
      { fields: ['sla_deadline'] },
    ],
  });

  return Ticket;
};



