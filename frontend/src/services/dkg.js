/**
 * DKG Publishing Service
 * Publishes Community Notes as Knowledge Assets to OriginTrail DKG
 */

const DKG_BACKEND_URL = import.meta.env.VITE_DKG_BACKEND_URL || 'http://localhost:3001';

/**
 * Transform analysis result into JSON-LD Community Note format
 */
export function createCommunityNoteJsonLD(analysisData) {
  const {
    topic,
    wikiArticle,
    grokArticle,
    analysis,
    discrepancies,
  } = analysisData;

  const communityNote = {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    
    // Metadata
    datePublished: new Date().toISOString(),
    claimReviewed: `Grokipedia article: ${topic}`,
    
    // Trust scoring
    reviewRating: {
      '@type': 'Rating',
      ratingValue: Math.round(analysis.alignmentScore * 100),
      bestRating: 100,
      worstRating: 0,
      ratingExplanation: `Compared Grokipedia vs Wikipedia with ${discrepancies.length} discrepancies found`,
    },
    
    // Source being reviewed
    itemReviewed: {
      '@type': 'CreativeWork',
      name: grokArticle.title,
      author: {
        '@type': 'Organization',
        name: 'Grokipedia'
      },
      url: grokArticle.url || `https://grokipedia.com/page/${topic}`,
      datePublished: new Date().toISOString(),
      text: grokArticle.extract,
    },
    
    // Reference source
    referenceSource: {
      '@type': 'CreativeWork',
      name: wikiArticle.title,
      author: {
        '@type': 'Organization',
        name: 'Wikipedia'
      },
      url: wikiArticle.url || `https://en.wikipedia.org/wiki/${topic}`,
      text: wikiArticle.extract,
    },
    
    // Who's reviewing
    author: {
      '@type': 'Organization',
      name: 'ChainLens Verification System',
      description: 'Decentralized fact-checking using LLM consensus and semantic analysis'
    },
    
    // Analysis methodology
    methodology: {
      embeddings: 'OpenAI text-embedding-3-small (1536D)',
      classification: 'Multi-LLM consensus (OpenAI, Gemini, Grok)',
      similarityThreshold: 0.85,
      comparisonMethod: analysis.comparisonMetadata?.method || 'semantic-embedding',
    },
    
    // Segment-level discrepancies
    segments: discrepancies.map((disc, index) => ({
      segmentId: `segment-${index + 1}`,
      text: disc.grokipedia_claim,
      classification: disc.type,
      explanation: disc.explanation,
      modelVotes: disc.model_votes || [],
      confidence: disc.model_votes ? 
        disc.model_votes.reduce((sum, v) => sum + (v.label === disc.type ? 1 : 0), 0) / disc.model_votes.length :
        0.5,
    })),
    
    // Statistics
    statistics: {
      wikiSentenceCount: analysis.stats.wikiSentenceCount,
      grokSentenceCount: analysis.stats.grokSentenceCount,
      discrepanciesFound: analysis.stats.addedCount,
      discrepanciesAnalyzed: analysis.discrepancyCount,
      alignmentScore: analysis.alignmentScore,
    },
    
    // Verdict
    trustScore: Math.round(analysis.alignmentScore * 100),
    verdict: getVerdict(analysis.alignmentScore),
    
    // Provenance
    generator: {
      '@type': 'SoftwareApplication',
      name: 'ChainLens',
      version: '1.0.0',
      url: 'https://chainlens.app'
    },
  };

  return communityNote;
}

/**
 * Calculate verdict based on alignment score
 */
function getVerdict(alignmentScore) {
  if (alignmentScore >= 0.9) return 'highly_reliable';
  if (alignmentScore >= 0.75) return 'reliable';
  if (alignmentScore >= 0.6) return 'mostly_reliable';
  if (alignmentScore >= 0.4) return 'questionable';
  return 'unreliable';
}

/**
 * Publish Community Note to DKG
 * Uses /api/publishnote endpoint following reference implementation
 * Returns UAL (Universal Asset Locator) for blockchain verification
 * 
 * @param {Object} analysisData - Analysis results to publish
 * @param {boolean} allowDemoFallback - If true, use demo UAL when real DKG fails
 */
