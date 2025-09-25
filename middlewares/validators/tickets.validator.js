const { body, param, query } = require('express-validator');
const validate = require('../validation');

const STATUS_ENUM = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
const PRIORITY_ENUM = ['low', 'medium', 'high', 'urgent'];

// Common
const ticketIdParam = validate([
	param('id').isUUID().withMessage('id must be a valid UUID'),
]);

const ticketRouteIdParam = validate([
	param('ticketId').isUUID().withMessage('ticketId must be a valid UUID'),
]);

// Create
const createTicket = validate([
	body('subject')
		.exists({ checkFalsy: true })
		.withMessage('subject is required')
		.isString()
		.bail()
		.isLength({ max: 500 })
		.withMessage('subject must be at most 500 chars'),
	body('description')
		.optional({ nullable: true })
		.isString()
		.withMessage('description must be a string'),
	body('status')
		.optional()
		.isIn(STATUS_ENUM)
		.withMessage(`status must be one of: ${STATUS_ENUM.join(', ')}`),
	body('priority')
		.optional()
		.isIn(PRIORITY_ENUM)
		.withMessage(`priority must be one of: ${PRIORITY_ENUM.join(', ')}`),
	body('sla_deadline')
		.optional({ nullable: true })
		.isISO8601()
		.withMessage('sla_deadline must be a valid ISO date')
		.toDate(),
]);

// Update
const updateTicket = validate([
	param('id').isUUID().withMessage('id must be a valid UUID'),
	body('subject')
		.optional({ nullable: true })
		.isString()
		.isLength({ max: 500 })
		.withMessage('subject must be at most 500 chars'),
	body('description')
		.optional({ nullable: true })
		.isString(),
	body('status')
		.optional()
		.isIn(STATUS_ENUM)
		.withMessage(`status must be one of: ${STATUS_ENUM.join(', ')}`),
	body('priority')
		.optional()
		.isIn(PRIORITY_ENUM)
		.withMessage(`priority must be one of: ${PRIORITY_ENUM.join(', ')}`),
	body('sla_deadline')
		.optional({ nullable: true })
		.isISO8601()
		.withMessage('sla_deadline must be a valid ISO date')
		.toDate(),
]);

// List
const listTickets = validate([
	query('status')
		.optional()
		.isIn(STATUS_ENUM)
		.withMessage(`status must be one of: ${STATUS_ENUM.join(', ')}`),
	query('priority')
		.optional()
		.isIn(PRIORITY_ENUM)
		.withMessage(`priority must be one of: ${PRIORITY_ENUM.join(', ')}`),
	query('from').optional().isISO8601().withMessage('from must be a valid ISO date'),
	query('to').optional().isISO8601().withMessage('to must be a valid ISO date'),
	query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
	query('offset').optional().isInt({ min: 0 }).toInt(),
]);

module.exports = {
	createTicket,
	updateTicket,
	listTickets,
	ticketIdParam,
	ticketRouteIdParam,
};


