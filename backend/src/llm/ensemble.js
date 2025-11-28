import { classifyDiscrepancyWithOpenAI } from './providers/openaiClient.js';
import { classifyDiscrepancyWithGemini } from './providers/geminiClient.js';
import { classifyDiscrepancyWithGrok } from './providers/grokClient.js';
import { llmConfig } from '../config/llmConfig.js';

/**
 * LLM Ensemble for Discrepancy Classification
 * 
 * Calls multiple LLM providers (OpenAI, Gemini, Grok) in parallel,
 * collects their classifications, and computes a majority vote.
 */

/**
 * Calculate majority vote label from multiple classifications
 * 
 * @param {Array} results - Array of classification results from different models
 * @returns {string} The label that received the most votes
 */
function calculateMajorityVote(results) {
  const votes = {};
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value?.label) {
      const label = result.value.label;
      votes[label] = (votes[label] || 0) + 1;
    }
  }
  
  // Find label with most votes
  let maxVotes = 0;
  let majorityLabel = 'factual_inconsistency'; // default
  
  for (const [label, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      majorityLabel = label;
    }
  }
  
  return majorityLabel;
}

/**
 * Check if there's disagreement among models
 * 
 * @param {Array} results - Array of classification results from different models
 * @returns {boolean} True if models disagree on classification
 */
function hasDisagreement(results) {
  const labels = new Set();
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value?.label) {
      labels.add(result.value.label);
    }
  }
  
  return labels.size > 1;
}

/**
 * Classify discrepancy using ensemble of LLM providers
 * 
 * Calls all available LLM providers in parallel, collects results,
 * and returns a consensus classification with individual model outputs.
 * 
 * @param {Object} input - Discrepancy input with topic, sentences, context
 * @returns {Promise<Object>} Ensemble classification result
 */
export async function classifyWithEnsemble(input) {
  const promises = [];
  const modelNames = [];
  
  // Add OpenAI if configured
  if (llmConfig.openai.apiKey) {
    promises.push(classifyDiscrepancyWithOpenAI(input));
    modelNames.push('openai');
  }
  
  // Add Gemini if configured
  if (llmConfig.gemini.apiKey) {
    promises.push(classifyDiscrepancyWithGemini(input));
    modelNames.push('gemini');
  }
  
  // Add Grok if configured
  if (llmConfig.grok.apiKey) {
    promises.push(classifyDiscrepancyWithGrok(input));
    modelNames.push('grok');
  }
  
  if (promises.length === 0) {
    throw new Error('No LLM providers configured - cannot perform ensemble classification');
  }
  
  // Call all providers in parallel
  const results = await Promise.allSettled(promises);
  
  // Collect results per model
  const perModel = results.map((result, index) => {
    const modelName = modelNames[index];
    
    if (result.status === 'fulfilled') {
      return {
        model: modelName,
        label: result.value.label,
        explanation: result.value.explanation,
      };
    } else {
      return {
        model: modelName,
        label: null,
        explanation: null,
        error: result.reason.message,
      };
    }
  });
  
  // Calculate majority vote
  const finalLabel = calculateMajorityVote(results);
  const disagreement = hasDisagreement(results);
  
  return {
    label: finalLabel,
    perModel,
    disagreement,
  };
}

export default {
  classifyWithEnsemble,
};
