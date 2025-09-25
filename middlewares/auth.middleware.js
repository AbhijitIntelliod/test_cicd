const jwt = require('jsonwebtoken');
const { User, Role, RolePermission } = require('../config/db.config');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const CognitoAuthService = require('../services/cognito.service');

/**
 * Authenticate Cognito token and attach user to req
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Access token is required');
  }

  try {
    let user = null;

    // Verify Cognito token
    try {
      const cognitoService = new CognitoAuthService();
      const cognitoPayload = await cognitoService.verifyCognitoToken(token);
      
      if (cognitoPayload) {
        // Extract user identifier from Cognito token payload
        // Cognito access tokens contain 'sub' (subject) which is the user's unique identifier
        const cognitoSub = cognitoPayload.sub || cognitoPayload.username;
        
        if (!cognitoSub) {
          console.error('No user identifier found in Cognito token payload:', cognitoPayload);
          throw new ApiError(401, 'Invalid token - no user identifier found');
        }
        
        // Find user by Cognito sub (stored in cognitoSub field)
        // Handle both UUID format (new users) and email format (legacy users)
        user = await User.findOne({
          where: { 
            [require('sequelize').Op.or]: [
              { cognitoSub: cognitoSub },
              { cognitoUsername: cognitoSub },
              { email: cognitoSub } // Fallback for legacy users
            ],
            status: 'active' 
          },
          include: [{
            model: Role,
            as: 'role',
            include: [{ model: RolePermission, as: 'permissions' }]
          }]
        });
      }
    } catch (cognitoError) {
      console.error('Cognito token verification failed:', cognitoError);
      throw new ApiError(401, 'Invalid or expired token');
    }

    if (!user) {
      throw new ApiError(401, 'Invalid token or user not found');
    }

    req.user = user;
    req.tokenType = 'cognito';
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'Authentication failed');
  }
});

/**
 * Require user to have specific permission
 */
const requirePermission = (resource, action) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (req.user.role && req.user.role.type === 'super_admin') {
      return next();
    }

    const hasPermission = await req.user.hasPermission(resource, action);
    if (!hasPermission) {
      throw new ApiError(403, `Access denied. Required permission: ${resource}:${action}`);
    }

    next();
  });

/**
 * Require user to have at least one of the given permissions
 */
const requireAnyPermission = (permissions) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (req.user.role && req.user.role.type === 'super_admin') {
      return next();
    }

    let hasAny = false;
    for (const p of permissions) {
      const allowed = await req.user.hasPermission(p.resource, p.action);
      if (allowed) {
        hasAny = true;
        break;
      }
    }

    if (!hasAny) {
      const needed = permissions.map(p => `${p.resource}:${p.action}`).join(', ');
      throw new ApiError(403, `Access denied. Required any of: ${needed}`);
    }

    next();
  });

/**
 * Require user to have all the given permissions
 */
const requireAllPermissions = (permissions) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (req.user.role && req.user.role.type === 'super_admin') {
      return next();
    }

    for (const p of permissions) {
      const allowed = await req.user.hasPermission(p.resource, p.action);
      if (!allowed) {
        throw new ApiError(403, `Access denied. Missing permission: ${p.resource}:${p.action}`);
      }
    }

    next();
  });

/**
 * Require user to have one of the allowed roles
 */
const requireRole = (roles) =>
  (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new ApiError(403, 'Access denied. No role assigned');
    }

    const userRole = req.user.role.type;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(403, `Access denied. Required role: ${allowedRoles.join(' or ')}`);
    }

    next();
  };

/**
 * Require user to own the resource (or be admin/super_admin)
 */
const requireOwnership = (userIdParam = 'id') =>
  (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const resourceUserId = parseInt(req.params[userIdParam], 10);
    const currentUserId = parseInt(req.user.id, 10);

    if (req.user.role && ['super_admin', 'admin'].includes(req.user.role.type)) {
      return next();
    }

    if (resourceUserId !== currentUserId) {
      throw new ApiError(403, 'Access denied. You can only access your own data');
    }

    next();
  };

/**
 * Optional auth – does not fail if no token, but sets req.user if valid
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    req.user = null;
    req.tokenType = null;
    return next();
  }

  try {
    let user = null;

    // Verify Cognito token
    try {
      const cognitoService = new CognitoAuthService();
      const cognitoPayload = await cognitoService.verifyCognitoToken(token);
      
      if (cognitoPayload) {
        // Extract user identifier from Cognito token payload
        // Cognito access tokens contain 'sub' (subject) which is the user's unique identifier
        const cognitoSub = cognitoPayload.sub || cognitoPayload.username;
        
        if (cognitoSub) {
          // Find user by Cognito sub (stored in cognitoSub field)
          // Handle both UUID format (new users) and email format (legacy users)
          user = await User.findOne({
            where: { 
              [require('sequelize').Op.or]: [
                { cognitoSub: cognitoSub },
                { cognitoUsername: cognitoSub },
                { email: cognitoSub } // Fallback for legacy users
              ],
              status: 'active' 
            },
            include: [{
              model: Role,
              as: 'role',
              include: [{ model: RolePermission, as: 'permissions' }]
            }]
          });
        }
      }
    } catch (cognitoError) {
      // Silently fail for optional auth
    }

    req.user = user || null;
    req.tokenType = user ? 'cognito' : null;
    next();
  } catch (error) {
    req.user = null;
    req.tokenType = null;
    next();
  }
});

/**
 * Require user to have KYC verified
 */
const requireKycVerified = asyncHandler(async (req, res, next) => {
  if (!req.user.isKycVerified) {
    throw new ApiError(403, 'KYC verification required');
  }
  next();
});

module.exports = {
  authenticate,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireOwnership,
  optionalAuth,
  requireKycVerified
};
