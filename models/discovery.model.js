module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Discovery', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [['trending', 'hidden-gems', 'local-favorites', 'seasonal', 'exclusive']] }
      },
      description: { type: DataTypes.TEXT, allowNull: false },
      fullDescription: { type: DataTypes.TEXT, allowNull: true },
      location: { type: DataTypes.STRING, allowNull: false },
      duration: { type: DataTypes.STRING, allowNull: false },
      rating: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0, max: 5 } },
      reviews: { type: DataTypes.INTEGER, defaultValue: 0 },
      price: { type: DataTypes.STRING, allowNull: false },
      tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      image: { type: DataTypes.STRING, allowNull: false, validate: { isUrl: true } },
      trending: { type: DataTypes.BOOLEAN, defaultValue: false },
      exclusive: { type: DataTypes.BOOLEAN, defaultValue: false },
      localFavorite: { type: DataTypes.BOOLEAN, defaultValue: false },
      bestTime: { type: DataTypes.STRING, allowNull: false },
      crowdLevel: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [['Very Low', 'Low', 'Medium', 'High']] }
      },
      instagrammable: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, { tableName: 'discoveries', timestamps: true });

    // Define associations
    Discovery.associate = function(models) {
      // Discovery has many Likes
      Discovery.hasMany(models.Like, {
        foreignKey: 'discoveryId',
        as: 'likes'
      });
    };

    return Discovery;
  };
  