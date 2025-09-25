const { Ticket, SlaLog } = require('../config/db.config');
const { Op } = require('sequelize');

exports.create = async (userId, data) => {
  const ticket = await Ticket.create({ ...data, user_id: userId });
  await SlaLog.create({ ticket_id: ticket.id, event: 'created' });
  return ticket;
};

exports.getById = (userId, id) => {
  return Ticket.findOne({ where: { id, user_id: userId } });
};

exports.update = async (userId, id, data) => {
  const ticket = await Ticket.findOne({ where: { id, user_id: userId } });
  if (!ticket) return null;
  const prevStatus = ticket.status;
  const updated = await ticket.update(data);
  if (data.status && data.status !== prevStatus) {
    await SlaLog.create({ ticket_id: ticket.id, event: 'status_change' });
  }
  return updated;
};

exports.remove = async (userId, id) => {
  const ticket = await Ticket.findOne({ where: { id, user_id: userId } });
  if (!ticket) return null;
  await ticket.destroy();
  return ticket;
};

exports.listForUser = (userId, { status, priority, from, to, limit = 50, offset = 0 } = {}) => {
  const where = { user_id: userId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
  }
  return Ticket.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
};



