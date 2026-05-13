# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete **AISEARCH ELITE** platform scaffolding (frontend + 4 microservices)
- Next.js 15.5.18 frontend with multiple search modes (Standard / Semantic / Hybrid / Research), AI chat, and monitoring dashboard
- Fastify v5.8.5 backend services: gateway (`:3001`), crawler (`:3002`), indexing (`:3003`), ai-ranking (`:3004`)
- Full Docker + `docker-compose.yml` orchestration with PostgreSQL 16, Redis 7, Qdrant v1.9.2, OpenSearch 2.13.0
- Multi-stage Dockerfiles for all services (builder + runtime stages)
- Shared type definitions per service (`src/types.ts`) and frontend (`lib/types.ts`)
- BM25 lexical search store with correct TF scoring and re-index support
- In-memory vector store with cosine similarity ranking
- Hybrid scoring (BM25 + semantic + freshness + authority weights)
- Research synthesis endpoint (LLM-ready stub)
- Fetch-based web crawler with in-memory job queue and URL deduplication
- HTML → clean → chunk → embed indexing pipeline

### Security
- **CVE patches**: `next` upgraded from 14.2.3 → 15.5.18 (SSRF, middleware bypass, DoS, auth bypass, cache poisoning)
- **CVE patches**: `fastify` upgraded from 4.29.1 → 5.8.5 across all four services (Content-Type tab bypass + body schema validation bypass)
- Linear O(n) state-machine HTML tag stripping — eliminates ReDoS on user-controlled HTML
- Explicit URL scheme filtering (`javascript:`, `data:`, `vbscript:`) in the crawler link extractor
- `GATEWAY_URL` removed from Next.js `env` (no longer baked into the client bundle)

### Fixed
- Dockerfiles: `npm ci --omit=dev` before `tsc` replaced with proper multi-stage builds
- Top-level `await` in all service entry points wrapped in `async function main()` (CJS-compatible)
- SearchBar `mode` state lifted to `HomePage` — mode pills and the select now share a single source of truth
- Tailwind `brand` palette completed with shades 200/300/400/800
- AbortController timeout leaks in five Next.js API routes — `clearTimeout` now called in `finally`
- BM25 `upsert()`: stores raw TF count (not normalized ratio); stale postings removed on re-index; counters correctly adjusted
- `cosineSimilarity()`: returns `0` on embedding dimension mismatch instead of `NaN`
- `VectorStore.delete()`: removes URL from `uniqueUrls` only when its last chunk is deleted
- `stripTaggedSections()`: `toLowerCase()` cached once per tag pass instead of recomputed on every `indexOf` call
- Qdrant image pinned to `v1.9.2` (was `latest`)
- README corrected: "Next.js 14" → "Next.js 15"
