const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sla_logs.controller');
const { authenticate, requirePermission } = require('../middlewares/auth.middleware');
const requestLogger = require('../middlewares/requestLogger');
const slaValidators = require('../middlewares/validators/sla_logs.validator');

// All routes require authentication
router.use(authenticate);

// SLA logs routes - require reports permission to access SLA data
router.get('/ticket/:ticketId', 
  requirePermission('reports', 'read'),
  slaValidators.listForTicket, 
  ctrl.listForTicket
);

router.post('/ticket/:ticketId', 
  requirePermission('reports', 'read'),
  slaValidators.createForTicket, 
  ctrl.createForTicket
);

module.exports = router;
