module.exports = (sequelize, DataTypes) => {
    return sequelize.define('IndividualProfessional', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      image: { type: DataTypes.STRING, allowNull: false, validate: { isUrl: true } },
    }, { tableName: 'individual_professionals', timestamps: true });
  };
  