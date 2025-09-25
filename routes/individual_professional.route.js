const express = require('express');
const router = express.Router();
const individualProfessionalService = require('../services/individual_professional.service');
const { authenticate, requirePermission } = require('../middlewares/auth.middleware');

// Apply auth middleware to all routes that need authentication
router.use(authenticate);

// Get all individual professionals
router.get('/', async (req, res) => {
  try {
    const professionals = await individualProfessionalService.getAll();
    res.json(professionals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get individual professional by ID
router.get('/:id', async (req, res) => {
  try {
    const professional = await individualProfessionalService.getById(req.params.id);
    if (!professional) {
      return res.status(404).json({ error: 'Individual professional not found' });
    }
    res.json(professional);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new individual professional
router.post('/', requirePermission('users', 'create'), async (req, res) => {
  try {
    const professional = await individualProfessionalService.create(req.body);
    res.status(201).json(professional);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update individual professional
router.put('/:id?', requirePermission('users', 'update'), async (req, res) => {
  try {
    const id = req.params.id ?? req.body.id;
    const professional = await individualProfessionalService.update(id, req.body);
    if (!professional) {
      return res.status(404).json({ error: 'Individual professional not found' });
    }
    res.json(professional);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete individual professional
router.delete('/:id?', requirePermission('users', 'delete'), async (req, res) => {
  try {
    const id = req.params.id ?? req.body.id;
    const professional = await individualProfessionalService.remove(id);
    if (!professional) {
      return res.status(404).json({ error: 'Individual professional not found' });
    }
    res.json({ message: 'Individual professional deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
