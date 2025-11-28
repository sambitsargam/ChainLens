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
  port: parseInt(process.env.DKG_PORT || '8900'),
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
let dkgAvailable = null;

/**
 * Check if DKG node is available
 */
export async function isDKGAvailable() {
  if (dkgAvailable !== null) {
    return dkgAvailable;
  }
  
  // If no private key configured, DKG is disabled
  if (!dkgConfig.blockchain.privateKey || dkgConfig.blockchain.privateKey === '') {
    console.log('ℹ DKG publishing disabled (no private key configured)');
    console.log('  To enable:');
    console.log('  1. Install DKG Edge Node: https://docs.origintrail.io/getting-started/dkg-node-services');
    console.log('  2. Set PRIVATE_KEY in .env');
    dkgAvailable = false;
    return false;
  }
  
  try {
    // Try to initialize DKG client to check connection
    const testDkg = new DKG(dkgConfig);
    
    // Simple test - check if we can access node info
    const nodeInfo = await testDkg.node.info();
    
    if (nodeInfo) {
      console.log('✓ DKG node is available');
      console.log(`  Version: ${nodeInfo.version || 'unknown'}`);
      dkgAvailable = true;
    } else {
      console.warn('⚠ DKG node responded but no info available');
      dkgAvailable = false;
    }
  } catch (error) {
    console.warn('⚠ DKG node not available:', error.message);
    console.warn('  Endpoint:', `${dkgConfig.endpoint}:${dkgConfig.port}`);
    console.warn('  Options:');
    console.warn('  1. Start DKG Edge Node: npm run start (in DKG node directory)');
    console.warn('  2. Use public gateway: DKG_ENDPOINT=https://v6-dkg-testnet.origin-trail.network');
    console.warn('  3. Continue without DKG (demo UALs will be used)');
    console.warn('  Docs: https://docs.origintrail.io/getting-started/dkg-node-services');
    dkgAvailable = false;
  }
  
  return dkgAvailable;
}

/**
 * Initialize DKG client singleton
 */
export async function initializeDKG() {
  if (!dkgInstance) {
    // Check if node is available first
    const available = await isDKGAvailable();
    if (!available) {
      console.warn('⚠ Cannot initialize DKG - node not available');
      return null;
    }
    
    try {
      dkgInstance = new DKG(dkgConfig);
      console.log('✓ DKG client initialized successfully');
      console.log(`  Endpoint: ${dkgConfig.endpoint}:${dkgConfig.port}`);
      console.log(`  Blockchain: ${dkgConfig.blockchain.name}`);
      console.log(`  Public Key: ${dkgConfig.blockchain.publicKey}`);
    } catch (error) {
      console.error('✗ Failed to initialize DKG client:', error.message);
      dkgInstance = null;
      return null;
    }
  }
  return dkgInstance;
}

/**
 * Get DKG client instance (returns null if not available)
 */
export async function getDKG() {
  if (!dkgInstance) {
    return await initializeDKG();
  }
  return dkgInstance;
}

export default {
  initializeDKG,
  getDKG,
  isDKGAvailable,
};
