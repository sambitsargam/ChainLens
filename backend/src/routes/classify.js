/**
 * Classification Route
 * Server-side multi-model LLM classification endpoint
 * Bypasses CORS issues by processing LLM calls on backend
 */

import express from 'express';

const router = express.Router();

/**
 * POST /api/classify
 * Classify discrepancies using multi-model consensus
 * 
 * Request body:
 * {
 *   "discrepancies": ["claim1", "claim2", ...],
 *   "context": "wikipedia text context"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { discrepancies, context } = req.body;
    
    if (!discrepancies || !Array.isArray(discrepancies)) {
      return res.status(400).json({
        success: false,
        error: 'discrepancies array is required'
      });
    }
    
    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'context is required'
      });
    }
    
    // Import LLM service
    const llmService = await import('../services/llm.js');
    
    // Classify all discrepancies
    const classified = [];
    const wikiContext = context.substring(0, 500);
    
    console.log(`🤖 Backend: Classifying ${discrepancies.length} discrepancies with 3-model consensus...`);
    
    for (const sentence of discrepancies) {
      try {
        let openaiResult = null;
        let geminiResult = null;
        let grokResult = null;
        const errors = [];
        
        // Attempt all 3 models in parallel with error handling
        const results = await Promise.allSettled([
          llmService.classifyWithOpenAI(sentence, wikiContext).then(r => ({ model: 'openai', result: r })),
          llmService.classifyWithGemini(sentence, wikiContext).then(r => ({ model: 'gemini', result: r })),
          llmService.classifyWithGrok(sentence, wikiContext).then(r => ({ model: 'grok', result: r })),
        ]);

        // Process results
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled') {
            const { model, result } = res.value;
            if (result) {
              if (model === 'openai') openaiResult = result;
              if (model === 'gemini') geminiResult = result;
              if (model === 'grok') grokResult = result;
              console.log(`✅ ${model.toUpperCase()}: ${result.label}`);
            }
          } else {
            const modelNames = ['openai', 'gemini', 'grok'];
            const errorMsg = res.reason?.message || res.reason || 'Unknown error';
            errors.push(`${modelNames[idx]}: ${errorMsg}`);
            console.warn(`❌ ${modelNames[idx].toUpperCase()} failed:`, res.reason);
          }
        });

        // Determine consensus classification
        const labels = [];
        const modelVotes = [];
        const confidences = [];
        
        if (openaiResult) {
          labels.push(openaiResult.label);
          confidences.push(openaiResult.confidence || 0.8);
          modelVotes.push({ 
            model: 'openai', 
            label: openaiResult.label, 
            explanation: openaiResult.explanation,
            confidence: openaiResult.confidence || 0.8
          });
        }
        if (geminiResult) {
          labels.push(geminiResult.label);
          confidences.push(geminiResult.confidence || 0.8);
          modelVotes.push({ 
            model: 'gemini', 
            label: geminiResult.label, 
            explanation: geminiResult.explanation,
            confidence: geminiResult.confidence || 0.8
          });
        }
        if (grokResult) {
          labels.push(grokResult.label);
          confidences.push(grokResult.confidence || 0.8);
          modelVotes.push({ 
            model: 'grok', 
            label: grokResult.label, 
            explanation: grokResult.explanation,
            confidence: grokResult.confidence || 0.8
          });
        }

        // Get consensus or most common label
        const labelCounts = {};
        labels.forEach(label => {
          labelCounts[label] = (labelCounts[label] || 0) + 1;
        });
        
        const finalLabel = labels.length > 0 
          ? Object.keys(labelCounts).sort((a, b) => labelCounts[b] - labelCounts[a])[0]
          : 'factual_inconsistency';
        
        const avgConfidence = confidences.length > 0
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : 0;
        
        const explanations = modelVotes.map(v => v.explanation).filter(Boolean);
        const explanation = explanations.length > 0 
          ? explanations[0] 
          : 'Could not fully classify';
        
        classified.push({
          type: finalLabel,
          grokipedia_claim: sentence,
          wikipedia_claim: null,
          explanation,
          model_votes: modelVotes,
          consensus_count: modelVotes.length,
          confidence: avgConfidence,
          errors: errors.length > 0 ? errors : undefined,
        });
        
        console.log(`✓ Consensus: ${finalLabel} (${modelVotes.length}/3 models, ${(avgConfidence * 100).toFixed(1)}% confidence)`);
      } catch (error) {
        console.error(`❌ Classification error for sentence "${sentence.substring(0, 50)}...":`, error);
        
        // Add fallback classification
        classified.push({
          type: 'factual_inconsistency',
          grokipedia_claim: sentence,
          wikipedia_claim: null,
          explanation: `Classification failed: ${error.message}`,
          model_votes: [],
          consensus_count: 0,
          confidence: 0,
          errors: [error.message]
        });
      }
    }
    
    res.json({
      success: true,
      classified,
      summary: {
        total: discrepancies.length,
        classified: classified.filter(c => c.model_votes.length > 0).length,
        failed: classified.filter(c => c.model_votes.length === 0).length,
        avg_confidence: classified.length > 0
          ? (classified.reduce((a, c) => a + (c.confidence || 0), 0) / classified.length).toFixed(2)
          : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Classification endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
