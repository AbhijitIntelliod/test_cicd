# Environment Variables Setup

This document explains how environment variables are managed in this project for both local development and production deployment.

## 🏠 Local Development

### 1. Create Environment File
Copy the example environment file and fill in your values:

```bash
cp env.example .env
```

### 2. Fill in Your Values
Edit the `.env` file with your actual values:

```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=your_local_db
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your_local_jwt_secret

# AWS (use test values for local development)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=test_key
AWS_SECRET_ACCESS_KEY=test_secret
# ... etc
```

### 3. Verify Setup
Run the verification script to check if all variables are loaded:

```bash
npm run verify:env
```

## 🚀 Production Deployment

### How It Works

1. **GitHub Secrets**: All production values are stored securely in GitHub repository secrets
2. **CI/CD Pipeline**: During deployment, GitHub Actions creates a `.env` file on the EC2 server
3. **PM2 Configuration**: PM2 reads the `.env` file and injects variables into your application
4. **Application**: Your Node.js app accesses variables via `process.env.VARIABLE_NAME`

### Environment Variables Flow

```
GitHub Secrets → CI/CD Pipeline → .env file on EC2 → PM2 → Your App
```

### Required GitHub Secrets

Make sure these secrets are configured in your GitHub repository:

#### Database
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `PGSSLMODE`
- `PGCHANNELBINDING`

#### Server
- `PORT`
- `JWT_SECRET`

#### AWS
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

#### Cognito
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET`

#### Logging
- `CLOUDWATCH_LOG_GROUP`
- `ENABLE_CLOUDWATCH`
- `LOG_LEVEL`

#### App Settings
- `FROM_EMAIL`
- `APP_NAME`
- `S3_BUCKET_NAME`

#### EC2 Deployment
- `EC2_HOST`
- `EC2_USERNAME`
- `EC2_PRIVATE_KEY`

## 🔧 Verification

### Local Development
```bash
npm run verify:env
```

### Production
The CI/CD pipeline automatically runs the verification script during deployment to ensure all environment variables are properly loaded.

## 📁 File Structure

```
├── env.example          # Template for local development
├── .env                 # Local environment file (gitignored)
├── ecosystem.config.js  # PM2 configuration
├── scripts/
│   ├── setup-logs.js    # Creates logs directory
│   └── verify-env.js    # Verifies environment variables
└── .github/workflows/
    └── ci.yml           # CI/CD pipeline that creates .env on EC2
```

## 🛡️ Security Notes

- ✅ Environment variables are stored securely in GitHub Secrets
- ✅ `.env` file has restricted permissions (`chmod 600`) on EC2
- ✅ Sensitive values are masked in verification output
- ✅ Local `.env` file is gitignored and never committed
- ✅ Production secrets are never exposed in code or logs

## 🚨 Troubleshooting

### Local Development Issues
- **Variables not loading**: Make sure `.env` file exists and has correct format
- **Database connection issues**: Verify database credentials in `.env`
- **AWS errors**: Check AWS credentials and region settings

### Production Issues
- **Deployment fails**: Check GitHub Secrets are properly configured
- **App won't start**: Verify environment variables are loaded (check deployment logs)
- **Database connection**: Ensure RDS security groups allow EC2 access

### Verification Commands
```bash
# Check environment variables
npm run verify:env

# Check PM2 status (on EC2)
pm2 status

# Check PM2 logs (on EC2)
pm2 logs nodejs_cicd_test

# Check environment file exists (on EC2)
ls -la .env
```

