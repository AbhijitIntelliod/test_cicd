#!/usr/bin/env node

/**
 * Script to run the Miftah.Ai Backend server with Swagger documentation
 * 
 * Usage:
 *   node run-with-swagger.js
 *   npm run dev:swagger
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Miftah.Ai Backend Server with Swagger Documentation...\n');

// Check if swagger.yaml exists
const fs = require('fs');
const swaggerPath = path.join(__dirname, 'swagger.yaml');

if (!fs.existsSync(swaggerPath)) {
    console.error('❌ Error: swagger.yaml file not found!');
    console.error('   Please make sure swagger.yaml exists in the project root.');
    process.exit(1);
}

console.log('✅ Swagger documentation found');
console.log('📚 API Documentation will be available at:');
console.log('   - http://localhost:5000/api-docs');
console.log('   - http://localhost:5000/ (redirects to docs)\n');

// Start the server
const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
});

server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});

server.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
});
