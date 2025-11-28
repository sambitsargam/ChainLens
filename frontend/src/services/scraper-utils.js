/**
 * Scraper Utilities - HTML parsing and content extraction
 * Based on: copy/dkg-web-main/lib/scraper.ts
 */

/**
 * Extract readable text from HTML using multiple strategies
 * @param {string} html - HTML content
 * @param {string} source - Source name for context
 * @returns {string} Extracted text
 */
export function extractTextFromHtml(html, source = 'unknown') {
  if (!html || typeof html !== 'string') return '';

  // Strategy 1: Parse article/main content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  // Strategy 2: Extract from article tags
  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    text = articleMatch[1];
  }

  // Strategy 3: Extract from main content div
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                    text.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                    text.match(/<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (mainMatch) {
    text = mainMatch[1];
  }

  // Remove HTML tags
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Extract structured content segments
 * @param {string} html - HTML content
 * @returns {Array<object>} Array of content segments
 */
export function extractSegments(html) {
  const segments = [];
  const text = extractTextFromHtml(html);

  // Split by sentences and paragraphs
  const sentences = text.split(/[.!?]\s+/).filter((s) => s.trim().length > 10);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 0) {
      segments.push({
        text: trimmed,
        source: 'extracted',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return segments;
}

/**
 * Extract links from HTML
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for relative links
 * @returns {Array<string>} Array of URLs
 */
export function extractLinks(html, baseUrl = '') {
  const links = [];
  const urlRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = urlRegex.exec(html)) !== null) {
    let url = match[1];

    // Convert relative URLs to absolute
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      url = `${base.protocol}//${base.host}${url}`;
    } else if (url.startsWith('http')) {
      // Already absolute
    } else if (baseUrl && !url.startsWith('#')) {
      url = `${baseUrl}/${url}`;
    } else {
      continue;
    }

    if (!links.includes(url)) {
      links.push(url);
    }
  }

  return links;
}

/**
 * Extract metadata from HTML
 * @param {string} html - HTML content
 * @returns {object} Metadata object
 */
export function extractMetadata(html) {
  const metadata = {
    title: '',
    description: '',
    author: '',
    date: '',
    lang: '',
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) metadata.title = titleMatch[1].trim();

  // Extract meta tags
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) metadata.description = descMatch[1];

  const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
  if (authorMatch) metadata.author = authorMatch[1];

  // Extract date
  const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i);
  if (dateMatch) metadata.date = dateMatch[1];

  // Extract language
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  if (langMatch) metadata.lang = langMatch[1];

  return metadata;
}

/**
 * Clean and normalize text
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
export function cleanText(text) {
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

/**
 * Extract key phrases from text
 * @param {string} text - Text content
 * @param {number} count - Number of phrases to extract
 * @returns {Array<string>} Key phrases
 */
export function extractKeyPhrases(text, count = 5) {
  const words = text.toLowerCase().split(/\s+/);
  const phrases = [];

  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = words.slice(i, Math.min(i + 3, words.length)).join(' ');
    
    // Filter out common words
    if (!isCommonPhrase(phrase) && phrase.length > 5) {
      if (!phrases.includes(phrase)) {
        phrases.push(phrase);
      }
    }
  }

  return phrases.slice(0, count);
}

/**
 * Check if phrase is common/stop word
 * @param {string} phrase - Phrase to check
 * @returns {boolean} Is common
 */
function isCommonPhrase(phrase) {
  const commonPhrases = [
    'the ', 'and ', 'is ', 'of ', 'to ', 'in ', 'for ', 'on ', 'with ', 'at ',
    'by ', 'or ', 'from ', 'a ', 'an ', 'as ', 'that ', 'this ', 'it ', 'be ',
  ];

  return commonPhrases.some((common) => phrase.startsWith(common));
}
