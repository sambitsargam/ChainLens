import { compareTwoStrings } from 'string-similarity';
import { compareTextsWithEmbeddings, batchCompareWithEmbeddings } from '../llm/embeddings.js';

/**
 * Text Comparison Logic
 * 
 * Compares Wikipedia and Grokipedia articles using both:
 * - Semantic embeddings (AI-powered understanding)
 * - String similarity (fast baseline)
 * 
 * Identifies:
 * - Global similarity score
 * - Sentences added in Grokipedia
 * - Sentences missing in Grokipedia
 */

/**
 * Split text into sentences using basic sentence boundaries
 * 
 * @param {string} text - Text to split into sentences
 * @returns {Array<string>} Array of sentences
 */
export function splitIntoSentences(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Split on periods, exclamation marks, question marks followed by space/newline
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30); // Filter out short fragments (increased from 10 to 30)
  
  return sentences;
}

/**
 * Calculate similarity between two sentences
 * 
 * @param {string} s1 - First sentence
 * @param {string} s2 - Second sentence
 * @returns {number} Similarity score between 0 and 1
 */
function sentenceSimilarity(s1, s2) {
  const normalized1 = s1.toLowerCase().trim();
  const normalized2 = s2.toLowerCase().trim();
  
  if (normalized1 === normalized2) {
    return 1.0;
  }
  
  return compareTwoStrings(normalized1, normalized2);
}

/**
 * Find sentences in source that don't have close matches in target
 * Uses semantic embeddings for better accuracy
 * 
 * @param {Array<string>} sourceSentences - Source sentences
 * @param {Array<string>} targetSentences - Target sentences
 * @param {number} threshold - Similarity threshold (default 0.65 for embeddings)
 * @param {string} label - Label for logging (e.g., 'added', 'missing')
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Array<string>>} Sentences from source not found in target
 */
async function findUnmatchedSentences(sourceSentences, targetSentences, threshold = 0.65, label = '', onProgress = null) {
  const unmatched = [];
  
  if (sourceSentences.length === 0 || targetSentences.length === 0) {
    return sourceSentences; // All source sentences are unmatched if no target
  }
  
  // Limit to first 5 sentences to keep processing fast
  const limitedSource = sourceSentences.slice(0, 5);
  const limitedTarget = targetSentences.slice(0, 5);
  
  try {
    // Use batch embedding comparison for efficiency
    console.log(`  → Comparing ${limitedSource.length} ${label} sentences using embeddings (limited from ${sourceSentences.length})...`);
    
    for (let i = 0; i < limitedSource.length; i++) {
      const sourceSent = limitedSource[i];
      console.log(`\n    [${i + 1}/${limitedSource.length}] ${label.toUpperCase()}:`);
      console.log(`    Source: "${sourceSent.substring(0, 80)}..."`);
      
      // Compare this sentence against all target sentences using embeddings
      const batchResults = await batchCompareWithEmbeddings(sourceSent, limitedTarget);
      
      // Find the highest similarity score and best match
      const maxSimilarity = Math.max(...batchResults.map(r => r.similarity));
      const bestMatch = batchResults.find(r => r.similarity === maxSimilarity);
      const matchedSentence = bestMatch ? limitedTarget[bestMatch.targetIndex] : null;
      
      // If no sentence in target is similar enough, mark as unmatched
      if (maxSimilarity < threshold) {
        unmatched.push(sourceSent);
        console.log(`    ✗ DISCREPANCY: ${(maxSimilarity * 100).toFixed(1)}% similarity (threshold: ${(threshold * 100).toFixed(0)}%)`);
        if (matchedSentence) {
          console.log(`    Closest match: "${matchedSentence.substring(0, 80)}..."`);
        }
      } else {
        console.log(`    ✓ Matched: ${(maxSimilarity * 100).toFixed(1)}% similarity`);
        if (matchedSentence) {
          console.log(`    Target: "${matchedSentence.substring(0, 80)}..."`);
        }
      }
      
      // Send progress update if callback provided
      if (onProgress) {
        onProgress({
          label,
          current: i + 1,
          total: limitedSource.length,
          percent: Math.round(((i + 1) / limitedSource.length) * 100),
          matched: maxSimilarity >= threshold,
          similarity: maxSimilarity,
          message: `Analyzing ${label} sentence ${i + 1}/${limitedSource.length} (${(maxSimilarity * 100).toFixed(1)}% similarity)`
        });
      }
      
      // Early stopping: if we found enough discrepancies (5+), stop processing
      if (unmatched.length >= 5) {
        console.log(`  ⚡ Early stopping: Found ${unmatched.length} discrepancies, stopping further comparison`);
        break;
      }
    }
    
    console.log(`  ✓ Found ${unmatched.length} unmatched ${label} sentences (threshold: ${threshold})`);
  } catch (error) {
    // Fallback to string similarity if embeddings fail
    console.warn(`  ⚠ Embedding comparison failed for ${label}, using string similarity:`, error.message);
    
    for (let i = 0; i < limitedSource.length; i++) {
      const sourceSent = limitedSource[i];
      let maxSimilarity = 0;
      
      for (const targetSent of limitedTarget) {
        const similarity = sentenceSimilarity(sourceSent, targetSent);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
        }
      }
      
      // Use higher threshold for string similarity (0.7 instead of 0.65)
      if (maxSimilarity < 0.7) {
        unmatched.push(sourceSent);
      }
      
      // Send progress update if callback provided
      if (onProgress) {
        onProgress({
          label,
          current: i + 1,
          total: limitedSource.length,
          percent: Math.round(((i + 1) / limitedSource.length) * 100),
          matched: maxSimilarity >= 0.7,
          similarity: maxSimilarity,
          message: `Analyzing ${label} sentence ${i + 1}/${limitedSource.length} (fallback: ${(maxSimilarity * 100).toFixed(1)}% similarity)`
        });
      }
      
      // Early stopping in fallback too
      if (unmatched.length >= 5) {
        console.log(`  ⚡ Early stopping: Found ${unmatched.length} discrepancies, stopping further comparison`);
        break;
      }
    }
  }
  
  return unmatched;
}

