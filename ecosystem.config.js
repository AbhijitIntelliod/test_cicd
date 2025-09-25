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
          // RDS PostgreSQL Configuration - Using GitHub Secrets
          POSTGRES_HOST: '${{ secrets.POSTGRES_HOST }}',
          POSTGRES_PORT: '${{ secrets.POSTGRES_PORT }}',
          POSTGRES_DB: '${{ secrets.POSTGRES_DB }}',
          POSTGRES_USER: '${{ secrets.POSTGRES_USER }}',
          POSTGRES_PASSWORD: '${{ secrets.POSTGRES_PASSWORD }}',
          PGSSLMODE: '${{ secrets.PGSSLMODE }}',
          PGCHANNELBINDING: '${{ secrets.PGCHANNELBINDING }}',
          // JWT
          JWT_SECRET: '${{ secrets.JWT_SECRET }}',
          // AWS
          AWS_REGION: '${{ secrets.AWS_REGION }}',
          AWS_ACCESS_KEY_ID: '${{ secrets.AWS_ACCESS_KEY_ID }}',
          AWS_SECRET_ACCESS_KEY: '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
          COGNITO_USER_POOL_ID: '${{ secrets.COGNITO_USER_POOL_ID }}',
          COGNITO_CLIENT_ID: '${{ secrets.COGNITO_CLIENT_ID }}',
          COGNITO_CLIENT_SECRET: '${{ secrets.COGNITO_CLIENT_SECRET }}',
          CLOUDWATCH_LOG_GROUP: '${{ secrets.CLOUDWATCH_LOG_GROUP }}',
          ENABLE_CLOUDWATCH: '${{ secrets.ENABLE_CLOUDWATCH }}',
          LOG_LEVEL: '${{ secrets.LOG_LEVEL }}',
          FROM_EMAIL: '${{ secrets.FROM_EMAIL }}',
          APP_NAME: '${{ secrets.APP_NAME }}'
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
  