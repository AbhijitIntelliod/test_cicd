// Script to verify environment variables are loaded correctly
// Note: dotenv is not needed here as PM2 will load the .env file automatically

console.log('🔍 Environment Variables Verification:');
console.log('=====================================');

// Check if we're in a local development environment
const isLocalDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
if (isLocalDev) {
  console.log('📝 Running in LOCAL DEVELOPMENT mode');
  console.log('💡 For local development, create a .env file based on env.example');
  console.log('🚀 In production, PM2 will load variables from .env file created by CI/CD');
  console.log('');
}

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'JWT_SECRET',
  'AWS_REGION',
  'COGNITO_USER_POOL_ID',
  'APP_NAME'
];

let allPresent = true;
let presentCount = 0;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const displayValue = ['POSTGRES_PASSWORD', 'JWT_SECRET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'COGNITO_CLIENT_SECRET'].includes(varName) 
      ? '***MASKED***' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
    presentCount++;
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allPresent = false;
  }
});

console.log('=====================================');
console.log(`📊 Found ${presentCount}/${requiredVars.length} required variables`);

if (allPresent) {
  console.log('🎉 All required environment variables are present!');
} else if (isLocalDev) {
  console.log('💡 This is normal for local development without .env file');
  console.log('📋 Copy env.example to .env and fill in your values for local development');
} else {
  console.log('⚠️  Some environment variables are missing!');
  console.log('🔧 Check your .env file or PM2 configuration');
}

// Test PM2 environment loading
console.log('\n🔧 PM2 Environment Test:');
console.log('========================');
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Current PORT:', process.env.PORT);
console.log('Database Host:', process.env.POSTGRES_HOST);
console.log('App Name:', process.env.APP_NAME);
