const discoveryService = require('../services/discovery.service');
const recommendationService = require('../services/recommendation.service');

exports.getAll = async (req, res) => {
  try {
    const discoveries = await discoveryService.getAll();
    res.json(discoveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const discovery = await discoveryService.getById(req.params.id);
    if (!discovery) return res.status(404).json({ error: 'Discovery not found' });
    res.json(discovery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const discovery = await discoveryService.create(req.body);
    res.status(201).json(discovery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const discovery = await discoveryService.update(req.params.id, req.body);
    if (!discovery) return res.status(404).json({ error: 'Discovery not found' });
    res.json(discovery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const discovery = await discoveryService.remove(req.params.id);
    if (!discovery) return res.status(404).json({ error: 'Discovery not found' });
    res.json({ message: 'Discovery deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// Get personalized discovery recommendations based on user preferences
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = getUserId(req);
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationService.getPersonalizedDiscoveries(userId, limit);
    
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      type: 'personalized_discoveries'
    });
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
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