export async function publishToDKG(analysisData, allowDemoFallback = true) {
  try {
    const communityNote = createCommunityNoteJsonLD(analysisData);
    
    console.log('[DKG] Publishing to DKG:', communityNote);
    
    // Call publishnote backend API (replaces /api/dkg/publish)
    const response = await fetch(`${DKG_BACKEND_URL}/api/publishnote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: communityNote,
        options: {
          epochsNum: 2,
          privacy: 'public',
          immutable: false,
        },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMsg = errorData.error || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }
    
    const result = await response.json();
    
    // Check if this is a real or demo response
    if (result.success) {
      console.log('[DKG] ✓ Published successfully:', result.ual);
      return {
        success: true,
        demo: false,
        ual: result.ual,
        transactionHash: result.transactionHash,
        explorerUrl: result.explorerUrl,
        communityNote: communityNote,
      };
    } else if (result.demo) {
      // Real DKG unavailable, but backend provided demo UAL
      console.warn('[DKG] ⚠️  DKG unavailable, using demo UAL:', result.ual);
      return {
        success: false,
        demo: true,
        ual: result.ual,
        warning: result.warning,
        transactionHash: result.transactionHash,
        explorerUrl: result.explorerUrl,
        communityNote: communityNote,
      };
    } else {
      // Real error from backend
      throw new Error(result.error || result.helpMessage || 'Publishing failed');
    }
  } catch (error) {
    console.error('[DKG] Publishing error:', error.message);
    
    if (!allowDemoFallback) {
      // Strict mode - return error
      return {
        success: false,
        demo: false,
        error: error.message,
        communityNote: communityNote,
      };
    }
    
    // Fallback: Generate demo UAL for development/demo
    const demoUAL = `did:otp:2043:0x${Math.random().toString(16).slice(2)}:0x${Math.random().toString(16).slice(2)}`;
    
    console.warn(`[DKG] Fallback to demo UAL: ${demoUAL}`);
    
    return {
      success: false,
      demo: true,
      error: error.message,
      ual: demoUAL,
      transactionHash: 'demo-0x' + Math.random().toString(16).slice(2),
      explorerUrl: `https://dkg-testnet.origintrail.io/explore?ual=${encodeURIComponent(demoUAL)}`,
      warning: `Publishing error: ${error.message}. Using demo UAL for preview.`,
      communityNote: communityNote,
    };
  }
}

/**
 * Fetch published note from DKG by UAL
 * Uses /api/publishnote/:ual endpoint
 * 
 * @param {string} ual - Universal Asset Locator
 * @returns {Promise<Object|null>} Note data or null
 */
export async function fetchPublishedNote(ual) {
  try {
    console.log('[DKG] Fetching note from DKG:', ual);
    
    const response = await fetch(`${DKG_BACKEND_URL}/api/publishnote/${encodeURIComponent(ual)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('[DKG] ✓ Note retrieved successfully');
      return result.data;
    } else {
      console.warn('[DKG] Note not found or not accessible');
      return null;
    }
  } catch (error) {
    console.error('[DKG] Fetch error:', error.message);
    return null;
  }
}

/**
 * Store published note in localStorage for history
 */
export function saveCommunityNoteToHistory(result, topic) {
  try {
    if (!result || !result.ual) {
      console.error('Invalid result object for history');
      return null;
    }

    const history = JSON.parse(localStorage.getItem('chainlens-history') || '[]');
    
    const entry = {
      id: Date.now(),
      topic,
      ual: result.ual,
      trustScore: result.communityNote?.trustScore || 0,
      verdict: result.communityNote?.verdict || 'unknown',
      timestamp: new Date().toISOString(),
      transactionHash: result.transactionHash || '',
      explorerUrl: result.explorerUrl || '',
      published: result.success || false,
    };
    
    history.unshift(entry);
    localStorage.setItem('chainlens-history', JSON.stringify(history.slice(0, 50)));
    
    return entry;
  } catch (error) {
    console.error('Failed to save to history:', error);
    return null;
  }
}

export default {
  createCommunityNoteJsonLD,
  publishToDKG,
  fetchPublishedNote,
  saveCommunityNoteToHistory,
};
