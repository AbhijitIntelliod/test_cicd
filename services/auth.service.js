const { User, LoginOtp } = require('../config/db.config');
const CognitoAuthService = require('./cognito.service');
const Email = require('../utils/Email');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

class AuthService {
  constructor() {
    this.cognitoService = new CognitoAuthService();
  }

  /**
   * User signup - creates user in Cognito with email verification
   * Uses Cognito's built-in email service for verification
   */
  async signup({ email, fullName, phoneNumber, password }) {
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


    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in local database first
    const user = await User.create({
      email,
      fullName,
      phoneNumber,
      password: hashedPassword,
      roleId: 3, // Default to Regular User role
      status: 'pending_verification' // Will be activated after Cognito verification
    });

    // Create user in Cognito with email verification
    let cognitoResult = null;
    
    try {
      if (!this.cognitoService.isConfigured) {
        throw new ApiError(500, 'Cognito is not properly configured');
      }

      console.log('Creating Cognito user with email verification for:', user.email);
      
      // Check if user already exists in Cognito
      const userExists = await this.cognitoService.checkUserExists(user.email);
      if (userExists.exists) {
        console.log('User already exists in Cognito with status:', userExists.userStatus);
        if (userExists.userStatus === 'CONFIRMED') {
          throw new ApiError(400, 'User with this email already exists and is verified');
        } else if (userExists.userStatus === 'UNCONFIRMED') {
          // User exists but not confirmed, we can still proceed with resending verification
          console.log('User exists but unconfirmed, will resend verification email');
        }
      }
      
      // Try the SignUpCommand method first (proper email verification)
      try {
        cognitoResult = await this.cognitoService.createCognitoUserWithEmailVerification(
          user.email,
          user.fullName,
          user.phoneNumber
        );
        console.log('✅ SignUpCommand method successful - email verification sent');
      } catch (primaryError) {
        console.log('❌ SignUpCommand method failed:', primaryError.message);
        console.log('Trying alternative AdminCreateUser method...');
        
        // If SignUpCommand fails, try alternative method
        try {
          cognitoResult = await this.cognitoService.createCognitoUserAndSendVerification(
            user.email,
            user.fullName,
            user.phoneNumber
          );
          console.log('✅ Alternative method successful');
        } catch (alternativeError) {
          console.error('❌ Both methods failed:', alternativeError.message);
          throw alternativeError;
        }
      }

      if (cognitoResult && cognitoResult.success) {
        console.log('Cognito user created successfully:', cognitoResult.cognitoSub);
        
        // Update user with Cognito info
        await user.update({
          cognitoSub: cognitoResult.cognitoSub,
          cognitoUsername: cognitoResult.cognitoUsername
        });
      }
    } catch (cognitoError) {
      console.error('Cognito user creation failed:', cognitoError);
      // Clean up local user if Cognito creation fails
      await user.destroy();
      
      // Handle specific Cognito errors with proper error messages
      if (cognitoError instanceof ApiError) {
        // Re-throw ApiError instances as they already have proper error messages
        throw cognitoError;
      }
      
      // Handle specific Cognito error types
      if (cognitoError.name === 'UsernameExistsException') {
        throw new ApiError(400, 'User with this email already exists. Please try logging in or use a different email.');
      }
      
      if (cognitoError.name === 'InvalidParameterException') {
        if (cognitoError.message.includes('email')) {
          throw new ApiError(400, 'Invalid email format. Please provide a valid email address.');
        }
        if (cognitoError.message.includes('password')) {
          throw new ApiError(400, 'Password does not meet requirements. Please use a stronger password.');
        }
        throw new ApiError(400, 'Invalid input parameters. Please check your information and try again.');
      }
      
      if (cognitoError.name === 'LimitExceededException') {
        throw new ApiError(429, 'Too many registration attempts. Please wait a few minutes before trying again.');
      }
      
      if (cognitoError.name === 'UserNotFoundException') {
        throw new ApiError(404, 'User not found. Please check your email address.');
      }
      
      if (cognitoError.name === 'NotAuthorizedException') {
        throw new ApiError(401, 'Authentication failed. Please check your credentials.');
      }
      
      if (cognitoError.name === 'TooManyRequestsException') {
        throw new ApiError(429, 'Too many requests. Please wait a moment and try again.');
      }
      
      // For any other Cognito errors, provide a more specific message
      if (cognitoError.message) {
        throw new ApiError(500, `Registration failed: ${cognitoError.message}`);
      }
      
      // Fallback for unknown errors
      throw new ApiError(500, 'Failed to create user account. Please try again later.');
    }

    return {
      message: 'Registration successful. Please check your email for verification code.',
      email,
      userId: user.id
    };
  }

