const recommendationService = require('../services/recommendation.service');

// Get all recommendations
exports.getAllRecommendations = async (req, res) => {
  try {
    const recommendations = await recommendationService.getAllRecommendations();
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single recommendation
exports.getRecommendationById = async (req, res) => {
  try {
    const recommendation = await recommendationService.getRecommendationById(req.params.id);
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    res.json(recommendation);
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create new recommendation
exports.createRecommendation = async (req, res) => {
  try {
    const recommendation = await recommendationService.createRecommendation(req.body);
    res.status(201).json(recommendation);
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update recommendation
exports.updateRecommendation = async (req, res) => {
  try {
    const updatedRecommendation = await recommendationService.updateRecommendation(req.params.id, req.body);
    if (!updatedRecommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    res.json(updatedRecommendation);
  } catch (error) {
    console.error('Error updating recommendation:', error);
    res.status(400).json({ error: error.message });
  }
};

// Delete recommendation
exports.deleteRecommendation = async (req, res) => {
  try {
    const success = await recommendationService.deleteRecommendation(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }
    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user ID from request headers
const getUserId = (req) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
};

// Get collaborative recommendations based on similar users
exports.getCollaborativeRecommendations = async (req, res) => {
  try {
    const userId = getUserId(req);
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationService.getCollaborativeRecommendations(userId, limit);
    
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      type: 'collaborative_filtering'
    });
  } catch (error) {
    console.error('Error getting collaborative recommendations:', error);
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get discovery-based recommendations
exports.getDiscoveryBasedRecommendations = async (req, res) => {
  try {
    const userId = getUserId(req);
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationService.getDiscoveryBasedRecommendations(userId, limit);
    
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      type: 'discovery_based'
    });
  } catch (error) {
    console.error('Error getting discovery-based recommendations:', error);
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get similar users for a given user
exports.getSimilarUsers = async (req, res) => {
  try {
    const userId = getUserId(req);
    const limit = parseInt(req.query.limit) || 10;
    
    const similarUsers = await recommendationService.findSimilarUsers(userId, limit);
    
    res.json({
      success: true,
      data: similarUsers,
      count: similarUsers.length
    });
  } catch (error) {
    console.error('Error getting similar users:', error);
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};