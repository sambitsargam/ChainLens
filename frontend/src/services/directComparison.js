/**
 * Direct API Comparison Service
 * Calls Wikipedia and Grokipedia APIs directly from frontend
 * Uses backend only for LLM classification and DKG publishing
 */

/**
 * Fetch Wikipedia article directly
 */
export async function fetchWikipediaArticle(title) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(title)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ChainLens/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract text from sections
    let text = '';
    if (data.lead?.sections?.[0]?.text) {
      text = data.lead.sections[0].text.replace(/<[^>]+>/g, ' ');
    }
    
    if (data.remaining?.sections) {
      for (const section of data.remaining.sections.slice(0, 5)) {
        if (section.text) {
          text += ' ' + section.text.replace(/<[^>]+>/g, ' ');
        }
      }
    }
    
    // Get first 20 sentences
    const sentences = text
      .replace(/\s+/g, ' ')
      .trim()
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.length > 30)
      .slice(0, 20);
    
    return {
      source: 'Wikipedia',
      title: data.lead?.displaytitle || title,
      text: sentences.join(' '),
      sentences: sentences,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch (error) {
    throw new Error(`Failed to fetch Wikipedia: ${error.message}`);
  }
}

/**
 * Fetch Grokipedia article directly
 */
export async function fetchGrokipediaArticle(slug) {
  try {
    // Try API first
    const apiUrl = `https://grokipedia-api.com/page/${encodeURIComponent(slug)}?extract_refs=true&citations=true`;
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.content_text) {
          const sentences = data.content_text
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.length > 30)
            .slice(0, 20);
          
          return {
            source: 'Grokipedia',
            title: data.title || slug,
            text: sentences.join(' '),
            sentences: sentences,
            url: `https://grokipedia.com/page/${slug}`,
          };
        }
      }
    } catch (apiError) {
      console.warn('Grokipedia API failed, trying web scraping...');
    }
    
    // Fallback: Scrape from web (via backend proxy to avoid CORS)
    const webUrl = `https://grokipedia.com/page/${slug}`;
    const response = await fetch(webUrl);
    const html = await response.text();
    
    // Simple extraction
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const article = doc.querySelector('article, main, .content');
    const text = article ? article.textContent : doc.body.textContent;
    
    const sentences = text
      .replace(/\s+/g, ' ')
      .trim()
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.length > 30)
      .slice(0, 20);
    
    return {
      source: 'Grokipedia',
      title: slug,
      text: sentences.join(' '),
      sentences: sentences,
      url: webUrl,
    };
  } catch (error) {
    throw new Error(`Failed to fetch Grokipedia: ${error.message}`);
  }
}

/**
 * Simple sentence similarity using Jaccard index
 */
function sentenceSimilarity(s1, s2) {
  const words1 = new Set(s1.toLowerCase().split(/\s+/));
  const words2 = new Set(s2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Compare articles locally in browser
 */
export function compareArticles(wikiArticle, grokArticle) {
  const threshold = 0.3; // 30% word overlap = similar
  
  const addedInGrok = [];
  const missingInGrok = [];
  
  // Find sentences in Grok not in Wiki
  for (const grokSent of grokArticle.sentences) {
    let maxSim = 0;
    for (const wikiSent of wikiArticle.sentences) {
      const sim = sentenceSimilarity(grokSent, wikiSent);
      if (sim > maxSim) maxSim = sim;
    }
    if (maxSim < threshold) {
      addedInGrok.push(grokSent);
    }
  }
  
  // Find sentences in Wiki not in Grok
  for (const wikiSent of wikiArticle.sentences) {
    let maxSim = 0;
    for (const grokSent of grokArticle.sentences) {
      const sim = sentenceSimilarity(wikiSent, grokSent);
      if (sim > maxSim) maxSim = sim;
    }
    if (maxSim < threshold) {
      missingInGrok.push(wikiSent);
    }
  }
  
  return {
    addedInGrok,
    missingInGrok,
    stats: {
      wikiSentenceCount: wikiArticle.sentences.length,
      grokSentenceCount: grokArticle.sentences.length,
      addedCount: addedInGrok.length,
      missingCount: missingInGrok.length,
    },
  };
}

/**
 * Full comparison workflow - all in frontend except LLM calls
 */
export async function runComparison(topic, wikiTitle, grokSlug, onProgress) {
  try {
    // Step 1: Fetch Wikipedia
    onProgress({ step: 1, message: 'Fetching Wikipedia...' });
    const wikiArticle = await fetchWikipediaArticle(wikiTitle);
    onProgress({ step: 1, message: `✓ Got ${wikiArticle.sentences.length} sentences from Wikipedia` });
    
    // Step 2: Fetch Grokipedia
    onProgress({ step: 2, message: 'Fetching Grokipedia...' });
    const grokArticle = await fetchGrokipediaArticle(grokSlug);
    onProgress({ step: 2, message: `✓ Got ${grokArticle.sentences.length} sentences from Grokipedia` });
    
    // Step 3: Compare locally
    onProgress({ step: 3, message: 'Comparing articles...' });
    const comparison = compareArticles(wikiArticle, grokArticle);
    onProgress({ step: 3, message: `✓ Found ${comparison.addedInGrok.length + comparison.missingInGrok.length} potential discrepancies` });
    
    return {
      success: true,
      wikiArticle,
      grokArticle,
      comparison,
      topic,
    };
  } catch (error) {
    throw new Error(`Comparison failed: ${error.message}`);
  }
}
