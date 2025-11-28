import axios from 'axios';
import { llmConfig } from '../config/llmConfig.js';

/**
 * Embedding Service
 * 
 * Provides semantic embeddings from multiple providers for better text comparison.
 * Supports OpenAI, Gemini, and local alternatives.
 */

/**
 * Get embeddings from OpenAI
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} Embedding vector
 */
export async function getOpenAIEmbedding(text) {
  if (!llmConfig.openai.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Truncate text if too long (OpenAI has 8191 token limit for embeddings)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;
    
    const response = await axios.post(
      llmConfig.openai.embeddingEndpoint,
      {
        input: truncatedText,
        model: llmConfig.openai.embeddingModel,
      },
      {
        headers: {
          'Authorization': `Bearer ${llmConfig.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    if (error.response?.data) {
      console.error('OpenAI embedding error:', error.response.data);
    } else {
      console.error('OpenAI embedding error:', error.message);
    }
    throw new Error(`OpenAI embedding failed: ${error.message}`);
  }
}

/**
 * Get embeddings from Google Gemini
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} Embedding vector
 */
export async function getGeminiEmbedding(text) {
  if (!llmConfig.gemini.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  try {
    // Use v1beta for Gemini embeddings
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${llmConfig.gemini.embeddingModel}:embedContent?key=${llmConfig.gemini.apiKey}`;
    
    const response = await axios.post(
      url,
      {
        content: {
          parts: [{ text }],
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.embedding.values;
  } catch (error) {
    console.error('Gemini embedding error:', error.message);
    throw new Error(`Gemini embedding failed: ${error.message}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} Similarity score between -1 and 1
 */
export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Get embedding using ensemble of available providers
 * Falls back to next provider if one fails
 * @param {string} text - Text to embed
 * @returns {Promise<Object>} Embedding vector and provider used
 */
export async function getEmbeddingWithFallback(text) {
  // Try OpenAI first (most reliable)
  if (llmConfig.openai.apiKey) {
    try {
      const embedding = await getOpenAIEmbedding(text);
      return { embedding, provider: 'openai' };
    } catch (error) {
      console.warn('OpenAI embedding failed, trying Gemini...');
    }
  }

  // Try Gemini as fallback
  if (llmConfig.gemini.apiKey) {
    try {
      const embedding = await getGeminiEmbedding(text);
      return { embedding, provider: 'gemini' };
    } catch (error) {
      console.warn('Gemini embedding failed');
    }
  }

  throw new Error('No embedding providers available or all failed');
}

/**
 * Compare two texts using semantic embeddings
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {Promise<Object>} Similarity score and metadata
 */
export async function compareTextsWithEmbeddings(text1, text2) {
  try {
    // Get embeddings for both texts
    const result1 = await getEmbeddingWithFallback(text1);
    const result2 = await getEmbeddingWithFallback(text2);

    // Calculate cosine similarity
    const similarity = cosineSimilarity(result1.embedding, result2.embedding);

    return {
      similarity: Math.max(0, Math.min(1, (similarity + 1) / 2)), // Normalize to 0-1
      rawSimilarity: similarity,
      provider: result1.provider,
      embeddingDimension: result1.embedding.length,
    };
  } catch (error) {
    console.error('Embedding comparison failed:', error.message);
    throw error;
  }
}

/**
 * Compare one source sentence against multiple target sentences
 * @param {string} sourceSentence - Source sentence to compare
 * @param {Array<string>} targetSentences - Array of target sentences
 * @returns {Promise<Array<Object>>} Array of similarity scores
 */
export async function batchCompareWithEmbeddings(sourceSentence, targetSentences) {
  const results = [];
  
  try {
    // Get source embedding once and determine which provider worked
    const sourceResult = await getEmbeddingWithFallback(sourceSentence);
    const provider = sourceResult.provider;
    
    // Use the SAME provider for all target sentences to ensure matching dimensions
    const getEmbeddingFunc = provider === 'openai' ? getOpenAIEmbedding : getGeminiEmbedding;
    
    // Compare against each target sentence using the same provider
    for (let i = 0; i < targetSentences.length; i++) {
      try {
        const targetEmbedding = await getEmbeddingFunc(targetSentences[i]);
        const similarity = cosineSimilarity(sourceResult.embedding, targetEmbedding);
        
        results.push({
          similarity: Math.max(0, Math.min(1, (similarity + 1) / 2)),
          rawSimilarity: similarity,
          targetIndex: i,
        });
      } catch (error) {
        console.error(`Error comparing target sentence ${i}: ${error.message}`);
        results.push({
          similarity: 0,
          targetIndex: i,
          error: error.message,
        });
      }
    }
  } catch (error) {
    console.error('Error getting source embedding:', error.message);
    // Return zero similarities for all targets
    for (let i = 0; i < targetSentences.length; i++) {
      results.push({ similarity: 0, targetIndex: i, error: error.message });
    }
  }
  
  return results;
}

export default {
  getOpenAIEmbedding,
  getGeminiEmbedding,
  getEmbeddingWithFallback,
  cosineSimilarity,
  compareTextsWithEmbeddings,
  batchCompareWithEmbeddings,
};
