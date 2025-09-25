const { body, param, query } = require('express-validator');
const validate = require('../validation');

const SLA_EVENTS = ['created', 'first_response', 'status_change', 'escalation', 'resolution'];

const ticketIdParam = validate([
	param('ticketId').isUUID().withMessage('ticketId must be a valid UUID'),
]);

const createForTicket = validate([
	param('ticketId').isUUID().withMessage('ticketId must be a valid UUID'),
	body('event')
		.exists({ checkFalsy: true })
		.withMessage('event is required')
		.isIn(SLA_EVENTS)
		.withMessage(`event must be one of: ${SLA_EVENTS.join(', ')}`),
]);

const listForTicket = validate([
	param('ticketId').isUUID().withMessage('ticketId must be a valid UUID'),
	query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
	query('offset').optional().isInt({ min: 0 }).toInt(),
]);

module.exports = {
	createForTicket,
	listForTicket,
	ticketIdParam,
};


