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
    
    console.log(`Fetching full Wikipedia article: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'GrokipediaTruthAlignment/1.0',
      },
      timeout: 15000,
    });
    
    const data = response.data;
    
    // Extract text from all sections
    let text = '';
    let sectionCount = 0;
    
    if (data.lead?.sections?.[0]?.text) {
      // Remove HTML tags from lead section
      const leadText = data.lead.sections[0].text.replace(/<[^>]+>/g, ' ');
      text = leadText;
      sectionCount++;
    }
    
    // Only extract first 5 sections to limit comparison size
    if (data.remaining?.sections) {
      for (const section of data.remaining.sections.slice(0, 5)) {
        if (section.text) {
          const sectionText = section.text.replace(/<[^>]+>/g, ' ');
          text += ' ' + sectionText;
          sectionCount++;
        }
      }
    }
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    if (!text || text.length < 100) {
      throw new Error('Insufficient content extracted from Wikipedia mobile-sections API');
    }
    
    // Split into sentences and take first 5 for testing
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 30)
      .slice(0, 5);
    
    const limitedText = sentences.join(' ');
    
    console.log(`✓ Extracted ${sectionCount} sections, ${sentences.length} sentences (${limitedText.length} chars) from Wikipedia`);
    
    return {
      source: 'Wikipedia',
      title: data.lead?.displaytitle || title,
      text: limitedText,
      meta: {
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        fetchedAt: new Date().toISOString(),
        description: data.lead?.description || '',
        charCount: limitedText.length,
        wordCount: limitedText.split(/\s+/).length,
        sentenceCount: sentences.length,
        sectionCount,
      },
    };
  } catch (error) {
    console.error(`Full article fetch failed for "${title}":`, error.message);
    console.log('Attempting fallback to summary API...');
    
    try {
      // Fallback to summary but enhance error handling
      const summaryArticle = await fetchWikipediaArticle(title);
      
      // Warn if we only got summary
      if (summaryArticle.text.length < 500) {
        console.warn(`⚠ Only got ${summaryArticle.text.length} chars from Wikipedia summary for "${title}"`);
      }
      
      return summaryArticle;
    } catch (summaryError) {
      // Both methods failed
      throw new Error(`Failed to fetch Wikipedia article "${title}": ${error.message}`);
    }
  }
}

export default {
  fetchWikipediaArticle,
  fetchWikipediaFullArticle,
};
