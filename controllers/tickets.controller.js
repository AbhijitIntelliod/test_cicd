const ticketsService = require('../services/tickets.service');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

function getUserId(req) {
  return req.user?.id ?? Number(req.headers['x-user-id']);
}

exports.createTicket = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    logger.warn('Create ticket failed: User not identified');
    throw new ApiError(401, 'User not identified');
  }
  const { subject } = req.body || {};
  if (!subject || (typeof subject === 'string' && subject.trim().length === 0)) {
    logger.warn('Create ticket failed: Missing required field "subject"');
    throw new ApiError(400, 'Validation error', { subject: 'subject is required' });
  }
  logger.info(`Creating ticket for user ID: ${userId}`);
  const created = await ticketsService.create(userId, req.body);
  logger.info(`Ticket created successfully with ID: ${created.id}`);
  return ApiResponse.created(res, created);
});

exports.listUserTickets = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    logger.warn('List tickets failed: User not identified');
    throw new ApiError(401, 'User not identified');
  }
  const { status, priority, from, to, limit, offset } = req.query;
  logger.info(`Listing tickets for user ID: ${userId} with filters:`, { status, priority, from, to, limit, offset });
  const result = await ticketsService.listForUser(userId, {
    status, priority, from, to, limit: Number(limit) || 50, offset: Number(offset) || 0
  });
  logger.info(`Retrieved ${result.tickets?.length || 0} tickets for user ID: ${userId}`);
  return ApiResponse.success(res, result);
});

exports.getTicket = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    logger.warn('Get ticket failed: User not identified');
    throw new ApiError(401, 'User not identified');
  }
  logger.info(`Getting ticket ID: ${req.params.id} for user ID: ${userId}`);
  const ticket = await ticketsService.getById(userId, req.params.id);
  if (!ticket) {
    logger.warn(`Ticket not found: ID ${req.params.id} for user ID: ${userId}`);
    throw new ApiError(404, 'Ticket not found');
  }
  logger.info(`Ticket retrieved successfully: ID ${req.params.id}`);
  return ApiResponse.success(res, ticket);
});

exports.updateTicket = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    logger.warn('Update ticket failed: User not identified');
    throw new ApiError(401, 'User not identified');
  }
  logger.info(`Updating ticket ID: ${req.params.id} for user ID: ${userId}`);
  const updated = await ticketsService.update(userId, req.params.id, req.body);
  if (!updated) {
    logger.warn(`Ticket not found for update: ID ${req.params.id} for user ID: ${userId}`);
    throw new ApiError(404, 'Ticket not found');
  }
  logger.info(`Ticket updated successfully: ID ${req.params.id}`);
  return ApiResponse.success(res, updated);
});

exports.deleteTicket = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    logger.warn('Delete ticket failed: User not identified');
    throw new ApiError(401, 'User not identified');
  }
  logger.info(`Deleting ticket ID: ${req.params.id} for user ID: ${userId}`);
  const removed = await ticketsService.remove(userId, req.params.id);
  if (!removed) {
    logger.warn(`Ticket not found for deletion: ID ${req.params.id} for user ID: ${userId}`);
    throw new ApiError(404, 'Ticket not found');
  }
  logger.info(`Ticket deleted successfully: ID ${req.params.id}`);
  return ApiResponse.message(res, 'Ticket deleted');
});



