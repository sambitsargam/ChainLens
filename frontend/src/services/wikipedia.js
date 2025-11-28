/**
 * Wikipedia Service
 * Fetches articles from Wikipedia using official API with retry logic
 * Reference implementation: copy/dkg-web-main/lib/wikipedia.ts
 */

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';

const HEADERS = {
  'User-Agent': 'ChainLens/1.0 (https://github.com/sambitsargam/ChainLens)',
  'Accept': 'application/json',
};

/**
 * Fetch with retry logic - handles rate limiting
 */
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, { headers: HEADERS });
      
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 500;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Failed after retries');
}

/**
 * Search for Wikipedia article by topic
 */
async function searchWikipedia(topic) {
  try {
    const searchParams = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: topic,
      format: 'json',
      origin: '*',
    });
    
    const searchResponse = await fetchWithRetry(`${WIKIPEDIA_API_BASE}?${searchParams}`);
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search?.length) {
      return null;
    }
    
    return searchData.query.search[0].title;
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return null;
  }
}

/**
 * Fetch Wikipedia content by title
 */
async function fetchWikipediaByTitle(title) {
  try {
    // Get full plain text extract
    const extractParams = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'extracts',
      explaintext: 'true',
      exsectionformat: 'plain',
      format: 'json',
      origin: '*',
    });
    
    const extractResponse = await fetchWithRetry(`${WIKIPEDIA_API_BASE}?${extractParams}`);
    const extractData = await extractResponse.json();
    
    const pages = extractData.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') return null;
    
    const page = pages[pageId];
    let fullContent = page.extract || '';
    
    console.log(`✓ Wikipedia extracted: ${fullContent.length} characters`);
    
    return {
      title: page.title,
      content: fullContent,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    return null;
  }
}

/**
 * Extract meaningful sentences from text
 * Filters: 5+ words, 20-500 chars, factual statements (no questions/commands)
 * Max 5 sentences returned
 */
function extractMeaningfulSentences(text) {
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
 * Fetch Wikipedia article by topic
 */
export async function fetchWikipediaArticle(topic) {
  try {
    console.log(`Fetching Wikipedia article: ${topic}`);
    
    // Search for the article
    const title = await searchWikipedia(topic);
    if (!title) {
      throw new Error(`No Wikipedia article found for "${topic}"`);
    }
    
    // Fetch the content
    const result = await fetchWikipediaByTitle(title);
    if (!result) {
      throw new Error(`Failed to fetch Wikipedia article: ${title}`);
    }
    
    const { content, title: pageTitle, url } = result;
    
    // Extract 5 meaningful sentences
    const sentences = extractMeaningfulSentences(content);
    const limitedText = sentences.join(' ');
    
    console.log(`✓ Wikipedia: ${sentences.length} sentences (${limitedText.length} chars)`);
    
    return {
      source: 'Wikipedia',
      title: pageTitle,
      text: limitedText,
      sentenceCount: sentences.length,
      url: url,
    };
  } catch (error) {
    console.error(`Wikipedia fetch failed:`, error);
    throw error;
  }
}
