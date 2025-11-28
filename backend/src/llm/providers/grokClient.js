import axios from 'axios';
import { llmConfig } from '../../config/llmConfig.js';

/**
 * Groq Client for Discrepancy Classification
 * 
 * Uses Groq's API to classify content discrepancies
 * between Grokipedia and Wikipedia.
 * Note: Using Groq as an alternative to xAI's Grok.
 */

const CLASSIFICATION_LABELS = [
  'factual_inconsistency',
  'missing_context',
  'hallucination',
  'bias',
  'aligned',
];

/**
 * Build prompt for discrepancy classification
 */
function buildClassificationPrompt(input) {
  const { topic, grokipediaSentence, wikipediaSentence, wikipediaContext } = input;
  
  let prompt = `You are an expert fact-checker analyzing discrepancies between two sources: Grokipedia and Wikipedia.

Topic: ${topic}

`;

  if (grokipediaSentence && !wikipediaSentence) {
    prompt += `Grokipedia contains this claim that is NOT present in Wikipedia:
"${grokipediaSentence}"

Wikipedia context (for reference):
"${wikipediaContext}"

`;
  } else if (wikipediaSentence && !grokipediaSentence) {
    prompt += `Wikipedia contains this claim that is MISSING in Grokipedia:
"${wikipediaSentence}"

`;
  } else {
    prompt += `Grokipedia claim: "${grokipediaSentence}"
Wikipedia claim: "${wikipediaSentence}"

`;
  }

  prompt += `Classify this discrepancy into ONE of these categories:
- factual_inconsistency: Direct contradiction of facts
- missing_context: Information present in one source but absent in the other
- hallucination: Claim with no factual basis or verification
- bias: Slanted or one-sided presentation
- aligned: Sources are consistent (no real discrepancy)

Respond ONLY with valid JSON in this exact format:
{
  "label": "one_of_the_labels_above",
  "explanation": "Brief explanation in 1-2 sentences"
}`;

  return prompt;
}

/**
 * Classify discrepancy using Grok (xAI)
 * 
 * @param {Object} input - Discrepancy input with topic, sentences, context
 * @returns {Promise<Object>} Classification result with label and explanation
 */
export async function classifyDiscrepancyWithGrok(input) {
  if (!llmConfig.grok.apiKey) {
    throw new Error('Grok API key not configured');
  }
  
  try {
    const prompt = buildClassificationPrompt(input);
    
    const response = await axios.post(
      llmConfig.grok.endpoint,
      {
        model: llmConfig.grok.model,
        messages: [
          {
            role: 'system',
            content: 'You are a precise fact-checking assistant that responds only with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${llmConfig.grok.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    const content = response.data.choices[0].message.content.trim();
    
    // Parse JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw parseError;
      }
    }
    
    // Validate label
    if (!CLASSIFICATION_LABELS.includes(result.label)) {
      console.warn(`Grok returned invalid label: ${result.label}, defaulting to 'factual_inconsistency'`);
      result.label = 'factual_inconsistency';
    }
    
    return {
      label: result.label,
      explanation: result.explanation || 'No explanation provided',
    };
  } catch (error) {
    console.error('Grok classification error:', error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Groq API authentication failed - check your API key');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Groq API rate limit exceeded');
    }
    
    if (error.response?.status === 400) {
      console.warn('Groq API returned 400, possibly model unavailable');
      throw new Error('Groq API bad request - check model availability');
    }
    
    throw new Error(`Groq classification failed: ${error.message}`);
  }
}

export default {
  classifyDiscrepancyWithGrok,
};
