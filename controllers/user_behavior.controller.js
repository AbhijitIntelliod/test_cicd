/**
 * User Behavior Controller
 * - Tracks user interactions to automatically learn preferences
 * - Updates user preferences based on behavior patterns
 */
const userBehaviorService = require('../services/user_behavior.service');

// Helper to get userId from request
function getUserId(req) {
  const userId = req.user?.id || 
                 req.userId || 
                 req.headers['x-user-id'] || 
                 req.body.userId;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  return userId;
}

// Track user view behavior
exports.trackView = async (req, res) => {
  try {
    const userId = getUserId(req);
    const behaviorData = req.body;
    
    const updatedPreferences = await userBehaviorService.trackView(userId, behaviorData);
    
    res.json({
      success: true,
      message: 'View behavior tracked and preferences updated',
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Error tracking view behavior:', error);
    
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

// Track user like behavior
exports.trackLike = async (req, res) => {
  try {
    const userId = getUserId(req);
    const likeData = req.body;
    
    const updatedPreferences = await userBehaviorService.trackLike(userId, likeData);
    
    res.json({
      success: true,
      message: 'Like behavior tracked and preferences updated',
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Error tracking like behavior:', error);
    
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

// Track user search behavior
exports.trackSearch = async (req, res) => {
  try {
    const userId = getUserId(req);
    const searchData = req.body;
    
    const updatedPreferences = await userBehaviorService.trackSearch(userId, searchData);
    
    res.json({
      success: true,
      message: 'Search behavior tracked and preferences updated',
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Error tracking search behavior:', error);
    
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

// Get user preferences (automatically learned)
exports.getUserPreferences = async (req, res) => {
  try {
    const userId = getUserId(req);
    const preferences = await userBehaviorService.getUserPreferences(userId);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    
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
