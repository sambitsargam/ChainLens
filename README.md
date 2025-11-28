# Grokipedia vs Wikipedia – Truth Alignment Hub

A full-stack JavaScript application that compares Grokipedia and Wikipedia articles using multi-LLM ensemble analysis, identifies discrepancies, and publishes Community Notes as Knowledge Assets on the OriginTrail Decentralized Knowledge Graph (DKG).

## 🎯 Features

- **Text-Only Content Comparison**: Fetches and compares plain text from Wikipedia and Grokipedia
- **Multi-LLM Ensemble Analysis**: Uses OpenAI, Google Gemini, and Grok in parallel to classify discrepancies
- **Structured Community Notes**: Generates JSON-LD formatted notes compatible with OriginTrail DKG
- **DKG Publishing**: Publishes verified notes as immutable Knowledge Assets with UALs
- **MCP Integration**: Provides query endpoints for external LLM agents via Model Context Protocol
- **Modern UI**: Clean, text-only interface built with React and Tailwind CSS (no images)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│              (React + Vite + Tailwind CSS)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS REST API                            │
│   /api/topics  /api/compare-and-publish  /api/notes/search     │
└─────┬──────────────────┬──────────────────┬─────────────────────┘
      │                  │                  │
      ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────────┐
│  Wikipedia   │  │  Grokipedia  │  │  OriginTrail    │
│   Fetcher    │  │   Fetcher    │  │   DKG Client    │
└──────────────┘  └──────────────┘  └─────────────────┘
      │                  │                  │
      └──────────┬───────┘                  │
                 ▼                          │
         ┌──────────────┐                  │
         │     Text     │                  │
         │  Comparison  │                  │
         └──────┬───────┘                  │
                │                          │
                ▼                          │
    ┌───────────────────────┐             │
    │   LLM Ensemble        │             │
    │ ┌─────────────────┐   │             │
    │ │ OpenAI  (GPT-4) │   │             │
    │ │ Gemini  (Pro)   │───┼─────────┐   │
    │ │ Grok    (Beta)  │   │         │   │
    │ └─────────────────┘   │         │   │
    │   Majority Voting     │         │   │
    └───────────┬───────────┘         │   │
                │                     │   │
                ▼                     │   │
        ┌──────────────┐              │   │
        │  JSON-LD     │              │   │
        │ Community    │              │   │
        │    Note      │──────────────┘   │
        └──────┬───────┘                  │
               │                          │
               └──────────────────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │  DKG Asset   │
                  │  (UAL)       │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  MCP Query   │
                  │   Layer      │
                  └──────────────┘
                         │
                         ▼
                  External LLM Agents
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **OriginTrail Edge Node** (running locally or accessible remotely)
- API keys for:
  - OpenAI
  - Google Gemini
  - Grok (xAI)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ChainLens
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Configure `.env`:**

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# OriginTrail DKG Configuration
DKG_ENDPOINT=http://localhost
DKG_PORT=8900
PUBLIC_KEY=your_public_key_here
PRIVATE_KEY=your_private_key_here
BLOCKCHAIN_NAME=otp::testnet
ENVIRONMENT=testnet

# LLM API Keys
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
GROK_API_KEY=xai-...

# Optional: Model configuration
OPENAI_MODEL=gpt-4
GEMINI_MODEL=gemini-pro
GROK_MODEL=grok-beta
```

**Start the backend:**

```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env if needed (default should work)
nano .env
```

**Configure `.env`:**

```env
VITE_API_BASE_URL=http://localhost:3001
```

**Start the frontend:**

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. OriginTrail Edge Node Setup

Follow the official OriginTrail documentation to set up your Edge Node:

https://docs.origintrail.io/decentralized-knowledge-graph/node-setup-instructions

**Minimum configuration:**

- Edge Node running on port 8900 (or configure in `.env`)
- Connected to a supported blockchain (OTP Testnet recommended for testing)
- Wallet with sufficient tokens for publishing

## 🎮 Usage

### Running a Comparison

1. **Open the app**: Navigate to `http://localhost:5173`
2. **Go to Dashboard**: Click "Open Comparison Dashboard"
3. **Select a topic**: Choose from predefined topics (AI, Blockchain, Climate Change, etc.)
4. **Run comparison**: Click "Run Comparison & Publish Note"
5. **Wait for results**: The system will:
   - Fetch Wikipedia article
   - Fetch Grokipedia article
   - Compare texts sentence-by-sentence
   - Call all three LLMs to classify discrepancies
   - Generate JSON-LD Community Note
   - Publish to OriginTrail DKG
