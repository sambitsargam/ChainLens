/**
 * DKG Publishing Service
 * Core service for publishing Community Notes to OriginTrail DKG
 * Implementation based on reference: dkg-web-main/lib/dkg-client.ts
 * 
 * Uses OriginTrail testnet HTTP API for real blockchain publishing
 */

import { config } from '../config/config.js';
import { logger } from '../config/logger.js';

// DKG Configuration - try local node first, then testnet
const DKG_LOCAL_URL = process.env.DKG_LOCAL_URL || 'http://localhost:9200';
const DKG_TESTNET_URL = process.env.DKG_TESTNET_URL || 'https://v6-dkg-testnet.origin-trail.network:8900';
const DKG_EXPLORER_URL = 'https://dkg-testnet.origintrail.io';
const DKG_API_KEY = process.env.DKG_API_KEY;

// Endpoints to try in order
const DKG_ENDPOINTS = [
  DKG_LOCAL_URL,           // Local node first (port 9200)
  DKG_TESTNET_URL,         // Then testnet
];

/**
 * Publish content to DKG blockchain
 * Uses OriginTrail testnet HTTP API for real publishing
 * Falls back to demo mode if testnet is unreachable
 * 
 * @param {Object} content - JSON-LD content to publish
 * @param {Object} options - Publishing options
 * @returns {Promise<Object>} Publishing result with UAL
 */
export async function publishToDKG(content, options = {}) {
  const startTime = Date.now();
  
  try {
    logger.info('[DKG] ========== DKG PUBLISH START ==========');
    logger.info('[DKG] Publishing to DKG...');
    logger.info('[DKG] Available endpoints:', DKG_ENDPOINTS);
    logger.info('[DKG] Community Note Topic:', content.claimReviewed || content.name);

    // Transform Community Note to format expected by DKG API
    // Using the standard DKG publish API format
    const payload = {
      content: JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'Article',
        name: `Community Note: ${content.claimReviewed || content.name || 'Analysis'}`,
        description: content.reviewRating?.ratingExplanation || 'Community analysis',
        author: content.author?.name || 'ChainLens',
        datePublished: content.datePublished || new Date().toISOString(),
        // Include full community note data
        claimReview: content,
      }),
      privacy: options.privacy || 'public',
      epochs: options.epochsNum || 2,
    };

    logger.info('[DKG] Payload structure:');
    logger.info('[DKG]   - privacy:', payload.privacy);
    logger.info('[DKG]   - epochs:', payload.epochs);
    
    // Try endpoints in order
    let lastError = null;
    for (const baseUrl of DKG_ENDPOINTS) {
      try {
        const endpoint = `${baseUrl}/publishnote/create`;
        logger.info('[DKG] Trying endpoint:', endpoint);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(DKG_API_KEY && { Authorization: `Bearer ${DKG_API_KEY}` }),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        logger.info('[DKG] Response status:', response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          logger.info('[DKG] DKG API success response:', JSON.stringify(result, null, 2));

          // Extract UAL from various possible response formats
          const ual = result.ual || result.UAL || result.id || result.publicAssertionId;

          if (!ual) {
            logger.error('[DKG] UAL not found in response. Full response:', result);
            throw new Error('DKG API did not return a UAL');
          }

          const duration = Date.now() - startTime;

          logger.info('[DKG] ✓ Successfully published to DKG');
          logger.info('[DKG] ✓ UAL:', ual);
          logger.info('[DKG] ✓ Endpoint used:', baseUrl);
          logger.info('[DKG] ✓ Duration:', `${duration}ms`);
          logger.info('[DKG] ========== DKG PUBLISH END ==========');

          return {
            success: true,
            demo: false,
            ual,
            transactionHash: result.transactionHash || result.txHash || result.operation?.transactionHash,
            explorerUrl: result.explorerUrl || `${DKG_EXPLORER_URL}/explore?ual=${encodeURIComponent(ual)}`,
            duration,
            endpoint: baseUrl,
          };
        } else if (response.status === 404) {
          // Endpoint not available, try next one
          logger.warn('[DKG] Endpoint not found (404), trying next:', baseUrl);
          lastError = new Error(`${baseUrl} not available (404)`);
        } else if (response.status >= 500) {
          // Server error, try next one
          const errorText = await response.text();
          logger.warn('[DKG] Server error, trying next endpoint:', baseUrl, errorText);
          lastError = new Error(`${baseUrl} server error: ${response.status}`);
        } else {
          // Other error, include details
          const errorText = await response.text();
          logger.error('[DKG] API error response:', errorText);
          throw new Error(`DKG API error (${response.status}): ${errorText}`);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          logger.warn('[DKG] Request timeout for endpoint:', baseUrl);
          lastError = new Error(`${baseUrl} timeout`);
        } else {
          lastError = err;
          logger.warn('[DKG] Endpoint failed:', baseUrl, err.message);
        }
        // Continue to next endpoint
      }
    }

    // If all endpoints failed, use demo mode
    logger.warn('[DKG] All endpoints failed. Using demo mode for development.');
    const demoUAL = generateDemoUAL(content);
    const duration = Date.now() - startTime;

    return {
      success: false,
      demo: true,
      ual: demoUAL,
      transactionHash: `demo-0x${Math.random().toString(16).slice(2)}`,
      explorerUrl: `https://dkg-testnet.origintrail.io/explore?ual=${encodeURIComponent(demoUAL)}`,
      warning: `DKG node unavailable. Using demo UAL for preview. Errors tried: ${lastError?.message}`,
      duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('[DKG] ========== DKG PUBLISH ERROR ==========');
    logger.error('[DKG] Error type:', error?.constructor?.name);
    logger.error('[DKG] Error message:', error instanceof Error ? error.message : String(error));
    logger.error('[DKG] Duration:', `${duration}ms`);
    logger.error('[DKG] ==========================================');

    // Return error response - don't auto-fallback to demo
    return {
      success: false,
      demo: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      helpMessage: 'Start DKG node at http://localhost:9200 or check DKG_TESTNET_URL. Run: cd dkg-node && npm start',
    };
  }
}

