/**
 * Wikipedia API Utilities
 * Based on: copy/dkg-web-main/lib/wikipedia.ts
 */

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

/**
 * Search Wikipedia for articles
 * @param {string} query - Search query
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Search results
 */
export async function searchWikipedia(query, limit = 5) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      list: 'search',
      srsearch: query,
      srlimit: limit,
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
      headers: {
        'User-Agent': 'ChainLens/1.0 (+https://chainlens.example.com)',
      },
    });

    const data = await response.json();
    return data.query?.search || [];
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return [];
  }
}

/**
 * Fetch Wikipedia article content
 * @param {string} title - Article title
 * @param {number} maxLength - Max content length
 * @returns {Promise<object>} Article data
 */
export async function fetchWikipediaArticle(title, maxLength = 5000) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: title,
      prop: 'extracts|pageimages|info',
      explaintext: true,
      exintro: false,
      exchars: maxLength,
      piprop: 'thumbnail',
      pithumbsize: 200,
      redirects: true,
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
      headers: {
        'User-Agent': 'ChainLens/1.0 (+https://chainlens.example.com)',
      },
    });

    const data = await response.json();
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];

    if (!pageId || pages[pageId].missing) {
      return null;
    }

    const page = pages[pageId];
    return {
      title: page.title,
      extract: page.extract || '',
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      thumbnail: page.thumbnail?.source,
      pageId: pageId,
      ns: page.ns,
    };
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    return null;
  }
}

/**
 * Get Wikipedia page sections
 * @param {string} title - Article title
 * @returns {Promise<Array>} Array of sections
 */
export async function getWikipediaPageSections(title) {
  try {
    const params = new URLSearchParams({
      action: 'parse',
      format: 'json',
      page: title,
      prop: 'sections',
      redirects: true,
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
      headers: {
        'User-Agent': 'ChainLens/1.0 (+https://chainlens.example.com)',
      },
    });

    const data = await response.json();
    return data.parse?.sections || [];
  } catch (error) {
    console.error('Wikipedia sections error:', error);
    return [];
  }
}

/**
 * Extract sections from article text
 * @param {string} text - Article text
 * @returns {Array<object>} Sections with headings and content
 */
export function extractSections(text) {
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;

  for (const line of lines) {
    // Detect heading pattern (simple heuristic)
    if (line.startsWith('==') && line.endsWith('==')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: line.replace(/=+/g, '').trim(),
        content: [],
      };
    } else if (currentSection && line.trim()) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections.map((s) => ({
    heading: s.heading,
    text: s.content.join('\n'),
  }));
}

/**
 * Get related Wikipedia articles
 * @param {string} title - Article title
 * @returns {Promise<Array>} Related articles
 */
export async function getRelatedArticles(title) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: title,
      prop: 'links',
      pllimit: 20,
      plnamespace: 0,
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
      headers: {
        'User-Agent': 'ChainLens/1.0 (+https://chainlens.example.com)',
      },
    });

    const data = await response.json();
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];

    if (!pageId) return [];

    return pages[pageId].links || [];
  } catch (error) {
    console.error('Related articles error:', error);
    return [];
  }
}

/**
 * Check if Wikipedia article exists
 * @param {string} title - Article title
 * @returns {Promise<boolean>} Does article exist
 */
export async function articleExists(title) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: title,
      prop: 'pageid',
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
      headers: {
        'User-Agent': 'ChainLens/1.0 (+https://chainlens.example.com)',
      },
    });

    const data = await response.json();
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];

    return pageId && !pages[pageId].missing;
  } catch (error) {
    console.error('Article existence check error:', error);
    return false;
  }
}

/**
 * Get Wikipedia page statistics
 * @param {string} title - Article title
 * @returns {Promise<object>} Statistics
 */
export async function getWikipediaStats(title) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: title,
      prop: 'info',
      inprop: 'url|watchers|views',
    });

    const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
      headers: {
        'User-Agent': 'ChainLens/1.0 (+https://chainlens.example.com)',
      },
    });

    const data = await response.json();
    const pages = data.query?.pages || {};
    const page = pages[Object.keys(pages)[0]];

    return {
      views: page?.views,
      watchers: page?.watchers,
      lastModified: page?.lastrevid,
    };
  } catch (error) {
    console.error('Wikipedia stats error:', error);
    return {};
  }
}
