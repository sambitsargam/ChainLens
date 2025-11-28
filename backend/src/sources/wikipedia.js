import axios from 'axios';

/**
 * Wikipedia Text Fetcher (Text-Only)
 * 
 * Fetches plain text content from Wikipedia using the REST API.
 * Returns normalized text without any HTML or formatting.
 */

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/api/rest_v1';

/**
 * Fetch Wikipedia article text for a given title
 * 
 * @param {string} title - Wikipedia article title
 * @returns {Promise<Object>} Article object with source, title, text, and metadata
 */
export async function fetchWikipediaArticle(title) {
  try {
    const url = `${WIKIPEDIA_API_BASE}/page/summary/${encodeURIComponent(title)}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'GrokipediaTruthAlignment/1.0',
      },
    });
    
    const data = response.data;
    
    // Extract text content (summary + extract)
    let text = '';
    if (data.extract) {
      text = data.extract;
    }
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return {
      source: 'Wikipedia',
      title: data.title || title,
      text,
      meta: {
        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        fetchedAt: new Date().toISOString(),
        description: data.description || '',
      },
    };
  } catch (error) {
    console.error(`Error fetching Wikipedia article "${title}":`, error.message);
    
    if (error.response?.status === 404) {
      throw new Error(`Wikipedia article "${title}" not found`);
    }
    
    throw new Error(`Failed to fetch Wikipedia article: ${error.message}`);
  }
}

/**
 * Fetch full Wikipedia article content (more detailed than summary)
 * Uses the mobile-sections endpoint for fuller text
 * 
 * @param {string} title - Wikipedia article title
 * @returns {Promise<Object>} Article object with full text content
 */
export async function fetchWikipediaFullArticle(title) {
  try {
    // Try the mobile-sections endpoint for more complete text
    const url = `${WIKIPEDIA_API_BASE}/page/mobile-sections/${encodeURIComponent(title)}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'GrokipediaTruthAlignment/1.0',
      },
    });
    
    const data = response.data;
    
    // Extract text from all sections
    let text = '';
    
    if (data.lead?.sections?.[0]?.text) {
      // Remove HTML tags from lead section
      text = data.lead.sections[0].text.replace(/<[^>]+>/g, ' ');
    }
    
    if (data.remaining?.sections) {
      for (const section of data.remaining.sections) {
        if (section.text) {
          text += ' ' + section.text.replace(/<[^>]+>/g, ' ');
        }
      }
    }
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return {
      source: 'Wikipedia',
      title: data.lead?.displaytitle || title,
      text,
      meta: {
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        fetchedAt: new Date().toISOString(),
        description: data.lead?.description || '',
      },
    };
  } catch (error) {
    console.log('Full article fetch failed, falling back to summary');
    // Fallback to summary
    return fetchWikipediaArticle(title);
  }
}

export default {
  fetchWikipediaArticle,
  fetchWikipediaFullArticle,
};
