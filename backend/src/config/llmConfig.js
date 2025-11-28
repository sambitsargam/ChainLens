import dotenv from 'dotenv';

dotenv.config();

/**
 * LLM Provider Configuration
 * 
 * Loads API keys and model settings for all LLM providers:
 * - OpenAI
 * - Google Gemini
 * - Grok/xAI
 */

export const llmConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    embeddingModel: 'text-embedding-3-small',
    embeddingEndpoint: 'https://api.openai.com/v1/embeddings',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  },
  grok: {
    apiKey: process.env.GROK_API_KEY || '',
    model: process.env.GROK_MODEL || 'llama-3.1-8b-instant',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  },
};

/**
 * Validate that required API keys are present
 */
export function validateLLMConfig() {
  const missingKeys = [];
  
  if (!llmConfig.openai.apiKey) missingKeys.push('OPENAI_API_KEY');
  if (!llmConfig.gemini.apiKey) missingKeys.push('GEMINI_API_KEY');
  if (!llmConfig.grok.apiKey) missingKeys.push('GROK_API_KEY');
  
  if (missingKeys.length > 0) {
    console.warn('⚠ Missing LLM API keys:', missingKeys.join(', '));
    console.warn('  Some LLM providers will be unavailable');
  } else {
    console.log('✓ All LLM API keys configured');
  }
  
  return missingKeys.length === 0;
}

export default llmConfig;