  /**
   * Verify email using Cognito's confirmation code and automatically log user in
   * This method verifies the confirmation code sent by Cognito via email
   * The 'otp' parameter is actually the confirmation code from Cognito
   */
  async verifyEmailByEmailOtp(email, otp) {
    // Find user in pending verification status with role and permissions
    const user = await User.findOne({
      where: { email, status: 'pending_verification' },
      include: [{
        model: require('../config/db.config').Role,
        as: 'role',
        include: [{
          model: require('../config/db.config').RolePermission,
          as: 'permissions'
        }]
      }]
    });

    if (!user) {
      throw new ApiError(400, 'User not found or already verified');
    }

    if (!user.cognitoSub) {
      throw new ApiError(400, 'User not properly configured for Cognito authentication');
    }

    try {
      // Verify the confirmation code with Cognito
      // The 'otp' parameter is actually the confirmation code from Cognito
      await this.cognitoService.verifyConfirmationCode(user.email, otp);
      
      // Set the service password for the user after successful verification
      // This ensures the user can authenticate for OTP sending
      await this.cognitoService.setUserPermanentPassword(user.email, null);
      
      // Activate user in local database
      await user.update({
        status: 'active',
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date()
      });

      // Generate Cognito tokens for automatic login
      if (!this.cognitoService.isConfigured) {
        throw new ApiError(500, 'Cognito is not properly configured');
      }

      // Generate Cognito tokens using the user's service password
      // Use email as username since that's how Cognito is configured
      const servicePassword = this.cognitoService.generateServicePassword(user.email);
      const cognitoResult = await this.cognitoService.generateCognitoTokensAdmin(user.email, servicePassword);
      
      if (!cognitoResult) {
        throw new ApiError(500, 'Failed to generate authentication tokens');
      }

      // Store Cognito tokens
      await user.updateCognitoTokens({
        accessToken: cognitoResult.accessToken,
        idToken: cognitoResult.idToken,
        refreshToken: cognitoResult.refreshToken,
        tokenType: cognitoResult.tokenType,
        expiresIn: cognitoResult.expiresIn
      });

      // Format user data with role and permissions
      const userData = user.toJSON();
      const formattedUser = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        isKycVerified: userData.isKycVerified,
        status: userData.status,
        emailVerifiedAt: userData.emailVerifiedAt,
        roleId: userData.roleId,
        cognitoSub: userData.cognitoSub,
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

      return {
        message: 'Email verified and logged in successfully',
        user: formattedUser,
        cognitoTokens: {
          accessToken: cognitoResult.accessToken,
          idToken: cognitoResult.idToken,
          refreshToken: cognitoResult.refreshToken,
          tokenType: cognitoResult.tokenType,
          expiresIn: cognitoResult.expiresIn
        }
      };
    } catch (cognitoError) {
      console.error('Cognito confirmation code verification failed:', cognitoError);
      
      // Handle specific Cognito error types for email verification
      if (cognitoError.name === 'CodeMismatchException') {
        throw new ApiError(400, 'Invalid confirmation code. Please check your email and enter the correct code.');
      }
      
      if (cognitoError.name === 'ExpiredCodeException') {
        throw new ApiError(400, 'Confirmation code has expired. Please request a new verification email.');
      }
      
      if (cognitoError.name === 'NotAuthorizedException') {
        throw new ApiError(400, 'Invalid or expired confirmation code. Please request a new verification email.');
      }
      
      if (cognitoError.name === 'UserNotFoundException') {
        throw new ApiError(404, 'User not found. Please check your email address.');
      }
      
      if (cognitoError.name === 'LimitExceededException') {
        throw new ApiError(429, 'Too many verification attempts. Please wait a few minutes before trying again.');
      }
      
      // For any other Cognito errors, provide a more specific message
      if (cognitoError.message) {
        throw new ApiError(400, `Email verification failed: ${cognitoError.message}`);
      }
      
      throw new ApiError(400, 'Invalid confirmation code. Please check your email and try again.');
    }
  }

