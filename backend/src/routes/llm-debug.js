/**
 * LLM Debug Route
 * Tests individual and multi-model LLM classification
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/llm-debug/status
 * Check which API keys are configured
 */
router.get('/status', (req, res) => {
  const status = {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    grok: !!process.env.GROK_API_KEY,
    timestamp: new Date().toISOString(),
  };
  
  res.json({
    success: true,
    status,
    message: `${Object.values(status).filter(Boolean).length}/3 API keys configured`
  });
});

/**
 * POST /api/llm-debug/test-openai
 * Test OpenAI classification
 */
router.post('/test-openai', async (req, res) => {
  try {
    const { claim, context } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }
    
    const llmService = await import('../services/llm.js');
    const result = await llmService.classifyWithOpenAI(claim, context);
    
    res.json({
      success: true,
      model: 'openai',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      model: 'openai',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/llm-debug/test-gemini
 * Test Gemini classification
 */
router.post('/test-gemini', async (req, res) => {
  try {
    const { claim, context } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }
    
    const llmService = await import('../services/llm.js');
    const result = await llmService.classifyWithGemini(claim, context);
    
    res.json({
      success: true,
      model: 'gemini',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      model: 'gemini',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/llm-debug/test-grok
 * Test Grok classification
 */
router.post('/test-grok', async (req, res) => {
  try {
    const { claim, context } = req.body;
    
    if (!process.env.GROK_API_KEY) {
      return res.status(400).json({ error: 'Grok API key not configured' });
    }
    
    const llmService = await import('../services/llm.js');
    const result = await llmService.classifyWithGrok(claim, context);
    
    res.json({
      success: true,
      model: 'grok',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      model: 'grok',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/llm-debug/test-all
 * Test all 3 models in parallel
 */
router.post('/test-all', async (req, res) => {
  try {
    const { claim, context } = req.body;
    
    if (!claim || !context) {
      return res.status(400).json({ error: 'claim and context are required' });
    }
    
    const llmService = await import('../services/llm.js');
    const results = {
      openai: { status: 'pending' },
      gemini: { status: 'pending' },
      grok: { status: 'pending' }
    };
    
    // Test each model in parallel
    const promises = [
      process.env.OPENAI_API_KEY 
        ? llmService.classifyWithOpenAI(claim, context)
          .then(r => { results.openai = { status: 'success', result: r }; })
          .catch(e => { results.openai = { status: 'error', error: e.message }; })
        : Promise.resolve(results.openai = { status: 'skipped', reason: 'API key not configured' }),
        
      process.env.GEMINI_API_KEY
        ? llmService.classifyWithGemini(claim, context)
          .then(r => { results.gemini = { status: 'success', result: r }; })
          .catch(e => { results.gemini = { status: 'error', error: e.message }; })
        : Promise.resolve(results.gemini = { status: 'skipped', reason: 'API key not configured' }),
        
      process.env.GROK_API_KEY
        ? llmService.classifyWithGrok(claim, context)
          .then(r => { results.grok = { status: 'success', result: r }; })
          .catch(e => { results.grok = { status: 'error', error: e.message }; })
        : Promise.resolve(results.grok = { status: 'skipped', reason: 'API key not configured' })
    ];
    
    await Promise.all(promises);
    
    const successCount = Object.values(results).filter(r => r.status === 'success').length;
    const errorCount = Object.values(results).filter(r => r.status === 'error').length;
    
    res.json({
      success: successCount > 0,
      summary: {
        total: 3,
        success: successCount,
        error: errorCount,
        skipped: Object.values(results).filter(r => r.status === 'skipped').length
      },
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/llm-debug/test-consensus
 * Test consensus classification
 */
router.post('/test-consensus', async (req, res) => {
  try {
    const { claims, context } = req.body;
    
    if (!claims || !Array.isArray(claims)) {
      return res.status(400).json({ error: 'claims array is required' });
    }
    
    const llmService = await import('../services/llm.js');
    const results = await llmService.classifyWithConsensus(claims, context || '');
    
    res.json({
      success: true,
      model: 'consensus',
      claims_processed: claims.length,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
