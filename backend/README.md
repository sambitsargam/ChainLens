# ChainLens DKG Backend

Production-ready Node.js backend for publishing Community Notes to OriginTrail Decentralized Knowledge Graph (DKG).

## Features

- ✅ **DKG Publishing** - Publish Community Notes as Knowledge Assets
- ✅ **JSON-LD Support** - Full Schema.org ClaimReview format
- ✅ **Blockchain Integration** - Real transactions on OriginTrail DKG
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Comprehensive Logging** - Winston-based logging with file rotation
- ✅ **Error Handling** - Graceful error handling and recovery
- ✅ **CORS Support** - Secure cross-origin requests
- ✅ **Health Checks** - Monitor DKG availability

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Run the interactive setup:

```bash
npm run setup
```

Or manually create `.env` from `.env.example`:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Get Testnet Tokens

For testnet, get free TRAC tokens:
- Visit: https://faucet.origintrail.io
- Enter your wallet address
- Request testnet tokens

### 4. Start Server

```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### POST /api/dkg/publish
Publish Community Note to DKG

**Request:**
```json
{
  "content": {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    "claimReviewed": "Topic name",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 85
    }
  },
  "options": {
    "epochsNum": 2,
    "privacy": "public",
    "immutable": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "ual": "did:dkg:otp:2043/0x.../123",
  "transactionHash": "0x...",
  "explorerUrl": "https://dkg-testnet.origintrail.io/explore?ual=...",
  "duration": 5432
}
```

### GET /api/dkg/asset/:ual
Retrieve published asset

### POST /api/dkg/query
Execute SPARQL query

### GET /api/dkg/stats
Get publishing statistics

### GET /api/dkg/health
Health check

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WALLET_PRIVATE_KEY` | Wallet private key (required) | - |
| `WALLET_PUBLIC_KEY` | Wallet public address (required) | - |
| `DKG_ENVIRONMENT` | mainnet or testnet | testnet |
| `DKG_ENDPOINT` | DKG node endpoint | testnet endpoint |
| `DKG_BLOCKCHAIN` | Blockchain identifier | otp:20430 |
| `PORT` | Server port | 3001 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `DEFAULT_EPOCHS` | Default storage epochs | 2 |

## Architecture

```
backend/
├── src/
│   ├── config/
│   │   ├── config.js      # Configuration management
│   │   ├── dkg.js         # DKG client initialization
│   │   └── logger.js      # Logging configuration
│   ├── routes/
│   │   └── dkg.js         # API routes
│   ├── services/
│   │   └── publisher.js   # Publishing service
│   ├── scripts/
│   │   └── setup.js       # Setup script
│   └── server.js          # Express server
├── logs/                  # Log files
├── .env                   # Environment config
└── package.json
```

## Logging

Logs are written to:
- **Console**: All levels with colors
- **logs/combined.log**: All logs
- **logs/error.log**: Errors only

Log rotation: 10MB max, 5 files retained

## Rate Limiting

Default limits:
- Window: 15 minutes
- Max requests: 100 per window per IP

## Security

- ✅ Private keys stored in `.env` (gitignored)
- ✅ Rate limiting on all API endpoints
- ✅ CORS restricted to configured frontend
- ✅ Request validation and sanitization
- ✅ Error messages sanitized in production

## Development

```bash
# Watch mode with auto-reload
npm run dev

# Check configuration
node src/scripts/setup.js
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production DKG endpoint
3. Use mainnet wallet with real TRAC tokens
4. Set up process manager (PM2, systemd)
5. Configure reverse proxy (nginx)
6. Enable HTTPS

## Troubleshooting

### "DKG not available"
- Check wallet configuration in `.env`
- Verify wallet has TRAC tokens
- Test DKG endpoint connectivity

### "Transaction failed"
- Ensure sufficient TRAC token balance
- Check blockchain network status
- Verify wallet permissions

### Rate limit errors
- Adjust `RATE_LIMIT_*` variables
- Implement authentication for higher limits

## Resources

- **OriginTrail DKG**: https://origintrail.io
- **DKG Documentation**: https://docs.origintrail.io
- **Testnet Faucet**: https://faucet.origintrail.io
- **DKG Explorer**: https://dkg-testnet.origintrail.io

## License

MIT
