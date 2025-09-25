module.exports = (sequelize, DataTypes) => {
  const SlaLog = sequelize.define('SlaLog', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    ticket_id: { type: DataTypes.UUID, allowNull: false },
    event: { type: DataTypes.ENUM('created', 'first_response', 'status_change', 'escalation', 'resolution'), allowNull: false },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'sla_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['ticket_id'] },
      { fields: ['event'] },
      { fields: ['timestamp'] },
    ],
  });

  return SlaLog;
};



