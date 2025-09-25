module.exports = (sequelize, DataTypes) => {
	const Event = sequelize.define('Event', {
	  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
	  user_id: { type: DataTypes.BIGINT, allowNull: false },
	  title: { type: DataTypes.STRING(200), allowNull: false },
	  type: { type: DataTypes.TEXT, allowNull: true },
	  location: { type: DataTypes.STRING(200), allowNull: true },
	  time: { type: DataTypes.STRING(255), allowNull: false },
	  color: { type: DataTypes.STRING(255), allowNull: true },
	  date: { type: DataTypes.STRING(255), allowNull: true } // ✅ only one
	}, {
	  tableName: 'events',
	  timestamps: true,
	  indexes: [
		{ fields: ['time'] },
		{ fields: ['user_id'] },
		{ fields: ['user_id', 'time'] }
	  ]
	});
	return Event;
  };
  