6. **View results**: See alignment score, discrepancies, and UAL

### API Examples

**Get topics:**

```bash
curl http://localhost:3001/api/topics
```

**Run comparison:**

```bash
curl -X POST http://localhost:3001/api/compare-and-publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Artificial Intelligence",
    "wikiTitle": "Artificial_intelligence",
    "grokSlug": "artificial-intelligence"
  }'
```

**Search notes:**

```bash
curl "http://localhost:3001/api/notes/search?topic=Artificial%20Intelligence"
```

## 🔌 MCP Integration

External LLM agents can query published Community Notes via the MCP (Model Context Protocol).

### For LLM Agents

Configure your agent to call:

```
GET http://localhost:3001/api/notes/search?topic=<topic>
```

**Response:**

```json
{
  "topic": "Artificial Intelligence",
  "notesFound": 1,
  "notes": [
    {
      "topic": "Artificial Intelligence",
      "ual": "did:dkg:otp/0x1234.../12345",
      "alignmentScore": 0.87,
      "discrepancyCount": 3,
      "createdAt": "2025-11-28T10:30:00Z"
    }
  ]
}
```

### MCP Tool Definition

See `backend/src/mcp/mcpConfigExample.md` for detailed MCP integration instructions, including:

- OriginTrail Edge Node MCP server configuration
- Claude Desktop integration
- Tool definitions for LLM agents
- Example workflows

## 📁 Project Structure

```
ChainLens/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── dkgClient.js          # OriginTrail DKG initialization
│   │   │   └── llmConfig.js          # LLM API configuration
│   │   ├── sources/
│   │   │   ├── wikipedia.js          # Wikipedia fetcher
│   │   │   └── grokipedia.js         # Grokipedia scraper
│   │   ├── llm/
│   │   │   ├── providers/
│   │   │   │   ├── openaiClient.js   # OpenAI integration
│   │   │   │   ├── geminiClient.js   # Gemini integration
│   │   │   │   └── grokClient.js     # Grok/xAI integration
│   │   │   └── ensemble.js           # Majority voting logic
│   │   ├── compare/
│   │   │   ├── textCompare.js        # Text similarity analysis
│   │   │   └── classifyDiscrepancy.js # LLM-based classification
│   │   ├── notes/
│   │   │   ├── buildNote.js          # JSON-LD builder
│   │   │   └── publishNote.js        # DKG publisher
│   │   ├── agent/
│   │   │   └── dkgQueries.js         # MCP query layer
│   │   ├── mcp/
│   │   │   └── mcpConfigExample.md   # MCP integration guide
│   │   └── server.js                 # Express API server
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Home page
│   │   │   ├── ComparisonDashboard.jsx # Main dashboard
│   │   │   └── TopicDetail.jsx       # Topic details view
│   │   ├── components/
│   │   │   ├── Layout.jsx            # App layout wrapper
│   │   │   ├── TopicList.jsx         # Topic selector
│   │   │   ├── DiscrepancyList.jsx   # Discrepancy display
│   │   │   └── AlignmentScoreBadge.jsx # Score indicator
│   │   ├── api.js                    # Backend API client
│   │   ├── App.jsx                   # React app root
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Tailwind styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── README.md
└── LICENSE
```

