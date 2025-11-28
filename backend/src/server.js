import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDKG } from './config/dkgClient.js';
import { validateLLMConfig } from './config/llmConfig.js';
import { fetchWikipediaFullArticle } from './sources/wikipedia.js';
import { fetchGrokipediaArticle } from './sources/grokipedia.js';
import { compareArticles } from './compare/textCompare.js';
import { classifyDiscrepancies } from './compare/classifyDiscrepancy.js';
import { buildCommunityNote, validateCommunityNote } from './notes/buildNote.js';
import { publishNoteToDKG, getAssetByUAL } from './notes/publishNote.js';
import { cacheNote, searchNotesByTopic, getNoteByUAL, getAllTopics } from './agent/dkgQueries.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Predefined topics with Wikipedia titles and Grokipedia slugs
 */
const TOPICS = [
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    wikiTitle: 'Artificial_intelligence',
    grokSlug: 'artificial-intelligence',
  },
  {
    id: 'blockchain',
    name: 'Blockchain',
    wikiTitle: 'Blockchain',
    grokSlug: 'blockchain',
  },
  {
    id: 'climate',
    name: 'Climate Change',
    wikiTitle: 'Climate_change',
    grokSlug: 'climate-change',
  },
  {
    id: 'quantum',
    name: 'Quantum Computing',
    wikiTitle: 'Quantum_computing',
    grokSlug: 'quantum-computing',
  },
  {
    id: 'covid',
    name: 'COVID-19',
    wikiTitle: 'COVID-19',
    grokSlug: 'covid-19',
  },
];

// ==================== API ROUTES ====================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      dkg: 'configured',
      llm: 'configured',
    },
  });
});

/**
 * GET /api/topics
 * Get list of available topics
 */
app.get('/api/topics', (req, res) => {
  res.json({
    topics: TOPICS,
    totalTopics: TOPICS.length,
  });
});

/**
 * POST /api/compare-and-publish/stream
 * Streaming endpoint: fetch, compare, classify, and publish with real-time progress updates via SSE
 */
