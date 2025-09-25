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
          PORT: 3000,
        },
  
        // Production environment - PM2 will load from .env file automatically
        env_production: {
          NODE_ENV: 'production',
          PORT: 3000,
        },

        // Environment file for production
        env_file: '.env',

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
          '*.log',
        ],
  
        // Advanced options
        kill_timeout: 5000,
        wait_ready: true,
        listen_timeout: 8000,
        autorestart: true,
        merge_logs: true,
        time: true,
      },
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
          'npm ci --production && pm2 reload ecosystem.config.js --env production && pm2 save',
      },
    },
  };
  