/**
 * Wikipedia Service
 * Fetches articles from Wikipedia using web scraping via CORS proxy
 */

const WIKIPEDIA_BASE = 'https://en.wikipedia.org/wiki';

export async function fetchWikipediaArticle(title) {
  try {
    const targetUrl = `${WIKIPEDIA_BASE}/${encodeURIComponent(title)}`;
    // Use allOrigins CORS proxy - more reliable
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    
    console.log(`Scraping Wikipedia page via allOrigins: ${targetUrl}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Wikipedia returned ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract main content from Wikipedia HTML
    // Wikipedia content is in <div id="mw-content-text">
    const contentMatch = html.match(/<div[^>]*id="mw-content-text"[^>]*>([\s\S]*?)<div[^>]*id="catlinks"/i);
    let content = contentMatch ? contentMatch[1] : html;
    
    // Remove references, tables, infoboxes, and navigation elements
    content = content
      .replace(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>[\s\S]*?<\/table>/gi, '')
      .replace(/<div[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
      .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<table[\s\S]*?<\/table>/gi, '');
    
    // Extract text from paragraphs
    const paragraphMatches = content.match(/<p>[\s\S]*?<\/p>/gi) || [];
    let text = '';
    
    for (const para of paragraphMatches.slice(0, 10)) {
      const cleanPara = para
        .replace(/<[^>]+>/g, ' ')
        .replace(/\[[^\]]+\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanPara.length > 50) {
        text += cleanPara + ' ';
      }
    }
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Split into sentences and take first 20
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 30)
      .slice(0, 20);
    
    const limitedText = sentences.join(' ');
    
    console.log(`✓ Wikipedia: ${sentences.length} sentences (${limitedText.length} chars)`);
    
    // Extract title from HTML
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s*-\s*Wikipedia.*$/, '').trim() : title;
    
    return {
      source: 'Wikipedia',
      title: pageTitle,
      text: limitedText,
      sentenceCount: sentences.length,
      url: targetUrl,
    };
  } catch (error) {
    console.error(`Wikipedia fetch failed:`, error);
    throw error;
  }
}
