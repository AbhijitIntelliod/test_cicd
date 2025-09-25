const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate, requirePermission } = require('../middlewares/auth.middleware');
const { 
  validateSignup, 
  validateVerifyEmail, 
  validateSendLoginOtp, 
  validateVerifyLoginOtp, 
  validateLogin,
  validatePasswordReset,
  validateRefreshCognito,
  validateSigninViaPassword,
  validateSendPasswordResetOtp
} = require('../middlewares/validators/auth.validator');

const router = express.Router();

// Public routes - no authentication required
router.post('/signup', validateSignup, authController.signup);
router.post('/verify-email', validateVerifyEmail, authController.verifyEmail);
router.post('/resend-confirmation-code', authController.resendConfirmationCode);
router.post('/send-login-otp', validateSendLoginOtp, authController.sendLoginOtp);
router.post('/verify-login-otp', validateVerifyLoginOtp, authController.verifyLoginOtp);
router.post('/login', validateLogin, authController.login);
router.post('/signin-via-password', validateSigninViaPassword, authController.signinViaPassword);

// Cognito token management routes - refresh token doesn't require bearer token
router.post('/refresh-cognito', validateRefreshCognito, authController.refreshCognitoTokens);

// Password reset routes - no authentication required
router.post('/send-password-reset-otp', validateSendPasswordResetOtp, authController.sendPasswordResetOtp);
router.post('/confirm-password-reset', validatePasswordReset, authController.confirmPasswordReset);



// Admin routes - require authentication and specific permissions
// router.delete('/cleanup-expired', 
//   authenticate, 
//   requirePermission('users', 'delete'), 
//   authController.cleanupExpired
// );

module.exports = router;
