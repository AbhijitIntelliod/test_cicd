const AuthService = require('../services/auth.service');
const { User } = require('../config/db.config');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Extract client info from request for session tracking
 */
const getClientInfo = (req) => {
  const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  // Parse device info from user agent (basic parsing)
  const deviceInfo = {
    userAgent,
    platform: req.get('sec-ch-ua-platform') || 'unknown',
    mobile: req.get('sec-ch-ua-mobile') === '?1',
    timestamp: new Date().toISOString()
  };

  return { ipAddress, userAgent, deviceInfo };
};

const signup = asyncHandler(async (req, res) => {
  const { email, fullName, phoneNumber, password } = req.body;


  if (!email || !fullName || !password) {
    throw new ApiError(400, 'Email, full name, and password are required');
  }

  const result = await AuthService.signup({
    email: email.toLowerCase().trim(),
    fullName: fullName.trim(),
    phoneNumber: phoneNumber?.trim() || null,
    password: password
  });

  res.status(201).json(
    new ApiResponse(201, result, 'Registration successful. Please check your email for verification.')
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and confirmation code are required');
  }

  // The 'otp' parameter is actually the confirmation code sent by Cognito via email
  const result = await AuthService.verifyEmailByEmailOtp(email.toLowerCase().trim(), otp.trim());

  res.status(200).json(
    new ApiResponse(200, result, 'Email verified successfully. You are now logged in.')
  );
});

const resendConfirmationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const result = await AuthService.resendEmailVerification(email.toLowerCase().trim());
  
  res.status(200).json(
    new ApiResponse(200, result, 'Verification email resent successfully')
  );
});


const login = asyncHandler(async (req, res) => {
  throw new ApiError(400, 'Password login disabled. Use email verification OTP to sign in.');
});

const signinViaPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const result = await AuthService.signinViaPassword(email.toLowerCase().trim(), password);

  res.status(200).json(
    new ApiResponse(200, result, 'Login successful')
  );
});


const cleanupExpired = asyncHandler(async (req, res) => {
  const deletedCount = await AuthService.cleanupExpiredRegistrations();
  
  res.status(200).json(
    new ApiResponse(200, { deletedCount }, 'Cleanup completed')
  );
});

const sendLoginOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');
  const result = await AuthService.sendLoginOtp(email.toLowerCase().trim());
  res.status(200).json(new ApiResponse(200, result, 'Authentication OTP sent successfully via Cognito'));
});

const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, 'Email and OTP are required');
  
  const result = await AuthService.verifyLoginOtp(email.toLowerCase().trim(), otp.trim());

  res.status(200).json(
    new ApiResponse(200, result, 'Login successful. Cognito tokens provided.')
  );
});

// Cognito token management endpoints

const refreshCognitoTokens = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, 'Cognito refresh token is required');
  }

  const CognitoAuthService = require('../services/cognito.service');
  const cognitoService = new CognitoAuthService();

  try {
    // Find user by refresh token stored in cognito_tokens JSON field
    // First, get all active users with stored tokens, then filter by refresh token
    const { Op } = require('sequelize');
    const users = await User.findAll({
      where: { 
        status: 'active',
        cognitoTokens: {
          [Op.ne]: null
        }
      }
    });

    // Find the user with matching refresh token
    const user = users.find(u => 
      u.cognitoTokens && 
      u.cognitoTokens.refreshToken && 
      u.cognitoTokens.refreshToken === refreshToken
    );

    if (!user) {
      throw new ApiError(404, 'User not found or invalid refresh token');
    }
    
    // Try using cognito_sub first, then fall back to email
    // The cognito_sub is the actual Cognito username
    const username = user.cognitoSub || user.cognitoUsername || user.email;
    console.log('Using username for SECRET_HASH:', username);
    console.log('User data:', {
      cognitoSub: user.cognitoSub,
      cognitoUsername: user.cognitoUsername,
      email: user.email
    });
    const result = await cognitoService.refreshCognitoTokens(refreshToken, username);
    
    // Update user's stored Cognito tokens with new tokens
    await user.updateCognitoTokens(result);

    res.status(200).json(
      new ApiResponse(200, result, 'Cognito tokens refreshed successfully')
    );
  } catch (error) {
    console.error('Refresh Cognito tokens error:', error);
    
    // Handle specific error types with appropriate status codes
    if (error.message.includes('Invalid or expired refresh token')) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    } else if (error.message.includes('User not found')) {
      throw new ApiError(404, 'User not found');
    } else if (error.message.includes('Invalid refresh token format')) {
      throw new ApiError(400, 'Invalid refresh token format');
    } else if (error.message.includes('Too many requests')) {
      throw new ApiError(429, 'Too many requests. Please try again later');
    } else if (error.message.includes('Invalid response from Cognito')) {
      throw new ApiError(502, 'Authentication service temporarily unavailable');
    }
    
    // Generic error for unexpected issues
    throw new ApiError(500, 'Failed to refresh Cognito tokens');
  }
});

const sendPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');
  
  const result = await AuthService.sendPasswordResetOtp(email.toLowerCase().trim());
  res.status(200).json(new ApiResponse(200, result, 'Password reset OTP sent successfully via Cognito'));
});

const confirmPasswordReset = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    throw new ApiError(400, 'Email, OTP, and new password are required');
  }
  
  const result = await AuthService.confirmPasswordReset(email.toLowerCase().trim(), otp.trim(), newPassword);
  res.status(200).json(new ApiResponse(200, result, 'Password reset successfully'));
});

module.exports = {
  signup,
  verifyEmail,
  resendConfirmationCode,
  login,
  signinViaPassword,
  cleanupExpired,
  sendLoginOtp,
  verifyLoginOtp,
  refreshCognitoTokens,
  sendPasswordResetOtp,
  confirmPasswordReset
};
