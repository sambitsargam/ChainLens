/**
 * Publish Note API Routes
 * Follows reference implementation pattern: dkg-web-main/app/api/community-note/route.ts
 * 
 * Endpoints:
 * - POST /api/publishnote - Create and publish new community note
 * - GET /api/publishnote/:ual - Retrieve published note by UAL
 */

import express from 'express';
import { publishToDKG, fetchFromDKG } from '../services/publisher.js';
import { logger } from '../config/logger.js';

const router = express.Router();

/**
 * POST /api/publishnote
 * Create and publish Community Note to DKG
 * 
 * Request body:
 * {
 *   content: { @context, @type, claimReviewed, ... },  // JSON-LD Community Note
 *   options: { epochsNum, privacy, immutable }          // Publishing options
 * }
 * 
 * Response: { success, ual, transactionHash, explorerUrl, duration }
 */
router.post('/', async (req, res) => {
  try {
    const { content, options } = req.body;

    // Validate input
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

    logger.info('[API] Publishing note request', {
      contentType: content['@type'],
      topic: content.claimReviewed || content.name,
    });

    // Publish to DKG
    const result = await publishToDKG(content, options);

    // Return response (real or demo mode)
    res.json(result);

  } catch (error) {
    logger.error('[API] Publish note error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/publishnote/:ual
 * Retrieve published note from DKG by UAL
 * 
 * Response: { success, ual, data }
 */
router.get('/:ual', async (req, res) => {
  try {
    const { ual } = req.params;

    if (!ual) {
      return res.status(400).json({
        success: false,
        error: 'Missing UAL parameter',
      });
    }

    logger.info('[API] Fetching note from DKG', { ual });

    const data = await fetchFromDKG(decodeURIComponent(ual));

    res.json({
      success: data !== null,
      ual: decodeURIComponent(ual),
      data,
    });

  } catch (error) {
    logger.error('[API] Fetch note error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
