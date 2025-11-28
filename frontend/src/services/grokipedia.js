/**
 * Grokipedia API Service
 * Fetches articles from Grokipedia API with fallback to web scraping
 */

const GROKIPEDIA_API_BASE = 'https://grokipedia-api.com/page';
const GROKIPEDIA_WEB_BASE = 'https://grokipedia.com/page';

export async function fetchGrokipediaArticle(slug) {
  try {
    // Try API first
    const url = `${GROKIPEDIA_API_BASE}/${encodeURIComponent(slug)}?extract_refs=true&citations=true`;
    
    console.log(`Fetching from Grokipedia API: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error(`Grokipedia API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.content_text) {
      throw new Error('No content_text in API response');
    }
    
    // Split into sentences and take first 20
    const sentences = data.content_text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 30)
      .slice(0, 20);
    
    const text = sentences.join(' ');
    
    console.log(`✓ Grokipedia: ${sentences.length} sentences (${text.length} chars)`);
    
    return {
      source: 'Grokipedia',
      title: data.title || slug,
      text,
      sentenceCount: sentences.length,
      url: data.url || `${GROKIPEDIA_WEB_BASE}/${slug}`,
    };
  } catch (error) {
    console.error(`Grokipedia fetch failed:`, error);
    throw error;
  }
}
