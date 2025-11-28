import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Grokipedia Text Fetcher
 * 
 * Fetches full article content from Grokipedia API or falls back to web scraping.
 * Prioritizes the official API for complete, structured content.
 */

const GROKIPEDIA_API_BASE = 'https://grokipedia-api.com/page';
const GROKIPEDIA_WEB_BASE = 'https://grokipedia.com/page';

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
 * Fetch Grokipedia article (tries API first, falls back to web scraping on 404)
 * 
 * @param {string} slug - Grokipedia article slug
 * @returns {Promise<Object>} Article object with limited content
 */
export async function fetchGrokipediaArticle(slug) {
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
    
    // Split into sentences and take first 5
    const sentences = data.content_text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 30)
      .slice(0, 5);
    
    const text = sentences.join(' ');
    
    console.log(`✓ Extracted ${sentences.length} sentences (${text.length} chars) from Grokipedia API`);
    
    return {
      source: 'Grokipedia',
      title: data.title || slug,
      text,
      meta: {
        url: data.url || `https://grokipedia.com/page/${slug}`,
        slug: data.slug || slug,
        fetchedAt: new Date().toISOString(),
        charCount: text.length,
        wordCount: text.split(/\s+/).length,
        sentenceCount: sentences.length,
        referencesCount: data.references_count || 0,
        references: data.references || [],
      },
    };
  } catch (error) {
    // If 404, fall back to web scraping
    if (error.response?.status === 404) {
      console.warn(`Grokipedia API returned 404 for "${slug}", falling back to web scraping...`);
      
      try {
        const webArticle = await fetchGrokipediaArticleFromWeb(slug);
        
        // Limit to first 5 sentences
        const sentences = webArticle.text
          .split(/(?<=[.!?])\s+/)
          .filter(s => s.trim().length > 30)
          .slice(0, 5);
        
        const text = sentences.join(' ');
        
        console.log(`✓ Extracted ${sentences.length} sentences (${text.length} chars) from Grokipedia web scraping`);
        
        return {
          ...webArticle,
          text,
          meta: {
            ...webArticle.meta,
            sentenceCount: sentences.length,
            charCount: text.length,
            wordCount: text.split(/\s+/).length,
          },
        };
      } catch (webError) {
        console.error(`Web scraping also failed for "${slug}":`, webError.message);
        throw new Error(`Failed to fetch Grokipedia article via API (404) and web scraping: ${webError.message}`);
      }
    }
    
    console.error(`Grokipedia API fetch failed for "${slug}":`, error.message);
    throw new Error(`Failed to fetch Grokipedia article: ${error.message}`);
  }
}

/**
 * Generate a Grokipedia slug from a topic title
 * Converts spaces to underscores and keeps original capitalization
 * 
 * @param {string} title - Topic title
 * @returns {string} URL-friendly slug
 */
export function generateSlug(title) {
  return title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

export default {
  fetchGrokipediaArticle,
  generateSlug,
};
