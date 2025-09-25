const { IndividualProfessional } = require('../config/db.config');

exports.getAll = async () => {
  try {
    return await IndividualProfessional.findAll({ order: [['createdAt', 'DESC']] });
  } catch (error) {
    throw new Error(`Failed to fetch individual professionals: ${error.message}`);
  }
};

exports.getById = async (id) => {
  try {
    if (!id || isNaN(id)) {
      throw new Error('Invalid ID provided');
    }
    return await IndividualProfessional.findByPk(id);
  } catch (error) {
    throw new Error(`Failed to fetch individual professional: ${error.message}`);
  }
};

exports.create = async (data) => {
  try {
    if (!data.title || !data.description || !data.image) {
      throw new Error('Title, description, and image are required');
    }
    return await IndividualProfessional.create(data);
  } catch (error) {
    throw new Error(`Failed to create individual professional: ${error.message}`);
  }
};

exports.update = async (id, data) => {
  try {
    if (!id || isNaN(id)) {
      throw new Error('Invalid ID provided');
    }
    const professional = await IndividualProfessional.findByPk(id);
    if (!professional) return null;
    return await professional.update(data);
  } catch (error) {
    throw new Error(`Failed to update individual professional: ${error.message}`);
  }
};

exports.remove = async (id) => {
  try {
    if (!id || isNaN(id)) {
      throw new Error('Invalid ID provided');
    }
    const professional = await IndividualProfessional.findByPk(id);
    if (!professional) return null;
    await professional.destroy();
    return professional;
  } catch (error) {
    throw new Error(`Failed to delete individual professional: ${error.message}`);
  }
};
