const express = require('express');
const router = express.Router();
const userBehaviorController = require('../controllers/user_behavior.controller');

// Track user view behavior
router.post('/track-view', userBehaviorController.trackView);

// Track user like behavior
router.post('/track-like', userBehaviorController.trackLike);

// Track user search behavior
router.post('/track-search', userBehaviorController.trackSearch);

// Get user preferences (automatically learned)
router.get('/preferences', userBehaviorController.getUserPreferences);

module.exports = router;
