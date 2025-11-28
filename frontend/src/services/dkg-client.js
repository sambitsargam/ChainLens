/**
 * DKG HTTP Client
 * Handles communication with OriginTrail DKG via HTTP API
 * Based on: copy/dkg-web-main/lib/dkg-client.ts
 */

const DKG_API_ENDPOINT = '/api/publishnote';

/**
 * Create JSON-LD formatted community note for DKG
 * @param {object} analysisData - Analysis and comparison results
 * @returns {object} JSON-LD formatted note
 */
export function createJsonLDNote(analysisData) {
  const {
    topic,
    grokipediaAnalysis,
    wikipediaAnalysis,
    verdict,
    score,
    issues,
    timestamp,
  } = analysisData;

  return {
    '@context': 'https://www.w3.org/ns/did/v1',
    '@type': 'CommunityNote',
    '@id': `note:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
    name: `Fact-Check: ${topic}`,
    description: `Comparison-based fact-check for "${topic}". Verdict: ${verdict}. Score: ${score}/100.`,
    timestamp: timestamp || new Date().toISOString(),
    topic,
    grokipediaAnalysis: {
      segments: grokipediaAnalysis?.segments?.length || 0,
      avgScore: Math.round(grokipediaAnalysis?.totalScore || 0),
    },
    wikipediaAnalysis: {
      segments: wikipediaAnalysis?.segments?.length || 0,
      avgScore: Math.round(wikipediaAnalysis?.totalScore || 0),
    },
    verdict,
    score,
    issueCount: issues?.length || 0,
    criticalIssues: issues?.filter((i) => i.severity === 'critical').length || 0,
  };
}

/**
 * Publish community note to DKG
 * @param {object} noteData - JSON-LD note data
 * @param {boolean} allowDemoFallback - Allow demo UAL if real publish fails
 * @returns {Promise<object>} Publication result
 */
export async function publishNoteToDKG(noteData, allowDemoFallback = true) {
  try {
    if (!noteData || !noteData['@context']) {
      throw new Error('Invalid note data: missing @context');
    }

    const response = await fetch(DKG_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
      timeout: 30000,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || data.message || 'DKG publication failed';
      
      if (allowDemoFallback) {
        console.warn('Real DKG publish failed, returning demo UAL:', errorMsg);
        return {
          success: false,
          demo: true,
          ual: generateDemoUAL(noteData),
          warning: `Demo Mode: ${errorMsg}. Use for testing only.`,
        };
      }
      
      throw new Error(errorMsg);
    }

    return {
      success: true,
      demo: false,
      ual: data.ual,
      transactionHash: data.transactionHash,
      explorerUrl: data.explorerUrl,
    };
  } catch (error) {
    const errorMsg = error.message || 'Unknown DKG error';
    
    if (allowDemoFallback) {
      console.warn('DKG publish error, returning demo UAL:', errorMsg);
      return {
        success: false,
        demo: true,
        ual: generateDemoUAL(noteData),
        warning: `Demo Mode: ${errorMsg}. Use for testing only.`,
      };
    }
    
    throw new Error(`Failed to publish to DKG: ${errorMsg}`);
  }
}

/**
 * Fetch published note from DKG
 * @param {string} ual - Uniform Asset Locator
 * @returns {Promise<object>} Published note data
 */
export async function fetchNoteFromDKG(ual) {
  try {
    if (!ual) throw new Error('UAL is required');

    const response = await fetch(`${DKG_API_ENDPOINT}/${ual}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Failed to fetch note: ${response.status}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to fetch from DKG: ${error.message}`);
  }
}

/**
 * Query DKG for notes
 * @param {string} query - SPARQL or simple query
 * @returns {Promise<Array>} Query results
 */
export async function queryDKG(query) {
  try {
    const response = await fetch(`${DKG_API_ENDPOINT}?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('DKG query error:', error);
    return [];
  }
}

/**
 * Check DKG health status
 * @returns {Promise<object>} Health status
 */
export async function checkDKGHealth() {
  try {
    const response = await fetch('/api/dkg/health', {
      method: 'GET',
      timeout: 10000,
    });

    if (!response.ok) {
      return { healthy: false, status: response.status };
    }

    return await response.json();
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
}

/**
 * Get DKG publishing statistics
 * @returns {Promise<object>} Stats
 */
export async function getDKGStats() {
  try {
    const response = await fetch('/api/dkg/stats', {
      method: 'GET',
    });

    if (!response.ok) return { error: 'Failed to fetch stats' };

    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Generate demo UAL for testing
 * @param {object} noteData - Note data
 * @returns {string} Demo UAL
 */
export function generateDemoUAL(noteData) {
  const hash = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  return `ual:otp:demo/${hash}/${timestamp}`;
}
