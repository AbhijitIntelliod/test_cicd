#!/usr/bin/env node

/**
 * Test script for authentication endpoints
 * This script tests the fixed authentication functionality
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1/auth';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_FULL_NAME = 'Test User';
const TEST_PHONE = '+1234567890';

// Test data
let testResults = {
  signup: null,
  verifyEmail: null,
  sendLoginOtp: null,
  verifyLoginOtp: null,
  signinViaPassword: null,
  refreshCognito: null
};

// Helper function to make API calls
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
}

// Test functions
async function testSignup() {
  console.log('\n🧪 Testing Signup...');
  
  const result = await makeRequest('POST', '/signup', {
    email: TEST_EMAIL,
    fullName: TEST_FULL_NAME,
    phoneNumber: TEST_PHONE,
    password: TEST_PASSWORD
  });
  
  testResults.signup = result;
  
  if (result.success) {
    console.log('✅ Signup successful:', result.data.message);
  } else {
    console.log('❌ Signup failed:', result.error);
  }
  
  return result;
}

async function testVerifyEmail() {
  console.log('\n🧪 Testing Email Verification...');
  
  // Note: In a real test, you would need the actual OTP from email
  // For this test, we'll simulate with a dummy OTP
  const result = await makeRequest('POST', '/verify-email', {
    email: TEST_EMAIL,
    otp: '123456' // This will likely fail, but tests the endpoint
  });
  
  testResults.verifyEmail = result;
  
  if (result.success) {
    console.log('✅ Email verification successful:', result.data.message);
  } else {
    console.log('❌ Email verification failed (expected):', result.error);
  }
  
  return result;
}

async function testSendLoginOtp() {
  console.log('\n🧪 Testing Send Login OTP...');
  
  const result = await makeRequest('POST', '/send-login-otp', {
    email: TEST_EMAIL
  });
  
  testResults.sendLoginOtp = result;
  
  if (result.success) {
    console.log('✅ Send login OTP successful:', result.data.message);
  } else {
    console.log('❌ Send login OTP failed:', result.error);
  }
  
  return result;
}

async function testVerifyLoginOtp() {
  console.log('\n🧪 Testing Verify Login OTP...');
  
  // Note: In a real test, you would need the actual OTP from email
  const result = await makeRequest('POST', '/verify-login-otp', {
    email: TEST_EMAIL,
    otp: '123456' // This will likely fail, but tests the endpoint
  });
  
  testResults.verifyLoginOtp = result;
  
  if (result.success) {
    console.log('✅ Verify login OTP successful:', result.data.message);
  } else {
    console.log('❌ Verify login OTP failed (expected):', result.error);
  }
  
  return result;
}

async function testSigninViaPassword() {
  console.log('\n🧪 Testing Signin via Password...');
  
  const result = await makeRequest('POST', '/signin-via-password', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  testResults.signinViaPassword = result;
  
  if (result.success) {
    console.log('✅ Signin via password successful:', result.data.message);
  } else {
    console.log('❌ Signin via password failed:', result.error);
  }
  
  return result;
}

async function testRefreshCognito() {
  console.log('\n🧪 Testing Refresh Cognito Tokens...');
  
  // Note: This will fail without a valid refresh token
  const result = await makeRequest('POST', '/refresh-cognito', {
    refreshToken: 'dummy-refresh-token'
  });
  
  testResults.refreshCognito = result;
  
  if (result.success) {
    console.log('✅ Refresh Cognito tokens successful:', result.data.message);
  } else {
    console.log('❌ Refresh Cognito tokens failed (expected):', result.error);
  }
  
  return result;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Authentication Endpoint Tests');
  console.log('==========================================');
  
  try {
    // Test signup
    await testSignup();
    
    // Test email verification (will likely fail without real OTP)
    await testVerifyEmail();
    
    // Test send login OTP
    await testSendLoginOtp();
    
    // Test verify login OTP (will likely fail without real OTP)
    await testVerifyLoginOtp();
    
    // Test signin via password
    await testSigninViaPassword();
    
    // Test refresh Cognito tokens (will likely fail without real token)
    await testRefreshCognito();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  Object.entries(testResults).forEach(([testName, result]) => {
    if (result) {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${testName}: ${status} (Status: ${result.status})`);
    } else {
      console.log(`${testName}: ⏭️  SKIPPED`);
    }
  });
  
  console.log('\n📝 Notes:');
  console.log('- Some tests are expected to fail without real OTPs/tokens');
  console.log('- The important thing is that endpoints are accessible and return proper error messages');
  console.log('- Check server logs for detailed error information');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testResults
};
