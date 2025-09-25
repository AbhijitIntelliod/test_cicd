const express = require('express');
const { sequelize } = require('../config/db.config');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false }); // avoid altering schema on health check
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      database: 'Disconnected',
      error: error.message,
    });
  }
});

module.exports = router;