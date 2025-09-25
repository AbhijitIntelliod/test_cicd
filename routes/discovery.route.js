const express = require('express');
const controller = require('../controllers/discovery.controller');
const router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Recommendation routes based on Discovery posts
router.get('/recommendations/personalized', controller.getPersonalizedRecommendations);
router.get('/recommendations/collaborative', controller.getCollaborativeRecommendations);
router.get('/recommendations/discovery-based', controller.getDiscoveryBasedRecommendations);
router.get('/recommendations/similar-users', controller.getSimilarUsers);

module.exports = router;
