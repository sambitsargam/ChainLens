import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Grokipedia Text Fetcher (Text-Only via Web Scraping)
 * 
 * Fetches and extracts plain text content from Grokipedia articles.
 * Uses Cheerio to parse HTML and extract article text.
 */

const GROKIPEDIA_BASE = 'https://grok.x.ai/grokipedia';

/**
 * Fetch Grokipedia article text for a given slug
 * 
 * @param {string} slug - Grokipedia article slug (URL-friendly identifier)
 * @returns {Promise<Object>} Article object with source, title, text, and metadata
 */
export async function fetchGrokipediaArticle(slug) {
  try {
    const url = `${GROKIPEDIA_BASE}/${slug}`;
    
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
      },
    };
  } catch (error) {
    console.error(`Error fetching Grokipedia article "${slug}":`, error.message);
    
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
