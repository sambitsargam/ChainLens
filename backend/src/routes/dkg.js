/**
 * DKG API Routes
 * REST API endpoints for DKG operations
 * Implementation based on reference: dkg-web-main
 */

import express from 'express';
import { publishToDKG, fetchFromDKG, queryDKG, checkDKGHealth, getPublishingStats } from '../services/publisher.js';
import { logger } from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/dkg/publish
 * Publish Community Note to DKG (DEPRECATED - use /api/publishnote instead)
 * Forwards to publishnote endpoint for backwards compatibility
 */
router.post('/publish', async (req, res) => {
  try {
    const { content, options } = req.body;

    // Validate request
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content',
      });
    }

    // Validate JSON-LD structure
    if (!content['@context'] || !content['@type']) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON-LD: missing @context or @type',
      });
    }

    logger.info('[DKG] Publishing request received', {
      contentType: content['@type'],
      topic: content.claimReviewed || content.name,
    });

    // Publish to DKG (with automatic fallback to demo mode)
    const result = await publishToDKG(content, options);

    // Return success (whether real or demo)
    res.json(result);

  } catch (error) {
    logger.error('[DKG] Publish endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dkg/asset/:ual
 * Retrieve asset from DKG by UAL
 */
router.get('/asset/:ual', async (req, res) => {
  try {
    const { ual } = req.params;

    if (!ual) {
      return res.status(400).json({
        success: false,
        error: 'Missing UAL parameter',
      });
    }

    const result = await fetchFromDKG(decodeURIComponent(ual));
    res.json({
      success: result !== null,
      ual: decodeURIComponent(ual),
      data: result,
    });

  } catch (error) {
    logger.error('Get asset endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/dkg/query
 * Query DKG with SPARQL
 */
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing SPARQL query',
      });
    }

    const result = await queryDKG(query);
    res.json(result);

  } catch (error) {
    logger.error('Query endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dkg/stats
 * Get publishing statistics and DKG status
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = getPublishingStats();
    const health = await checkDKGHealth();

    res.json({
      success: true,
      ...stats,
      health,
    });

  } catch (error) {
    logger.error('Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dkg/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = await checkDKGHealth();
    const stats = getPublishingStats();

    res.json({
      status: health.status === 'operational' ? 'healthy' : 'degraded',
      dkg: {
        ...health,
        ...stats,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
