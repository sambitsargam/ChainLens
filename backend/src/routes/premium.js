/**
 * Premium Features Route
 * Endpoints protected by X402 payment
 */

import express from 'express';
import {
  X402_CONFIG,
  isProtectedEndpoint,
  isFreeEndpoint,
  getEndpointConfig,
  format402Response,
} from '../services/x402-handler.js';

const router = express.Router();

/**
 * Check payment middleware
 */
const requirePayment = (req, res, next) => {
  const isPaid = req.headers["x-payment"] !== undefined;
  const isFree = isFreeEndpoint(req.path);

  if (isFree) {
    return next();
  }

  if (isProtectedEndpoint(req.path) && !isPaid) {
    const config = getEndpointConfig(req.path);
    return res.status(402).json(format402Response(req.path, config));
  }

  next();
};

router.use(requirePayment);

/**
 * POST /api/publishnote
 * Publish community note to DKG (Premium)
 */
router.post("/api/publishnote", async (req, res) => {
  try {
    const { analysis, source } = req.body;

    if (!analysis) {
      return res.status(400).json({ error: "Analysis required" });
    }

    // Check if user has paid or is free user with remaining quota
    const isPaid = req.headers["x-payment"] !== undefined;
    const userTier = req.headers["x-user-tier"] || "free";

    // Payment processing logic
    console.log(`✅ Publishing note (Premium) - User tier: ${userTier}, Paid: ${isPaid}`);

    // TODO: Call publisher service
    const result = {
      success: true,
      ual: "did:otp:2043:0x" + Math.random().toString(16).slice(2),
      transactionHash: "0x" + Math.random().toString(16).slice(2),
      explorerUrl: "https://dkg-testnet.origintrail.io/explore?ual=...",
      premium: true,
      timestamp: new Date().toISOString(),
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/analysis/advanced
 * Advanced multi-LLM consensus analysis (Premium)
 */
router.post("/api/analysis/advanced", async (req, res) => {
  try {
    const { claims, sources } = req.body;

    if (!claims || !Array.isArray(claims)) {
      return res.status(400).json({ error: "Claims array required" });
    }

    const userTier = req.headers["x-user-tier"] || "free";
    const isPaid = req.headers["x-payment"] !== undefined;

    console.log(`✅ Advanced analysis request - User tier: ${userTier}, Paid: ${isPaid}`);
    console.log(`   Analyzing ${claims.length} claims with 3-model consensus...`);

    // Import LLM service
    const llmService = await import('../services/llm.js');
    
    // Get context from sources or use default
    const context = sources?.join(' ').substring(0, 500) || 'General knowledge base';
    
    // Classify all claims with consensus
    const analysis = await llmService.classifyWithConsensus(claims, context);

    // Calculate aggregate statistics
    const labelCounts = {};
    let totalConfidence = 0;
    let successCount = 0;

    analysis.forEach(item => {
      if (item.model_count > 0) {
        labelCounts[item.consensus_label] = (labelCounts[item.consensus_label] || 0) + 1;
        totalConfidence += item.consensus_confidence;
        successCount++;
      }
    });

    const avgConfidence = successCount > 0 ? totalConfidence / successCount : 0;
    const topLabel = Object.keys(labelCounts).sort((a, b) => labelCounts[b] - labelCounts[a])[0] || 'unknown';

    const result = {
      success: true,
      premium: true,
      analysis: {
        claims_processed: analysis.length,
        successful: successCount,
        failed: analysis.length - successCount,
        overall_consensus: topLabel,
        average_confidence: parseFloat(avgConfidence.toFixed(2)),
        model_results: analysis,
        summary: {
          factual_inconsistency: labelCounts['factual_inconsistency'] || 0,
          missing_context: labelCounts['missing_context'] || 0,
          hallucination: labelCounts['hallucination'] || 0,
          bias: labelCounts['bias'] || 0,
          aligned: labelCounts['aligned'] || 0,
        },
        timestamp: new Date().toISOString(),
      },
    };

    res.json(result);
  } catch (error) {
    console.error('❌ Advanced analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/grokipedia-pro
 * Premium Grokipedia search (Premium)
 */
router.get("/api/grokipedia-pro", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query required" });
    }

    const userTier = req.headers["x-user-tier"] || "free";
    const isPaid = req.headers["x-payment"] !== undefined;

    console.log(`✅ Premium Grokipedia search - User tier: ${userTier}, Paid: ${isPaid}`);

    // TODO: Call grokipedia service with premium features
    const result = {
      success: true,
      premium: true,
      results: [
        {
          title: "Sample Result",
          excerpt: "Premium enhanced search result with full extraction",
          claims: [],
          confidence: 0.85,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/batch-verify
 * Batch verify multiple claims (Premium)
 */
router.post("/api/batch-verify", async (req, res) => {
  try {
    const { claims } = req.body;

    if (!claims || !Array.isArray(claims) || claims.length === 0) {
      return res.status(400).json({ error: "Claims array required" });
    }

    if (claims.length > 100) {
      return res.status(400).json({
        error: "Maximum 100 claims per batch",
        max: 100,
        received: claims.length,
      });
    }

    const userTier = req.headers["x-user-tier"] || "free";
    const isPaid = req.headers["x-payment"] !== undefined;

    console.log(
      `✅ Batch verification (${claims.length} claims) - User tier: ${userTier}, Paid: ${isPaid}`
    );

    // TODO: Call batch verification service
    const result = {
      success: true,
      premium: true,
      batch_id: "batch_" + Date.now(),
      total_claims: claims.length,
      results: claims.map((claim, idx) => ({
        claim_id: idx + 1,
        original_claim: claim,
        verdict: ["TRUE", "PARTIALLY_TRUE", "FALSE"][Math.floor(Math.random() * 3)],
        trustScore: Math.random().toFixed(2),
        sources: [],
      })),
      timestamp: new Date().toISOString(),
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/premium/status
 * Get user's premium status and usage
 */
router.get("/api/premium/status", (req, res) => {
  const userTier = req.headers["x-user-tier"] || "free";
  const userAddress = req.headers["x-wallet-address"] || "not_connected";
  const isPaid = req.headers["x-payment"] !== undefined;

  const tierConfig = X402_CONFIG.subscriptions[userTier] || X402_CONFIG.subscriptions.free;

  res.json({
    subscription: {
      tier: userTier,
      name: tierConfig.name,
      monthly_cost: tierConfig.monthly_cost,
      features: tierConfig.features,
      limits: tierConfig.limits,
    },
    wallet: {
      connected: isPaid,
      address: userAddress,
    },
    usage: {
      publishing_this_month: 0,
      advanced_analyses_this_month: 0,
      grokipedia_searches_this_month: 0,
      batch_verifications_this_month: 0,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/premium/pricing
 * Get pricing information for all features
 */
router.get("/api/premium/pricing", (req, res) => {
  const pricing = {
    features: X402_CONFIG.features,
    subscriptions: X402_CONFIG.subscriptions,
    payment_methods: {
      network: X402_CONFIG.x402.network,
      currency: "USDC",
      facilitator: X402_CONFIG.x402.facilitatorUrl,
    },
  };

  res.json(pricing);
});

export default router;
