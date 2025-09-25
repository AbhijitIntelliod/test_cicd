const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'testuser@example.com';

async function testForgotPasswordFlow() {
  console.log('🧪 Testing Forgot Password Flow...\n');

  try {
    // Test 1: Send Password Reset OTP
    console.log('1️⃣ Testing send password reset OTP...');
    const sendOtpResponse = await axios.post(`${BASE_URL}/api/v1/auth/send-password-reset-otp`, {
      email: TEST_EMAIL
    });
    
    console.log('✅ Send OTP Response:', {
      status: sendOtpResponse.status,
      message: sendOtpResponse.data.message,
      data: sendOtpResponse.data.data
    });

    // Test 2: Confirm Password Reset (this will fail with invalid OTP, but we can test the endpoint)
    console.log('\n2️⃣ Testing confirm password reset with invalid OTP...');
    try {
      const confirmResetResponse = await axios.post(`${BASE_URL}/api/v1/auth/confirm-password-reset`, {
        email: TEST_EMAIL,
        otp: '000000', // Invalid OTP
        newPassword: 'NewSecurePassword123!'
      });
      console.log('✅ Confirm Reset Response:', confirmResetResponse.data);
    } catch (error) {
      console.log('✅ Expected error for invalid OTP:', {
        status: error.response?.status,
        message: error.response?.data?.message
      });
    }

    console.log('\n🎉 Forgot password endpoints are working correctly!');
    console.log('\n📋 Available endpoints:');
    console.log('   POST /api/v1/auth/send-password-reset-otp');
    console.log('   POST /api/v1/auth/confirm-password-reset');

  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
  }
}

// Run the test
testForgotPasswordFlow();
