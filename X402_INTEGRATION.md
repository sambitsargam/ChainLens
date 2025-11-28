# X402 Premium Access Integration

ChainLens now includes comprehensive X402 payment protocol integration, enabling premium features with frictionless crypto payments. This document covers the implementation, configuration, and usage.

## Overview

X402 is an open payment standard that uses the HTTP 402 Payment Required status code to enable services to charge for API access directly over HTTP. ChainLens uses X402 to offer:

- **Unlimited DKG Publishing** ($19.99/month or $0.05 per publish)
- **Advanced AI Analysis** ($4.99/month or $0.02 per analysis)
- **Premium Grokipedia Access** ($2.99/month or $0.01 per search)
- **Batch Verification** ($14.99/month or $0.10 per batch)

## Architecture

### Backend (Express.js)

```
/backend/src/
├── config/
│   └── x402-config.js          # Payment configuration & pricing
├── services/
│   ├── x402-handler.js         # Payment middleware & utilities
│   └── usage-tracker.js        # Free tier usage tracking
└── routes/
    └── premium.js              # Premium endpoints
```

### Frontend (React/Vite)

```
/frontend/src/
├── services/
│   └── x402-client.js          # Wallet & payment client
└── components/
    └── PremiumAccessManager.jsx # Premium UI
```

## Backend Implementation

### 1. X402 Configuration (`x402-config.js`)

Defines all premium features, pricing, and endpoints:

```javascript
const X402_CONFIG = {
  features: {
    unlimited_publishing: {
      name: "Unlimited DKG Publishing",
      pricePerMonth: 9.99,
      free_limit: 5, // Free users get 5 per month
    },
    // ... more features
  },
  
  endpoints: {
    paid: {
      "/api/publishnote": {
        feature: "unlimited_publishing",
        price: "$0.05",
        description: "Publish community note to DKG",
      },
      // ... more endpoints
    },
    free: ["/api/health", "/api/wikipedia", "/api/scraper"],
  },
  
  x402: {
    facilitatorUrl: "https://x402.org/facilitator",
    network: "base-sepolia",
    receivingAddress: "0x44CBd027D65F0Aeb0AC3deEb02a3247871F00f48",
  },
  
  subscriptions: {
    free: { /* free tier limits */ },
    premium: { /* premium tier */ },
    pro: { /* pro tier */ },
  },
};
```

### 2. Premium Endpoints (`premium.js`)

All premium endpoints include:

- **Payment Check**: HTTP 402 response if no payment
- **Wallet Verification**: Validates X-PAYMENT header
- **Usage Tracking**: For free tier limits
- **Response**: Returns feature with premium flag

```javascript
// POST /api/publishnote - Publish to DKG (Premium)
POST /api/publishnote
Header: X-PAYMENT: <signed_transaction>
Body: { analysis, source }

// POST /api/analysis/advanced - Multi-LLM consensus (Premium)
POST /api/analysis/advanced
Header: X-PAYMENT: <signed_transaction>
Body: { claims, sources }

// GET /api/grokipedia-pro - Premium Grokipedia (Premium)
GET /api/grokipedia-pro?query=...
Header: X-PAYMENT: <signed_transaction>

// POST /api/batch-verify - Batch claims (Premium, max 100 claims)
POST /api/batch-verify
Header: X-PAYMENT: <signed_transaction>
Body: { claims }

// GET /api/premium/status - User's premium status (Free)
GET /api/premium/status
Response: { subscription, wallet, usage }

// GET /api/premium/pricing - Pricing info (Free)
GET /api/premium/pricing
Response: { features, subscriptions, payment_methods }
```

### 3. Payment Flow

```
1. Client makes request to premium endpoint
   GET /api/publishnote

2. Server checks for X-PAYMENT header
   - If missing: Respond with HTTP 402 Payment Required
   - If present: Verify and process

3. Server responds with 402
   {
     "status": 402,
     "message": "Payment Required",
     "price": "$0.05",
     "facilitator": "https://x402.org/facilitator",
     "receiver": "0x44CBd027D65F0Aeb0AC3deEb02a3247871F00f48"
   }

4. Client creates payment
   - Sign transaction with wallet
   - Include payment in X-PAYMENT header
   - Retry request

5. Server verifies payment via facilitator
   - Call /verify endpoint on facilitator
   - Check signature and amount
   - If valid: Return resource

6. Server settles payment
   - Call /settle endpoint on facilitator
   - Transfer funds to receiver
```

