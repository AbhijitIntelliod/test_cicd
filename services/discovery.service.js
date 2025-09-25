const { Discovery } = require('../config/db.config');

exports.getAll = () => Discovery.findAll({ order: [['createdAt', 'DESC']] });
exports.getById = (id) => Discovery.findByPk(id);
exports.create = (data) => Discovery.create(data);
exports.update = async (id, data) => {
  const discovery = await Discovery.findByPk(id);
  if (!discovery) return null;
  return discovery.update(data);
};
exports.remove = async (id) => {
  const discovery = await Discovery.findByPk(id);
  if (!discovery) return null;
  await discovery.destroy();
  return discovery;
};