app.post('/api/compare-and-publish/stream', async (req, res) => {
  const { topic, wikiTitle, grokSlug } = req.body;
  
  if (!topic || !wikiTitle || !grokSlug) {
    return res.status(400).json({
      error: 'Missing required fields: topic, wikiTitle, grokSlug',
    });
  }
  
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  try {
    console.log(`\n=== Starting streaming comparison for: ${topic} ===`);
    sendEvent('start', { topic, timestamp: new Date().toISOString() });
    
    // Step 1: Fetch Wikipedia article
    sendEvent('progress', { step: 1, status: 'fetching_wiki', message: 'Fetching Wikipedia article...' });
    const wikiArticle = await fetchWikipediaFullArticle(wikiTitle);
    sendEvent('progress', {
      step: 1,
      status: 'wiki_complete',
      message: `✓ Wikipedia fetched: ${wikiArticle.text.length} characters`,
      data: {
        title: wikiArticle.title,
        charCount: wikiArticle.text.length,
        wordCount: wikiArticle.meta?.wordCount || wikiArticle.text.split(/\s+/).length,
        extract: wikiArticle.text.substring(0, 300) + '...'
      }
    });
    
    // Step 2: Fetch Grokipedia article
    sendEvent('progress', { step: 2, status: 'fetching_grok', message: 'Fetching Grokipedia article...' });
    const grokArticle = await fetchGrokipediaArticle(grokSlug);
    sendEvent('progress', {
      step: 2,
      status: 'grok_complete',
      message: `✓ Grokipedia fetched: ${grokArticle.text.length} characters`,
      data: {
        title: grokArticle.title,
        charCount: grokArticle.text.length,
        wordCount: grokArticle.meta?.wordCount || grokArticle.text.split(/\s+/).length,
        extract: grokArticle.text.substring(0, 300) + '...'
      }
    });
    
    // Step 3: Compare texts using semantic embeddings with progress updates
    sendEvent('progress', { step: 3, status: 'comparing', message: 'Comparing articles with semantic embeddings...' });
    
    // Create progress callback for comparison
    const onCompareProgress = (progressData) => {
      sendEvent('progress', {
        step: 3,
        status: 'compare_progress',
        message: progressData.message,
        data: progressData
      });
    };
    
    const comparisonResult = await compareArticles(wikiArticle, grokArticle, onCompareProgress);
    sendEvent('progress', {
      step: 3,
      status: 'compare_complete',
      message: `✓ Comparison complete: ${(comparisonResult.globalSimilarity * 100).toFixed(1)}% similarity`,
      data: {
        globalSimilarity: comparisonResult.globalSimilarity,
        method: comparisonResult.comparisonMetadata?.method,
        provider: comparisonResult.comparisonMetadata?.provider,
        addedCount: comparisonResult.addedInGrok.length,
        missingCount: comparisonResult.missingInGrok.length
      }
    });
    
    // Step 4: Classify discrepancies with LLM ensemble
    sendEvent('progress', { step: 4, status: 'classifying', message: 'Classifying discrepancies with LLM ensemble...' });
    const analysis = await classifyDiscrepancies({
      topic,
      wikiArticle,
      grokArticle,
      comparisonResult,
    });
    sendEvent('progress', {
      step: 4,
      status: 'classify_complete',
      message: `✓ Classification complete: ${analysis.discrepancies.length} discrepancies analyzed`,
      data: {
        alignmentScore: analysis.alignmentScore,
        discrepancyCount: analysis.discrepancies.length
      }
    });
    
    // Step 5: Build Community Note
    sendEvent('progress', { step: 5, status: 'building', message: 'Building Community Note...' });
    const note = buildCommunityNote({
      topic,
      wikiArticle,
      grokArticle,
      analysis,
    });
    validateCommunityNote(note);
    sendEvent('progress', { step: 5, status: 'build_complete', message: '✓ Community Note built and validated' });
    
    // Step 6: Publish to DKG
    sendEvent('progress', { step: 6, status: 'publishing', message: 'Publishing to OriginTrail DKG...' });
    let publishResult = null;
    let ual = null;
    
    try {
      publishResult = await publishNoteToDKG(note);
      ual = publishResult.ual;
      sendEvent('progress', { step: 6, status: 'publish_complete', message: `✓ Published to DKG: ${ual}`, data: { ual } });
    } catch (dkgError) {
      ual = `demo:${topic.toLowerCase().replace(/\s+/g, '-')}:${Date.now()}`;
      sendEvent('progress', { step: 6, status: 'publish_demo', message: `⚠ Using demo UAL: ${ual}`, data: { ual } });
    }
    
    // Step 7: Cache the note
    cacheNote(topic, {
      topic,
      ual,
      alignmentScore: analysis.alignmentScore,
      discrepancyCount: analysis.discrepancies.length,
      createdAt: new Date().toISOString(),
    });
    
    // Send final complete event with full results
    sendEvent('complete', {
      success: true,
      topic,
      ual,
      dkgPublished: publishResult !== null,
      wikiArticle: {
        title: wikiArticle.title,
        extract: wikiArticle.text.substring(0, 300) + '...',
        fullText: wikiArticle.text,
        fullLength: wikiArticle.text.length,
        sentenceCount: comparisonResult.stats.wikiSentenceCount,
      },
      grokArticle: {
        title: grokArticle.title,
        extract: grokArticle.text.substring(0, 300) + '...',
        fullText: grokArticle.text,
        fullLength: grokArticle.text.length,
        sentenceCount: comparisonResult.stats.grokSentenceCount,
      },
      analysis: {
        alignmentScore: analysis.alignmentScore,
        discrepancyCount: analysis.discrepancies.length,
        stats: analysis.stats,
        comparisonMetadata: comparisonResult.comparisonMetadata || null,
      },
      discrepancies: analysis.discrepancies,
      notePublicGraph: note.public,
    });
    
    console.log('=== Streaming comparison complete ===\n');
    res.end();
    
  } catch (error) {
    console.error('Error in streaming compare-and-publish:', error);
    sendEvent('error', {
      error: error.message,
      details: 'Failed to complete comparison and publication',
      timestamp: new Date().toISOString()
    });
    res.end();
  }
});

/**
 * POST /api/compare-and-publish
 * Main endpoint: fetch, compare, classify, and publish to DKG
 */
