import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Grokipedia Text Fetcher
 * 
 * Fetches full article content from Grokipedia API or falls back to web scraping.
 * Prioritizes the official API for complete, structured content.
 */

const GROKIPEDIA_API_BASE = 'https://grokipedia-api.com/page';
const GROKIPEDIA_WEB_BASE = 'https://grok.x.ai/grokipedia';

/**
 * Fetch Grokipedia article using the official API
 * 
 * @param {string} slug - Grokipedia article slug
 * @returns {Promise<Object>} Article object with full content
 */
export async function fetchGrokipediaArticleFromAPI(slug) {
  try {
    const url = `${GROKIPEDIA_API_BASE}/${encodeURIComponent(slug)}?extract_refs=true&citations=true`;
    
    console.log(`Fetching from Grokipedia API: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GrokipediaTruthAlignment/1.0',
      },
      timeout: 20000,
    });
    
    const data = response.data;
    
    if (!data.content_text) {
      throw new Error('No content_text in API response');
    }
    
    // Normalize whitespace
    const text = data.content_text.replace(/\s+/g, ' ').trim();
    
    return {
      source: 'Grokipedia',
      title: data.title || slug,
      text,
      meta: {
        url: data.url || `https://grokipedia.com/page/${slug}`,
        slug: data.slug || slug,
        fetchedAt: new Date().toISOString(),
        charCount: data.char_count || text.length,
        wordCount: data.word_count || text.split(/\s+/).length,
        referencesCount: data.references_count || 0,
        references: data.references || [],
      },
    };
  } catch (error) {
    console.error(`Grokipedia API fetch failed for "${slug}":`, error.message);
    
    // Don't throw, let caller handle fallback
    throw error;
  }
}

/**
 * Fetch Grokipedia article text via web scraping (fallback)
 * 
 * @param {string} slug - Grokipedia article slug (URL-friendly identifier)
 * @returns {Promise<Object>} Article object with source, title, text, and metadata
 */
export async function fetchGrokipediaArticleFromWeb(slug) {
  try {
    const url = `${GROKIPEDIA_WEB_BASE}/${slug}`;
    
    console.log(`Fetching from Grokipedia web (fallback): ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract title
    let title = $('h1').first().text().trim() || slug;
    
    // Extract article text from main content area
    // Try multiple selectors to find the main article content
    let text = '';
    
    const selectors = [
      'article',
      'main',
      '.article-content',
      '.content',
      '[role="article"]',
      '#content',
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        // Remove script and style tags
        element.find('script, style, nav, header, footer, aside').remove();
        
        // Get text content
        text = element.text();
        
        if (text.length > 100) {
          break;
        }
      }
    }
    
    // If no content found, try body
    if (!text || text.length < 100) {
      $('script, style, nav, header, footer, aside').remove();
      text = $('body').text();
    }
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    if (!text || text.length < 50) {
      throw new Error('Insufficient content extracted from Grokipedia article');
    }
    
    return {
      source: 'Grokipedia',
      title,
      text,
      meta: {
        url,
        slug,
        fetchedAt: new Date().toISOString(),
        charCount: text.length,
        wordCount: text.split(/\s+/).length,
      },
    };
  } catch (error) {
    console.error(`Error fetching Grokipedia web article "${slug}":`, error.message);
    
    if (error.response?.status === 404) {
      throw new Error(`Grokipedia article "${slug}" not found`);
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Grokipedia request timed out');
    }
    
    throw new Error(`Failed to fetch Grokipedia article: ${error.message}`);
  }
}

/**
 * Fetch Grokipedia article (tries API first, falls back to web scraping)
 * 
 * @param {string} slug - Grokipedia article slug
 * @returns {Promise<Object>} Article object with full content
 */
export async function fetchGrokipediaArticle(slug) {
  try {
    // Try API first for full article with references
    return await fetchGrokipediaArticleFromAPI(slug);
  } catch (apiError) {
    console.warn('Grokipedia API failed, falling back to web scraping');
    
    // Fall back to web scraping
    try {
      return await fetchGrokipediaArticleFromWeb(slug);
    } catch (webError) {
      // Both failed, throw the original API error with context
      throw new Error(`Failed to fetch Grokipedia article via API and web: ${apiError.message}`);
    }
  }
}

/**
 * Generate a Grokipedia slug from a topic title
 * Converts spaces to hyphens and lowercases
 * 
 * @param {string} title - Topic title
 * @returns {string} URL-friendly slug
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default {
  fetchGrokipediaArticle,
  generateSlug,
};
