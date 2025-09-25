const { Recommendation, Like, Discovery } = require('../config/db.config');

// Fetch all recommendations
exports.getAllRecommendations = () => {
  return Recommendation.findAll({ order: [['createdAt', 'DESC']] });
};

// Fetch recommendation by ID
exports.getRecommendationById = (id) => {
  return Recommendation.findByPk(id);
};

// Create new recommendation
exports.createRecommendation = async (data) => {
  const requiredFields = [
    'title',
    'description',
    'rating',
    'price',
    'location',
    'duration',
    'image'
  ];
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }

  const tags = Array.isArray(data.tags) ? data.tags : [];

  return Recommendation.create({ ...data, tags });
};

// Update recommendation
exports.updateRecommendation = async (id, data) => {
  const recommendation = await Recommendation.findByPk(id);
  if (!recommendation) return null;

  const tags = Array.isArray(data.tags) ? data.tags : [];
  return recommendation.update({ ...data, tags });
};

// Delete recommendation
exports.deleteRecommendation = async (id) => {
  const recommendation = await Recommendation.findByPk(id);
  if (!recommendation) return false;

  await recommendation.destroy();
  return true;
};

// Collaborative Filtering: Find users with similar preferences
exports.findSimilarUsers = async (userId, limit = 10) => {
  try {
    // Get all likes by the current user
    const userLikes = await Like.findAll({
      where: { userId },
      attributes: ['discoveryId', 'recommendationId']
    });

    if (userLikes.length === 0) {
      return [];
    }

    // Extract liked discovery and recommendation IDs
    const likedDiscoveryIds = userLikes
      .filter(like => like.discoveryId)
      .map(like => like.discoveryId);
    
    const likedRecommendationIds = userLikes
      .filter(like => like.recommendationId)
      .map(like => like.recommendationId);

    // Find users who liked the same discoveries or recommendations
    const similarUsers = await Like.findAll({
      where: {
        userId: { [require('sequelize').Op.ne]: userId }, // Exclude current user
        [require('sequelize').Op.or]: [
          { discoveryId: { [require('sequelize').Op.in]: likedDiscoveryIds } },
          { recommendationId: { [require('sequelize').Op.in]: likedRecommendationIds } }
        ]
      },
      attributes: ['userId'],
      group: ['userId'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('userId')), 'DESC']],
      limit: limit
    });

    return similarUsers.map(user => user.userId);
  } catch (error) {
    console.error('Error finding similar users:', error);
    throw new Error('Failed to find similar users');
  }
};

// Get recommendations based on similar users' preferences (Discovery-based)
exports.getCollaborativeRecommendations = async (userId, limit = 10) => {
  try {
    // Find users with similar preferences
    const similarUserIds = await exports.findSimilarUsers(userId, 20);
    
    if (similarUserIds.length === 0) {
      // If no similar users found, return trending discoveries
      return await Discovery.findAll({
        where: { trending: true },
        order: [['rating', 'DESC']],
        limit: limit
      });
    }

    // Get likes from similar users for discoveries
    const similarUserLikes = await Like.findAll({
      where: {
        userId: { [require('sequelize').Op.in]: similarUserIds },
        discoveryId: { [require('sequelize').Op.ne]: null }
      },
      attributes: ['discoveryId'],
      group: ['discoveryId'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('discoveryId')), 'DESC']],
      limit: limit * 2 // Get more to filter out already liked ones
    });

    // Get user's already liked discoveries to exclude them
    const userLikedDiscoveries = await Like.findAll({
      where: { userId, discoveryId: { [require('sequelize').Op.ne]: null } },
      attributes: ['discoveryId']
    });

    const userLikedDiscoveryIds = userLikedDiscoveries.map(like => like.discoveryId);
    const recommendedDiscoveryIds = similarUserLikes
      .map(like => like.discoveryId)
      .filter(id => !userLikedDiscoveryIds.includes(id))
      .slice(0, limit);

    // Get the actual discovery details
    const recommendations = await Discovery.findAll({
      where: { id: { [require('sequelize').Op.in]: recommendedDiscoveryIds } },
      order: [['rating', 'DESC']]
    });

    return recommendations;
  } catch (error) {
    console.error('Error getting collaborative recommendations:', error);
    throw new Error('Failed to get collaborative recommendations');
  }
};