  /**
   * Resend email verification code using Cognito's built-in email service
   */
  async resendEmailVerification(email) {
    // Find user in pending verification status
    const user = await User.findOne({
      where: { email, status: 'pending_verification' }
    });

    if (!user) {
      throw new ApiError(400, 'User not found or already verified');
    }

    if (!user.cognitoSub) {
      throw new ApiError(400, 'User not properly configured for Cognito authentication');
    }

    try {
      if (!this.cognitoService.isConfigured) {
        throw new ApiError(500, 'Cognito is not properly configured');
      }

      // Resend confirmation code using Cognito
      await this.cognitoService.resendConfirmationCode(user.email);
      
      return {
        message: 'Verification email resent successfully. Please check your email.',
        email
      };
    } catch (cognitoError) {
      console.error('Cognito resend confirmation code failed:', cognitoError);
      
      // Handle specific Cognito error types for resend verification
      if (cognitoError.name === 'NotAuthorizedException') {
        throw new ApiError(400, 'Cannot resend verification email. User may already be verified or in an invalid state.');
      }
      
      if (cognitoError.name === 'UserNotFoundException') {
        throw new ApiError(404, 'User not found. Please check your email address.');
      }
      
      if (cognitoError.name === 'LimitExceededException') {
        throw new ApiError(429, 'Too many resend attempts. Please wait a few minutes before trying again.');
      }
      
      if (cognitoError.name === 'InvalidParameterException') {
        throw new ApiError(400, 'Invalid email address. Please provide a valid email.');
      }
      
      // If resend fails, try manual confirmation as fallback
      try {
        await this.cognitoService.manuallyConfirmUser(user.email);
        await user.update({
          status: 'active',
          emailVerifiedAt: new Date()
        });
        
        return {
          message: 'Email verification completed automatically. You can now log in.',
          email
        };
      } catch (manualError) {
        console.error('Manual confirmation also failed:', manualError);
        
        // For any other Cognito errors, provide a more specific message
        if (cognitoError.message) {
          throw new ApiError(500, `Failed to resend verification email: ${cognitoError.message}`);
        }
        
        throw new ApiError(500, 'Failed to resend verification email. Please contact support.');
      }
    }
  }

