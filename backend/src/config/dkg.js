/**
 * DKG Client Configuration
 * Initializes and manages connection to OriginTrail DKG
 */

import DKG from 'dkg.js';
import { config } from './config.js';
import { logger } from './logger.js';

let dkgClient = null;

/**
 * Initialize DKG client with wallet credentials
 */
export function initializeDKG() {
  try {
    // Validate configuration
    if (!config.wallet.privateKey) {
      logger.warn('No wallet private key configured - DKG publishing will not work');
      return null;
    }

    if (!config.wallet.publicKey) {
      logger.warn('No wallet public key configured - DKG publishing will not work');
      return null;
    }

    logger.info('Initializing DKG client...', {
      environment: config.dkg.environment,
      endpoint: config.dkg.endpoint,
      blockchain: config.dkg.blockchain,
      wallet: config.wallet.publicKey,
    });

    dkgClient = new DKG({
      environment: config.dkg.environment,
      endpoint: config.dkg.endpoint,
      port: config.dkg.port,
      blockchain: {
        name: config.dkg.blockchain,
        publicKey: config.wallet.publicKey,
        privateKey: config.wallet.privateKey,
      },
      maxNumberOfRetries: 5,
      frequency: 2,
      contentType: 'all',
    });

    logger.info('✓ DKG client initialized successfully');
    return dkgClient;

  } catch (error) {
    logger.error('Failed to initialize DKG client:', error);
    return null;
  }
}

/**
 * Get DKG client instance (lazy initialization)
 */
export function getDKGClient() {
  if (!dkgClient) {
    dkgClient = initializeDKG();
  }
  return dkgClient;
}

/**
 * Check if DKG is available
 */
export function isDKGAvailable() {
  return dkgClient !== null && config.wallet.privateKey && config.wallet.publicKey;
}

/**
 * Get node info for health check
 */
export async function getNodeInfo() {
  try {
    const client = getDKGClient();
    if (!client) {
      return { available: false, reason: 'DKG client not initialized' };
    }

    const info = await client.node.info();
    return {
      available: true,
      version: info.version,
      blockchain: config.dkg.blockchain,
      wallet: config.wallet.publicKey,
    };
  } catch (error) {
    logger.error('Failed to get node info:', error);
    return { available: false, reason: error.message };
  }
}

export default {
  initializeDKG,
  getDKGClient,
  isDKGAvailable,
  getNodeInfo,
};