// Get recommendations based on discovery preferences (Discovery-based)
exports.getDiscoveryBasedRecommendations = async (userId, limit = 10) => {
  try {
    // Get user's liked discoveries
    const userLikes = await Like.findAll({
      where: { userId, discoveryId: { [require('sequelize').Op.ne]: null } },
      include: [{
        model: Discovery,
        as: 'discovery',
        attributes: ['tags', 'category', 'location', 'price']
      }]
    });

    if (userLikes.length === 0) {
      // If user hasn't liked anything, return trending discoveries
      return await Discovery.findAll({
        where: { trending: true },
        order: [['rating', 'DESC']],
        limit: limit
      });
    }

    // Extract user preferences from liked discoveries
    const userPreferences = {
      tags: [],
      categories: [],
      locations: [],
      priceRanges: []
    };

    userLikes.forEach(like => {
      if (like.discovery) {
        userPreferences.tags.push(...like.discovery.tags);
        userPreferences.categories.push(like.discovery.category);
        userPreferences.locations.push(like.discovery.location);
        userPreferences.priceRanges.push(like.discovery.price);
      }
    });

    // Remove duplicates
    userPreferences.tags = [...new Set(userPreferences.tags)];
    userPreferences.categories = [...new Set(userPreferences.categories)];
    userPreferences.locations = [...new Set(userPreferences.locations)];
    userPreferences.priceRanges = [...new Set(userPreferences.priceRanges)];

    // Get user's already liked discovery IDs to exclude them
    const userLikedDiscoveryIds = userLikes.map(like => like.discoveryId);

    // Find discoveries that match user preferences
    const recommendations = await Discovery.findAll({
      where: {
        id: { [require('sequelize').Op.notIn]: userLikedDiscoveryIds }, // Exclude already liked
        [require('sequelize').Op.or]: [
          { tags: { [require('sequelize').Op.overlap]: userPreferences.tags } },
          { category: { [require('sequelize').Op.in]: userPreferences.categories } },
          { location: { [require('sequelize').Op.in]: userPreferences.locations } },
          { price: { [require('sequelize').Op.in]: userPreferences.priceRanges } }
        ]
      },
      order: [['rating', 'DESC']],
      limit: limit
    });

    return recommendations;
  } catch (error) {
    console.error('Error getting discovery-based recommendations:', error);
    throw new Error('Failed to get discovery-based recommendations');
  }
};

// Get personalized discovery recommendations based on user preferences
exports.getPersonalizedDiscoveries = async (userId, limit = 10) => {
  try {
    // Get user's liked discoveries to understand preferences
    const userLikes = await Like.findAll({
      where: { userId, discoveryId: { [require('sequelize').Op.ne]: null } },
      include: [{
        model: Discovery,
        as: 'discovery',
        attributes: ['tags', 'category', 'location', 'price', 'rating']
      }]
    });

    if (userLikes.length === 0) {
      // If user hasn't liked anything, return trending discoveries
      return await Discovery.findAll({
        where: { trending: true },
        order: [['rating', 'DESC']],
        limit: limit
      });
    }

    // Calculate user preference scores
    const preferenceScores = {
      tags: {},
      categories: {},
      locations: {},
      priceRanges: {}
    };

    // Weight preferences based on rating and recency
    userLikes.forEach(like => {
      if (like.discovery) {
        const weight = like.discovery.rating / 5; // Normalize rating to 0-1
        
        // Count tag preferences
        like.discovery.tags.forEach(tag => {
          preferenceScores.tags[tag] = (preferenceScores.tags[tag] || 0) + weight;
        });
        
        // Count category preferences
        preferenceScores.categories[like.discovery.category] = 
          (preferenceScores.categories[like.discovery.category] || 0) + weight;
        
        // Count location preferences
        preferenceScores.locations[like.discovery.location] = 
          (preferenceScores.locations[like.discovery.location] || 0) + weight;
        
        // Count price preferences
        preferenceScores.priceRanges[like.discovery.price] = 
          (preferenceScores.priceRanges[like.discovery.price] || 0) + weight;
      }
    });

    // Get top preferences
    const topTags = Object.keys(preferenceScores.tags)
      .sort((a, b) => preferenceScores.tags[b] - preferenceScores.tags[a])
      .slice(0, 5);
    
    const topCategories = Object.keys(preferenceScores.categories)
      .sort((a, b) => preferenceScores.categories[b] - preferenceScores.categories[a])
      .slice(0, 3);
    
    const topLocations = Object.keys(preferenceScores.locations)
      .sort((a, b) => preferenceScores.locations[b] - preferenceScores.locations[a])
      .slice(0, 3);

    // Get user's already liked discovery IDs to exclude them
    const userLikedDiscoveryIds = userLikes.map(like => like.discoveryId);

    // Find discoveries that match user preferences
    const recommendations = await Discovery.findAll({
      where: {
        id: { [require('sequelize').Op.notIn]: userLikedDiscoveryIds },
        [require('sequelize').Op.or]: [
          { tags: { [require('sequelize').Op.overlap]: topTags } },
          { category: { [require('sequelize').Op.in]: topCategories } },
          { location: { [require('sequelize').Op.in]: topLocations } }
        ]
      },
      order: [['rating', 'DESC']],
      limit: limit
    });

    return recommendations;
  } catch (error) {
    console.error('Error getting personalized discoveries:', error);
    throw new Error('Failed to get personalized discoveries');
  }
};
