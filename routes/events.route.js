const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');

// Create new event
router.post('/', eventsController.createEvent);

// Get ALL events for a user (from x-user-id header)
router.get('/', eventsController.listUserEvents);

// Get ONE event by eventId (still requires x-user-id in header)
router.get('/:id', eventsController.getEvent);

// Update an event
router.put('/:id', eventsController.updateEvent);

// Delete an event
router.delete('/:id', eventsController.deleteEvent);

module.exports = router;
