const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, requirePermission } = require('../middlewares/auth.middleware');
const { validateGetUserById, validateCreateUser } = require('../middlewares/validators/user.validator');


const router = express.Router();



// GET /api/v1/users/me - Get current user's profile
router.get('/me', 
  authenticate,
  userController.getCurrentUser
);

// GET /api/v1/users/all - Get all users (admin only)
router.get('/all', 
  authenticate,
  requirePermission('users', 'read'),
  userController.getAllUsers
);

// GET /api/v1/users/:id - Get user by ID (admin only)
router.get('/:id',
  authenticate,
  requirePermission('users', 'read'),
  validateGetUserById,
  userController.getUserById
);

// POST /api/v1/users - Create a new user (admin only)
router.post('/',
  authenticate,
  requirePermission('users', 'create'),
  validateCreateUser,
  userController.createUser
);

module.exports = router;


