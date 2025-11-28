/**
 * LLM Classification Service
 * Classifies discrepancies using OpenAI, Gemini, and Grok
 * Includes rate limiting, retry logic, and graceful fallbacks
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;

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
        }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || Math.pow(2, attempt);
        console.warn(`OpenAI rate limited, retrying after ${retryAfter}s (attempt ${attempt + 1}/${retries})`);
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
  const prompt = `Classify this discrepancy as ONE of: factual_inconsistency, missing_context, hallucination, bias, aligned

Grokipedia: "${grokSentence}"
Wikipedia: "${wikiContext}"

Respond with JSON: {"label": "...", "explanation": "..."}`;

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
            maxOutputTokens: 2000,
            responseMimeType: 'application/json',
          },
        }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        console.warn(`Gemini rate limited (attempt ${attempt + 1}/${retries}), skipping`);
        throw new Error('Gemini rate limited');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new Error('Invalid Gemini response structure: no candidates');
      }
      
      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid Gemini response structure: no content');
      }
      
      const content = candidate.content.parts[0].text.trim();
      return JSON.parse(content);
    } catch (error) {
      if (attempt === retries - 1) {
        console.warn(`Gemini classification failed: ${error.message}`);
        return null;
      }
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}

/**
 * Classify discrepancies with multi-model voting and fallbacks
 */
export async function classifyDiscrepancies(discrepancies, wikiText) {
  const classified = [];
  const wikiContext = wikiText.substring(0, 500);
  
  console.log(`Classifying ${discrepancies.length} discrepancies with OpenAI...`);
  
  for (const sentence of discrepancies.slice(0, 5)) {
    try {
      let openaiResult = null;
      let geminiResult = null;
      
      // Try OpenAI first (more reliable)
      try {
        openaiResult = await classifyWithOpenAI(sentence, wikiContext);
      } catch (error) {
        console.warn(`OpenAI classification failed: ${error.message}`);
      }
      
      // Try Gemini as backup (with rate limit tolerance)
      try {
        geminiResult = await classifyWithGemini(sentence, wikiContext);
      } catch (error) {
        console.warn(`Gemini classification failed: ${error.message}`);
      }
      
      // Determine final classification
      const finalLabel = openaiResult?.label || geminiResult?.label || 'factual_inconsistency';
      const explanation = openaiResult?.explanation || geminiResult?.explanation || 'Could not fully classify';
      
      const modelVotes = [];
      if (openaiResult) modelVotes.push({ model: 'openai', label: openaiResult.label, explanation: openaiResult.explanation });
      if (geminiResult) modelVotes.push({ model: 'gemini', label: geminiResult.label, explanation: geminiResult.explanation });
      
      classified.push({
        type: finalLabel,
        grokipedia_claim: sentence,
        wikipedia_claim: null,
        explanation,
        model_votes: modelVotes,
      });
      
      console.log(`✓ Classified: ${finalLabel}`);
    } catch (error) {
      console.error(`Classification error for sentence "${sentence.substring(0, 50)}...":`, error);
      
      // Add fallback classification
      classified.push({
        type: 'factual_inconsistency',
        grokipedia_claim: sentence,
        wikipedia_claim: null,
        explanation: `Classification failed: ${error.message}`,
        model_votes: [],
      });
    }
  }
  
  return classified;
}
