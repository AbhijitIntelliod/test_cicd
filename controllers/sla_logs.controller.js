const slaLogsService = require('../services/sla_logs.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

function getUserId(req) {
  return req.user?.id ?? Number(req.headers['x-user-id']);
}

exports.listForTicket = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) throw new ApiError(401, 'User not identified');
  const { limit, offset } = req.query;
  const result = await slaLogsService.listForTicket(userId, req.params.ticketId, {
    limit: Number(limit) || 50, offset: Number(offset) || 0
  });
  if (result === null) throw new ApiError(404, 'Ticket not found');
  return ApiResponse.success(res, result);
});

exports.createForTicket = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) throw new ApiError(401, 'User not identified');
  const { event } = req.body;
  const created = await slaLogsService.create(userId, req.params.ticketId, event);
  if (!created) throw new ApiError(404, 'Ticket not found');
  return ApiResponse.created(res, created);
});


