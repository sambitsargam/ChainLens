/**
 * ChainLens DKG Backend Server
 * Express server for publishing Community Notes to OriginTrail DKG
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config/config.js';
import { logger, requestLogger } from './config/logger.js';
import { initializeDKG } from './config/dkg.js';
import dkgRoutes from './routes/dkg.js';
import publishnoteRoutes from './routes/publishnote.js';
import scraperRoutes from './routes/scraper.js';
import premiumRoutes from './routes/premium.js';
import llmDebugRoutes from './routes/llm-debug.js';
import classifyRoutes from './routes/classify.js';

const app = express();

// Validate configuration
const { warnings, errors } = validateConfig();
if (warnings.length > 0) {
  warnings.forEach(warning => logger.warn(warning));
}
if (errors.length > 0) {
  errors.forEach(error => logger.error(error));
  process.exit(1);
}

// Initialize DKG client
initializeDKG();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/dkg', dkgRoutes);
app.use('/api/publishnote', publishnoteRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/llm-debug', llmDebugRoutes);
app.use('/api/classify', classifyRoutes);
app.use('/api', premiumRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ChainLens DKG Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/dkg/health',
      publish: 'POST /api/dkg/publish',
      getAsset: 'GET /api/dkg/asset/:ual',
      query: 'POST /api/dkg/query',
      stats: 'GET /api/dkg/stats',
    },
    documentation: 'https://github.com/sambitsargam/ChainLens',
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: config.server.env === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info('='.repeat(60));
  logger.info('🚀 ChainLens DKG Backend Server Started');
  logger.info('='.repeat(60));
  logger.info(`Environment: ${config.server.env}`);
  logger.info(`Server: http://localhost:${PORT}`);
  logger.info(`Frontend: ${config.server.frontendUrl}`);
  logger.info(`DKG Endpoint: ${config.dkg.endpoint}`);
  logger.info(`Blockchain: ${config.dkg.blockchain}`);
  logger.info(`Wallet: ${config.wallet.publicKey || 'NOT CONFIGURED'}`);
  logger.info(`🔐 X402 Premium: Configured (disabled by default - enable in .env)`);
  logger.info(`   Receiver: ${process.env.X402_WALLET_ADDRESS || 'Not set'}`);
  logger.info(`   Network: ${process.env.X402_NETWORK || 'base-sepolia'}`);
  logger.info(`   Premium Endpoints: /api/publishnote, /api/analysis/advanced, /api/grokipedia-pro, /api/batch-verify`);
  logger.info('='.repeat(60));
  
  if (!config.wallet.privateKey) {
    logger.warn('⚠️  WARNING: Wallet not configured - DKG publishing disabled');
    logger.warn('⚠️  Set WALLET_PRIVATE_KEY in .env to enable publishing');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
