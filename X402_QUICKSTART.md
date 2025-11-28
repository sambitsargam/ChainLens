# X402 Premium Features Quick Start

ChainLens now includes **X402 premium access** - a crypto-native payment system for advanced features.

## 🔐 What's Available

### Free Features
- 5 DKG publishes/month
- 3 advanced analyses/month
- 10 Grokipedia searches/month
- Basic fact-checking

### 💎 Premium Features ($19.99/month)
- ✅ Unlimited DKG publishing
- ✅ Advanced multi-LLM analysis
- ✅ Premium Grokipedia access
- ✅ Batch verification (up to 100 claims)

### Pro Features ($49.99/month)
- Everything in Premium
- Priority support
- Higher API rate limits
- Custom batch sizes

## 🚀 Quick Start

### 1. Setup X402

```bash
cd /Users/sambit/Documents/ChainLens
bash setup-x402.sh
```

### 2. Get Testnet USDC

Get test USDC on Base Sepolia:
- https://www.alchemy.com/faucets/base-sepolia

### 3. Start Services

```bash
# Terminal 1: Backend (with premium endpoints)
cd backend
npm start

# Terminal 2: Frontend
cd frontend  
npm run dev

# Terminal 3: DKG Node (optional)
cd dkg-node/apps/agent
npm run dev:server
```

### 4. Visit Premium Dashboard

Open http://localhost:5173 and look for the "🔐 Premium Access" section

## 💳 Configuration

### Backend (.env)
```env
X402_WALLET_ADDRESS=0x44CBd027D65F0Aeb0AC3deEb02a3247871F00f48
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_NETWORK=base-sepolia
X402_RPC_URL=https://sepolia.base.org
X402_ENABLED=false  # Set to true to enforce payments
```

### Frontend (.env)
```env
VITE_X402_FACILITATOR_URL=https://x402.org/facilitator
VITE_X402_NETWORK=base-sepolia
VITE_X402_RPC_URL=https://sepolia.base.org
VITE_X402_PRIVATE_KEY=your-private-key
```

## 🧪 Testing

### Test 402 Response (No Payment)
```bash
curl -X POST http://localhost:3001/api/publishnote \
  -H "Content-Type: application/json" \
  -d '{"analysis": {}}'

# Response: 402 Payment Required
# {
#   "status": 402,
#   "message": "Payment Required",
#   "price": "$0.05",
#   "facilitator": "https://x402.org/facilitator"
# }
```

### Enable Payments
```bash
# Set X402_ENABLED=true in backend/.env
# Restart backend
```

### Test Payment Flow
1. Frontend connects wallet with private key
2. Frontend makes request to premium endpoint
3. Backend responds with 402 + payment instructions
4. Frontend signs payment using wallet
5. Frontend retries with X-PAYMENT header
6. Backend verifies and responds with resource

## 📁 New Files

```
backend/
├── src/config/x402-config.js         # Payment configuration
├── src/services/x402-handler.js      # Middleware & utilities
├── src/services/usage-tracker.js     # Free tier tracking
└── src/routes/premium.js             # Premium endpoints

frontend/
├── src/services/x402-client.js       # Payment client
└── src/components/PremiumAccessManager.jsx  # UI

Documentation/
├── X402_INTEGRATION.md               # Full integration guide
└── setup-x402.sh                     # Setup script
```

## 🔑 API Endpoints

### Premium (Require Payment)
- `POST /api/publishnote` - DKG publishing ($0.05)
- `POST /api/analysis/advanced` - Multi-LLM analysis ($0.02)
- `GET /api/grokipedia-pro` - Premium Grokipedia ($0.01)
- `POST /api/batch-verify` - Batch claims ($0.10)

### Free
- `GET /api/premium/status` - User status
- `GET /api/premium/pricing` - Pricing info
- All existing endpoints (/api/wikipedia, /api/scraper, etc.)

## 🌐 Network Details

- **Network**: Base Sepolia (testnet)
- **Currency**: USDC
- **Facilitator**: https://x402.org/facilitator
- **Receiver**: 0x44CBd027D65F0Aeb0AC3deEb02a3247871F00f48

## 📚 Documentation

See **X402_INTEGRATION.md** for:
- Complete architecture overview
- Advanced configuration
- Troubleshooting guide
- Production deployment steps
- Rate limiting for premium users
- Custom pricing configuration

## 🆘 Troubleshooting

### "Cannot find module 'x402-express'"
```bash
cd backend && npm install
```

### "Cannot find module 'x402-fetch'"
```bash
cd frontend && npm install
```

### Payment verification fails
1. Check wallet has USDC on Base Sepolia
2. Verify X402_FACILITATOR_URL is correct
3. Ensure X402_NETWORK matches wallet network

### "402 response but no payment data"
- Set `X402_ENABLED=true` in backend/.env
- Restart backend

## 🎯 Next Steps

1. ✅ Dependencies installed
2. ✅ Configuration added
3. 🔲 Get testnet USDC
4. 🔲 Enable X402_ENABLED=true
5. 🔲 Test payment flow
6. 🔲 Deploy to production

## 💰 Pricing Summary

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| DKG Publishing | 5/mo | Unlimited | Unlimited |
| Advanced Analysis | 3/mo | Unlimited | Unlimited |
| Grokipedia | 10/mo | Unlimited | Unlimited |
| Batch Verify | 1/mo | Unlimited | Unlimited |
| Monthly Cost | $0 | $19.99 | $49.99 |

## 🔗 Resources

- [X402 GitBook](https://x402.gitbook.io/x402)
- [x402-express npm](https://www.npmjs.com/package/x402-express)
- [x402-fetch npm](https://www.npmjs.com/package/x402-fetch)
- [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
- [X402 Discord](https://discord.gg/invite/cdp)

---

**Status**: ✅ Ready for Testing
**Last Updated**: November 29, 2025
