module.exports = (sequelize, DataTypes) => {
    const Like = sequelize.define(
      "Like",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        discoveryId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        recommendationId: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        tableName: "likes",
        timestamps: true, // createdAt, updatedAt
        indexes: [
          {
            unique: true,
            fields: ["userId", "discoveryId"], // prevents duplicate likes for discoveries
          },
          {
            unique: true,
            fields: ["userId", "recommendationId"], // prevents duplicate likes for recommendations
          },
        ]
      }
    );
  
    // Define associations
    Like.associate = function(models) {
      // Like belongs to Discovery
      Like.belongsTo(models.Discovery, {
        foreignKey: 'discoveryId',
        as: 'discovery'
      });
      
      // Like belongs to Recommendation
      Like.belongsTo(models.Recommendation, {
        foreignKey: 'recommendationId',
        as: 'recommendation'
      });
      
      // Like belongs to User
      Like.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    };
  
    return Like;
  };