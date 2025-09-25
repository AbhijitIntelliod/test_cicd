const { User, Role, RolePermission } = require('../config/db.config');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get current user's profile information
 * Uses the authenticated user from req.user (set by auth middleware)
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  // Format user data with role and permissions
  const userData = req.user.toJSON();
  const formattedUser = {
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    phoneNumber: userData.phoneNumber,
    isKycVerified: userData.isKycVerified,
    status: userData.status,
    emailVerifiedAt: userData.emailVerifiedAt,
    lastLoginAt: userData.lastLoginAt,
    roleId: userData.roleId,
    cognitoSub: userData.cognitoSub,
    cognitoUsername: userData.cognitoUsername,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
    role: userData.role ? {
      id: userData.role.id,
      name: userData.role.name,
      type: userData.role.type,
      description: userData.role.description,
      is_active: userData.role.is_active
    } : null,
    permissions: userData.role && userData.role.permissions ? 
      userData.role.permissions.map(permission => ({
        id: permission.id,
        resource: permission.resource,
        action: permission.action
      })) : []
  };

  res.status(200).json(new ApiResponse(200, formattedUser, 'User profile retrieved successfully'));
});

/**
 * Get current user's ID token from stored Cognito tokens
 */
const getCurrentUserTokens = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  // Get user with fresh data from database
  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Parse stored Cognito tokens
  let cognitoTokens = null;
  if (user.cognitoTokens) {
    try {
      cognitoTokens = typeof user.cognitoTokens === 'string' 
        ? JSON.parse(user.cognitoTokens) 
        : user.cognitoTokens;
    } catch (error) {
      console.error('Error parsing stored Cognito tokens:', error);
      cognitoTokens = null;
    }
  }

  if (!cognitoTokens) {
    throw new ApiError(404, 'No Cognito tokens found for user. Please login again.');
  }

  // Return tokens (excluding sensitive data)
  const tokenInfo = {
    hasAccessToken: !!cognitoTokens.accessToken,
    hasIdToken: !!cognitoTokens.idToken,
    hasRefreshToken: !!cognitoTokens.refreshToken,
    tokenType: cognitoTokens.tokenType || 'Bearer',
    expiresIn: cognitoTokens.expiresIn,
    // Include actual tokens for client use
    tokens: {
      accessToken: cognitoTokens.accessToken,
      idToken: cognitoTokens.idToken,
      refreshToken: cognitoTokens.refreshToken,
      tokenType: cognitoTokens.tokenType || 'Bearer',
      expiresIn: cognitoTokens.expiresIn
    }
  };

  res.status(200).json(new ApiResponse(200, tokenInfo, 'User tokens retrieved successfully'));
});

/**
 * Get user by ID (admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    include: [{
      model: Role,
      as: 'role',
      include: [{ model: RolePermission, as: 'permissions' }]
    }]
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Format user data
  const userData = user.toJSON();
  const formattedUser = {
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    phoneNumber: userData.phoneNumber,
    isKycVerified: userData.isKycVerified,
    status: userData.status,
    emailVerifiedAt: userData.emailVerifiedAt,
    lastLoginAt: userData.lastLoginAt,
    roleId: userData.roleId,
    cognitoSub: userData.cognitoSub,
    cognitoUsername: userData.cognitoUsername,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
    role: userData.role ? {
      id: userData.role.id,
      name: userData.role.name,
      type: userData.role.type,
      description: userData.role.description,
      is_active: userData.role.is_active
    } : null,
    permissions: userData.role && userData.role.permissions ? 
      userData.role.permissions.map(permission => ({
        id: permission.id,
        resource: permission.resource,
        action: permission.action
      })) : []
  };

  res.status(200).json(new ApiResponse(200, formattedUser, 'User retrieved successfully'));
});

/**
 * Get all users (admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, role, search } = req.query;
  const offset = (page - 1) * limit;

  // Build where clause
  const whereClause = {};
  if (status) whereClause.status = status;
  if (role) whereClause.roleId = role;

  // Build search clause
  const searchClause = search ? {
    [require('sequelize').Op.or]: [
      { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { fullName: { [require('sequelize').Op.iLike]: `%${search}%` } },
    ]
  } : {};

  const { count, rows: users } = await User.findAndCountAll({
    where: { ...whereClause, ...searchClause },
    include: [{
      model: Role,
      as: 'role',
      include: [{ model: RolePermission, as: 'permissions' }]
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  // Format users data
  const formattedUsers = users.map(user => {
    const userData = user.toJSON();
    return {
      id: userData.id,
      email: userData.email,
      fullName: userData.fullName,
      phoneNumber: userData.phoneNumber,
      isKycVerified: userData.isKycVerified,
      status: userData.status,
      emailVerifiedAt: userData.emailVerifiedAt,
      lastLoginAt: userData.lastLoginAt,
      roleId: userData.roleId,
      cognitoSub: userData.cognitoSub,
      cognitoUsername: userData.cognitoUsername,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      role: userData.role ? {
        id: userData.role.id,
        name: userData.role.name,
        type: userData.role.type,
        description: userData.role.description,
        is_active: userData.role.is_active
      } : null,
      permissions: userData.role && userData.role.permissions ? 
        userData.role.permissions.map(permission => ({
          id: permission.id,
          resource: permission.resource,
          action: permission.action
        })) : []
    };
  });

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(count / limit),
    totalUsers: count,
    usersPerPage: parseInt(limit)
  };

  res.status(200).json(new ApiResponse(200, {
    users: formattedUsers,
    pagination
  }, 'Users retrieved successfully'));
});

/**
 * Update current user's profile
 */
const updateCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'User not authenticated');
  }

  const { fullName, phoneNumber } = req.body;
  const allowedUpdates = {};

  if (fullName !== undefined) allowedUpdates.fullName = fullName;
  if (phoneNumber !== undefined) allowedUpdates.phoneNumber = phoneNumber;

  if (Object.keys(allowedUpdates).length === 0) {
    throw new ApiError(400, 'No valid fields to update');
  }

  await req.user.update(allowedUpdates);

  // Get updated user with role and permissions
  const updatedUser = await User.findByPk(req.user.id, {
    include: [{
      model: Role,
      as: 'role',
      include: [{ model: RolePermission, as: 'permissions' }]
    }]
  });

  // Format user data
  const userData = updatedUser.toJSON();
  const formattedUser = {
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    phoneNumber: userData.phoneNumber,
    isKycVerified: userData.isKycVerified,
    status: userData.status,
    emailVerifiedAt: userData.emailVerifiedAt,
    lastLoginAt: userData.lastLoginAt,
    roleId: userData.roleId,
    cognitoSub: userData.cognitoSub,
    cognitoUsername: userData.cognitoUsername,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
    role: userData.role ? {
      id: userData.role.id,
      name: userData.role.name,
      type: userData.role.type,
      description: userData.role.description,
      is_active: userData.role.is_active
    } : null,
    permissions: userData.role && userData.role.permissions ? 
      userData.role.permissions.map(permission => ({
        id: permission.id,
        resource: permission.resource,
        action: permission.action
      })) : []
  };

  res.status(200).json(new ApiResponse(200, formattedUser, 'User profile updated successfully'));
});

/**
 * Change user role (admin only)
 */
const changeUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  // Validate required fields
  if (!roleId) {
    throw new ApiError(400, 'Role ID is required');
  }

  // Check if user exists
  const user = await User.findByPk(userId, {
    include: [{
      model: Role,
      as: 'role',
      include: [{ model: RolePermission, as: 'permissions' }]
    }]
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if role exists and is active
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }

  if (!role.is_active) {
    throw new ApiError(400, 'Cannot assign inactive role');
  }

  // Prevent users from changing their own role
  if (req.user && req.user.id === parseInt(userId)) {
    throw new ApiError(400, 'You cannot change your own role');
  }

  // Store old role for logging
  const oldRole = user.role ? user.role.name : 'No Role';

  // Update user role
  await user.update({ roleId });

  // Get updated user with new role and permissions
  const updatedUser = await User.findByPk(userId, {
    include: [{
      model: Role,
      as: 'role',
      include: [{ model: RolePermission, as: 'permissions' }]
    }]
  });

  // Format user data
  const userData = updatedUser.toJSON();
  const formattedUser = {
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    phoneNumber: userData.phoneNumber,
    isKycVerified: userData.isKycVerified,
    status: userData.status,
    emailVerifiedAt: userData.emailVerifiedAt,
    lastLoginAt: userData.lastLoginAt,
    roleId: userData.roleId,
    cognitoSub: userData.cognitoSub,
    cognitoUsername: userData.cognitoUsername,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
    role: userData.role ? {
      id: userData.role.id,
      name: userData.role.name,
      type: userData.role.type,
      description: userData.role.description,
      is_active: userData.role.is_active
    } : null,
    permissions: userData.role && userData.role.permissions ? 
      userData.role.permissions.map(permission => ({
        id: permission.id,
        resource: permission.resource,
        action: permission.action
      })) : []
  };

  res.status(200).json(new ApiResponse(200, {
    user: formattedUser,
    roleChange: {
      oldRole,
      newRole: role.name,
      changedBy: req.user ? req.user.id : null,
      changedAt: new Date().toISOString()
    }
  }, `User role changed from "${oldRole}" to "${role.name}" successfully`));
});

/**
 * Create a new user (admin only)
 */
