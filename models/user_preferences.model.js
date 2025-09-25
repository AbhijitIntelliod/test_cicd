/**
 * UserPreferences model
 * - Stores per-user preference settings (budget, locations, categories, etc.)
 * - Also stores like state as arrays: likedDiscoveries and likedRecommendations
 * - Consumed by the Likes API (controllers/like.controller.js, services/like.service.js)
 * - Rows are created/updated implicitly by the Likes service; no separate routes
 */
module.exports = (sequelize, DataTypes) => {
  const UserPreferences = sequelize.define('UserPreferences', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Budget preferences
    preferredBudget: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['$', '$$', '$$$', '$$$$']]
      }
    },
    // Location preferences
    preferredLocations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    // Activity preferences
    preferredCategories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      validate: {
        // Allow empty array; ensure each element is one of allowed values
        areValidCategories(value) {
          if (!Array.isArray(value)) return;
          const allowed = ['adventure', 'relaxation', 'culture', 'food', 'nature', 'nightlife', 'shopping', 'history'];
          for (const category of value) {
            if (!allowed.includes(category)) {
              throw new Error('preferredCategories contains invalid value');
            }
          }
        }
      }
    },
    // Rating preferences
    minRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 3.0,
      validate: {
        min: 0,
        max: 5
      }
    },
    // Duration preferences
    preferredDuration: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['short', 'medium', 'long', 'flexible']]
      }
    },
    // Crowd level preferences
    preferredCrowdLevel: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['Very Low', 'Low', 'Medium', 'High']]
      }
    },
    // Time preferences
    preferredTimeOfDay: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['morning', 'afternoon', 'evening', 'night', 'flexible']]
      }
    },
    // Special preferences
    instagrammable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    trending: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    exclusive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Liked items arrays
    likedDiscoveries: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: []
    },
    likedRecommendations: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: []
    }
  }, {
    tableName: 'user_preferences',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId']
      }
    ]
  });

  return UserPreferences;
};