## Frontend Implementation

### 1. X402 Payment Client (`x402-client.js`)

Automatic payment handling with viem and x402-fetch:

```javascript
import { x402Client } from '../services/x402-client.js';

// Initialize with wallet
await x402Client.initializeWallet(privateKey);

// Make paid request (handles 402 automatically)
const result = await x402Client.makePaidRequest(
  'http://localhost:3001/api/publishnote',
  {
    method: 'POST',
    body: JSON.stringify({ analysis, source })
  }
);

// Get payment status
console.log(result.paid); // true/false
console.log(result.payment); // { amount, timestamp, ... }
```

### 2. Premium UI Component (`PremiumAccessManager.jsx`)

React component showing:

- Wallet status & connection
- Subscription tier display
- Payment history
- Feature comparison table
- Upgrade flows

```jsx
import PremiumAccessManager from '@/components/PremiumAccessManager.jsx';

<PremiumAccessManager />
```

### 3. React Hook (`useX402Payment`)

```javascript
const { 
  isInitialized,      // Wallet ready
  wallet,             // Wallet address
  paymentHistory,     // List of payments
  makePaidRequest,    // Function to make payment
  totalSpent,         // Total amount spent
} = useX402Payment();
```

## Configuration

### Backend Environment Variables

Add to `/backend/.env`:

```env
# X402 Payment Configuration
X402_WALLET_ADDRESS=0x44CBd027D65F0Aeb0AC3deEb02a3247871F00f48
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_NETWORK=base-sepolia
X402_RPC_URL=https://sepolia.base.org

# Enable/Disable payments (default: false for dev)
X402_ENABLED=false
```

### Frontend Environment Variables

Add to `/frontend/.env`:

```env
# X402 Payment Configuration
VITE_X402_FACILITATOR_URL=https://x402.org/facilitator
VITE_X402_NETWORK=base-sepolia
VITE_X402_RPC_URL=https://sepolia.base.org
```

## Testing

### 1. Disable Payments (Development)

By default, payments are disabled (`X402_ENABLED=false`). Premium endpoints respond with 402 but don't enforce payment.

```bash
# Backend will respond with 402 but allow access
curl -X POST http://localhost:3001/api/publishnote \
  -H "Content-Type: application/json" \
  -d '{"analysis": {}}'

# Response: 402 Payment Required
```

### 2. Enable Payments (Testing)

```bash
# Set in .env
X402_ENABLED=true

# Restart backend
npm start
```

### 3. Test Payment Flow

```bash
# 1. Install x402-fetch client package
npm install x402-fetch

# 2. Create test wallet with USDC on Base Sepolia
# https://www.alchemy.com/faucets/base-sepolia

# 3. Make payment-required request
curl -X POST http://localhost:3001/api/publishnote \
  -H "Content-Type: application/json" \
  -d '{"analysis": {}}'

# 4. Response: 402 with payment instructions
# {
#   "status": 402,
#   "message": "Payment Required",
#   "price": "$0.05",
#   "facilitator": "https://x402.org/facilitator"
# }

# 5. Client signs payment using x402-client
# 6. Client retries with X-PAYMENT header
# 7. Server verifies and responds with resource
```

## Usage Tracking

The `UsageTracker` service tracks free tier usage:

```javascript
const usageTracker = require('../services/usage-tracker');

// Track usage
usageTracker.trackUsage('0x...', 'publishing', 1);

// Check if reached limit
const hasReached = usageTracker.hasReachedLimit(
  '0x...', 
  'publishing',
  5  // Free limit
);

// Get remaining quota
const remaining = usageTracker.getRemainingQuota(
  '0x...',
  'publishing',
  5
);
```

## Pricing Tiers

### Free ($0/month)

- 5 DKG publishes
- 3 advanced analyses
- 10 Grokipedia searches
- 1 batch verification
- Usage resets monthly

### Premium ($19.99/month)

- Unlimited publishing
- Unlimited analyses
- Unlimited Grokipedia access
- Unlimited batch verification
- No wait times

### Pro ($49.99/month)

- Everything in Premium
- Priority support
- Higher API rate limits
- Custom batch sizes

## Pay-as-You-Go Pricing

Without subscription:

