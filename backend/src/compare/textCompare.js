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
    .filter(s => s.length > 10); // Filter out very short fragments
  
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
 * @returns {Promise<Array<string>>} Sentences from source not found in target
 */
async function findUnmatchedSentences(sourceSentences, targetSentences, threshold = 0.65, label = '') {
  const unmatched = [];
  
  if (sourceSentences.length === 0 || targetSentences.length === 0) {
    return sourceSentences; // All source sentences are unmatched if no target
  }
  
  try {
    // Use batch embedding comparison for efficiency
    console.log(`  → Comparing ${sourceSentences.length} ${label} sentences using embeddings...`);
    
    for (let i = 0; i < sourceSentences.length; i++) {
      const sourceSent = sourceSentences[i];
      console.log(`    [${i + 1}/${sourceSentences.length}] Analyzing: "${sourceSent.substring(0, 50)}..."`);
      
      // Compare this sentence against all target sentences using embeddings
      const batchResults = await batchCompareWithEmbeddings(sourceSent, targetSentences);
      
      // Find the highest similarity score
      const maxSimilarity = Math.max(...batchResults.map(r => r.similarity));
      
      // If no sentence in target is similar enough, mark as unmatched
      if (maxSimilarity < threshold) {
        unmatched.push(sourceSent);
        console.log(`    ✗ Unmatched (max similarity: ${(maxSimilarity * 100).toFixed(1)}%)`);
      } else {
        console.log(`    ✓ Matched (max similarity: ${(maxSimilarity * 100).toFixed(1)}%)`);
      }
    }
    
    console.log(`  ✓ Found ${unmatched.length} unmatched ${label} sentences (threshold: ${threshold})`);
  } catch (error) {
    // Fallback to string similarity if embeddings fail
    console.warn(`  ⚠ Embedding comparison failed for ${label}, using string similarity:`, error.message);
    
    for (const sourceSent of sourceSentences) {
      let maxSimilarity = 0;
      
      for (const targetSent of targetSentences) {
        const similarity = sentenceSimilarity(sourceSent, targetSent);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
        }
      }
      
      // Use higher threshold for string similarity (0.7 instead of 0.65)
      if (maxSimilarity < 0.7) {
        unmatched.push(sourceSent);
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
 * @returns {Promise<Object>} Comparison result with similarity and discrepancies
 */
export async function compareArticles(wikiArticle, grokArticle) {
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
  
  // Find sentences added in Grokipedia (not in Wikipedia) using embeddings
  const addedInGrok = await findUnmatchedSentences(grokSentences, wikiSentences, 0.65, 'added');
  
  // Find sentences missing in Grokipedia (present in Wikipedia) using embeddings
  const missingInGrok = await findUnmatchedSentences(wikiSentences, grokSentences, 0.65, 'missing');
  
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
