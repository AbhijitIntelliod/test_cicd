const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tickets.controller');
const slaCtrl = require('../controllers/sla_logs.controller');
const { authenticate, requirePermission, requireOwnership } = require('../middlewares/auth.middleware');

const ticketValidators = require('../middlewares/validators/tickets.validator');
const slaValidators = require('../middlewares/validators/sla_logs.validator');

// All routes require authentication
router.use(authenticate);

// Ticket routes - users can manage their own tickets, admins can manage all
router.post('/', ticketValidators.createTicket, ctrl.createTicket);
router.get('/', ticketValidators.listTickets, ctrl.listUserTickets);
router.get('/:id', ticketValidators.ticketIdParam, ctrl.getTicket);
router.put('/:id', ticketValidators.updateTicket, requireOwnership, ctrl.updateTicket);
router.delete('/:id', requirePermission('users', 'delete'), ctrl.deleteTicket); // Only admins can delete tickets

// Nested SLA logs routes - require permission to read/create SLA logs
router.get('/:ticketId/sla-logs', 
  requirePermission('reports', 'read'), 
  slaValidators.listForTicket, 
  slaCtrl.listForTicket
);
router.post('/:ticketId/sla-logs', 
  requirePermission('reports', 'read'), 
  slaValidators.createForTicket, 
  slaCtrl.createForTicket
);

module.exports = router;