## 🔬 How It Works

### 1. Content Fetching

- **Wikipedia**: Uses REST API (`/api/rest_v1/page/summary/`) to fetch plain text
- **Grokipedia**: Scrapes HTML with Cheerio and extracts text from article elements

### 2. Text Comparison

- Splits both articles into sentences
- Calculates global similarity using `string-similarity` library
- Identifies sentences unique to each source

### 3. LLM Ensemble Classification

For each discrepancy:

1. **Prompt Engineering**: Constructs a structured prompt with:
   - Topic context
   - Grokipedia claim
   - Wikipedia claim or context
   - Classification categories

2. **Parallel Execution**: Calls all three LLMs simultaneously via `Promise.allSettled`

3. **Majority Voting**: Determines final classification based on model consensus

4. **Output**: Returns structured result with per-model votes and disagreement flag

### 4. Community Note Generation

Creates JSON-LD document following schema.org standards:

- **@context**: Schema.org + custom namespace
- **@type**: Comment (Community Note)
- **Properties**:
  - Alignment score
  - Source URLs
  - Discrepancy array with full LLM votes
  - Metadata

### 5. DKG Publishing

Uses `dkg.js` SDK:

```javascript
const result = await dkg.asset.create(content, {
  epochsNum: 6, // ~1 year retention
});
```

Returns UAL (Universal Asset Locator) for permanent reference.

## 🎨 UI Design Philosophy

**Text-Only Interface**: No images, icons use CSS/Unicode only

**Design Principles**:
- Clean typography with Inter font
- Card-based layout with subtle shadows
- Color-coded badges for different states
- Gradient accents for visual hierarchy
- Responsive grid layouts
- Smooth transitions and hover effects

## 🐛 Troubleshooting

### DKG Connection Issues

**Error**: "DKG blockchain connection failed"

**Solution**:
- Verify Edge Node is running: `curl http://localhost:8900`
- Check blockchain name matches your node configuration
- Ensure wallet has sufficient tokens

### LLM API Errors

**Error**: "OpenAI API authentication failed"

**Solution**:
- Verify API keys in `.env`
- Check key format and permissions
- Monitor rate limits

### Grokipedia Scraping Issues

**Error**: "Insufficient content extracted"

**Solution**:
- Grokipedia structure may have changed
- Update selectors in `backend/src/sources/grokipedia.js`
- Try different article slugs

## 🔐 Security Notes

- **API Keys**: Never commit `.env` files
- **Rate Limiting**: Consider adding rate limits for production
- **CORS**: Configured for local development, tighten for production
- **DKG Keys**: Keep private keys secure, use environment variables only

## 🚀 Production Deployment

### Backend

1. Set `NODE_ENV=production`
2. Use process manager (PM2, systemd)
3. Configure reverse proxy (nginx)
4. Set up SSL/TLS certificates
5. Enable logging and monitoring
6. Use database for note caching (replace in-memory cache)

### Frontend

1. Build production bundle: `npm run build`
2. Serve static files via CDN or nginx
3. Configure environment variables for production API
4. Enable compression (gzip/brotli)
5. Set up CDN caching

## 📚 Resources

- [OriginTrail Documentation](https://docs.origintrail.io/)
- [DKG.js SDK Reference](https://docs.origintrail.io/decentralized-knowledge-graph/dkg-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Grok API (xAI)](https://docs.x.ai/)

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Additional LLM providers
- More sophisticated text comparison algorithms
- SPARQL-based DKG queries
- Advanced MCP server implementation
- Database integration for production
- Enhanced error handling
- Unit and integration tests

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **OriginTrail** for the DKG infrastructure
- **OpenAI, Google, xAI** for LLM APIs
- **Wikipedia** for open knowledge
- **Grokipedia** for alternative perspectives

---

**Built with ❤️ for the Truth**

Powered by OriginTrail DKG & Multi-LLM Ensemble • Text-Only UI • 2025
