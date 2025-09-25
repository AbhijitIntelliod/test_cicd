/**
 * Likes Service
 * - Depends on UserPreferences model to store like state
 * - Does not use a separate Like table; likes are arrays on UserPreferences
 */
const { UserPreferences, Recommendation, CorporateCommunity } = require('../config/db.config');

// Like a discovery
exports.likeDiscovery = async (userId, discoveryId) => {
  try {
    const userIdNumber = Number(userId);
    const discoveryIdNumber = Number(discoveryId);
    let preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) {
      preferences = await UserPreferences.create({ 
        userId: userIdNumber,
        preferredLocations: [],
        preferredCategories: [],
        instagrammable: false,
        trending: false,
        exclusive: false,
        likedDiscoveries: [],
        likedRecommendations: []
      });
    }
    
    const currentLikedDiscoveries = Array.isArray(preferences.likedDiscoveries) ? preferences.likedDiscoveries : [];
    const likedDiscoveries = Array.from(new Set([...currentLikedDiscoveries, discoveryIdNumber]));
    
    await preferences.update({ likedDiscoveries }, { validate: false });
    await preferences.reload();
    
    return { success: true, message: 'Discovery liked successfully' };
  } catch (error) {
    throw new Error(`Error liking discovery: ${error.message}`);
  }
};

// Like a recommendation
exports.likeRecommendation = async (userId, recommendationId) => {
  try {
    const userIdNumber = Number(userId);
    const recommendationIdNumber = Number(recommendationId);
    let preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) {
      preferences = await UserPreferences.create({ 
        userId: userIdNumber,
        preferredLocations: [],
        preferredCategories: [],
        instagrammable: false,
        trending: false,
        exclusive: false,
        likedDiscoveries: [],
        likedRecommendations: []
      });
    }
    
    const currentLikedRecommendations = Array.isArray(preferences.likedRecommendations) ? preferences.likedRecommendations : [];
    const likedRecommendations = Array.from(new Set([...currentLikedRecommendations, recommendationIdNumber]));
    await preferences.update({ likedRecommendations }, { validate: false });
    await preferences.reload();
    
    return { success: true, message: 'Recommendation liked successfully' };
  } catch (error) {
    throw new Error(`Error liking recommendation: ${error.message}`);
  }
};

// Unlike a discovery
exports.unlikeDiscovery = async (userId, discoveryId) => {
  try {
    const userIdNumber = Number(userId);
    const discoveryIdNumber = Number(discoveryId);
    const preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) return { success: false, message: 'User preferences not found' };
    
    const likedDiscoveriesArray = Array.isArray(preferences.likedDiscoveries) ? preferences.likedDiscoveries : [];
    const updatedLikedDiscoveries = likedDiscoveriesArray.filter(id => Number(id) !== discoveryIdNumber);
    
    await preferences.update({ likedDiscoveries: updatedLikedDiscoveries }, { validate: false });
    await preferences.reload();
    
    return { success: true, message: 'Discovery unliked successfully' };
  } catch (error) {
    throw new Error(`Error unliking discovery: ${error.message}`);
  }
};

// Unlike a recommendation
exports.unlikeRecommendation = async (userId, recommendationId) => {
  try {
    const userIdNumber = Number(userId);
    const recommendationIdNumber = Number(recommendationId);
    const preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) return { success: false, message: 'User preferences not found' };
    
    const likedRecommendationsArray = Array.isArray(preferences.likedRecommendations) ? preferences.likedRecommendations : [];
    const updatedLikedRecommendations = likedRecommendationsArray.filter(id => Number(id) !== recommendationIdNumber);
    
    await preferences.update({ likedRecommendations: updatedLikedRecommendations }, { validate: false });
    await preferences.reload();
    
    return { success: true, message: 'Recommendation unliked successfully' };
  } catch (error) {
    throw new Error(`Error unliking recommendation: ${error.message}`);
  }
};

