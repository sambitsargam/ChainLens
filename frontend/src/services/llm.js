/**
 * LLM Classification Service
 * Classifies discrepancies using OpenAI, Gemini, and Grok
 * Includes rate limiting, retry logic, and graceful fallbacks
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;

console.log('🔧 LLM Service Configuration:');
console.log('✓ OpenAI API Key:', OPENAI_API_KEY ? '✓ Configured' : '✗ Missing');
console.log('✓ Gemini API Key:', GEMINI_API_KEY ? '✓ Configured' : '✗ Missing');
console.log('✓ Grok API Key:', GROK_API_KEY ? '✓ Configured' : '✗ Missing');

/**
 * Sleep utility for retries
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Classify with OpenAI with retry logic
 */
export async function classifyWithOpenAI(grokSentence, wikiContext, retries = 3) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are a fact-checker. Classify this discrepancy:

Grokipedia claim: "${grokSentence}"
Wikipedia context: "${wikiContext}"

Classify as ONE of: factual_inconsistency, missing_context, hallucination, bias, aligned

Respond ONLY with JSON: {"label": "...", "explanation": "..."}`;

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

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || Math.pow(2, attempt);
        console.warn(`🔄 OpenAI rate limited, retrying after ${retryAfter}s (attempt ${attempt + 1}/${retries})`);
        await sleep(parseInt(retryAfter) * 1000);
        continue;
      }

      if (!response.ok) {
        throw new Error(`OpenAI HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid OpenAI response structure');
      }
      
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}

/**
 * Classify with Gemini with retry logic and rate limiting
 */
export async function classifyWithGemini(grokSentence, wikiContext, retries = 2) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `Classify this discrepancy as ONE of: factual_inconsistency, missing_context, hallucination, bias, aligned

Grokipedia: "${grokSentence}"
Wikipedia: "${wikiContext}"

Respond with JSON: {"label": "...", "explanation": "..."}`;

  // Use the correct Gemini API endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: prompt }],
            role: 'user'
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        console.warn(`🔄 Gemini rate limited (attempt ${attempt + 1}/${retries}), retrying...`);
        await sleep(Math.pow(2, attempt) * 2000);
        continue;
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new Error('Invalid Gemini response: no candidates');
      }
      
      const candidate = data.candidates[0];
      if (candidate.finishReason !== 'STOP' && candidate.finishReason !== 'END_TURN') {
        throw new Error(`Gemini blocked: ${candidate.finishReason}`);
      }
      
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid Gemini response: no content');
      }
      
      const content = candidate.content.parts[0].text.trim();
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error(`🔴 Gemini attempt ${attempt + 1}/${retries} failed:`, error.message);
      if (attempt === retries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}

/**
 * Classify with Groq with retry logic
 */
export async function classifyWithGrok(grokSentence, wikiContext, retries = 2) {
  if (!GROK_API_KEY) {
    throw new Error('Grok API key not configured');
  }

  const prompt = `Classify this discrepancy as ONE of: factual_inconsistency, missing_context, hallucination, bias, aligned

Grokipedia: "${grokSentence}"
Wikipedia: "${wikiContext}"

Respond with JSON only: {"label": "...", "explanation": "..."}`;

  const url = 'https://api.groq.com/openai/v1/chat/completions';

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'groq/compound',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        console.warn(`🔄 Groq rate limited (attempt ${attempt + 1}/${retries}), retrying...`);
        await sleep(Math.pow(2, attempt) * 2000);
        continue;
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('Invalid Groq response: no choices');
      }
      
      const content = data.choices[0].message.content.trim();
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error(`🔴 Groq attempt ${attempt + 1}/${retries} failed:`, error.message);
      if (attempt === retries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}

/**
 * Classify discrepancies with multi-model voting and consensus
 */
export async function classifyDiscrepancies(discrepancies, wikiText) {
  const classified = [];
  const wikiContext = wikiText.substring(0, 500);
  
  console.log(`🤖 Classifying ${discrepancies.length} discrepancies with 3-model consensus...`);
  
  for (const sentence of discrepancies.slice(0, 5)) {
    try {
      let openaiResult = null;
      let geminiResult = null;
      let grokResult = null;
      const errors = [];
      
      // Attempt all 3 models in parallel with error handling
      const results = await Promise.allSettled([
        classifyWithOpenAI(sentence, wikiContext).then(r => ({ model: 'openai', result: r })),
        classifyWithGemini(sentence, wikiContext).then(r => ({ model: 'gemini', result: r })),
        classifyWithGrok(sentence, wikiContext).then(r => ({ model: 'grok', result: r })),
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
      
      if (openaiResult) {
        labels.push(openaiResult.label);
        modelVotes.push({ model: 'openai', label: openaiResult.label, explanation: openaiResult.explanation });
      }
      if (geminiResult) {
        labels.push(geminiResult.label);
        modelVotes.push({ model: 'gemini', label: geminiResult.label, explanation: geminiResult.explanation });
      }
      if (grokResult) {
        labels.push(grokResult.label);
        modelVotes.push({ model: 'grok', label: grokResult.label, explanation: grokResult.explanation });
      }

      // Get consensus or most common label
      const labelCounts = {};
      labels.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });
      
      const finalLabel = labels.length > 0 
        ? Object.keys(labelCounts).sort((a, b) => labelCounts[b] - labelCounts[a])[0]
        : 'factual_inconsistency';
      
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
        errors: errors.length > 0 ? errors : undefined,
      });
      
      console.log(`✓ Consensus: ${finalLabel} (${modelVotes.length}/3 models)`);
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
      });
    }
  }
  
  console.log(`✅ Classification complete: ${classified.length} discrepancies analyzed`);
  return classified;
}
