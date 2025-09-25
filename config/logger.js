const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

// Global context storage
let globalContext = {};



class Logger {
  constructor() {
    this.logger = this.createLogger();
    this.setupErrorHandling();
  }

  // Set global context (called by middleware)
  setContext(contextData) {
    globalContext = { ...globalContext, ...contextData };
  }

  // Get current context
  getContext() {
    return globalContext;
  }

  // Clear context (optional, for cleanup)
  clearContext() {
    globalContext = {};
  }

  // Get current date string for log file naming
  getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Create custom log format
  createLogFormat() {
    return winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        // Add context to meta
        const context = this.getContext();
        const fullMeta = { ...context, ...meta };
        
        let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (stack) {
          logMessage += `\nStack: ${stack}`;
        }
        
        if (Object.keys(fullMeta).length > 0) {
          logMessage += `\nMeta: ${JSON.stringify(fullMeta, null, 2)}`;
        }
        
        return logMessage;
      })
    );
  }

  /**
   * Create JSON format for file and CloudWatch logging
   */
  createJsonFormat() {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        // Merge context into the log data
        const context = this.getContext();
        const logData = { ...context, ...info };
        return JSON.stringify(logData);
      })
    );
  }

  /**
   * Create console format with colors
   */
  createConsoleFormat() {
    return winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        let logMessage = `${timestamp} ${level}: ${message}`;
        if (stack) {
          logMessage += `\n${stack}`;
        }
        return logMessage;
      })
    );
  }

  /**
   * Create CloudWatch transport
   */
  createCloudWatchTransport() {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
  
    // One stream per day
    const formattedDate = `${day}-${month}-${year}`; // e.g. "9-September-2025"
  
    const cloudWatchConfig = {
      logGroupName: process.env.CLOUDWATCH_LOG_GROUP || 'miftah-api-logs',
      logStreamName: process.env.CLOUDWATCH_LOG_STREAM || `api-${formattedDate}`,
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      messageFormatter: ({ level, message, timestamp, ...meta }) => {
        // CloudWatch logs - ensure all data is included
        const context = this.getContext();
        const logEntry = {
          timestamp: timestamp || new Date().toISOString(),
          level,
          message,
          ...context,
          ...meta
        };
        return JSON.stringify(logEntry);
      },
      uploadRate: 1000, // Reduced for more frequent uploads
      errorHandler: (err) => {
        console.error('CloudWatch logging error:', err);
        // Don't throw - just log the error
      },
      retentionInDays: 30,
      jsonMessage: true,
      awsOptions: {
        maxRetries: 3,
        retryDelayOptions: {
          customBackoff: function(retryCount) {
            return Math.pow(2, retryCount) * 100;
          }
        }
      }
    };
  
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      cloudWatchConfig.awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
      cloudWatchConfig.awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    }
  
    return new WinstonCloudWatch(cloudWatchConfig);
  }
  

  /**
   * Create transports based on environment
   */
  createTransports() {
    const transports = [];
    const isTest = process.env.NODE_ENV === 'test';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    // Console transport (disabled in test environment)
    if (!isTest) {
      transports.push(
        new winston.transports.Console({
          level: isDevelopment ? 'debug' : 'info',
          format: this.createConsoleFormat()
        })
      );
    }

    // CloudWatch transport (enabled in production or when explicitly configured)
    if ((isProduction || process.env.ENABLE_CLOUDWATCH === 'true') && !isTest) {
      try {
        transports.push(this.createCloudWatchTransport());
        console.log('CloudWatch logging enabled');
      } catch (error) {
        console.warn('Failed to create CloudWatch transport:', error.message);
      }
    }

    return transports;
  }

  /**
   * Create the winston logger instance
   */
  createLogger() {
    const logLevel = process.env.LOG_LEVEL || 
      (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

    return winston.createLogger({
      level: logLevel,
      format: this.createJsonFormat(), // Use JSON format by default
      transports: this.createTransports(),
      exitOnError: false,
      silent: process.env.NODE_ENV === 'test'
    });
  }

  /**
   * Setup error handling for the logger
   */
  setupErrorHandling() {
    this.logger.on('error', (error) => {
      console.error('Logger error:', error);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      // Give CloudWatch time to upload logs before exiting
      setTimeout(() => process.exit(1), 3000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Graceful shutdown to ensure logs are sent to CloudWatch
    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received, shutting down gracefully');
      setTimeout(() => process.exit(0), 2000);
    });

    process.on('SIGINT', () => {
      this.logger.info('SIGINT received, shutting down gracefully');
      setTimeout(() => process.exit(0), 2000);
    });
  }

  /**
   * Log methods with automatic context inclusion
   */
  debug(message, meta = {}) {
    const context = this.getContext();
    this.logger.debug(message, { ...context, ...meta });
  }

  info(message, meta = {}) {
    const context = this.getContext();
    this.logger.info(message, { ...context, ...meta });
  }

  warn(message, meta = {}) {
    const context = this.getContext();
    this.logger.warn(message, { ...context, ...meta });
  }

  error(message, error = null, meta = {}) {
    const context = this.getContext();
    if (error instanceof Error) {
      this.logger.error(message, { 
        error: error.message, 
        stack: error.stack, 
        ...context,
        ...meta 
      });
    } else {
      this.logger.error(message, { ...context, ...meta });
    }
  }

  /**
   * HTTP request logging helper
   */
  logRequest(req, res, responseTime) {
    const context = this.getContext();
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      ...context
    };

    if (res.statusCode >= 400) {
      this.error(`HTTP ${res.statusCode} ${req.method} ${req.url}`, null, logData);
    } else {
      this.info(`HTTP ${res.statusCode} ${req.method} ${req.url}`, logData);
    }
  }

  /**
   * Database operation logging helper
   */
  logDatabase(operation, table, duration, error = null) {
    const context = this.getContext();
    const logData = {
      operation,
      table,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...context
    };

    if (error) {
      this.error(`Database ${operation} failed on ${table}`, error, logData);
    } else {
      this.debug(`Database ${operation} on ${table}`, logData);
    }
  }

  /**
   * Authentication logging helper
   */
  logAuth(action, userId, success, details = {}) {
    const context = this.getContext();
    const logData = {
      action,
      userId,
      success,
      timestamp: new Date().toISOString(),
      ...context,
      ...details
    };

    if (success) {
      this.info(`Auth ${action} successful for user ${userId}`, logData);
    } else {
      this.warn(`Auth ${action} failed for user ${userId}`, logData);
    }
  }

  /**
   * Force flush logs to CloudWatch (useful before shutdown)
   */
  async flush() {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}

// Create and export logger instance
const loggerInstance = new Logger();

module.exports = loggerInstance;