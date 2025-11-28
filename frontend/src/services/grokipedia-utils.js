/**
 * Grokipedia API Utilities
 * Based on: copy/dkg-web-main/lib/gorkpedia-utils.ts
 */

const GROKIPEDIA_BASE_URL = 'https://grokipedia.xai.com';
const BACKEND_SCRAPER_URL = '/api/scraper';

/**
 * Build Grokipedia search URL
 * @param {string} query - Search query
 * @returns {string} Grokipedia URL
 */
export function buildGrokipediaUrl(query) {
  const encoded = encodeURIComponent(query);
  return `${GROKIPEDIA_BASE_URL}/search?q=${encoded}`;
}

/**
 * Fetch Grokipedia content via backend proxy
 * @param {string} query - Search query
 * @returns {Promise<object>} Grokipedia data
 */
export async function fetchGrokipediaContent(query) {
  try {
    if (!query) throw new Error('Query is required');

    const url = buildGrokipediaUrl(query);

    // Use backend proxy to bypass CORS
    const response = await fetch(BACKEND_SCRAPER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        source: 'grokipedia',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Failed to fetch: ${response.status}`);
    }

    return {
      query,
      content: data.content || '',
      url: url,
      source: 'grokipedia',
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    console.error('Grokipedia fetch error:', error);
    return {
      query,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Search Grokipedia and extract segments
 * @param {string} query - Search query
 * @returns {Promise<Array>} Content segments
 */
export async function searchGrokipediaSegments(query) {
  try {
    const result = await fetchGrokipediaContent(query);

    if (!result.success || !result.content) {
      return [];
    }

    // Split content into segments
    const sentences = result.content
      .split(/[.!?]\s+/)
      .filter((s) => s.trim().length > 15)
      .map((s) => s.trim());

    return sentences.map((text, index) => ({
      id: `grok-${Date.now()}-${index}`,
      text,
      source: 'grokipedia',
      url: result.url,
      index,
      timestamp: result.timestamp,
    }));
  } catch (error) {
    console.error('Grokipedia segments error:', error);
    return [];
  }
}

/**
 * Extract claims from Grokipedia content
 * @param {string} content - Grokipedia content
 * @returns {Array<string>} Extracted claims
 */
export function extractClaimsFromGrokipedia(content) {
  if (!content) return [];

  // Split into sentences
  const sentences = content
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 500);

  // Filter out questions and generic statements
  return sentences.filter((s) => {
    const lower = s.toLowerCase();
    return (
      !lower.startsWith('what ') &&
      !lower.startsWith('how ') &&
      !lower.startsWith('why ') &&
      !lower.startsWith('is ') &&
      !lower.endsWith('?') &&
      s.split(' ').length >= 5
    );
  });
}

/**
 * Get Grokipedia article data
 * @param {string} title - Article title
 * @returns {Promise<object>} Article data
 */
export async function getGrokipediaArticle(title) {
  try {
    const result = await fetchGrokipediaContent(title);

    if (!result.success) {
      return null;
    }

    return {
      title,
      content: result.content,
      url: result.url,
      source: 'grokipedia',
    };
  } catch (error) {
    console.error('Grokipedia article error:', error);
    return null;
  }
}

/**
 * Compare queries across Grokipedia and Wikipedia
 * @param {string} query - Query string
 * @returns {Promise<object>} Comparison results
 */
export async function compareGrokipediaToWikipedia(query) {
  try {
    // Fetch Grokipedia
    const grokResult = await fetchGrokipediaContent(query);

    // Fetch Wikipedia via backend
    const wikiResponse = await fetch('/api/scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        source: 'wikipedia',
      }),
    });

    const wikiData = await wikiResponse.json();

    return {
      query,
      grokipedia: grokResult,
      wikipedia: wikiData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Comparison error:', error);
    return {
      query,
      error: error.message,
    };
  }
}

/**
 * Get trending topics on Grokipedia
 * @returns {Promise<Array>} Trending topics
 */
export async function getTrendingGrokipediaTopics() {
  try {
    // This would need a separate endpoint if available
    return [];
  } catch (error) {
    console.error('Trending topics error:', error);
    return [];
  }
}

/**
 * Cache Grokipedia searches locally
 */
const grokipediaCache = new Map();

/**
 * Get cached Grokipedia result
 * @param {string} query - Query string
 * @returns {object|null} Cached result or null
 */
export function getCachedGrokipedia(query) {
  const key = query.toLowerCase();
  const cached = grokipediaCache.get(key);

  if (cached && Date.now() - cached.timestamp < 3600000) {
    // Cache valid for 1 hour
    return cached.data;
  }

  return null;
}

/**
 * Set cached Grokipedia result
 * @param {string} query - Query string
 * @param {object} data - Data to cache
 */
export function setCachedGrokipedia(query, data) {
  const key = query.toLowerCase();
  grokipediaCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear Grokipedia cache
 */
export function clearGrokipediaCache() {
  grokipediaCache.clear();
}