/**
 * Compare two articles and identify discrepancies using semantic embeddings
 * 
 * @param {Object} wikiArticle - Wikipedia article object
 * @param {Object} grokArticle - Grokipedia article object
 * @param {Function} onProgress - Optional progress callback for real-time updates
 * @returns {Promise<Object>} Comparison result with similarity and discrepancies
 */
export async function compareArticles(wikiArticle, grokArticle, onProgress = null) {
  const wikiText = wikiArticle.text || '';
  const grokText = grokArticle.text || '';
  
  // Calculate global similarity using semantic embeddings
  let globalSimilarity;
  let comparisonMetadata = {};
  
  try {
    console.log('→ Computing semantic similarity with embeddings...');
    const embeddingResult = await compareTextsWithEmbeddings(wikiText, grokText);
    globalSimilarity = embeddingResult.similarity;
    comparisonMetadata = {
      method: 'semantic-embedding',
      provider: embeddingResult.provider,
      embeddingDimension: embeddingResult.embeddingDimension,
      rawSimilarity: embeddingResult.rawSimilarity
    };
    console.log(`✓ Semantic similarity: ${(globalSimilarity * 100).toFixed(2)}% via ${embeddingResult.provider} (${embeddingResult.embeddingDimension}D)`);
  } catch (error) {
    // Fallback to string similarity if embeddings fail
    console.warn('⚠ Embedding comparison failed, using string similarity fallback:', error.message);
    globalSimilarity = compareTwoStrings(
      wikiText.toLowerCase(),
      grokText.toLowerCase()
    );
    comparisonMetadata = {
      method: 'string-similarity',
      provider: 'fallback',
      error: error.message
    };
    console.log(`✓ String similarity: ${(globalSimilarity * 100).toFixed(2)}%`);
  }
  
  // Split into sentences
  const wikiSentences = splitIntoSentences(wikiText);
  const grokSentences = splitIntoSentences(grokText);
  
  console.log(`→ Split: ${wikiSentences.length} Wiki sentences, ${grokSentences.length} Grok sentences`);
  
  console.log(`\n→ Analyzing discrepancies between ${grokSentences.length} Grok sentences and ${wikiSentences.length} Wiki sentences...`);
  console.log('Sample Grok sentence:', grokSentences[0]?.substring(0, 100));
  console.log('Sample Wiki sentence:', wikiSentences[0]?.substring(0, 100));
  
  // Find sentences added in Grokipedia (not in Wikipedia) using embeddings
  // Lower threshold to 0.35 - sentences need to be VERY different to be flagged
  const addedInGrok = await findUnmatchedSentences(grokSentences, wikiSentences, 0.35, 'added', onProgress);
  
  // Find sentences missing in Grokipedia (present in Wikipedia) using embeddings
  const missingInGrok = await findUnmatchedSentences(wikiSentences, grokSentences, 0.35, 'missing', onProgress);
  
  console.log(`✓ Found ${addedInGrok.length} added and ${missingInGrok.length} missing sentences`);
  if (addedInGrok.length > 0) {
    console.log('Example added:', addedInGrok[0]?.substring(0, 150));
  }
  if (missingInGrok.length > 0) {
    console.log('Example missing:', missingInGrok[0]?.substring(0, 150));
  }
  
  return {
    globalSimilarity: Math.round(globalSimilarity * 100) / 100, // Round to 2 decimals
    comparisonMetadata,
    addedInGrok,
    missingInGrok,
    stats: {
      wikiSentenceCount: wikiSentences.length,
      grokSentenceCount: grokSentences.length,
      addedCount: addedInGrok.length,
      missingCount: missingInGrok.length,
    },
  };
}

export default {
  splitIntoSentences,
  compareArticles,
};
