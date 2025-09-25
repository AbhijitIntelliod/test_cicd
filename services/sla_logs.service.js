const { SlaLog, Ticket } = require('../config/db.config');

exports.create = async (userId, ticketId, event) => {
  const ticket = await Ticket.findOne({ where: { id: ticketId, user_id: userId } });
  if (!ticket) return null;
  return SlaLog.create({ ticket_id: ticketId, event });
};

exports.listForTicket = async (userId, ticketId, { limit = 50, offset = 0 } = {}) => {
  const ticket = await Ticket.findOne({ where: { id: ticketId, user_id: userId } });
  if (!ticket) return null;
  return SlaLog.findAndCountAll({ where: { ticket_id: ticketId }, order: [['timestamp', 'ASC']], limit, offset });
};



