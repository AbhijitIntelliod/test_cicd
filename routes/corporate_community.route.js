const express = require('express');
const router = express.Router();
const corporateCommunityService = require('../services/corporate_community.service');
const { authenticate, requirePermission } = require('../middlewares/auth.middleware');

// Apply auth middleware to all routes that need authentication
router.use(authenticate);

// Get all corporate communities
router.get('/', async (req, res) => {
  try {
    const communities = await corporateCommunityService.getAll();
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get corporate community by ID
router.get('/:id', async (req, res) => {
  try {
    const community = await corporateCommunityService.getById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Corporate community not found' });
    }
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new corporate community
router.post('/', requirePermission('users', 'create'), async (req, res) => {
  try {
    const community = await corporateCommunityService.create(req.body);
    res.status(201).json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update corporate community
router.put('/:id', requirePermission('users', 'update'), async (req, res) => {
  try {
    const community = await corporateCommunityService.update(req.params.id, req.body);
    if (!community) {
      return res.status(400).json({ error: 'invalid deets' });
    }
    res.json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete corporate community
router.delete('/:id', requirePermission('users', 'delete'), async (req, res) => {
  try {
    const community = await corporateCommunityService.remove(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Corporate community not found' });
    }
    res.json({ message: 'Corporate community deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
