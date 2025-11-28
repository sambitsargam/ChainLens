/**
 * Wikipedia API Service
 * Fetches articles directly from Wikipedia REST API using CORS proxy
 */

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/api/rest_v1';

export async function fetchWikipediaArticle(title) {
  try {
    const url = `${WIKIPEDIA_API_BASE}/page/summary/${encodeURIComponent(title)}`;
    
    console.log(`Fetching from Wikipedia: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Wikipedia API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Use summary endpoint which has better CORS support
    let text = data.extract || '';
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Split into sentences and take first 20
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 30)
      .slice(0, 20);
    
    const limitedText = sentences.join(' ');
    
    console.log(`✓ Wikipedia: ${sentences.length} sentences (${limitedText.length} chars)`);
    
    return {
      source: 'Wikipedia',
      title: data.title || title,
      text: limitedText,
      sentenceCount: sentences.length,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch (error) {
    console.error(`Wikipedia fetch failed:`, error);
    throw error;
  }
}
