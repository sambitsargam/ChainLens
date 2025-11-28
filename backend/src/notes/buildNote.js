/**
 * Community Notes JSON-LD Builder
 * 
 * Builds JSON-LD structured data for Community Notes compatible
 * with OriginTrail DKG Knowledge Assets.
 */

/**
 * Build a Community Note as JSON-LD
 * 
 * Creates a structured JSON-LD document representing the comparison
 * between Grokipedia and Wikipedia for a given topic, including
 * all discrepancies and their LLM ensemble classifications.
 * 
 * @param {Object} params - Note building parameters
 * @returns {Object} JSON-LD Community Note with public and private graphs
 */
export function buildCommunityNote(params) {
  const { topic, wikiArticle, grokArticle, analysis } = params;
  
  const timestamp = new Date().toISOString();
  const noteId = `urn:grok-wiki-note:${encodeURIComponent(topic)}:${Date.now()}`;
  
  // Build public graph
  const publicGraph = {
    '@context': [
      'https://schema.org',
      {
        'gw': 'https://example.org/grok-wiki#',
      },
    ],
    '@id': noteId,
    '@type': 'Comment',
    'name': `Truth Alignment Note: ${topic}`,
    'about': topic,
    'dateCreated': timestamp,
    'gw:alignmentScore': analysis.alignmentScore,
    'gw:sourceWikipedia': wikiArticle.meta.url,
    'gw:sourceGrokipedia': grokArticle.meta.url,
    'gw:statistics': {
      '@type': 'gw:ComparisonStatistics',
      'gw:wikipediaSentenceCount': analysis.stats.wikiSentenceCount,
      'gw:grokipediaSentenceCount': analysis.stats.grokSentenceCount,
      'gw:addedInGrokCount': analysis.stats.addedCount,
      'gw:missingInGrokCount': analysis.stats.missingCount,
      'gw:discrepanciesAnalyzed': analysis.stats.discrepanciesAnalyzed,
    },
    'gw:discrepancies': analysis.discrepancies.map((d, index) => ({
      '@id': `${noteId}#disc-${index}`,
      '@type': 'gw:Discrepancy',
      'gw:discrepancyType': d.type,
      'gw:grokipediaClaim': d.grokipedia_claim || null,
      'gw:wikipediaClaim': d.wikipedia_claim || null,
      'gw:explanation': d.explanation,
      'gw:modelVotes': d.model_votes.map((v, vIndex) => ({
        '@id': `${noteId}#disc-${index}-vote-${vIndex}`,
        '@type': 'gw:ModelVote',
        'gw:model': v.model,
        'gw:label': v.label,
        'gw:explanation': v.explanation,
      })),
      'gw:modelDisagreement': d.model_disagreement,
    })),
  };
  
  // Build private graph (minimal for now, can contain sensitive metadata)
  const privateGraph = {
    '@context': 'https://schema.org',
    '@id': `${noteId}#private`,
    '@type': 'PrivateNote',
    'dateCreated': timestamp,
    'creator': 'Grokipedia Truth Alignment System',
  };
  
  return {
    public: publicGraph,
    private: privateGraph,
  };
}

/**
 * Validate Community Note structure
 * 
 * @param {Object} note - Community Note to validate
 * @returns {boolean} True if valid
 */
export function validateCommunityNote(note) {
  if (!note.public || !note.private) {
    throw new Error('Community Note must have both public and private graphs');
  }
  
  if (!note.public['@id'] || !note.public['@type']) {
    throw new Error('Public graph must have @id and @type');
  }
  
  if (!note.public['gw:alignmentScore']) {
    throw new Error('Public graph must have alignment score');
  }
  
  return true;
}

export default {
  buildCommunityNote,
  validateCommunityNote,
};