/**
 * Generate a demo UAL for testing/demo mode
 * Format: did:otp:2043:0x{random}:0x{random}
 */
function generateDemoUAL(content) {
  const topicHash = content.claimReviewed?.substring(0, 8) || 'demo';
  const uuid = `0x${Math.random().toString(16).slice(2)}`;
  const hash = `0x${Math.random().toString(16).slice(2)}`;
  return `did:otp:2043:${uuid}:${hash}`;
}

/**
 * Fetch from DKG by UAL
 * Mock implementation for now - full implementation would fetch from DKG
 * 
 * @param {string} ual - Universal Asset Locator
 * @returns {Promise<Object|null>} Asset data or null
 */
export async function fetchFromDKG(ual) {
  try {
    logger.info('[DKG] Fetching from DKG:', ual);

    // Mock implementation for demo purposes
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, this would fetch from the actual DKG
    return null;

  } catch (error) {
    logger.error('[DKG] DKG fetch error:', error);
    return null;
  }
}

/**
 * Query DKG with SPARQL
 * Mock implementation for now
 * 
 * @param {string} query - SPARQL query
 * @returns {Promise<Object>} Query results
 */
export async function queryDKG(query) {
  try {
    logger.info('[DKG] Querying DKG with SPARQL');

    // Mock implementation - would call actual DKG graph API
    const results = [];

    logger.info('[DKG] ✓ Query completed', { resultsCount: results.length });

    return {
      success: true,
      results,
      count: results.length,
    };

  } catch (error) {
    logger.error('[DKG] Failed to query DKG', {
      error: error.message,
    });

    throw new Error(`DKG query failed: ${error.message}`);
  }
}

/**
 * Check DKG health
 * Mock implementation
 */
export async function checkDKGHealth() {
  try {
    // Mock health check
    return {
      status: 'operational',
      endpoint: DKG_LOCAL_URL,
      available_endpoints: DKG_ENDPOINTS,
    };
  } catch (error) {
    return {
      status: 'error',
      endpoint: DKG_LOCAL_URL,
      error: error.message,
    };
  }
}

/**
 * Get publishing statistics
 */
export function getPublishingStats() {
  return {
    dkgEndpoints: DKG_ENDPOINTS,
    dkgExplorer: DKG_EXPLORER_URL,
    configured: !!DKG_API_KEY,
    localNodeUrl: DKG_LOCAL_URL,
    testnetUrl: DKG_TESTNET_URL,
  };
}

export default {
  publishToDKG,
  fetchFromDKG,
  queryDKG,
  checkDKGHealth,
  getPublishingStats,
};
