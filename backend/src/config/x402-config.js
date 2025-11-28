/**
 * X402 Payment Configuration
 * Defines premium features, pricing, and payment terms for ChainLens
 */

const X402_CONFIG = {
  // Premium features and their pricing (in USDC)
  features: {
    unlimited_publishing: {
      name: "Unlimited DKG Publishing",
      description: "Unlimited community notes published to DKG network",
      pricePerMonth: 9.99,
      free_limit: 5, // Free users get 5 publishes per month
    },
    advanced_analysis: {
      name: "Advanced AI Analysis",
      description: "Access to multi-LLM consensus and advanced trust scoring",
      pricePerMonth: 4.99,
      free_limit: 3, // Free users get 3 advanced analyses per month
    },
    grokipedia_premium: {
      name: "Grokipedia Premium",
      description: "Unlimited Grokipedia article access and claim extraction",
      pricePerMonth: 2.99,
      free_limit: 10, // Free users get 10 Grokipedia searches per month
    },
    batch_verification: {
      name: "Batch Verification",
      description: "Verify up to 100 claims at once",
      pricePerMonth: 14.99,
      free_limit: 1, // Free users can do 1 batch verification per month
    },
  },

  // API endpoints with payment protection
  endpoints: {
    // Premium paid endpoints
    paid: {
      "/api/publishnote": {
        feature: "unlimited_publishing",
        price: "$0.05", // Per publish after monthly limit
        description: "Publish community note to DKG",
        mimeType: "application/json",
        outputSchema: {
          type: "object",
          properties: {
            ual: { type: "string" },
            transactionHash: { type: "string" },
            explorerUrl: { type: "string" },
          },
        },
      },
      "/api/analysis/advanced": {
        feature: "advanced_analysis",
        price: "$0.02", // Per advanced analysis
        description: "Advanced multi-LLM consensus analysis",
        mimeType: "application/json",
        outputSchema: {
          type: "object",
          properties: {
            verdict: { type: "string" },
            trustScore: { type: "number" },
            consensus: { type: "object" },
          },
        },
      },
      "/api/grokipedia-pro": {
        feature: "grokipedia_premium",
        price: "$0.01", // Per premium search
        description: "Premium Grokipedia search with enhanced extraction",
        mimeType: "application/json",
      },
      "/api/batch-verify": {
        feature: "batch_verification",
        price: "$0.10", // Per batch of up to 100 claims
        description: "Batch verify multiple claims",
        mimeType: "application/json",
      },
    },

    // Free endpoints (always accessible)
    free: [
      "/api/health",
      "/api/wikipedia",
      "/api/scraper",
      "/api/dkg/stats",
      "/api/dkg/health",
    ],
  },

  // X402 Protocol Configuration
  x402: {
    facilitatorUrl: process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator",
    network: process.env.X402_NETWORK || "base-sepolia",
    receivingAddress: process.env.X402_WALLET_ADDRESS || "0x44CBd027D65F0Aeb0AC3deEb02a3247871F00f48",
    maxTimeoutSeconds: 60,
  },

  // Subscription tiers
  subscriptions: {
    free: {
      name: "Free",
      monthly_cost: 0,
      features: {
        unlimited_publishing: false,
        advanced_analysis: false,
        grokipedia_premium: false,
        batch_verification: false,
      },
      limits: {
        publishing_per_month: 5,
        advanced_analyses_per_month: 3,
        grokipedia_searches_per_month: 10,
        batch_verifications_per_month: 1,
      },
    },
    premium: {
      name: "Premium",
      monthly_cost: 19.99,
      features: {
        unlimited_publishing: true,
        advanced_analysis: true,
        grokipedia_premium: true,
        batch_verification: true,
      },
      limits: {
        publishing_per_month: Infinity,
        advanced_analyses_per_month: Infinity,
        grokipedia_searches_per_month: Infinity,
        batch_verifications_per_month: Infinity,
      },
    },
    pro: {
      name: "Pro",
      monthly_cost: 49.99,
      features: {
        unlimited_publishing: true,
        advanced_analysis: true,
        grokipedia_premium: true,
        batch_verification: true,
      },
      limits: {
        publishing_per_month: Infinity,
        advanced_analyses_per_month: Infinity,
        grokipedia_searches_per_month: Infinity,
        batch_verifications_per_month: Infinity,
      },
      priority_support: true,
      api_priority: "high",
    },
  },

  // Usage tracking for free users
  usage_tracking: {
    enabled: true,
    storage: "redis", // or "memory" for development
    resetInterval: "monthly", // Reset usage on first day of month
  },
};

export default X402_CONFIG;
