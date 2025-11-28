/**
 * Grokipedia Service
 * Fetches articles from Grokipedia via backend API (to avoid CORS)
 * Backend uses multi-strategy HTML parsing matching reference implementation
 */

const BACKEND_URL = import.meta.env.VITE_DKG_BACKEND_URL || 'http://localhost:3001';

/**
 * Extract meaningful sentences from text
 * Filters: 5+ words, 20-500 chars, factual statements (no questions/commands)
 * Max 5 sentences returned
 */
function extractMeaningfulSentences(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  return text
    .replace(/([.!?])\s+/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map(s => s.trim())
    .filter(s => {
      const wordCount = s.split(/\s+/).length;
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
    .slice(0, 5);
}

/**
 * Fetch Grokipedia article by slug via backend API
 */
export async function fetchGrokipediaArticle(slug) {
  try {
    const backendUrl = `${BACKEND_URL}/api/scraper/grokipedia?slug=${encodeURIComponent(slug)}`;
    console.log(`Fetching Grokipedia (via backend): ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✓ Grokipedia (backend): ${data.title} (${data.contentLength} chars)`);
    
    // Extract 5 meaningful sentences from full content
    const sentences = extractMeaningfulSentences(data.content);
    const limitedText = sentences.join(' ');
    
    if (limitedText.length === 0) {
      throw new Error('No meaningful sentences extracted from content');
    }
    
    console.log(`✓ Grokipedia: ${sentences.length} sentences extracted`);
    
    return {
      source: 'Grokipedia',
      title: data.title,
      text: limitedText,
      sentenceCount: sentences.length,
      url: data.url,
    };
    
  } catch (error) {
    console.error(`Grokipedia fetch failed: ${error.message}`);
    throw new Error(`Failed to fetch Grokipedia: ${error.message}`);
  }
}
