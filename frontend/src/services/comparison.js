/**
 * Text Comparison Service
 * Compares Wikipedia and Grokipedia articles using embeddings
 */

import { getOpenAIEmbedding, cosineSimilarity } from './embeddings.js';

export function splitIntoSentences(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);
  
  return sentences;
}

export async function compareArticles(wikiArticle, grokArticle, onProgress) {
  const wikiSentences = splitIntoSentences(wikiArticle.text);
  const grokSentences = splitIntoSentences(grokArticle.text);
  
  console.log(`Comparing ${wikiSentences.length} Wiki vs ${grokSentences.length} Grok sentences`);
  
  // Compare for added sentences (in Grok but not Wiki)
  const addedInGrok = [];
  const threshold = 0.85; // 85% similarity = match
  
  for (let i = 0; i < grokSentences.length; i++) {
    const grokSent = grokSentences[i];
    
    if (onProgress) {
      onProgress({
        type: 'comparison',
        current: i + 1,
        total: grokSentences.length,
        sentence: grokSent.substring(0, 50) + '...',
      });
    }
    
    // Get embedding for grok sentence
    const grokEmbed = await getOpenAIEmbedding(grokSent);
    
    // Compare against all wiki sentences
    let maxSimilarity = 0;
    for (const wikiSent of wikiSentences) {
      const wikiEmbed = await getOpenAIEmbedding(wikiSent);
      const similarity = cosineSimilarity(grokEmbed, wikiEmbed);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }
    
    // If no match found, it's a discrepancy
    if (maxSimilarity < threshold) {
      addedInGrok.push(grokSent);
      console.log(`Discrepancy found: ${(maxSimilarity * 100).toFixed(1)}% similarity`);
    }
  }
  
  console.log(`✓ Found ${addedInGrok.length} discrepancies`);
  
  return {
    globalSimilarity: 0.8, // Placeholder
    addedInGrok,
    missingInGrok: [], // Simplified for now
    stats: {
      wikiSentenceCount: wikiSentences.length,
      grokSentenceCount: grokSentences.length,
      addedCount: addedInGrok.length,
      missingCount: 0,
    },
  };
}