const createUser = asyncHandler(async (req, res) => {
  const { email, fullName, phoneNumber, roleId, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  // Check if phone number is taken (if provided)
  if (phoneNumber) {
    const existingPhone = await User.findOne({ where: { phoneNumber } });
    if (existingPhone) {
      throw new ApiError(400, 'Phone number is already registered');
    }
  }

  // Validate role exists and is active
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found');
  }

  if (!role.is_active) {
    throw new ApiError(400, 'Cannot assign inactive role');
  }

  // Hash the password
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user in local database
  const user = await User.create({
    email,
    fullName,
    phoneNumber,
    password: hashedPassword,
    roleId,
    status: 'active', // Admin-created users are immediately active
    emailVerifiedAt: new Date() // Admin-created users are considered email verified
  });

  // Create Cognito account for the user
  try {
    const CognitoAuthService = require('../services/cognito.service');
    const cognitoService = new CognitoAuthService();
    
    if (cognitoService.isConfigured) {
      console.log('Creating Cognito account for admin-created user:', user.email);
      
      // Create user in Cognito using AdminCreateUser (creates confirmed user)
      const cognitoResult = await cognitoService.createCognitoUserAndSendVerification(
        user.email,
        user.fullName,
        user.phoneNumber
      );
      
      if (cognitoResult && cognitoResult.success) {
        console.log('Cognito user created successfully:', cognitoResult.cognitoSub);
        
        // Update user with Cognito info
        await user.update({
          cognitoSub: cognitoResult.cognitoSub,
          cognitoUsername: cognitoResult.cognitoUsername
        });
        
        // Set up permanent password for the newly created Cognito user
        try {
          await cognitoService.setUserPermanentPassword(cognitoResult.cognitoSub, null);
          console.log('Permanent password set for admin-created Cognito user');
        } catch (passwordError) {
          console.error('Failed to set permanent password for admin-created user:', passwordError);
          // Continue with user creation even if password setup fails
        }
      }
    } else {
      console.warn('Cognito is not configured, user created without Cognito account');
    }
  } catch (cognitoError) {
    console.error('Failed to create Cognito account for admin-created user:', cognitoError);
    
    // Log specific error details for debugging
    if (cognitoError.name === 'InvalidParameterException') {
      if (cognitoError.message.includes('phone number')) {
        console.error('Phone number format error:', cognitoError.message);
      }
    }
    
    // Don't fail user creation if Cognito creation fails
    // The user can still be created and use alternative authentication methods
    console.warn('User created successfully but Cognito account creation failed. Authentication will be set up on first login.');
  }

  // Get created user with role and permissions
  const createdUser = await User.findByPk(user.id, {
    include: [{
      model: Role,
      as: 'role',
      include: [{ model: RolePermission, as: 'permissions' }]
    }]
  });

  // Format user data
  const userData = createdUser.toJSON();
  const formattedUser = {
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    phoneNumber: userData.phoneNumber,
    isKycVerified: userData.isKycVerified,
    status: userData.status,
    emailVerifiedAt: userData.emailVerifiedAt,
    lastLoginAt: userData.lastLoginAt,
    roleId: userData.roleId,
    cognitoSub: userData.cognitoSub,
    cognitoUsername: userData.cognitoUsername,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
    role: userData.role ? {
      id: userData.role.id,
      name: userData.role.name,
      type: userData.role.type,
      description: userData.role.description,
      is_active: userData.role.is_active
    } : null,
    permissions: userData.role && userData.role.permissions ? 
      userData.role.permissions.map(permission => ({
        id: permission.id,
        resource: permission.resource,
        action: permission.action
      })) : []
  };

  // Send welcome email to the created user
  try {
    const Email = require('../utils/Email');
    const hasCognitoAccount = user.cognitoSub ? 'Yes' : 'No';
    const emailMessage = user.cognitoSub 
      ? `Hello ${user.fullName},\n\nYour account has been successfully created by an administrator.\n\nAccount Details:\n- Email: ${user.email}\n- Role: ${role.name}\n- Status: Active\n- Authentication: Cognito account created\n\nWelcome to Miftah AI!\n\nBest regards,\nThe Miftah AI Team`
      : `Hello ${user.fullName},\n\nYour account has been successfully created by an administrator.\n\nAccount Details:\n- Email: ${user.email}\n- Role: ${role.name}\n- Status: Active\n- Authentication: Will be set up on first login\n\nYou can now log in using your email address. Your authentication will be automatically set up when you first log in.\n\nWelcome to Miftah AI!\n\nBest regards,\nThe Miftah AI Team`;
    
    await Email.sendEmail(
      user.email,
      'Welcome to Miftah AI - Account Created Successfully',
      emailMessage
    );
    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (emailError) {
    console.warn(`⚠️  Failed to send welcome email to ${user.email}:`, emailError.message);
    // Don't fail the user creation if email fails
  }

  res.status(201).json(new ApiResponse(201, {
    user: formattedUser,
    createdBy: req.user ? req.user.id : null,
    createdAt: new Date().toISOString()
  }, 'User created successfully and welcome email sent'));
});

module.exports = {
  getCurrentUser,
  getCurrentUserTokens,
  getUserById,
  getAllUsers,
  updateCurrentUser,
  changeUserRole,
  createUser
};
