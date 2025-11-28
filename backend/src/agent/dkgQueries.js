import { getDKG } from '../config/dkgClient.js';

/**
 * DKG Query Layer for MCP/Agent Integration
 * 
 * Provides query functions that external LLM agents can use via MCP
 * to retrieve Community Notes from the DKG.
 */

// In-memory cache of published notes (in production, use a database)
const notesCache = new Map();

/**
 * Cache a published note for quick retrieval
 * 
 * @param {string} topic - Topic name
 * @param {Object} noteInfo - Note information including UAL
 */
export function cacheNote(topic, noteInfo) {
  const topicKey = topic.toLowerCase().trim();
  
  if (!notesCache.has(topicKey)) {
    notesCache.set(topicKey, []);
  }
  
  notesCache.get(topicKey).push({
    ...noteInfo,
    cachedAt: new Date().toISOString(),
  });
}

/**
 * Search for Community Notes by topic
 * 
 * Returns cached notes for a given topic. In a production system,
 * this would query a database or use DKG's graph query capabilities.
 * 
 * @param {string} topic - Topic to search for
 * @returns {Promise<Array>} Array of matching notes
 */
export async function searchNotesByTopic(topic) {
  const topicKey = topic.toLowerCase().trim();
  
  const cachedNotes = notesCache.get(topicKey) || [];
  
  // Return summary information
  return cachedNotes.map(note => ({
    topic: note.topic,
    ual: note.ual,
    alignmentScore: note.alignmentScore,
    discrepancyCount: note.discrepancyCount,
    createdAt: note.createdAt,
    cachedAt: note.cachedAt,
  }));
}

/**
 * Get all available topics with notes
 * 
 * @returns {Array} Array of topics
 */
export function getAllTopics() {
  return Array.from(notesCache.keys());
}

/**
 * Get detailed note information by UAL
 * 
 * Fetches the full Knowledge Asset from the DKG.
 * 
 * @param {string} ual - Universal Asset Locator
 * @returns {Promise<Object>} Full note data
 */
export async function getNoteByUAL(ual) {
  try {
    const dkg = getDKG();
    const result = await dkg.asset.get(ual);
    
    return {
      ual,
      public: result.assertion?.public || result.public,
      private: result.assertion?.private || result.private,
    };
  } catch (error) {
    console.error(`Error retrieving note ${ual}:`, error.message);
    throw new Error(`Failed to retrieve note: ${error.message}`);
  }
}

/**
 * Query DKG for assets matching criteria (advanced)
 * 
 * This is a placeholder for more sophisticated DKG graph queries.
 * In production, you would use SPARQL queries or DKG's query API.
 * 
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} Matching assets
 */
export async function queryDKG(criteria) {
  try {
    // This is a simplified version - in production, implement proper graph queries
    console.log('Querying DKG with criteria:', criteria);
    
    // For now, return cached results
    if (criteria.topic) {
      return searchNotesByTopic(criteria.topic);
    }
    
    return [];
  } catch (error) {
    console.error('DKG query error:', error.message);
    throw new Error(`DKG query failed: ${error.message}`);
  }
}

export default {
  cacheNote,
  searchNotesByTopic,
  getAllTopics,
  getNoteByUAL,
  queryDKG,
};
