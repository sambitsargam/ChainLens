/**
 * Grokipedia Service
 * Fetches articles from Grokipedia using web scraping via CORS proxy
 */

const GROKIPEDIA_WEB_BASE = 'https://grokipedia.com/page';

async function scrapeGrokipediaPage(slug) {
  const targetUrl = `${GROKIPEDIA_WEB_BASE}/${slug}`;
  // Use allOrigins CORS proxy - more reliable
  const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
  
  console.log(`Scraping Grokipedia page via allOrigins: ${targetUrl}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Grokipedia returned ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract text content from HTML
    // Remove script and style tags
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract title from meta tags or h1
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i) || 
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s*\|\s*Grokipedia$/, '') : slug;
    
    return { text, title, url };
  } catch (error) {
    console.error('Web scraping failed:', error);
    throw error;
  }
}

export async function fetchGrokipediaArticle(slug) {
  try {
    console.log(`Fetching Grokipedia article for: ${slug}`);
    
    // Use web scraping directly (more reliable than API with CORS issues)
    const { text, title, url } = await scrapeGrokipediaPage(slug);
    
    // Split into sentences and take first 20
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 30)
      .slice(0, 20);
    
    const limitedText = sentences.join(' ');
    
    console.log(`✓ Grokipedia: ${sentences.length} sentences (${limitedText.length} chars)`);
    
    return {
      source: 'Grokipedia',
      title: title || slug,
      text: limitedText,
      sentenceCount: sentences.length,
      url: url || `${GROKIPEDIA_WEB_BASE}/${slug}`,
    };
  } catch (error) {
    console.error(`Grokipedia fetch failed:`, error);
    throw error;
  }
}
