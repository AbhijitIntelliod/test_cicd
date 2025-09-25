const { DataTypes } = require('sequelize');

// Define Recommendation model
module.exports = (sequelize, DataTypes) => {
  const Recommendation = sequelize.define('Recommendation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 5
      }
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['$', '$$', '$$$', '$$$$']]
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    },
    trending: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
        notEmpty: true
      }
    },
  }, {
    tableName: 'recommendations',
    timestamps: true,
  });

  // Define associations
  Recommendation.associate = function(models) {
    // Recommendation has many Likes
    Recommendation.hasMany(models.Like, {
      foreignKey: 'recommendationId',
      as: 'likes'
    });
  };

  return Recommendation;
};
  