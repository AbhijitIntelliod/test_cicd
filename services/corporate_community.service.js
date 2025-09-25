const { CorporateCommunity } = require('../config/db.config');

exports.getAll = async () => {
  try {
    return await CorporateCommunity.findAll({ order: [['createdAt', 'DESC']] });
  } catch (error) {
    throw new Error(`Failed to fetch corporate communities: ${error.message}`);
  }
};

exports.getById = async (id) => {
  try {
    if (!id || isNaN(id)) {
      throw new Error('Invalid ID provided');
    }
    return await CorporateCommunity.findByPk(id);
  } catch (error) {
    throw new Error(`Failed to fetch corporate community: ${error.message}`);
  }
};

exports.create = async (data) => {
  try {
    if (!data.title || !data.description || !data.image) {
      throw new Error('Title, description, and image are required');
    }
    return await CorporateCommunity.create(data);
  } catch (error) {
    throw new Error(`Failed to create corporate community: ${error.message}`);
  }
};

exports.update = async (id, data) => {
  try {
    if (!id || isNaN(id)) {
      throw new Error('Invalid ID provided');
    }
    const community = await CorporateCommunity.findByPk(id);
    if (!community) return null;
    return await community.update(data);
  } catch (error) {
    throw new Error(`Failed to update corporate community: ${error.message}`);
  }
};

exports.remove = async (id) => {
  try {
    if (!id || isNaN(id)) {
      throw new Error('Invalid ID provided');
    }
    const community = await CorporateCommunity.findByPk(id);
    if (!community) return null;
    await community.destroy();
    return community;
  } catch (error) {
    throw new Error(`Failed to delete corporate community: ${error.message}`);
  }
};
