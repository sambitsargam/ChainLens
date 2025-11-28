# MCP Integration with OriginTrail DKG

## Overview

This document explains how to integrate the Grokipedia Truth Alignment Hub with external LLM agents using the **Model Context Protocol (MCP)**.

MCP allows AI assistants (like Claude, ChatGPT, or custom agents) to query the OriginTrail DKG and retrieve Community Notes, enabling them to provide more accurate, fact-checked responses.

## Architecture

```
User Question → LLM Agent → MCP Tool → DKG Query API → OriginTrail DKG
                    ↓
              Community Notes
                    ↓
            Aligned Answer
```

## OriginTrail Edge Node MCP Server

OriginTrail Edge Nodes can expose an **MCP server** that allows LLM agents to query the DKG directly.

### Configuration

1. **Start OriginTrail Edge Node** with MCP enabled:
   ```bash
   # In your Edge Node configuration
   {
     "mcp": {
       "enabled": true,
       "port": 8901
     }
   }
   ```

2. **Configure MCP Client** (in your LLM agent):
   ```json
   {
     "mcpServers": {
       "origintrail-dkg": {
         "command": "node",
         "args": ["mcp-client.js"],
         "env": {
           "DKG_ENDPOINT": "http://localhost:8900",
           "MCP_ENDPOINT": "http://localhost:8901"
         }
       }
     }
   }
   ```

## HTTP API Integration (Alternative)

If you're not using an Edge Node's built-in MCP server, you can expose HTTP endpoints that LLM agents call:

### Available Endpoints

#### 1. Search Community Notes by Topic

```http
GET /api/notes/search?topic=<topic>
```

**Example:**
```bash
curl "http://localhost:3001/api/notes/search?topic=Artificial%20Intelligence"
```

**Response:**
```json
[
  {
    "topic": "Artificial Intelligence",
    "ual": "did:dkg:otp/0x1234.../12345",
    "alignmentScore": 0.87,
    "discrepancyCount": 3,
    "createdAt": "2025-11-28T10:30:00Z"
  }
]
```

#### 2. Get Note Details by UAL

```http
GET /api/notes/:ual
```

**Example:**
```bash
curl "http://localhost:3001/api/notes/did:dkg:otp%2F0x1234...%2F12345"
```

**Response:**
```json
{
  "ual": "did:dkg:otp/0x1234.../12345",
  "public": {
    "@context": ["https://schema.org", {...}],
    "@type": "Comment",
    "about": "Artificial Intelligence",
    "gw:alignmentScore": 0.87,
    "gw:discrepancies": [...]
  }
}
```

## MCP Tool Definition

Here's how you would define an MCP tool for an LLM agent (example for Claude Desktop or custom agent):

### Tool: `search_community_notes`

```json
{
  "name": "search_community_notes",
  "description": "Search for fact-checked Community Notes about a topic from the OriginTrail DKG. Returns alignment scores and discrepancy analysis between Wikipedia and Grokipedia.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic": {
        "type": "string",
        "description": "The topic to search for (e.g., 'Artificial Intelligence')"
      }
    },
    "required": ["topic"]
  }
}
```

### Tool Implementation (JavaScript)

```javascript
async function search_community_notes({ topic }) {
  const response = await fetch(
    `http://localhost:3001/api/notes/search?topic=${encodeURIComponent(topic)}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to search notes: ${response.statusText}`);
  }
  
  const notes = await response.json();
  
  return {
    topic,
    notesFound: notes.length,
    notes: notes.map(note => ({
      alignmentScore: note.alignmentScore,
      discrepancies: note.discrepancyCount,
      ual: note.ual,
      createdAt: note.createdAt,
    })),
  };
}
```

## Example Agent Workflow

1. **User asks a question:**
   > "What is Artificial Intelligence?"

2. **Agent recognizes the need for fact-checking:**
   - Agent determines this is a factual question
   - Agent calls MCP tool: `search_community_notes({ topic: "Artificial Intelligence" })`

3. **System retrieves Community Notes:**
   - Queries DKG via HTTP API
   - Gets alignment scores and discrepancy classifications

4. **Agent synthesizes response:**
   - Uses Community Notes to identify potential biases or inconsistencies
   - Provides a balanced answer with caveats where sources disagree
   - Cites alignment score and UAL for transparency

5. **User receives fact-checked answer:**
   > "According to Wikipedia, Artificial Intelligence is... 
   > Note: Alignment score with alternative sources is 87%. 
   > Some discrepancies exist regarding [specific claims]. 
   > [DKG Reference: did:dkg:otp/0x1234.../12345]"

## Claude Desktop MCP Configuration

To use this with Claude Desktop, add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "grokipedia-truth-hub": {
      "command": "node",
      "args": ["/path/to/backend/src/mcp/mcp-server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

## Benefits of MCP + DKG Integration

1. **Verifiable Facts**: All Community Notes are stored immutably on DKG
2. **Transparency**: UALs provide permanent references to fact-check sources
3. **Multi-LLM Consensus**: Notes are generated by ensemble voting across OpenAI, Gemini, and Grok
4. **Real-time Access**: Agents can query latest alignment data during conversations
5. **Reduced Hallucination**: LLMs can cross-reference their knowledge against verified Community Notes

## Next Steps

1. Implement a full MCP server module (Node.js) that exposes DKG query tools
2. Add authentication for production deployments
3. Implement SPARQL-based graph queries for more sophisticated searches
4. Create webhooks for real-time note updates
5. Build a dashboard for monitoring agent queries

## Resources

- [OriginTrail Documentation](https://docs.origintrail.io/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [DKG.js SDK Reference](https://docs.origintrail.io/decentralized-knowledge-graph/dkg-sdk)
