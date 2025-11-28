import { classifyWithEnsemble } from '../llm/ensemble.js';

/**
 * Discrepancy Classification
 * 
 * Takes text comparison results and uses LLM ensemble to classify
 * each discrepancy into categories like factual_inconsistency,
 * missing_context, hallucination, bias, or aligned.
 */

/**
 * Build a discrepancy classification input for a single sentence
 * 
 * @param {Object} params - Parameters for building input
 * @returns {Object} Formatted input for LLM classification
 */
function buildClassificationInput(params) {
  const { topic, grokSentence, wikiSentence, wikipediaContext } = params;
  
  return {
    topic,
    grokipediaSentence: grokSentence || null,
    wikipediaSentence: wikiSentence || null,
    wikipediaContext: wikipediaContext || '',
  };
}

/**
 * Format model votes for a discrepancy
 * 
 * @param {Object} ensembleResult - Result from ensemble classification
 * @returns {Array} Formatted model votes
 */
function formatModelVotes(ensembleResult) {
  return ensembleResult.perModel.map(vote => ({
    model: vote.model,
    label: vote.label || 'error',
    explanation: vote.explanation || vote.error || 'Classification failed',
  }));
}

/**
 * Classify all discrepancies found in text comparison
 * 
 * Processes both sentences added in Grokipedia and sentences missing from it,
 * using the LLM ensemble to classify each discrepancy.
 * 
 * @param {Object} params - Classification parameters
 * @returns {Promise<Object>} Analysis result with alignment score and discrepancies
 */
export async function classifyDiscrepancies(params) {
  const { topic, wikiArticle, grokArticle, comparisonResult } = params;
  
  console.log(`→ Classifying discrepancies: ${comparisonResult.addedInGrok.length} added, ${comparisonResult.missingInGrok.length} missing`);
  
  const discrepancies = [];
  const wikipediaContext = wikiArticle.text.substring(0, 500); // First 500 chars for context
  
  // Process sentences added in Grokipedia
  const addedLimit = Math.min(comparisonResult.addedInGrok.length, 5); // Limit to 5 for API costs
  console.log(`  → Will classify ${addedLimit} added sentences`);
  
  for (let i = 0; i < addedLimit; i++) {
    const grokSentence = comparisonResult.addedInGrok[i];
    
    try {
      const input = buildClassificationInput({
        topic,
        grokSentence,
        wikiSentence: null,
        wikipediaContext,
      });
      
      const ensembleResult = await classifyWithEnsemble(input);
      
      discrepancies.push({
        topic,
        type: ensembleResult.label,
        grokipedia_claim: grokSentence,
        wikipedia_claim: null,
        explanation: `Grokipedia contains information not present in Wikipedia. ${ensembleResult.perModel.find(m => m.label === ensembleResult.label)?.explanation || ''}`,
        model_votes: formatModelVotes(ensembleResult),
        model_disagreement: ensembleResult.disagreement,
      });
    } catch (error) {
      console.error(`Error classifying added sentence: ${error.message}`);
      // Continue with next sentence
    }
  }
  
  // Process sentences missing in Grokipedia (optional, commented out to reduce API calls)
  // Uncomment if you want to also classify missing content
  /*
  const missingLimit = Math.min(comparisonResult.missingInGrok.length, 3);
  
  for (let i = 0; i < missingLimit; i++) {
    const wikiSentence = comparisonResult.missingInGrok[i];
    
    try {
      const input = buildClassificationInput({
        topic,
        grokSentence: null,
        wikiSentence,
        wikipediaContext,
      });
      
      const ensembleResult = await classifyWithEnsemble(input);
      
      discrepancies.push({
        topic,
        type: ensembleResult.label,
        grokipedia_claim: null,
        wikipedia_claim: wikiSentence,
        explanation: `Wikipedia contains information missing in Grokipedia. ${ensembleResult.perModel.find(m => m.label === ensembleResult.label)?.explanation || ''}`,
        model_votes: formatModelVotes(ensembleResult),
        model_disagreement: ensembleResult.disagreement,
      });
    } catch (error) {
      console.error(`Error classifying missing sentence: ${error.message}`);
    }
  }
  */
  
  console.log(`✓ Classified ${discrepancies.length} discrepancies`);
  
  return {
    topic,
    alignmentScore: comparisonResult.globalSimilarity,
    discrepancies,
    stats: {
      ...comparisonResult.stats,
      discrepanciesAnalyzed: discrepancies.length,
    },
  };
}

export default {
  classifyDiscrepancies,
};
