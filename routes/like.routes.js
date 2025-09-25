const express = require('express');
const router = express.Router();
const likeController = require('../controllers/like.controller');

// Like a discovery or recommendation
router.post('/', likeController.createLike);

// Unlike a discovery or recommendation
router.delete('/discovery/:discoveryId', likeController.removeLike);
router.delete('/recommendation/:recommendationId', likeController.removeLike);

// Get user's likes
router.get('/my-likes', likeController.getUserLikes);

// Check if user has liked a specific item
router.get('/status/discovery/:discoveryId', likeController.checkLikeStatus);
router.get('/status/recommendation/:recommendationId', likeController.checkLikeStatus);

// Get like count for a discovery or recommendation
router.get('/count/discovery/:discoveryId', likeController.getLikeCount);
router.get('/count/recommendation/:recommendationId', likeController.getLikeCount);

// Get most liked items
router.get('/most-liked/discoveries', likeController.getMostLikedDiscoveries);
router.get('/most-liked/recommendations', likeController.getMostLikedRecommendations);


module.exports = router;
