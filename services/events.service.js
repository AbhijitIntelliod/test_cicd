const { Event } = require('../config/db.config');

exports.create = (userId, data) => {
  return Event.create({ ...data, user_id: userId });
};

exports.getById = (userId, id) => {
  return Event.findOne({ where: { id, user_id: userId } });
};

exports.update = async (userId, id, data) => {
  const ev = await Event.findOne({ where: { id, user_id: userId } });
  if (!ev) return null;
  return ev.update(data);
};

exports.remove = async (userId, id) => {
  const ev = await Event.findOne({ where: { id, user_id: userId } });
  if (!ev) return null;
  await ev.destroy();
  return ev;
};

exports.listForUser = (userId, { limit = 50, offset = 0 } = {}) => {
  return Event.findAndCountAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
};