  /**
   * Send login OTP using custom OTP generation (like Cognito UI)
   */
  async sendLoginOtp(email) {
    const user = await User.findOne({ where: { email, status: 'active' } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    try {
      // Clean up any existing OTP records for this email
      await LoginOtp.destroy({ where: { email } });

      // Generate a 6-digit OTP
      const otp = this.generateOtp();
      
      // Store the OTP record in database
      await LoginOtp.create({
        email,
        otp,
        otpExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        session: null
      });

      // Try to send OTP via email, but don't fail if email sending fails
      try {
        await Email.sendLoginOtpEmail(email, user.fullName, otp);
        console.log(`✅ Authentication OTP sent via email to ${email}`);
      } catch (emailError) {
        console.warn(`⚠️  Email sending failed for ${email}:`, emailError.message);
        console.log(`📱 Authentication OTP for ${email}: ${otp}`);
        console.log(`⏰ OTP expires at: ${new Date(Date.now() + 30 * 60 * 1000).toISOString()}`);
      }
      
      return {
        message: 'Authentication OTP generated successfully',
        email
        // OTP should never be returned in response for security reasons
        // OTP is sent via email and logged to console for development
      };
    } catch (error) {
      console.error('Custom OTP generation failed:', error);
      throw new ApiError(500, 'Failed to generate login OTP. Please try again.');
    }
  }

  /**
   * Verify login OTP using custom OTP verification
   */
  async verifyLoginOtp(email, otp) {
    // Find user with role and permissions
    const user = await User.findOne({
      where: { email, status: 'active' },
      include: [{
        model: require('../config/db.config').Role,
        as: 'role',
        include: [{
          model: require('../config/db.config').RolePermission,
          as: 'permissions'
        }]
      }]
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // For admin-created users who might not have Cognito accounts yet,
    // we'll check if they exist in Cognito and link them, or create a new one
    if (!user.cognitoSub) {
      console.log('User does not have Cognito account, checking if one exists:', user.email);
      
      try {
        if (!this.cognitoService.isConfigured) {
          throw new ApiError(500, 'Cognito is not properly configured');
        }

        // First, check if user already exists in Cognito
        const userExists = await this.cognitoService.checkUserExists(user.email);
        
        if (userExists.exists) {
          console.log('User already exists in Cognito, linking to local account:', userExists.userStatus);
          
          // Link the existing Cognito user to our local user
          await user.update({
            cognitoSub: userExists.cognitoSub || user.email, // Use cognitoSub if available, otherwise use email
            cognitoUsername: user.email
          });
          
          // Set up permanent password for the existing Cognito user
          try {
            await this.cognitoService.setUserPermanentPassword(user.email, null);
            console.log('Permanent password set for existing Cognito user');
          } catch (passwordError) {
            console.error('Failed to set permanent password for existing user:', passwordError);
            // Continue with login even if password setup fails
          }
        } else {
          console.log('User does not exist in Cognito, creating new account');
          
          // Create new Cognito account for the user
          const cognitoResult = await this.cognitoService.createCognitoUserAndSendVerification(
            user.email,
            user.fullName,
            user.phoneNumber
          );
          
          if (cognitoResult && cognitoResult.success) {
            console.log('Cognito user created successfully during login:', cognitoResult.cognitoSub);
            
            // Update user with Cognito info
            await user.update({
              cognitoSub: cognitoResult.cognitoSub,
              cognitoUsername: cognitoResult.cognitoUsername
            });
            
            // Set up permanent password for the newly created Cognito user
            try {
              await this.cognitoService.setUserPermanentPassword(user.email, null);
              console.log('Permanent password set for newly created Cognito user');
            } catch (passwordError) {
              console.error('Failed to set permanent password for newly created user:', passwordError);
              // Continue with login even if password setup fails
            }
          } else {
            throw new ApiError(500, 'Failed to create Cognito account during login');
          }
        }
      } catch (cognitoError) {
        console.error('Failed to set up Cognito account during login:', cognitoError);
        
        // Handle specific Cognito errors with proper error messages
        if (cognitoError.name === 'InvalidParameterException') {
          if (cognitoError.message.includes('phone number')) {
            throw new ApiError(400, 'Invalid phone number format. Please contact support to update your phone number.');
          }
          if (cognitoError.message.includes('email')) {
            throw new ApiError(400, 'Invalid email format. Please contact support.');
          }
          throw new ApiError(400, 'Invalid user information. Please contact support.');
        }
        
        if (cognitoError.name === 'UsernameExistsException') {
          // This shouldn't happen now since we check first, but handle it gracefully
          console.log('User exists in Cognito, attempting to link...');
          try {
            const userExists = await this.cognitoService.checkUserExists(user.email);
            if (userExists.exists) {
              await user.update({
                cognitoSub: userExists.cognitoSub || user.email,
                cognitoUsername: user.email
              });
              await this.cognitoService.setUserPermanentPassword(user.email, null);
            }
          } catch (linkError) {
            throw new ApiError(400, 'User account already exists. Please contact support to resolve authentication issues.');
          }
        }
        
        if (cognitoError.name === 'LimitExceededException') {
          throw new ApiError(429, 'Too many authentication attempts. Please wait a few minutes before trying again.');
        }
        
        // For any other Cognito errors, provide a more specific message
        if (cognitoError.message) {
          throw new ApiError(500, `Authentication setup failed: ${cognitoError.message}`);
        }
        
        throw new ApiError(500, 'Failed to set up authentication. Please contact support.');
      }
    }

    // Find the stored OTP record for this email
    const loginOtpRecord = await LoginOtp.findOne({
      where: { 
        email,
        otpExpiresAt: {
          [require('sequelize').Op.gt]: new Date()
        },
        consumedAt: null
      }
    });

    if (!loginOtpRecord) {
      throw new ApiError(400, 'No valid OTP found. Please request a new OTP.');
    }

    // Verify the OTP matches
    if (loginOtpRecord.otp !== otp) {
      throw new ApiError(400, 'Invalid OTP. Please try again.');
    }

    try {
      if (!this.cognitoService.isConfigured) {
        throw new ApiError(500, 'Cognito is not properly configured');
      }

      // Mark OTP as consumed
      await loginOtpRecord.update({ consumedAt: new Date() });

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Generate Cognito tokens using the user's service password
      // Use email as username since that's how Cognito is configured
      const servicePassword = this.cognitoService.generateServicePassword(user.email);
      const cognitoResult = await this.cognitoService.generateCognitoTokensAdmin(user.email, servicePassword);
      
      if (!cognitoResult) {
        throw new ApiError(500, 'Failed to generate authentication tokens');
      }

      // Store Cognito tokens
      await user.updateCognitoTokens({
        accessToken: cognitoResult.accessToken,
        idToken: cognitoResult.idToken,
        refreshToken: cognitoResult.refreshToken,
        tokenType: cognitoResult.tokenType,
        expiresIn: cognitoResult.expiresIn
      });

      // Format user data with role and permissions
      const userData = user.toJSON();
      const formattedUser = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        isKycVerified: userData.isKycVerified,
        status: userData.status,
        emailVerifiedAt: userData.emailVerifiedAt,
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

      return {
        user: formattedUser,
        cognitoTokens: {
          accessToken: cognitoResult.accessToken,
          idToken: cognitoResult.idToken,
          refreshToken: cognitoResult.refreshToken,
          tokenType: cognitoResult.tokenType,
          expiresIn: cognitoResult.expiresIn
        }
      };
    } catch (cognitoError) {
      console.error('Cognito token generation failed:', cognitoError);
      
      // Handle specific Cognito error types for login
      if (cognitoError.name === 'NotAuthorizedException') {
        throw new ApiError(401, 'Authentication failed. Please check your credentials and try again.');
      }
      
      if (cognitoError.name === 'UserNotFoundException') {
        throw new ApiError(404, 'User not found. Please check your email address.');
      }
      
      if (cognitoError.name === 'UserNotConfirmedException') {
        throw new ApiError(400, 'Email not verified. Please verify your email before logging in.');
      }
      
      if (cognitoError.name === 'PasswordResetRequiredException') {
        throw new ApiError(400, 'Password reset required. Please reset your password before logging in.');
      }
      
      if (cognitoError.name === 'TooManyRequestsException') {
        throw new ApiError(429, 'Too many login attempts. Please wait a moment and try again.');
      }
      
      if (cognitoError.name === 'LimitExceededException') {
        throw new ApiError(429, 'Login limit exceeded. Please wait a few minutes before trying again.');
      }
      
      // For any other Cognito errors, provide a more specific message
      if (cognitoError.message) {
        throw new ApiError(500, `Login failed: ${cognitoError.message}`);
      }
      
      throw new ApiError(500, 'Failed to generate authentication tokens. Please try again.');
    }
  }

  // JWT methods removed - using Cognito tokens only


  /**
   * Generate OTP
   */
  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Sign in user with email and password
   */
  async signinViaPassword(email, password) {
    // Find user with role and permissions
    const user = await User.findOne({
      where: { email, status: 'active' },
      include: [{
        model: require('../config/db.config').Role,
        as: 'role',
        include: [{
          model: require('../config/db.config').RolePermission,
          as: 'permissions'
        }]
      }]
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if user has a password set
    if (!user.password) {
      throw new ApiError(401, 'Password not set for this user. Please use OTP login or contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    try {
      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // For users with Cognito accounts, generate Cognito tokens
      if (user.cognitoSub && this.cognitoService.isConfigured) {
        try {
          // Generate Cognito tokens using the user's service password
          // Use email as username since that's how Cognito is configured
          const servicePassword = this.cognitoService.generateServicePassword(user.email);
          const cognitoResult = await this.cognitoService.generateCognitoTokensAdmin(user.email, servicePassword);
          
          if (cognitoResult) {
            // Store Cognito tokens
            await user.updateCognitoTokens({
              accessToken: cognitoResult.accessToken,
              idToken: cognitoResult.idToken,
              refreshToken: cognitoResult.refreshToken,
              tokenType: cognitoResult.tokenType,
              expiresIn: cognitoResult.expiresIn
            });

            // Format user data with role and permissions
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

            return {
              user: formattedUser,
              cognitoTokens: {
                accessToken: cognitoResult.accessToken,
                idToken: cognitoResult.idToken,
                refreshToken: cognitoResult.refreshToken,
                tokenType: cognitoResult.tokenType,
                expiresIn: cognitoResult.expiresIn
              }
            };
          }
        } catch (cognitoError) {
          console.error('Cognito token generation failed during password login:', cognitoError);
          // Continue with basic login even if Cognito fails
        }
      }

      // For users without Cognito accounts or if Cognito fails, return basic user info
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

      return {
        user: formattedUser,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Password login error:', error);
      throw new ApiError(500, 'Login failed. Please try again.');
    }
  }

  /**
   * Send password reset OTP using Cognito's built-in email service
   */
  async sendPasswordResetOtp(email) {
    const user = await User.findOne({ where: { email, status: 'active' } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    try {
      if (!this.cognitoService.isConfigured) {
        throw new ApiError(500, 'Cognito is not properly configured');
      }

      // Use Cognito's built-in password reset email
      const result = await this.cognitoService.sendPasswordResetOtp(email);
      
      return {
        message: 'Password reset OTP sent successfully via Cognito',
        email
      };
    } catch (cognitoError) {
      console.error('Cognito password reset OTP send failed:', cognitoError);
      
      // Handle specific Cognito error types for password reset
      if (cognitoError.name === 'UserNotFoundException') {
        throw new ApiError(404, 'User not found. Please check your email address.');
      }
      
      if (cognitoError.name === 'InvalidParameterException') {
        throw new ApiError(400, 'Invalid email address. Please provide a valid email.');
      }
      
      if (cognitoError.name === 'LimitExceededException') {
        throw new ApiError(429, 'Too many password reset attempts. Please wait a few minutes before trying again.');
      }
      
      if (cognitoError.name === 'TooManyRequestsException') {
        throw new ApiError(429, 'Too many requests. Please wait a moment and try again.');
      }
      
      // For any other Cognito errors, provide a more specific message
      if (cognitoError.message) {
        throw new ApiError(500, `Password reset failed: ${cognitoError.message}`);
      }
      
      throw new ApiError(500, 'Failed to send password reset OTP. Please try again.');
    }
  }

  /**
   * Confirm password reset using Cognito's built-in email service
   */
  async confirmPasswordReset(email, otp, newPassword) {
    const user = await User.findOne({ where: { email, status: 'active' } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    try {
      if (!this.cognitoService.isConfigured) {
        throw new ApiError(500, 'Cognito is not properly configured');
      }

      // Use Cognito's built-in password reset confirmation
      const result = await this.cognitoService.confirmPasswordReset(email, otp, newPassword);
      
      // IMPORTANT: Update the local database password to match the new password
      // This ensures password-based login works correctly
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await user.update({ password: hashedPassword });
      
      // CRITICAL: Reset the Cognito user's password back to the service password
      // This ensures OTP login continues to work after password reset
      try {
        const servicePassword = this.cognitoService.generateServicePassword(email);
        await this.cognitoService.setUserPermanentPassword(email, servicePassword);
        console.log('Cognito user password reset to service password after password reset');
      } catch (passwordError) {
        console.error('Failed to reset Cognito password to service password:', passwordError);
        // Continue anyway, as the password reset was successful
      }
      
      console.log('Local database password updated after Cognito password reset');
      
      return {
        message: 'Password reset successfully',
        email
      };
    } catch (cognitoError) {
      console.error('Cognito password reset confirmation failed:', cognitoError);
      
      // Handle specific Cognito error types for password reset confirmation
      if (cognitoError.name === 'CodeMismatchException') {
        throw new ApiError(400, 'Invalid confirmation code. Please check your email and enter the correct code.');
      }
      
      if (cognitoError.name === 'ExpiredCodeException') {
        throw new ApiError(400, 'Confirmation code has expired. Please request a new password reset.');
      }
      
      if (cognitoError.name === 'InvalidPasswordException') {
        throw new ApiError(400, 'Password does not meet requirements. Please use a stronger password.');
      }
      
      if (cognitoError.name === 'UserNotFoundException') {
        throw new ApiError(404, 'User not found. Please check your email address.');
      }
      
      if (cognitoError.name === 'LimitExceededException') {
        throw new ApiError(429, 'Too many password reset attempts. Please wait a few minutes before trying again.');
      }
      
      if (cognitoError.name === 'NotAuthorizedException') {
        throw new ApiError(401, 'Invalid or expired confirmation code. Please request a new password reset.');
      }
      
      // For any other Cognito errors, provide a more specific message
      if (cognitoError.message) {
        throw new ApiError(400, `Password reset failed: ${cognitoError.message}`);
      }
      
      throw new ApiError(400, 'Invalid OTP or password reset failed. Please try again.');
    }
  }
}

module.exports = new AuthService();
