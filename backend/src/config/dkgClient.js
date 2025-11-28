import DKG from 'dkg.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * OriginTrail DKG Client Configuration
 * 
 * This module initializes and exports the DKG client for interacting
 * with the OriginTrail Decentralized Knowledge Graph.
 * 
 * Configured per OriginTrail docs: https://docs.origintrail.io/
 */

const dkgConfig = {
  endpoint: process.env.DKG_ENDPOINT || 'http://localhost',
  port: process.env.DKG_PORT || '8900',
  blockchain: {
    name: process.env.BLOCKCHAIN_NAME || 'otp:20430',
    publicKey: process.env.PUBLIC_KEY || '',
    privateKey: process.env.PRIVATE_KEY || '',
  },
  maxNumberOfRetries: 30,
  frequency: 2,
  contentType: 'all',
};

let dkgInstance = null;

/**
 * Initialize DKG client singleton
 */
export function initializeDKG() {
  if (!dkgInstance) {
    try {
      dkgInstance = new DKG(dkgConfig);
      console.log('✓ DKG client initialized successfully');
      console.log(`  Endpoint: ${dkgConfig.endpoint}:${dkgConfig.port}`);
      console.log(`  Blockchain: ${dkgConfig.blockchain.name}`);
    } catch (error) {
      console.error('✗ Failed to initialize DKG client:', error.message);
      throw error;
    }
  }
  return dkgInstance;
}

/**
 * Get DKG client instance
 */
export function getDKG() {
  if (!dkgInstance) {
    return initializeDKG();
  }
  return dkgInstance;
}

export default {
  initializeDKG,
  getDKG,
};