app.post('/api/compare-and-publish', async (req, res) => {
  try {
    const { topic, wikiTitle, grokSlug } = req.body;
    
    if (!topic || !wikiTitle || !grokSlug) {
      return res.status(400).json({
        error: 'Missing required fields: topic, wikiTitle, grokSlug',
      });
    }
    
    console.log(`\n=== Starting comparison for: ${topic} ===`);
    
    // Step 1: Fetch Wikipedia article
    console.log('Step 1: Fetching Wikipedia article...');
    const wikiArticle = await fetchWikipediaFullArticle(wikiTitle);
    console.log(`✓ Wikipedia fetched: ${wikiArticle.text.length} characters`);
    
    // Step 2: Fetch Grokipedia article
    console.log('Step 2: Fetching Grokipedia article...');
    const grokArticle = await fetchGrokipediaArticle(grokSlug);
    console.log(`✓ Grokipedia fetched: ${grokArticle.text.length} characters`);
    
    // Step 3: Compare texts using semantic embeddings
    console.log('Step 3: Comparing articles with semantic embeddings...');
    const comparisonResult = await compareArticles(wikiArticle, grokArticle);
    console.log(`✓ Comparison complete: ${comparisonResult.globalSimilarity} similarity`);
    if (comparisonResult.comparisonMetadata) {
      console.log(`  Method: ${comparisonResult.comparisonMetadata.method}`);
      console.log(`  Provider: ${comparisonResult.comparisonMetadata.provider}`);
    }
    console.log(`  Added in Grok: ${comparisonResult.addedInGrok.length} sentences`);
    console.log(`  Missing in Grok: ${comparisonResult.missingInGrok.length} sentences`);
    
    // Step 4: Classify discrepancies with LLM ensemble
    console.log('Step 4: Classifying discrepancies with LLM ensemble...');
    const analysis = await classifyDiscrepancies({
      topic,
      wikiArticle,
      grokArticle,
      comparisonResult,
    });
    console.log(`✓ Classification complete: ${analysis.discrepancies.length} discrepancies analyzed`);
    
    // Step 5: Build Community Note (JSON-LD)
    console.log('Step 5: Building Community Note...');
    const note = buildCommunityNote({
      topic,
      wikiArticle,
      grokArticle,
      analysis,
    });
    validateCommunityNote(note);
    console.log('✓ Community Note built and validated');
    
    // Step 6: Publish to DKG (optional - will work without if DKG node not available)
    console.log('Step 6: Publishing to OriginTrail DKG...');
    let publishResult = null;
    let ual = null;
    
    try {
      publishResult = await publishNoteToDKG(note);
      ual = publishResult.ual;
      console.log(`✓ Published to DKG: ${ual}`);
    } catch (dkgError) {
      console.warn('⚠ DKG publishing failed (this is okay for demo purposes):', dkgError.message);
      ual = `demo:${topic.toLowerCase().replace(/\s+/g, '-')}:${Date.now()}`;
      console.log(`✓ Using demo UAL: ${ual}`);
    }
    
    // Step 7: Cache the note for quick retrieval
    cacheNote(topic, {
      topic,
      ual,
      alignmentScore: analysis.alignmentScore,
      discrepancyCount: analysis.discrepancies.length,
      createdAt: new Date().toISOString(),
    });
    
    console.log('=== Comparison complete ===\n');
    
    // Return response with fetched data
    res.json({
      success: true,
      topic,
      ual,
      dkgPublished: publishResult !== null,
      wikiArticle: {
        title: wikiArticle.title,
        extract: wikiArticle.text.substring(0, 300) + '...',
        fullText: wikiArticle.text,
        fullLength: wikiArticle.text.length,
        sentenceCount: comparisonResult.stats.wikiSentenceCount,
      },
      grokArticle: {
        title: grokArticle.title,
        extract: grokArticle.text.substring(0, 300) + '...',
        fullText: grokArticle.text,
        fullLength: grokArticle.text.length,
        sentenceCount: comparisonResult.stats.grokSentenceCount,
      },
      analysis: {
        alignmentScore: analysis.alignmentScore,
        discrepancyCount: analysis.discrepancies.length,
        stats: analysis.stats,
        comparisonMetadata: comparisonResult.comparisonMetadata || null,
      },
      discrepancies: analysis.discrepancies,
      notePublicGraph: note.public,
    });
    
  } catch (error) {
    console.error('Error in compare-and-publish:', error);
    res.status(500).json({
      error: error.message,
      details: 'Failed to complete comparison and publication',
    });
  }
});

/**
 * GET /api/notes/search
 * Search for Community Notes by topic
 */
app.get('/api/notes/search', async (req, res) => {
  try {
    const { topic } = req.query;
    
    if (!topic) {
      return res.status(400).json({
        error: 'Missing required query parameter: topic',
      });
    }
    
    const notes = await searchNotesByTopic(topic);
    
    res.json({
      topic,
      notesFound: notes.length,
      notes,
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/notes/topics
 * Get all topics with published notes
 */
app.get('/api/notes/topics', (req, res) => {
  try {
    const topics = getAllTopics();
    
    res.json({
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/notes/:ual
 * Get detailed note by UAL
 */
app.get('/api/notes/:ual', async (req, res) => {
  try {
    const { ual } = req.params;
    
    // Decode UAL if URL encoded
    const decodedUAL = decodeURIComponent(ual);
    
    const note = await getNoteByUAL(decodedUAL);
    
    res.json(note);
  } catch (error) {
    console.error('Error fetching note by UAL:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    console.log('\n🚀 Starting Grokipedia Truth Alignment Backend...\n');
    
    // Initialize DKG client
    console.log('Initializing OriginTrail DKG client...');
    initializeDKG();
    
    // Validate LLM configuration
    console.log('Validating LLM configuration...');
    validateLLMConfig();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`);
      console.log('\nAvailable endpoints:');
      console.log(`  GET  /api/health`);
      console.log(`  GET  /api/topics`);
      console.log(`  POST /api/compare-and-publish`);
      console.log(`  POST /api/compare-and-publish/stream (SSE)`);
      console.log(`  GET  /api/notes/search?topic=<topic>`);
      console.log(`  GET  /api/notes/topics`);
      console.log(`  GET  /api/notes/:ual`);
      console.log('\n✓ Ready to process requests\n');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
