/**
 * Analysis Utilities Service
 * Provides analysis and scoring utilities
 * Based on: copy/dkg-web-main/lib/analysis-utils.ts
 */

/**
 * Calculate weighted trust score based on issues found
 * @param {Array} issues - Array of issues with severity
 * @returns {number} Trust score 0-100
 */
export function calculateTrustScore(issues) {
  if (!issues || issues.length === 0) return 100;

  const weights = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
  };

  const totalPenalty = issues.reduce((sum, issue) => {
    return sum + (weights[issue.severity] || 5);
  }, 0);

  // Diminishing returns for many issues
  const adjustedPenalty = totalPenalty > 50 
    ? 50 + Math.log2(totalPenalty - 49) * 5 
    : totalPenalty;

  return Math.max(0, Math.round(100 - adjustedPenalty));
}

/**
 * Determine verdict based on score and issue count
 * @param {number} score - Trust score 0-100
 * @param {Array} issues - Array of issues
 * @returns {string} Verdict: reliable|mostly_reliable|questionable|unreliable
 */
export function determineVerdict(score, issues) {
  if (!issues) issues = [];
  
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;

  if (criticalCount >= 5 || score < 20) return 'unreliable';
  if (criticalCount >= 3 || highCount >= 5 || score < 40) return 'questionable';
  if (criticalCount >= 1 || highCount >= 2 || score < 70) return 'mostly_reliable';
  return 'reliable';
}

/**
 * Extract key claims from text content
 * @param {string} content - Text content
 * @returns {Array<string>} Array of extracted claims
 */
export function extractClaims(content) {
  if (!content) return [];

  const sentences = content
    .replace(/([.!?])\s+/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 500);

  return sentences.filter((s) => {
    const lower = s.toLowerCase();
    return (
      !lower.startsWith('what ') &&
      !lower.startsWith('how ') &&
      !lower.startsWith('why ') &&
      !lower.startsWith('please ') &&
      !lower.endsWith('?') &&
      s.split(' ').length >= 5
    );
  });
}

/**
 * Extract key facts (dates, numbers) from content
 * @param {string} content - Text content
 * @returns {Array<string>} Array of key facts
 */
export function extractKeyFacts(content) {
  if (!content) return [];

  const facts = [];

  // Extract dates
  const datePattern = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4})\b/gi;
  const dates = content.match(datePattern) || [];
  facts.push(...dates.slice(0, 10));

  // Extract numbers with context
  const numberPattern = /\b(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:percent|%|million|billion|trillion|thousand|km|miles|meters|feet|years|months|days)\b/gi;
  const numbers = content.match(numberPattern) || [];
  facts.push(...numbers.slice(0, 10));

  return [...new Set(facts)];
}

/**
 * Generate comparison summary
 * @param {Array} grokSegments - Grokipedia segments
 * @param {Array} wikiSegments - Wikipedia segments
 * @returns {string} Summary string
 */
export function generateComparisonSummary(grokSegments, wikiSegments) {
  const grokClaims = grokSegments.reduce((sum, s) => sum + (s.claims ? s.claims.length : 0), 0);
  const wikiClaims = wikiSegments.reduce((sum, s) => sum + (s.claims ? s.claims.length : 0), 0);

  return `Grokipedia: ${grokSegments.length} segments, ${grokClaims} claims | Wikipedia: ${wikiSegments.length} segments, ${wikiClaims} claims`;
}