// Get user's liked items
exports.getUserLikes = async (userId) => {
  try {
    const userIdNumber = Number(userId);
    const preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) {
      return { likedDiscoveries: [], likedRecommendations: [] };
    }
    
    return {
      likedDiscoveries: preferences.likedDiscoveries || [],
      likedRecommendations: preferences.likedRecommendations || []
    };
  } catch (error) {
    throw new Error(`Error fetching user likes: ${error.message}`);
  }
};

// Check if user has liked a discovery
exports.hasLikedDiscovery = async (userId, discoveryId) => {
  try {
    const userIdNumber = Number(userId);
    const preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) return false;
    
    const discoveryIdNumber = Number(discoveryId);
    const likedDiscoveriesArray = Array.isArray(preferences.likedDiscoveries) ? preferences.likedDiscoveries : [];
    return likedDiscoveriesArray.some(id => Number(id) === discoveryIdNumber);
  } catch (error) {
    throw new Error(`Error checking discovery like status: ${error.message}`);
  }
};

// Check if user has liked a recommendation
exports.hasLikedRecommendation = async (userId, recommendationId) => {
  try {
    const userIdNumber = Number(userId);
    const preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) return false;
    
    const recommendationIdNumber = Number(recommendationId);
    const likedRecommendationsArray = Array.isArray(preferences.likedRecommendations) ? preferences.likedRecommendations : [];
    return likedRecommendationsArray.some(id => Number(id) === recommendationIdNumber);
  } catch (error) {
    throw new Error(`Error checking recommendation like status: ${error.message}`);
  }
};

// Get like count for a discovery
exports.getDiscoveryLikeCount = async (discoveryId) => {
  try {
    const preferences = await UserPreferences.findAll();
    let count = 0;
    const discoveryIdNumber = Number(discoveryId);
    
    preferences.forEach(pref => {
      const likedDiscoveriesArray = Array.isArray(pref.likedDiscoveries) ? pref.likedDiscoveries : [];
      if (likedDiscoveriesArray.some(id => Number(id) === discoveryIdNumber)) count++;
    });
    
    return count;
  } catch (error) {
    throw new Error(`Error getting discovery like count: ${error.message}`);
  }
};

// Get like count for a recommendation
exports.getRecommendationLikeCount = async (recommendationId) => {
  try {
    const preferences = await UserPreferences.findAll();
    let count = 0;
    const recommendationIdNumber = Number(recommendationId);
    
    preferences.forEach(pref => {
      const likedRecommendationsArray = Array.isArray(pref.likedRecommendations) ? pref.likedRecommendations : [];
      if (likedRecommendationsArray.some(id => Number(id) === recommendationIdNumber)) count++;
    });
    
    return count;
  } catch (error) {
    throw new Error(`Error getting recommendation like count: ${error.message}`);
  }
};

// Get most liked discoveries
exports.getMostLikedDiscoveries = async (limit = 10) => {
  try {
    const preferences = await UserPreferences.findAll();
    const discoveryCounts = {};
    
    preferences.forEach(pref => {
      if (pref.likedDiscoveries) {
        pref.likedDiscoveries.forEach(discoveryId => {
          discoveryCounts[discoveryId] = (discoveryCounts[discoveryId] || 0) + 1;
        });
      }
    });
    
    const sortedDiscoveries = Object.entries(discoveryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([id, count]) => ({ discoveryId: parseInt(id), likeCount: count }));
    
    return sortedDiscoveries;
  } catch (error) {
    throw new Error(`Error getting most liked discoveries: ${error.message}`);
  }
};

// Get most liked recommendations
exports.getMostLikedRecommendations = async (limit = 10) => {
  try {
    const preferences = await UserPreferences.findAll();
    const recommendationCounts = {};
    
    preferences.forEach(pref => {
      if (pref.likedRecommendations) {
        pref.likedRecommendations.forEach(recommendationId => {
          recommendationCounts[recommendationId] = (recommendationCounts[recommendationId] || 0) + 1;
        });
      }
    });
    
    const sortedRecommendations = Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([id, count]) => ({ recommendationId: parseInt(id), likeCount: count }));
    
    return sortedRecommendations;
  } catch (error) {
    throw new Error(`Error getting most liked recommendations: ${error.message}`);
  }
};