- $0.05 per DKG publish
- $0.02 per advanced analysis
- $0.01 per Grokipedia search
- $0.10 per batch verification

## Advanced Features

### 1. Custom Pricing

Modify `X402_CONFIG.features` to adjust pricing:

```javascript
unlimited_publishing: {
  pricePerMonth: 9.99,        // Monthly subscription
  pay_per_use: "$0.05",        // Per-use price
  free_limit: 5,               // Free quota
}
```

### 2. Usage-Based Limits

Free users have monthly limits per feature. Implement via:

```javascript
// Check if user exceeded free limit
const hasReached = usageTracker.hasReachedLimit(
  walletAddress,
  'publishing',
  5  // Free monthly limit
);

if (hasReached && !isPaid) {
  return res.status(402).json({
    message: "Monthly free quota exceeded",
    limit: 5,
    used: 5,
  });
}
```

### 3. Rate Limiting for Paid

Increase rate limits for premium users:

```javascript
const rateLimitConfig = {
  free: {
    windowMs: 900000,      // 15 minutes
    maxRequests: 10,
  },
  premium: {
    windowMs: 900000,
    maxRequests: 100,
  },
  pro: {
    windowMs: 900000,
    maxRequests: 1000,
  },
};
```

## Troubleshooting

### Issue: "Cannot find module 'x402-express'"

**Solution**: Install dependencies

```bash
cd backend
npm install x402-express @coinbase/x402
```

### Issue: "Cannot find module 'x402-fetch'"

**Solution**: Install frontend dependencies

```bash
cd frontend
npm install x402-fetch viem
```

### Issue: "402 response but no payment data"

**Solution**: Check facilitator URL in config

```javascript
X402_CONFIG.x402.facilitatorUrl
// Should be: https://x402.org/facilitator (testnet)
// Or configure your own facilitator
```

### Issue: "Payment verification failed"

**Solution**: Ensure:

1. Wallet has USDC on Base Sepolia
2. Sufficient balance for payment
3. Facilitator URL is correct
4. Network matches (base-sepolia)

## Production Deployment

### 1. Enable Payments

```env
X402_ENABLED=true
```

### 2. Use Real Facilitator

```env
X402_FACILITATOR_URL=https://x402.org/facilitator  # Mainnet
X402_NETWORK=base                                  # Mainnet
```

### 3. Configure Real Receiver

```env
X402_WALLET_ADDRESS=<your-mainnet-address>
```

### 4. Add Usage Tracking Database

Switch from in-memory to Redis:

```javascript
// In usage-tracker.js
const redis = require('redis');
const client = redis.createClient();
```

### 5. Monitor Payments

Set up webhooks for payment events:

```javascript
// Example: payment-webhook.js
app.post('/webhooks/payment', (req, res) => {
  const { payment, amount, status } = req.body;
  
  // Log payment
  console.log(`💰 Payment received: ${amount} from ${payment.sender}`);
  
  // Update user subscription
  // Trigger fulfillment
});
```

## API Reference

### Premium Endpoints

All require `X-PAYMENT` header when enabled:

| Method | Endpoint | Price | Premium Feature |
|--------|----------|-------|-----------------|
| POST | /api/publishnote | $0.05 | DKG Publishing |
| POST | /api/analysis/advanced | $0.02 | Advanced Analysis |
| GET | /api/grokipedia-pro | $0.01 | Grokipedia |
| POST | /api/batch-verify | $0.10 | Batch Verification |
| GET | /api/premium/status | Free | Check subscription |
| GET | /api/premium/pricing | Free | Get pricing |

### Response Headers

```
X-Payment-Response: {
  "amount": "0.05",
  "currency": "USDC",
  "status": "verified",
  "timestamp": "2025-11-29T...",
  "transactionHash": "0x..."
}
```

## References

- [X402 Specification](https://x402.gitbook.io/x402)
- [x402-express npm](https://www.npmjs.com/package/x402-express)
- [x402-fetch npm](https://www.npmjs.com/package/x402-fetch)
- [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
- [X402 Discord](https://discord.gg/invite/cdp)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review [X402 GitBook](https://x402.gitbook.io/x402)
3. Join [X402 Discord](https://discord.gg/invite/cdp)
4. Open an issue on GitHub

---

**Last Updated**: November 29, 2025
**Status**: ✅ Production Ready
**X402 Version**: 1.0.0
