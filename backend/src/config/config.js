/**
 * Application Configuration
 * Centralized configuration management
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  // DKG Configuration
  dkg: {
    environment: process.env.DKG_ENVIRONMENT || 'testnet',
    endpoint: process.env.DKG_ENDPOINT || 'https://v6-dkg-testnet.origin-trail.network',
    port: parseInt(process.env.DKG_PORT || '8900', 10),
    blockchain: process.env.DKG_BLOCKCHAIN || 'otp:20430',
  },

  // Wallet Configuration
  wallet: {
    publicKey: process.env.WALLET_PUBLIC_KEY || '',
    privateKey: process.env.WALLET_PRIVATE_KEY || '',
  },

  // Publishing Configuration
  publishing: {
    defaultEpochs: parseInt(process.env.DEFAULT_EPOCHS || '2', 10),
    defaultImmutable: process.env.DEFAULT_IMMUTABLE === 'true',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

// Validate critical configuration
export function validateConfig() {
  const warnings = [];
  const errors = [];

  if (!config.wallet.privateKey) {
    warnings.push('WALLET_PRIVATE_KEY not set - DKG publishing will not work');
  }

  if (!config.wallet.publicKey) {
    warnings.push('WALLET_PUBLIC_KEY not set - DKG publishing will not work');
  }

  if (config.server.env === 'production' && !config.wallet.privateKey) {
    errors.push('Production environment requires WALLET_PRIVATE_KEY');
  }

  return { warnings, errors };
}

export default config;
