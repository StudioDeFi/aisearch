# AISEARCH ELITE

AI-powered universal search platform with semantic understanding, hybrid ranking, and research synthesis.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 15)           :3000                          │
│  ├── / (Home / Search)                                          │
│  ├── /chat (AI Research Chat)                                   │
│  └── /dashboard (Monitoring)                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│  Gateway Service (Fastify)       :3001                          │
│  ├── /api/search   /api/semantic  /api/research                 │
│  ├── /api/crawl    /api/index     /api/seo                      │
│  ├── /api/trends   /api/graph                                   │
│  └── CORS · Rate Limiting · JWT Auth                            │
└───┬──────────────┬───────────────┬──────────────────────────────┘
    │              │               │
┌───▼───┐    ┌─────▼─────┐  ┌─────▼──────┐
│Crawler│    │ Indexing  │  │ AI Ranking │
│:3002  │    │ :3003     │  │ :3004      │
│       │    │ pipeline  │  │ BM25 +     │
│fetch +│    │ vectorstore│  │ semantic   │
│queue  │    │ lexical   │  │ hybrid     │
└───┬───┘    └─────┬─────┘  └────────────┘
    │              │
┌───▼──────────────▼──────────────────────┐
│  Infrastructure                         │
│  PostgreSQL · Redis · Qdrant · OpenSearch│
└─────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js UI — search, chat, dashboard |
| Gateway | 3001 | API gateway — routing, auth, rate-limiting |
| Crawler | 3002 | Fetch-based web crawler with in-memory job queue |
| Indexing | 3003 | HTML → clean → chunk → embed → store |
| AI Ranking | 3004 | Hybrid BM25 + semantic reranking |
| PostgreSQL | 5432 | Relational metadata store |
| Redis | 6379 | Cache & job queue |
| Qdrant | 6333 | Vector store for semantic search |
| OpenSearch | 9200 | Lexical full-text search |

## Quick Start

```bash
# Clone and start all services
git clone https://github.com/StudioDeFi/aisearch
cd aisearch

# (Optional) Set OpenAI key for real embeddings
export OPENAI_API_KEY=sk-...

# Start everything
docker compose up --build

# Open the app
open http://localhost:3000
```

## Search Modes

- **Standard** — Traditional keyword search with BM25 ranking
- **Semantic** — Vector similarity search using embeddings (Qdrant)
- **Hybrid** — Combined BM25 (30%) + semantic (45%) + freshness (10%) + authority (15%)
- **Research** — Deep synthesis across multiple sources via LLM

## CLI

AISEARCH ELITE includes a top-level command-line interface for managing all services without touching individual service directories.

### Installation

```bash
cd packages/cli
npm install
npm run build
npm link          # makes `aisearch` available globally
```

### Commands

| Command | Description |
|---------|-------------|
| `aisearch start` | Start all services via Docker Compose |
| `aisearch stop` | Stop all running services |
| `aisearch status` | Check health of all services |
| `aisearch crawl <url>` | Submit a URL for crawling |
| `aisearch index <url>` | Submit a URL for indexing |
| `aisearch search <query>` | Run a search and print results |

### Examples

```bash
# Start the full platform
aisearch start

# Check service health
aisearch status

# Crawl a website
aisearch crawl https://example.com

# Index a specific page
aisearch index https://example.com/page

# Search
aisearch search "AI-powered search"

# Stop everything
aisearch stop
```

## Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Gateway
cd services/gateway-service && npm install && npm run dev

# Crawler
cd services/crawler-service && npm install && npm run dev

# Indexing
cd services/indexing-service && npm install && npm run dev

# AI Ranking
cd services/ai-ranking-service && npm install && npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | OpenAI API key for real embeddings |
| `GATEWAY_URL` | `http://localhost:3001` | Gateway URL for frontend |
| `REDIS_URL` | `redis://redis:6379` | Redis connection |
| `QDRANT_URL` | `http://qdrant:6333` | Qdrant vector DB |
| `OPENSEARCH_URL` | `http://opensearch:9200` | OpenSearch URL |
| `POSTGRES_URL` | `postgresql://aisearch:aisearch@postgres:5432/aisearch` | PostgreSQL |

## Project Structure

```
aisearch/
├── frontend/                    # Next.js 15 app
│   ├── app/
│   │   ├── page.tsx             # Home / search
│   │   ├── chat/page.tsx        # AI chat interface
│   │   ├── dashboard/page.tsx   # Monitoring dashboard
│   │   └── api/                 # API routes (proxy to gateway)
│   └── components/
│       ├── SearchBar.tsx
│       └── SearchResults.tsx
├── services/
│   ├── gateway-service/         # Fastify API gateway
│   ├── crawler-service/         # Web crawler
│   ├── indexing-service/        # Document indexing pipeline
│   └── ai-ranking-service/      # Hybrid ranking engine
├── packages/
│   └── types/                   # Shared TypeScript types
└── docker-compose.yml
```
