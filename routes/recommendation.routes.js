const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');

// Define routes and map them to controller functions
router.get('/', recommendationController.getAllRecommendations); //Get all recommendations
router.get('/:id', recommendationController.getRecommendationById); //Get a single recommendation
router.post('/', recommendationController.createRecommendation); //Create a new recommendation
router.put('/:id', recommendationController.updateRecommendation); //Update a recommendation
router.delete('/:id', recommendationController.deleteRecommendation); //Delete a recommendation

// Collaborative filtering routes
router.get('/collaborative/similar-users', recommendationController.getSimilarUsers); //Get users with similar preferences
router.get('/collaborative/recommendations', recommendationController.getCollaborativeRecommendations); //Get recommendations based on similar users
router.get('/discovery-based/recommendations', recommendationController.getDiscoveryBasedRecommendations); //Get recommendations based on discovery preferences

module.exports = router;
