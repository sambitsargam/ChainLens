import axios from 'axios';
import { llmConfig } from '../../config/llmConfig.js';

/**
 * Google Gemini Client for Discrepancy Classification
 * 
 * Uses Google's Gemini API to classify content discrepancies
 * between Grokipedia and Wikipedia.
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
 * Classify discrepancy using Google Gemini
 * 
 * @param {Object} input - Discrepancy input with topic, sentences, context
 * @returns {Promise<Object>} Classification result with label and explanation
 */
export async function classifyDiscrepancyWithGemini(input) {
  if (!llmConfig.gemini.apiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  try {
    const prompt = buildClassificationPrompt(input);
    
    const url = `https://generativelanguage.googleapis.com/v1/models/${llmConfig.gemini.model}:generateContent?key=${llmConfig.gemini.apiKey}`;
    
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    const content = response.data.candidates[0].content.parts[0].text.trim();
    
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
      console.warn(`Gemini returned invalid label: ${result.label}, defaulting to 'factual_inconsistency'`);
      result.label = 'factual_inconsistency';
    }
    
    return {
      label: result.label,
      explanation: result.explanation || 'No explanation provided',
    };
  } catch (error) {
    console.error('Gemini classification error:', error.message);
    
    if (error.response?.status === 400) {
      throw new Error('Gemini API bad request - check your configuration');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Gemini API rate limit exceeded');
    }
    
    throw new Error(`Gemini classification failed: ${error.message}`);
  }
}

export default {
  classifyDiscrepancyWithGemini,
};
