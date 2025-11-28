/**
 * Analysis Schema - Type definitions and validation
 * Based on: copy/dkg-web-main/lib/analysis-schema.ts
 */

/**
 * Analysis segment schema
 */
export const AnalysisSegmentSchema = {
  text: 'string',
  claims: 'array',
  keyword: 'string',
  issues: 'array',
  score: 'number',
};

/**
 * Community note schema
 */
export const CommunityNoteSchema = {
  '@context': 'string',
  '@type': 'string',
  '@id': 'string',
  name: 'string',
  description: 'string',
  timestamp: 'string',
  topic: 'string',
  grokipediaAnalysis: 'object',
  wikipediaAnalysis: 'object',
  verdict: 'string',
  score: 'number',
  issues: 'array',
};

/**
 * DKG Publication Response Schema
 */
export const DKGPublicationSchema = {
  success: 'boolean',
  ual: 'string',
  transactionHash: 'string',
  explorerUrl: 'string',
  demo: 'boolean',
  warning: 'string',
  error: 'string',
};

/**
 * Validation function for analysis segment
 * @param {*} data - Data to validate
 * @returns {boolean} Is valid
 */
export function validateAnalysisSegment(data) {
  if (!data || typeof data !== 'object') return false;
  
  return (
    typeof data.text === 'string' &&
    Array.isArray(data.claims) &&
    typeof data.keyword === 'string' &&
    Array.isArray(data.issues) &&
    typeof data.score === 'number'
  );
}

/**
 * Validation function for community note
 * @param {*} data - Data to validate
 * @returns {boolean} Is valid
 */
export function validateCommunityNote(data) {
  if (!data || typeof data !== 'object') return false;

  return (
    typeof data['@context'] === 'string' &&
    typeof data['@type'] === 'string' &&
    typeof data.name === 'string' &&
    typeof data.description === 'string' &&
    typeof data.timestamp === 'string'
  );
}

/**
 * Create empty analysis result
 * @returns {object} Empty analysis
 */
export function createEmptyAnalysis() {
  return {
    segments: [],
    totalScore: 0,
    verdict: 'pending',
    issues: [],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create analysis result from segments
 * @param {Array} segments - Analysis segments
 * @returns {object} Complete analysis
 */
export function createAnalysisResult(segments) {
  const totalScore =
    segments.length > 0
      ? Math.round(segments.reduce((sum, s) => sum + s.score, 0) / segments.length)
      : 0;

  const allIssues = segments.flatMap((s) => s.issues || []);

  return {
    segments,
    totalScore,
    issues: allIssues,
    timestamp: new Date().toISOString(),
  };
}
