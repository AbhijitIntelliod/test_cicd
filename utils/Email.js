const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

class EmailService {
  constructor() {
    this.ses = new SESClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async sendVerificationEmail(email, fullName, verificationToken) {
    const emailOTP = `${verificationToken}`;
    
    const params = {
      Source: `"${process.env.APP_NAME}" <${process.env.FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Verify Your Email Address',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to ${process.env.APP_NAME}!</h2>
              <p>Hello ${fullName},</p>
              <p>Thank you for signing up! Please use the OTP below to verify your email address:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <span style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block; font-size: 18px;">
                  ${emailOTP}
                </span>
              </div>
              
              <p>This OTP will expire in 24 hours.</p>
              <hr style="border: 1px solid #eee; margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">
                If you didn't create an account, please ignore this email.
              </p>
            </div>
          `,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await this.ses.send(command);
      console.log('Verification email sent:', result.MessageId);
      return result;
    } catch (error) {
      console.error('SES Error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendKycStatusEmail(email, fullName, status, rejectionReason = null) {
    const subject = status === 'approved' 
      ? 'KYC Verification Approved' 
      : 'KYC Verification Update Required';
    
    const html = status === 'approved' 
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>KYC Verification Approved!</h2>
          <p>Hello ${fullName},</p>
          <p>Great news! Your KYC verification has been approved. You now have full access to all platform features.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Access Dashboard
            </a>
          </div>
          <p>Thank you for completing the verification process!</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>KYC Verification Update Required</h2>
          <p>Hello ${fullName},</p>
          <p>We've reviewed your KYC submission and need you to provide additional information or documentation.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <strong>Reason:</strong> ${rejectionReason}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/kyc" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Resubmit KYC Documents
            </a>
          </div>
          <p>Please review the requirements and submit updated documents at your earliest convenience.</p>
        </div>
      `;

    const params = {
      Source: `"${process.env.APP_NAME}" <${process.env.FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await this.ses.send(command);
      console.log('KYC status email sent:', result.MessageId);
      return result;
    } catch (error) {
      console.error('SES Error:', error);
      throw new Error('Failed to send KYC status email');
    }
  }

  async sendLoginOtpEmail(email, fullName, otp) {
    const params = {
      Source: `"${process.env.APP_NAME}" <${process.env.FROM_EMAIL}>`,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Miftah AI Login Code', Charset: 'UTF-8' },
        Body: {
          Html: {
            Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Miftah AI Login Code</h2>
              <p>Hello ${fullName},</p>
              <p>Your login code is ${otp}</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="background-color: #4CAF50; color: white; padding: 12px 24px; border-radius: 4px; display: inline-block; font-size: 18px;">${otp}</span>
              </div>
              <p>This code will expire in 30 minutes.</p>
              <hr style="border: 1px solid #eee; margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
          `,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await this.ses.send(command);
      console.log('Login OTP email sent:', result.MessageId);
      return result;
    } catch (error) {
      console.error('SES Error:', error);
      
      // Handle specific SES errors more gracefully
      if (error.name === 'MessageRejected' && error.message.includes('Email address is not verified')) {
        console.warn('SES Sandbox Mode: Email address not verified, OTP will be logged instead');
        throw new Error('Email address not verified in SES sandbox mode');
      }
      
      throw new Error('Failed to send login OTP email');
    }
  }

  /**
   * Generic email sending method
   */
  async sendEmail(email, subject, message) {
    const params = {
      Source: `"${process.env.APP_NAME || 'Miftah AI'}" <${process.env.FROM_EMAIL || 'noreply@miftah.ai'}>`,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: {
            Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
                <div style="color: #555; line-height: 1.6;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                  This is an automated message from ${process.env.APP_NAME || 'Miftah AI'}.
                </p>
              </div>
            </div>
          `,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await this.ses.send(command);
      console.log('Email sent:', result.MessageId);
      return result;
    } catch (error) {
      console.error('SES Error:', error);
      throw new Error('Failed to send email');
    }
  }
}

module.exports = new EmailService();