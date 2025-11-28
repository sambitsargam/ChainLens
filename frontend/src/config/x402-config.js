/**
 * X402 Frontend Configuration
 * Mirrors backend config for UI purposes
 */

const X402_CONFIG = {
  // Premium features and their pricing (in USDC)
  features: {
    unlimited_publishing: {
      name: "Unlimited DKG Publishing",
      description: "Unlimited community notes published to DKG network",
      pricePerMonth: 9.99,
      free_limit: 5,
    },
    advanced_analysis: {
      name: "Advanced AI Analysis",
      description: "Access to multi-LLM consensus and advanced trust scoring",
      pricePerMonth: 4.99,
      free_limit: 3,
    },
    grokipedia_premium: {
      name: "Grokipedia Premium",
      description: "Unlimited Grokipedia article access and claim extraction",
      pricePerMonth: 2.99,
      free_limit: 10,
    },
    batch_verification: {
      name: "Batch Verification",
      description: "Verify up to 100 claims at once",
      pricePerMonth: 14.99,
      free_limit: 1,
    },
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

  // X402 Protocol Configuration
  x402: {
    facilitatorUrl: "https://x402.org/facilitator",
    network: "base-sepolia",
    receivingAddress: "0x44CBd027D65F0Aeb0AC3deEb02a3247871F00f48",
  },
};

export default X402_CONFIG;
