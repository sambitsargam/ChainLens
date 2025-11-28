/**
 * Text Comparison Service
 * Compares Wikipedia and Grokipedia articles using embeddings
 * Reference implementation: copy/dkg-web-main/lib/analysis-utils.ts
 */

import { getOpenAIEmbedding, cosineSimilarity } from './embeddings.js';

/**
 * Split text into meaningful sentences
 * Filters: 5+ words, 20-500 chars, factual statements (no questions/commands)
 * Max 5 sentences returned
 */
export function splitIntoSentences(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Split by sentence markers and filter for meaningful claims
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map(s => s.trim())
    .filter(s => {
      const wordCount = s.split(/\s+/).length;
      // Must be 5+ words, 20-500 chars, factual statements
      return (
        s.length >= 20 &&
        s.length <= 500 &&
        wordCount >= 5 &&
        !s.toLowerCase().startsWith('what ') &&
        !s.toLowerCase().startsWith('how ') &&
        !s.toLowerCase().startsWith('why ') &&
        !s.toLowerCase().startsWith('please ') &&
        !s.endsWith('?')
      );
    })
    .slice(0, 5); // Max 5 sentences
  
  return sentences;
}

/**
 * Compare two articles using semantic similarity
 * Returns discrepancies found between sources
 */
export async function compareArticles(wikiArticle, grokArticle, onProgress) {
  const wikiSentences = splitIntoSentences(wikiArticle.text);
  const grokSentences = splitIntoSentences(grokArticle.text);
  
  console.log(`Comparing ${wikiSentences.length} Wiki vs ${grokSentences.length} Grok sentences`);
  
  // Compare for added sentences (in Grok but not Wiki)
  const addedInGrok = [];
  const threshold = 0.70; // 70% similarity = match (more lenient for better discrepancy detection)
  
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
