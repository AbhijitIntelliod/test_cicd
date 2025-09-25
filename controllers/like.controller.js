/**
 * Likes Controller
 * - Uses like.service which persists likes inside UserPreferences
 * - Exposes endpoints under /api/v1/likes
 */
const likeService = require('../services/like.service');

// Helper to get userId from request (you may need to adjust this based on your auth middleware)
function getUserId(req) {
  // Try different sources for user ID
  const userId = req.user?.id || 
                 req.userId || 
                 req.headers['x-user-id'] || 
                 req.body.userId;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  return userId;
}

// Like a discovery or recommendation
exports.createLike = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { discoveryId, recommendationId } = req.body;

    let result;
    if (discoveryId) {
      result = await likeService.likeDiscovery(userId, discoveryId);
    } else if (recommendationId) {
      result = await likeService.likeRecommendation(userId, recommendationId);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Either discoveryId or recommendationId is required' 
      });
    }
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Error creating like:', error);
    
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Unlike (remove like)
exports.removeLike = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { discoveryId, recommendationId } = req.params;

    let result;
    if (discoveryId) {
      result = await likeService.unlikeDiscovery(userId, discoveryId);
    } else if (recommendationId) {
      result = await likeService.unlikeRecommendation(userId, recommendationId);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Either discoveryId or recommendationId is required' 
      });
    }
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error removing like:', error);
    
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get user's likes
exports.getUserLikes = async (req, res) => {
  try {
    const userId = getUserId(req);

    const result = await likeService.getUserLikes(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting user likes:', error);
    
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Check if user has liked a specific item
exports.checkLikeStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { discoveryId, recommendationId } = req.params;

    let hasLiked;
    if (discoveryId) {
      hasLiked = await likeService.hasLikedDiscovery(userId, discoveryId);
    } else if (recommendationId) {
      hasLiked = await likeService.hasLikedRecommendation(userId, recommendationId);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Either discoveryId or recommendationId is required' 
      });
    }
    
    res.json({
      success: true,
      data: {
        hasLiked,
        discoveryId: discoveryId || null,
        recommendationId: recommendationId || null
      }
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get like count for a discovery or recommendation
exports.getLikeCount = async (req, res) => {
  try {
    const { discoveryId, recommendationId } = req.params;

    let count;
    if (discoveryId) {
      count = await likeService.getDiscoveryLikeCount(discoveryId);
    } else if (recommendationId) {
      count = await likeService.getRecommendationLikeCount(recommendationId);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Either discoveryId or recommendationId is required' 
      });
    }
    
    res.json({
      success: true,
      data: count
    });
  } catch (error) {
    console.error('Error getting like count:', error);
    
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get most liked discoveries
exports.getMostLikedDiscoveries = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const discoveries = await likeService.getMostLikedDiscoveries(parseInt(limit));
    
    res.json({
      success: true,
      data: discoveries
    });
  } catch (error) {
    console.error('Error getting most liked discoveries:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get most liked recommendations
exports.getMostLikedRecommendations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recommendations = await likeService.getMostLikedRecommendations(parseInt(limit));
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting most liked recommendations:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

