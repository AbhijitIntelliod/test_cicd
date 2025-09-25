module.exports = {
    apps: [
      {
        name: 'nodejs_cicd_test', // App name
        script: './server.js', // Main entry point
        instances: 'max', // Use all CPU cores
        exec_mode: 'cluster', // Cluster mode
  
        // Default environment (dev/test)
        env: {
          NODE_ENV: 'development',
          PORT: 3000
        },
  
        // Production environment
        env_production: {
          NODE_ENV: 'production',
          PORT: 3000,
          // RDS PostgreSQL Configuration - Will be set from .env file
          POSTGRES_HOST: process.env.POSTGRES_HOST,
          POSTGRES_PORT: process.env.POSTGRES_PORT,
          POSTGRES_DB: process.env.POSTGRES_DB,
          POSTGRES_USER: process.env.POSTGRES_USER,
          POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
          PGSSLMODE: process.env.PGSSLMODE,
          PGCHANNELBINDING: process.env.PGCHANNELBINDING,
          // JWT
          JWT_SECRET: process.env.JWT_SECRET,
          // AWS
          AWS_REGION: process.env.AWS_REGION,
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
          COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
          COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
          COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,
          CLOUDWATCH_LOG_GROUP: process.env.CLOUDWATCH_LOG_GROUP,
          ENABLE_CLOUDWATCH: process.env.ENABLE_CLOUDWATCH,
          LOG_LEVEL: process.env.LOG_LEVEL,
          FROM_EMAIL: process.env.FROM_EMAIL,
          APP_NAME: process.env.APP_NAME,
          S3_BUCKET_NAME: process.env.S3_BUCKET_NAME
        },
  
        // Logging
        out_file: './logs/out.log',
        error_file: './logs/error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  
        // Restart rules
        max_restarts: 10,
        min_uptime: '10s',
        max_memory_restart: '500M',
  
        // File watching (disabled in prod)
        watch: false,
        ignore_watch: [
          'node_modules',
          'logs',
          '.git',
          '*.log'
        ],
  
        // Advanced options
        kill_timeout: 5000,
        wait_ready: true,
        listen_timeout: 8000,
        autorestart: true,
        merge_logs: true,
        time: true
      }
    ],
  
    // Optional: Deployment config
    deploy: {
      production: {
        user: 'ubuntu', // EC2 username
        host: '13.127.36.233', // Or use DNS: ec2-13-127-36-233.ap-south-1.compute.amazonaws.com
        ref: 'origin/main',
        repo: 'git@github.com:AbhijitIntelliod/nodejs_cicd_test.git',
        path: '/home/ubuntu/nodejs_cicd_test',
        'post-deploy':
          'npm ci --production && pm2 reload ecosystem.config.js --env production && pm2 save'
      }
    }
  };
  