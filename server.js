const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { sequelize } = require("./config/db.config");
const logger = require('./config/logger');
// JWT-based authentication - no session cleanup needed

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;

// Log CloudWatch configuration for debugging
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CLOUDWATCH === 'true') {
  console.log('CloudWatch Configuration:');
  console.log('- LOG_GROUP:', process.env.CLOUDWATCH_LOG_GROUP || 'miftah-api-logs');
  console.log('- AWS_REGION:', process.env.AWS_REGION || 'us-east-1');
  console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
  console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
  console.log('- ENABLE_CLOUDWATCH:', process.env.ENABLE_CLOUDWATCH);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
}

const requestLogger = require('./middlewares/requestLogger'); 
app.use(requestLogger);

// ===== Middleware =====
app.use(cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173', 'http://192.168.1.81:5173', 'http://192.168.1.68:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id', 'x-access-token'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser()); // Add cookie parser for other cookies

/// ===== Routes =====
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const roleRoutes = require('./routes/role.route');
const permissionRoutes = require('./routes/permission.route');
const healthRoutes = require('./routes/health.route');
const recommendationRoutes = require('./routes/recommendation.routes');

const discoveryRoutes = require('./routes/discovery.route');
const corporateCommunityRoutes = require('./routes/corporate_community.route');
const individualProfessionalRoutes = require('./routes/individual_professional.route');

const eventRoutes = require('./routes/events.route');
const ticketRoutes = require('./routes/tickets.route');
const slaLogRoutes = require('./routes/sla_logs.route');
const kycRoutes = require('./routes/kyc.route');



const likeRoutes = require('./routes/like.routes');
const bookingRoutes = require('./routes/booking.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles',roleRoutes);
app.use('/api/v1/permissions',permissionRoutes);
app.use('/api/v1/kyc',kycRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/discoveries', discoveryRoutes);
app.use('/api/v1/corporate-communities', corporateCommunityRoutes);
app.use('/api/v1/individual-professionals', individualProfessionalRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/sla-logs', slaLogRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// ===== Swagger Documentation =====
const swaggerDocument = yaml.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Miftah.Ai Backend API Documentation"
}));

// Redirect root to API docs
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// ===== Error Handler (must be after routes) =====
const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);

// ===== Start Server After DB Connection =====
const startServer = async (initialPort = DEFAULT_PORT, maxAttempts = 5) => {
    try {
        await sequelize.authenticate();
        logger.info("Database connected successfully");

        // Sync models
        if ((process.env.DB_SYNC_ALTER === 'true')) {
            await sequelize.sync({ alter: true });
            logger.info("Models synchronized with alter (dev mode)");
        } else {
            await sequelize.sync();
            logger.info("Models synchronized");
        }


        let currentPort = initialPort;
        let attemptsLeft = Math.max(1, maxAttempts);

        const tryListen = () => {
            const server = app.listen(currentPort, () => {
                logger.info(`Server running on port ${currentPort}`);
              
            });

            server.on('error', (err) => {
                if (err && err.code === 'EADDRINUSE' && attemptsLeft > 1) {
                    logger.warn(`Port ${currentPort} is in use. Trying ${currentPort + 1}...`);
                    attemptsLeft -= 1;
                    currentPort += 1;
                    setTimeout(tryListen, 250);
                } else if (err && err.code === 'EADDRINUSE') {
                    logger.error(`All attempted ports are in use starting from ${initialPort}. Set PORT env var to an open port.`);
                    process.exit(1);
                } else {
                    logger.error('Server failed to start:', err);
                    process.exit(1);
                }
            });

            // Graceful shutdown handling
            const gracefulShutdown = (signal) => {
                logger.info(`Received ${signal}. Starting graceful shutdown...`);
                
                server.close(async () => {
                    logger.info('HTTP server closed');
                    
                    try {
                        // Close database connection
                        await sequelize.close();
                        logger.info('Database connection closed');
                        
                        logger.info('Graceful shutdown completed');
                        process.exit(0);
                    } catch (error) {
                        logger.error('Error during graceful shutdown:', error);
                        process.exit(1);
                    }
                });
            };

            // Handle shutdown signals
            process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
            process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        };

        tryListen();
    } catch (error) {
        logger.error("Unable to connect to the database:", error);
        process.exit(1); // exit if DB fails
    }
};

startServer();
