# BUYaSOUL Workbench + Soul Engine

## Quick Start (Docker)

### Prerequisites
- Docker and Docker Compose installed
- A Gemini API key (or OpenAI/Anthropic key)

### 1. Clone or extract the project

```bash
cd BUYaSOUL-One/workbench
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

### 3. Configure your API key

Edit `.env` and set at least one LLM provider key:

```env
MASTER_API_KEY="your-secure-api-key-here"
VAULT_PASSPHRASE="your-encryption-passphrase"
GEMINI_API_KEY="your-gemini-api-key"
```

Generate secure keys:
```bash
# Generate a random API key
openssl rand -hex 32

# Generate a random passphrase
openssl rand -base64 32
```

### 4. Start the services

```bash
docker-compose up -d
```

This starts:
- **Workbench** on http://localhost:3000
- **ChromaDB** on http://localhost:8000

### 5. Access the workbench

Open http://localhost:3000 in your browser.

Enter your `MASTER_API_KEY` when prompted.

---

## Quick Start (Manual)

### Prerequisites
- Node.js 18+ installed
- ChromaDB running (optional, for BrainIngestion)

### 1. Install dependencies

```bash
cd BUYaSOUL-One/workbench
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your keys
```

### 3. Start the server

```bash
npm run dev
```

### 4. Access the workbench

Open http://localhost:3000 in your browser.

---

## Configuration

### Required Keys

| Key | Description |
|-----|-------------|
| `MASTER_API_KEY` | Your workbench access key |
| `VAULT_PASSPHRASE` | Encryption key for stored API keys |
| At least one LLM key | `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY` |

### Optional Integrations

| Key | Service |
|-----|---------|
| `PINECONE_API_KEY` | Pinecone vector database |
| `SLACK_WEBHOOK_URL` | Slack notifications |
| `HUBSPOT_API_KEY` | HubSpot CRM |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify store |
| `SOLANA_RPC_URL` | Solana blockchain |

### API Key Management

You can manage API keys through the workbench UI:

1. Open the **Vault** tab
2. Enter your API keys
3. Click **Save** to store them securely
4. Click **Validate** to test if a key works

Or use the API:

```bash
# Save a key
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_MASTER_KEY" \
  -d '{"service": "GEMINI_API_KEY", "apiKey": "your-gemini-key"}'

# List keys (masked)
curl http://localhost:3000/api/keys \
  -H "X-API-Key: YOUR_MASTER_KEY"
```

---

## BrainIngestion (ChromaDB)

The workbench includes a built-in vector database for document ingestion and retrieval.

### Ingest Documents

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_MASTER_KEY" \
  -d '{
    "collection": "my-docs",
    "text": "Your document content here...",
    "metadata": {"source": "manual"}
  }'
```

### Search Documents

```bash
curl -X POST http://localhost:3000/api/retrieve \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_MASTER_KEY" \
  -d '{"collection": "my-docs", "query": "search query"}'
```

### List Collections

```bash
curl http://localhost:3000/api/collections \
  -H "X-API-Key: YOUR_MASTER_KEY"
```

---

## Building for Production

```bash
npm run build
npm start
```

The server will start in production mode on port 3000.

---

## Troubleshooting

### "API key required" error
Make sure you've set `MASTER_API_KEY` in your `.env` file and are passing it in the `X-API-Key` header.

### ChromaDB connection failed
Ensure ChromaDB is running:
```bash
docker ps  # Check if chroma container is running
docker-compose logs chroma  # Check ChromaDB logs
```

### Port already in use
Change the port in `.env`:
```env
PORT=3001
```

---

## Support

For issues or questions, contact support@buyasoul.online
