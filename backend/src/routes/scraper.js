/**
 * Scraper Routes
 * Server-side web scraping - exact implementation from reference project
 * Reference: copy/dkg-web-main/lib/scraper.ts
 */

import express from 'express';
import { logger } from '../config/logger.js';

const router = express.Router();

/**
 * Strip HTML tags and decode entities (exact copy from reference)
 */
function stripHtml(html) {
  return html
    // Remove scripts and styles first
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    // Remove navigation and structural elements
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract content using multiple fallback strategies
 * Exactly matches reference implementation
 */
function extractContent(html) {
  let content = '';
  
  // Strategy 1: Look for specific Grokipedia content containers
  const contentSelectors = [
    /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*page-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*wiki-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*main-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*id="main-content"[^>]*>([\s\S]*?)<\/div>/gi,
  ];
  
  for (const selector of contentSelectors) {
    const matches = html.matchAll(selector);
    for (const match of matches) {
      const extracted = stripHtml(match[1]);
      if (extracted.length > content.length) {
        content = extracted;
        logger.info(`Found content via selector, length: ${extracted.length}`);
      }
    }
  }
  
  // Strategy 2: Try article tag
  if (content.length < 1000) {
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      const extracted = stripHtml(articleMatch[1]);
      if (extracted.length > content.length) {
        content = extracted;
        logger.info(`Found content via article tag, length: ${extracted.length}`);
      }
    }
  }
  
  // Strategy 3: Try main tag
  if (content.length < 1000) {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      const extracted = stripHtml(mainMatch[1]);
      if (extracted.length > content.length) {
        content = extracted;
        logger.info(`Found content via main tag, length: ${extracted.length}`);
      }
    }
  }
  
  // Strategy 4: Extract all paragraph content
  if (content.length < 1000) {
    const paragraphs = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(html)) !== null) {
      const pContent = stripHtml(pMatch[1]);
      if (pContent.length > 50) {
        paragraphs.push(pContent);
      }
    }
    if (paragraphs.length > 0) {
      const combined = paragraphs.join('\n\n');
      if (combined.length > content.length) {
        content = combined;
        logger.info(`Found content via paragraphs, count: ${paragraphs.length}, length: ${combined.length}`);
      }
    }
  }
  
  // Strategy 5: Last resort - extract body content
  if (content.length < 500) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const extracted = stripHtml(bodyMatch[1]);
      if (extracted.length > content.length) {
        content = extracted;
        logger.info(`Found content via body tag, length: ${extracted.length}`);
      }
    }
  }
  
  return content;
}

/**
 * GET /api/scraper/grokipedia
 * Scrape Grokipedia article by slug or full URL
 */
router.get('/grokipedia', async (req, res) => {
  try {
    const { slug, url } = req.query;
    
    if (!slug && !url) {
      return res.status(400).json({ error: 'slug or url parameter required' });
    }
    
    const targetUrl = url || `https://grokipedia.com/page/${slug}`;
    logger.info(`Scraping Grokipedia: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    });
    
    logger.info(`Response status: ${response.status}`);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Grokipedia returned ${response.status}` 
      });
    }
    
    const html = await response.text();
    logger.info(`HTML length: ${html.length} characters`);
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';
    title = title.replace(/ - .*$/, '').replace(/ \| .*$/, '').trim();
    logger.info(`Title: ${title}`);
    
    // Extract content using multiple strategies
    const content = extractContent(html);
    
    if (!content || content.length === 0) {
      return res.status(404).json({ 
        error: 'No content extracted from Grokipedia' 
      });
    }
    
    logger.info(`Final content length: ${content.length} characters`);
    
    // Limit content
    const maxLength = 50000;
    const finalContent = content.length > maxLength 
      ? content.slice(0, maxLength)
      : content;
    
    res.json({
      source: 'Grokipedia',
      title,
      content: finalContent,
      url: targetUrl,
      contentLength: finalContent.length,
    });
    
  } catch (error) {
    logger.error('Grokipedia scraping error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape Grokipedia',
      message: error.message 
    });
  }
});

export default router;
