const { 
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AdminRespondToAuthChallengeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
  ConfirmSignUpCommand,
  AdminUpdateUserAttributesCommand,
  SignUpCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const crypto = require('crypto');
const { CognitoJwtVerifier } = require('aws-jwt-verify');

// Configure AWS Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

class CognitoAuthService {
  constructor() {
    this.userPoolId = process.env.COGNITO_USER_POOL_ID;
    this.clientId = process.env.COGNITO_CLIENT_ID;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET; // Optional
    this.region = process.env.AWS_REGION;
    
    // Check if Cognito is properly configured
    this.isConfigured = this.checkConfiguration();
    
    if (this.isConfigured) {
      // Initialize JWT verifier for Cognito tokens
      this.jwtVerifier = CognitoJwtVerifier.create({
        userPoolId: this.userPoolId,
        tokenUse: 'access',
        clientId: this.clientId
      });
    } else {
      console.warn('Cognito is not properly configured. Some features may not work.');
    }
  }

  // Check if Cognito configuration is complete
  checkConfiguration() {
    const required = ['COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn('Missing Cognito configuration:', missing);
      return false;
    }
    
    return true;
  }

  // Create user in Cognito with temporary password
  async createCognitoUser(email, fullName, phoneNumber) {
    try {
      // Check if Cognito is configured
      if (!this.isConfigured) {
        throw new Error('Cognito is not properly configured. Please check your environment variables.');
      }

      // Validate required environment variables
      if (!this.userPoolId || !this.clientId) {
        throw new Error('Cognito configuration missing: USER_POOL_ID or CLIENT_ID not set');
      }

      console.log('Creating Cognito user with params:', {
        email,
        fullName,
        phoneNumber,
        userPoolId: this.userPoolId,
        clientId: this.clientId
      });

      const tempPassword = this.generateTempPassword();
      
      const params = {
        UserPoolId: this.userPoolId,
        Username: email, // Use email as username since Cognito is configured to require email as username
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: fullName || '' },
          { Name: 'phone_number', Value: phoneNumber || '' }
        ],
        TemporaryPassword: tempPassword,
        MessageAction: 'SUPPRESS', // Don't send welcome email
        ForceAliasCreation: false
      };

      const command = new AdminCreateUserCommand(params);
      const result = await cognitoClient.send(command);
      
      console.log('Cognito user created, setting permanent password...');
      
      // Immediately set permanent password to disable temp password requirement
      const permanentPassword = await this.setUserPermanentPassword(email, tempPassword);
      
      console.log('Cognito user setup completed successfully');
      
      return {
        cognitoSub: result.User.Username, // Use the actual Cognito UserSub (UUID)
        cognitoUsername: email, // Store email as username for reference
        success: true,
        permanentPassword // Store this securely for token generation
      };
    } catch (error) {
      console.error('Cognito user creation error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      throw error;
    }
  }

  // Set permanent password (users won't know this password)
  async setUserPermanentPassword(email, tempPassword) {
    try {
      const permanentPassword = this.generateServicePassword(email); // Use consistent service password
      
      const params = {
        UserPoolId: this.userPoolId,
        Username: email, // Username is the email address
        Password: permanentPassword,
        Permanent: true
      };

      const command = new AdminSetUserPasswordCommand(params);
      await cognitoClient.send(command);
      
      console.log('Permanent password set successfully for user:', email);
      return permanentPassword;
    } catch (error) {
      console.error('Failed to set permanent password for user:', email, error);
      throw error;
    }
  }

  // Generate Cognito tokens after OTP verification (Admin Auth)
  async generateCognitoTokensAdmin(username, servicePassword) {
    try {
      console.log('Generating Cognito tokens for user:', username);
      
      // Generate SECRET_HASH if client secret is configured
      let secretHash = null;
      if (this.clientSecret) {
        const message = username + this.clientId;
        secretHash = crypto.createHmac('SHA256', this.clientSecret).update(message).digest('base64');
        console.log('Original token generation SECRET_HASH details:', {
          username: username,
          clientId: this.clientId,
          message: message,
          secretHash: secretHash.substring(0, 10) + '...'
        });
      }
      
      const params = {
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: username, // Use username (which is email) consistently
          PASSWORD: servicePassword,
          ...(secretHash && { SECRET_HASH: secretHash })
        }
      };

      const command = new AdminInitiateAuthCommand(params);
      const authResult = await cognitoClient.send(command);

      console.log('Cognito tokens generated successfully');
      
      return {
        accessToken: authResult.AuthenticationResult.AccessToken,
        idToken: authResult.AuthenticationResult.IdToken,
        refreshToken: authResult.AuthenticationResult.RefreshToken,
        tokenType: authResult.AuthenticationResult.TokenType,
        expiresIn: authResult.AuthenticationResult.ExpiresIn
      };
    } catch (error) {
      console.error('Admin token generation error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      return null;
    }
  }


  // Verify Cognito access token
  async verifyCognitoToken(token) {
    try {
      const payload = await this.jwtVerifier.verify(token);
      console.log('Cognito token payload:', JSON.stringify(payload, null, 2));
      return payload;
    } catch (error) {
      console.error('Cognito token verification error:', error);
      return null;
    }
  }

  // Refresh Cognito tokens
  async refreshCognitoTokens(refreshToken, username = null) {
    try {
      console.log('Starting token refresh for username:', username);
      console.log('Refresh token (first 50 chars):', refreshToken.substring(0, 50) + '...');
      
      // Generate SECRET_HASH if client secret is configured
      let secretHash = null;
      if (this.clientSecret) {
        if (!username) {
          console.warn('Username is required for refresh token when client secret is configured');
          throw new Error('Username is required for token refresh');
        }
        
        // Use the provided username to generate SECRET_HASH
        const message = username + this.clientId;
        secretHash = crypto.createHmac('SHA256', this.clientSecret).update(message).digest('base64');
        console.log('Generated secret hash for username:', username);
        console.log('SECRET_HASH generation details:', {
          username: username,
          clientId: this.clientId,
          message: message,
          secretHash: secretHash.substring(0, 10) + '...' // Only show first 10 chars for security
        });
      }

      const params = {
        ClientId: this.clientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          ...(secretHash && { SECRET_HASH: secretHash })
        }
      };

      console.log('Refresh token params:', {
        ClientId: this.clientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        hasRefreshToken: !!refreshToken,
        hasSecretHash: !!secretHash,
        username: username
      });

      // Use InitiateAuthCommand for refresh token flow
      const command = new InitiateAuthCommand(params);
      const result = await cognitoClient.send(command);

      if (!result.AuthenticationResult) {
        throw new Error('Invalid response from Cognito - no authentication result');
      }

      return {
        accessToken: result.AuthenticationResult.AccessToken,
        idToken: result.AuthenticationResult.IdToken,
        refreshToken: result.AuthenticationResult.RefreshToken || refreshToken, // Keep existing refresh token if new one not provided
        tokenType: result.AuthenticationResult.TokenType,
        expiresIn: result.AuthenticationResult.ExpiresIn
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Provide more specific error messages based on the error type
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Invalid or expired refresh token');
      } else if (error.name === 'UserNotFoundException') {
        throw new Error('User not found');
      } else if (error.name === 'InvalidParameterException') {
        throw new Error('Invalid refresh token format');
      } else if (error.name === 'TooManyRequestsException') {
        throw new Error('Too many requests. Please try again later');
      }
      
      throw error;
    }
  }

  // Get user from Cognito by email (since email is used as alias)
  async getCognitoUser(email) {
    try {
      // Since email is used as alias, we can use it directly
      const params = {
        UserPoolId: this.userPoolId,
        Username: email // Use email as username consistently
      };

      const command = new AdminGetUserCommand(params);
      const result = await cognitoClient.send(command);
      return result;
    } catch (error) {
      console.error('Get Cognito user error:', error);
      return null;
    }
  }

  // Delete user from Cognito
  async deleteCognitoUser(email) {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: email // Use email as username consistently
      };

      const command = new AdminDeleteUserCommand(params);
      await cognitoClient.send(command);
      return true;
    } catch (error) {
      console.error('Delete Cognito user error:', error);
      throw error;
    }
  }

  // Helper methods
  generateTempPassword() {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + 'Aa1!'; // Ensure it meets Cognito requirements
  }

  generateSecurePassword() {
    return crypto.randomBytes(32).toString('hex') + 'Aa1!';
  }

  // Generate consistent service password for a user (for token generation)
  generateServicePassword(email) {
    const hash = crypto.createHash('sha256');
    hash.update(email + process.env.JWT_SECRET);
    return hash.digest('hex').substring(0, 16) + 'Aa1!';
  }

  // Generate unique username for Cognito (when email is used as alias)
  generateUniqueUsername(email) {
    // Create a deterministic but unique username based on email
    const hash = crypto.createHash('sha256');
    hash.update(email + process.env.JWT_SECRET);
    return 'user_' + hash.digest('hex').substring(0, 16);
  }

  // Resend confirmation code for email verification
  async resendConfirmationCode(email) {
    try {
      // Generate SECRET_HASH if client secret is configured
      let secretHash = null;
      if (this.clientSecret) {
        const message = email + this.clientId;
        secretHash = crypto.createHmac('SHA256', this.clientSecret).update(message).digest('base64');
      }

      const params = {
        ClientId: this.clientId,
        Username: email, // Use email as username consistently
        ...(secretHash && { SecretHash: secretHash })
      };

      const command = new ResendConfirmationCodeCommand(params);
      const result = await cognitoClient.send(command);
      
      console.log('Confirmation code resent successfully');
      return result;
    } catch (error) {
      console.error('Resend confirmation code error:', error);
      
      // Handle specific error cases
      if (error.name === 'NotAuthorizedException') {
        console.log('User may already be confirmed or in an invalid state for resending confirmation code');
        throw new Error('Cannot resend confirmation code. User may already be verified or in an invalid state.');
      }
      
      if (error.name === 'UserNotFoundException') {
        console.log('User not found in Cognito');
        throw new Error('User not found. Please check the email address.');
      }
      
      throw error;
    }
  }

  // Check if user exists in Cognito
  async checkUserExists(email) {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: email // Use email as username consistently
      };

      const command = new AdminGetUserCommand(params);
      const result = await cognitoClient.send(command);
      
      return {
        exists: true,
        userStatus: result.UserStatus,
        enabled: result.Enabled,
        cognitoSub: result.Username, // The username in Cognito is the cognitoSub
        cognitoUsername: email // The email used to look up the user
      };
    } catch (error) {
      if (error.name === 'UserNotFoundException') {
        return { exists: false };
      }
      throw error;
    }
  }

  // Alternative method to send confirmation code using AdminResendConfirmationCode
  async adminResendConfirmationCode(email) {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: email // Use email as username consistently
      };

      const command = new ResendConfirmationCodeCommand(params);
      const result = await cognitoClient.send(command);
      
      console.log('Admin confirmation code resent successfully');
      return result;
    } catch (error) {
      console.error('Admin resend confirmation code error:', error);
      throw error;
    }
  }

  // Verify confirmation code
  async verifyConfirmationCode(email, confirmationCode) {
    try {
      // Generate SECRET_HASH if client secret is configured
      let secretHash = null;
      if (this.clientSecret) {
        const message = email + this.clientId;
        secretHash = crypto.createHmac('SHA256', this.clientSecret).update(message).digest('base64');
      }

      const params = {
        ClientId: this.clientId,
        Username: email, // Use email as username consistently
        ConfirmationCode: confirmationCode,
        ...(secretHash && { SecretHash: secretHash })
      };

      const command = new ConfirmSignUpCommand(params);
      const result = await cognitoClient.send(command);
      
      console.log('Confirmation code verified successfully');
      return result;
    } catch (error) {
      console.error('Confirmation code verification error:', error);
      throw error;
    }
  }

  // Manually confirm user (for testing when SES is in sandbox mode)
  async manuallyConfirmUser(email) {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: email, // Use email as username consistently
        UserAttributes: [
          { Name: 'email_verified', Value: 'true' }
        ]
      };

      const command = new AdminUpdateUserAttributesCommand(params);
      const result = await cognitoClient.send(command);
      
      console.log('User manually confirmed successfully');
      return result;
    } catch (error) {
      console.error('Manual confirmation error:', error);
      throw error;
    }
  }

  // Send OTP using Cognito's MFA flow for authentication
  async sendCognitoOtp(email) {
    try {
      console.log('Sending Cognito authentication OTP for user:', email);
      
      // Generate SECRET_HASH if client secret is configured
      let secretHash = null;
      if (this.clientSecret) {
        const message = email + this.clientId;
        secretHash = crypto.createHmac('SHA256', this.clientSecret).update(message).digest('base64');
      }
      
      // First, authenticate the user with their service password to initiate MFA
      const servicePassword = this.generateServicePassword(email);
      
      const authParams = {
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          'USERNAME': email, // Use email as username consistently
          'PASSWORD': servicePassword,
          ...(secretHash && { 'SECRET_HASH': secretHash })
        }
      };

      const authCommand = new AdminInitiateAuthCommand(authParams);
      const authResult = await cognitoClient.send(authCommand);

      console.log('Cognito authentication initiated, checking for MFA challenge');
      
      // If MFA is required, Cognito will return a challenge
      if (authResult.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
        // This means MFA is enabled and we need to send the MFA code
        return {
          message: 'Authentication OTP sent successfully via email',
          challengeName: 'SOFTWARE_TOKEN_MFA',
          session: authResult.Session,
          success: true
        };
      } else if (authResult.ChallengeName === 'SMS_MFA') {
        // SMS MFA challenge
        return {
          message: 'Authentication OTP sent successfully via SMS',
          challengeName: 'SMS_MFA',
          session: authResult.Session,
          success: true
        };
      } else {
        // If no MFA challenge, fall back to forgot password flow
        // but we'll need to handle this differently
        const forgotPasswordParams = {
          ClientId: this.clientId,
          Username: email, // Use email as username consistently
          ...(secretHash && { SecretHash: secretHash })
        };

        const forgotPasswordCommand = new ForgotPasswordCommand(forgotPasswordParams);
        const forgotPasswordResult = await cognitoClient.send(forgotPasswordCommand);

        console.log('Cognito forgot password initiated as fallback');
        
        return {
          message: 'Authentication OTP sent successfully via email',
          deliveryDetails: forgotPasswordResult.CodeDeliveryDetails,
          success: true,
          challengeName: 'PASSWORD_RESET_REQUIRED'
        };
      }
    } catch (error) {
      console.error('Cognito authentication OTP send error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      
      // If user doesn't exist, try to create them first
      if (error.name === 'UserNotFoundException') {
        console.log('User not found, this might be a new user. Please sign up first.');
        throw new ApiError(400, 'User not found. Please sign up first.');
      }
      
      // If user is not confirmed, they need to verify their email first
      if (error.name === 'InvalidParameterException' && error.message.includes('not confirmed')) {
        console.log('User email not confirmed, please verify email first.');
        throw new ApiError(400, 'Please verify your email first before requesting OTP.');
      }
      
      throw error;
    }
  }

  // Verify OTP using Cognito's authentication flow
  async verifyCognitoOtp(email, otp, newPassword = null) {
    try {
      console.log('Verifying Cognito authentication OTP for user:', email);
      
      // Generate SECRET_HASH if client secret is configured
      let secretHash = null;
      if (this.clientSecret) {
        const message = email + this.clientId;
        secretHash = crypto.createHmac('SHA256', this.clientSecret).update(message).digest('base64');
      }
      
      // Use ConfirmForgotPassword to verify the OTP
      // For login OTP, we'll use a temporary password that gets reset immediately
      const tempPassword = newPassword || this.generateServicePassword(email);
      
      const params = {
        ClientId: this.clientId,
        Username: email, // Use email as username consistently
        ConfirmationCode: otp,
        Password: tempPassword,
        ...(secretHash && { SecretHash: secretHash })
      };

      const command = new ConfirmForgotPasswordCommand(params);
      const result = await cognitoClient.send(command);

      console.log('Cognito authentication OTP verified successfully');
      
      // Now authenticate the user to get tokens
      const authParams = {
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          'USERNAME': email, // Use email as username consistently
          'PASSWORD': tempPassword,
          ...(secretHash && { 'SECRET_HASH': secretHash })
        }
      };

      const authCommand = new AdminInitiateAuthCommand(authParams);
      const authResult = await cognitoClient.send(authCommand);

      console.log('User authenticated successfully after OTP verification');
      
      return {
        accessToken: authResult.AuthenticationResult.AccessToken,
        idToken: authResult.AuthenticationResult.IdToken,
        refreshToken: authResult.AuthenticationResult.RefreshToken,
        tokenType: authResult.AuthenticationResult.TokenType,
        expiresIn: authResult.AuthenticationResult.ExpiresIn,
        success: true
      };
    } catch (error) {
      console.error('Cognito authentication OTP verification error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      throw error;
    }
  }

  // Send password reset OTP using Cognito's forgot password
  async sendPasswordResetOtp(email) {
    try {
      console.log('Sending password reset OTP for user:', email);
      
      // Generate SECRET_HASH if client secret is configured
      let secretHash = null;
      if (this.clientSecret) {
        const message = email + this.clientId;
        secretHash = crypto.createHmac('SHA256', this.clientSecret).update(message).digest('base64');
      }
      
      const params = {
        ClientId: this.clientId,
        Username: email, // Use email as username consistently
        ...(secretHash && { SecretHash: secretHash })
      };

      const command = new ForgotPasswordCommand(params);
      const result = await cognitoClient.send(command);

      console.log('Password reset OTP sent successfully');
      
      return {
        success: true,
        message: 'Password reset OTP sent to email'
      };
    } catch (error) {
      console.error('Password reset OTP send error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      throw error;
    }
  }

  // Confirm password reset with OTP
  async confirmPasswordReset(email, otp, newPassword) {
    try {
      console.log('Confirming password reset for user:', email);
      
      // Generate SECRET_HASH if client secret is configured
      let secretHash = null;
      if (this.clientSecret) {
        const message = email + this.clientId;
        secretHash = crypto.createHmac('SHA256', this.clientSecret).update(message).digest('base64');
      }
      
      const params = {
        ClientId: this.clientId,
        Username: email, // Use email as username consistently
        ConfirmationCode: otp,
        Password: newPassword,
        ...(secretHash && { SecretHash: secretHash })
      };

      const command = new ConfirmForgotPasswordCommand(params);
      await cognitoClient.send(command);

      console.log('Password reset confirmed successfully');
      
      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      throw error;
    }
  }

  // Helper function to format phone number for Cognito (E.164 format)
  formatPhoneNumberForCognito(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 and has 11 digits, assume US number
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // If it has 10 digits, assume US number and add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // For other cases, add + prefix
    return `+${digits}`;
  }

  // Create user with email verification using proper Cognito signup flow
  async createCognitoUserWithEmailVerification(email, fullName, phoneNumber) {
    try {
      console.log('Creating Cognito user with email verification:', email);
      
      // Generate SECRET_HASH if client secret is configured
      let secretHash = null;
      if (this.clientSecret) {
        const message = email + this.clientId;
        secretHash = crypto.createHmac('SHA256', this.clientSecret).update(message).digest('base64');
      }
      
      const tempPassword = this.generateTempPassword();
      
      // Format phone number for Cognito (E.164 format)
      const formattedPhoneNumber = this.formatPhoneNumberForCognito(phoneNumber);
      
      // Use SignUpCommand instead of AdminCreateUserCommand for proper email verification
      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'name', Value: fullName || '' }
      ];
      
      // Only add phone number if it's properly formatted
      if (formattedPhoneNumber) {
        userAttributes.push({ Name: 'phone_number', Value: formattedPhoneNumber });
      }
      
      const params = {
        ClientId: this.clientId,
        Username: email,
        Password: tempPassword,
        UserAttributes: userAttributes,
        ...(secretHash && { SecretHash: secretHash })
      };

      console.log('Creating user with signup params:', JSON.stringify(params, null, 2));
      
      const command = new SignUpCommand(params);
      const result = await cognitoClient.send(command);
      
      console.log('Cognito user created with email verification:', result);
      
      // Cognito automatically sends verification email when using SignUpCommand
      
      return {
        cognitoSub: result.UserSub, // Use the actual Cognito UserSub (UUID)
        cognitoUsername: email, // Store email as username for reference
        success: true,
        message: 'User created. Please check email for verification code.',
        userSub: result.UserSub
      };
    } catch (error) {
      console.error('Cognito user creation with email verification error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      throw error;
    }
  }

  // Alternative method: Use AdminCreateUser with proper email sending
  async createCognitoUserAndSendVerification(email, fullName, phoneNumber) {
    try {
      console.log('Creating Cognito user and sending verification:', email);
      
      const tempPassword = this.generateTempPassword();
      
      // Format phone number for Cognito (E.164 format)
      const formattedPhoneNumber = this.formatPhoneNumberForCognito(phoneNumber);
      
      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' }, // Admin-created users are immediately verified
        { Name: 'name', Value: fullName || '' }
      ];
      
      // Only add phone number if it's properly formatted
      if (formattedPhoneNumber) {
        userAttributes.push({ Name: 'phone_number', Value: formattedPhoneNumber });
      }
      
      // Create user as confirmed (admin-created users don't need email verification)
      const createParams = {
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: userAttributes,
        TemporaryPassword: tempPassword,
        MessageAction: 'SUPPRESS', // Don't send welcome email, we'll send our own
        ForceAliasCreation: false
      };

      console.log('Creating user with params:', JSON.stringify(createParams, null, 2));
      
      const createCommand = new AdminCreateUserCommand(createParams);
      const result = await cognitoClient.send(createCommand);
      
      console.log('Cognito user created:', result);
      
      // Admin-created users are immediately confirmed, no need for email verification
      
      return {
        cognitoSub: result.User.Username, // Use the actual Cognito UserSub (UUID)
        cognitoUsername: email, // Store email as username for reference
        success: true,
        message: 'User created. Please check email for verification code.'
      };
    } catch (error) {
      console.error('Cognito user creation and verification error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        name: error.name
      });
      throw error;
    }
  }
}

module.exports = CognitoAuthService;
