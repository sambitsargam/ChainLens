/**
 * Backend LLM Classification Service
 * Supports OpenAI, Gemini, and Grok with multi-model consensus
 * Includes retry logic, rate limiting, and graceful fallbacks
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY;

console.log('🤖 Backend LLM Service Configuration:');
console.log('  OpenAI:', OPENAI_API_KEY ? '✓ Configured' : '✗ Missing');
console.log('  Gemini:', GEMINI_API_KEY ? '✓ Configured' : '✗ Missing');
console.log('  Grok:', GROK_API_KEY ? '✓ Configured' : '✗ Missing');

/**
 * Sleep utility for retries
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Classify with OpenAI
 */
export async function classifyWithOpenAI(claim, context, retries = 3) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are a fact-checker. Classify this claim as ONE of: factual_inconsistency, missing_context, hallucination, bias, aligned

Claim: "${claim}"
Context: "${context}"

Respond ONLY with JSON: {"label": "...", "confidence": 0.0-1.0, "explanation": "..."}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || Math.pow(2, attempt));
        console.warn(`⏳ OpenAI rate limited, retrying in ${retryAfter}s (${attempt + 1}/${retries})`);
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ OpenAI attempt ${attempt + 1} failed:`, error.message);
      if (attempt === retries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}

/**
 * Classify with Gemini
 */
export async function classifyWithGemini(claim, context, retries = 2) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `Classify this claim as ONE of: factual_inconsistency, missing_context, hallucination, bias, aligned

Claim: "${claim}"
Context: "${context}"

Respond with JSON: {"label": "...", "confidence": 0.0-1.0, "explanation": "..."}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.status === 429) {
        console.warn(`⏳ Gemini rate limited (${attempt + 1}/${retries}), retrying...`);
        await sleep(Math.pow(2, attempt) * 2000);
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || ''}`);
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text.trim();
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Gemini attempt ${attempt + 1} failed:`, error.message);
      if (attempt === retries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}

/**
 * Classify with Grok (xAI)
 */
export async function classifyWithGrok(claim, context, retries = 2) {
  if (!GROK_API_KEY) {
    throw new Error('Grok API key not configured');
  }

  const prompt = `Classify this claim as ONE of: factual_inconsistency, missing_context, hallucination, bias, aligned

Claim: "${claim}"
Context: "${context}"

Respond with JSON only: {"label": "...", "confidence": 0.0-1.0, "explanation": "..."}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (response.status === 429) {
        console.warn(`⏳ Grok rate limited (${attempt + 1}/${retries}), retrying...`);
        await sleep(Math.pow(2, attempt) * 2000);
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || ''}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Grok attempt ${attempt + 1} failed:`, error.message);
      if (attempt === retries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}

/**
 * Get consensus classification from multiple models
 */
export async function classifyWithConsensus(claims, context) {
  console.log(`🤖 Classifying ${claims.length} claims with 3-model consensus...`);
  
  const results = [];

  for (const claim of claims.slice(0, 10)) {
    try {
      const modelResults = {};
      const errors = [];

      // Attempt all 3 models in parallel
      const promises = [
        classifyWithOpenAI(claim, context)
          .then(result => {
            modelResults.openai = { ...result, model: 'openai' };
            console.log(`  ✅ OpenAI: ${result.label}`);
          })
          .catch(error => {
            errors.push(`OpenAI: ${error.message}`);
            console.error(`  ❌ OpenAI failed`);
          }),

        classifyWithGemini(claim, context)
          .then(result => {
            modelResults.gemini = { ...result, model: 'gemini' };
            console.log(`  ✅ Gemini: ${result.label}`);
          })
          .catch(error => {
            errors.push(`Gemini: ${error.message}`);
            console.error(`  ❌ Gemini failed`);
          }),

        classifyWithGrok(claim, context)
          .then(result => {
            modelResults.grok = { ...result, model: 'grok' };
            console.log(`  ✅ Grok: ${result.label}`);
          })
          .catch(error => {
            errors.push(`Grok: ${error.message}`);
            console.error(`  ❌ Grok failed`);
          }),
      ];

      await Promise.all(promises);

      // Calculate consensus
      const labels = Object.values(modelResults).map(r => r.label);
      const labelCounts = {};
      labels.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });

      const consensusLabel = labels.length > 0
        ? Object.keys(labelCounts).sort((a, b) => labelCounts[b] - labelCounts[a])[0]
        : 'factual_inconsistency';

      const avgConfidence = labels.length > 0
        ? Object.values(modelResults).reduce((sum, r) => sum + (r.confidence || 0), 0) / labels.length
        : 0;

      const modelVotes = Object.values(modelResults);

      results.push({
        claim,
        consensus_label: consensusLabel,
        consensus_confidence: parseFloat(avgConfidence.toFixed(2)),
        model_votes: modelVotes,
        model_count: modelVotes.length,
        errors: errors.length > 0 ? errors : undefined,
      });

      console.log(`  🎯 Consensus: ${consensusLabel} (${modelVotes.length}/3 models, ${(avgConfidence * 100).toFixed(1)}% confidence)`);
    } catch (error) {
      console.error(`❌ Classification error for claim "${claim.substring(0, 50)}...":`, error.message);
      
      results.push({
        claim,
        consensus_label: 'factual_inconsistency',
        consensus_confidence: 0,
        model_votes: [],
        model_count: 0,
        error: error.message,
      });
    }
  }

  console.log(`✅ Classification complete: ${results.length} claims processed`);
  return results;
}

/**
 * Simple classification with fallback to first available model
 */
export async function classifySimple(claim, context) {
  const models = [
    { name: 'openai', fn: () => classifyWithOpenAI(claim, context) },
    { name: 'gemini', fn: () => classifyWithGemini(claim, context) },
    { name: 'grok', fn: () => classifyWithGrok(claim, context) },
  ];

  for (const model of models) {
    try {
      const result = await model.fn();
      console.log(`✅ ${model.name}: ${result.label}`);
      return { ...result, model: model.name };
    } catch (error) {
      console.warn(`⚠️ ${model.name} failed: ${error.message}`);
    }
  }

  // Fallback
  console.warn('⚠️ All models failed, returning default classification');
  return {
    label: 'factual_inconsistency',
    confidence: 0,
    explanation: 'Could not classify - all models failed',
    model: 'none',
  };
}

export default {
  classifyWithOpenAI,
  classifyWithGemini,
  classifyWithGrok,
  classifyWithConsensus,
  classifySimple,
};
