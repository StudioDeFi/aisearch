import Fastify, { FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'

const CRAWLER_URL = process.env.CRAWLER_URL ?? 'http://localhost:3002'
const INDEXING_URL = process.env.INDEXING_URL ?? 'http://localhost:3003'
const AI_RANKING_URL = process.env.AI_RANKING_URL ?? 'http://localhost:3004'

// ── Auth stub (JWT validation would go here) ────────────────────────────────
async function authStub(_req: FastifyRequest) {
  // In production: verify JWT from Authorization header
  // const token = req.headers.authorization?.replace('Bearer ', '')
  // await verifyJWT(token)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function proxyPost(url: string, body: unknown, fallback: unknown): Promise<unknown> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return fallback
    return await res.json()
  } catch {
    clearTimeout(timeout)
    return fallback
  }
}

function mockSearchResults(query: string, mode: string, page: number, limit: number) {
  const domains = ['wikipedia.org', 'github.com', 'medium.com', 'arxiv.org', 'stackoverflow.com']
  const results = Array.from({ length: limit }, (_, i) => ({
    id: `gw-${page}-${i}`,
    title: `Gateway Result ${(page - 1) * limit + i + 1}: ${query}`,
    url: `https://${domains[i % domains.length]}/q/${encodeURIComponent(query)}/${i}`,
    snippet: `Aggregated search result for "${query}" via AISEARCH gateway (${mode} mode). Result index ${(page - 1) * limit + i + 1}.`,
    engine: ['web', 'news', 'academic'][i % 3],
    language: 'en',
    score: Math.max(0.3, 1 - ((page - 1) * limit + i) * 0.04),
    semanticScore: mode === 'standard' ? 0 : Math.max(0.3, 0.95 - i * 0.03),
    freshness: Math.random(),
    authority: Math.max(0.3, 0.9 - i * 0.02),
  }))
  return { results, total: 1500, query, latencyMs: Math.round(30 + Math.random() * 80), mode, page, hasMore: page * limit < 1500 }
}

async function main() {
  const app = Fastify({ logger: { level: 'info' } })

  // ── Plugins ──────────────────────────────────────────────────────────────────
  await app.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] })
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute', errorResponseBuilder: () => ({ error: 'Too many requests', statusCode: 429 }) })

  // ── Routes ───────────────────────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    service: 'gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }))

  app.post('/api/search', { preHandler: authStub }, async (req) => {
    const { query, mode = 'hybrid', page = 1, limit = 20 } = req.body as Record<string, unknown> & { query: string }
    // Fan out to AI ranking service which aggregates results
    const result = await proxyPost(
      `${AI_RANKING_URL}/rank`,
      { query, mode, page, limit },
      mockSearchResults(query, String(mode), Number(page), Number(limit))
    )
    return result
  })

  app.post('/api/semantic', { preHandler: authStub }, async (req) => {
    const body = req.body as Record<string, unknown>
    const result = await proxyPost(
      `${AI_RANKING_URL}/semantic`,
      body,
      { results: [], query: body.query, total: 0, latencyMs: 0, mode: 'semantic', page: 1, hasMore: false }
    )
    return result
  })

  app.post('/api/research', { preHandler: authStub }, async (req) => {
    const body = req.body as Record<string, unknown>
    const result = await proxyPost(
      `${AI_RANKING_URL}/research`,
      body,
      {
        summary: `Research synthesis for "${body.query}" is unavailable. Please try again later.`,
        sources: [],
        citations: [],
        confidence: 0,
        latencyMs: 0,
      }
    )
    return result
  })

  app.post('/api/crawl', { preHandler: authStub }, async (req) => {
    const body = req.body as Record<string, unknown>
    const result = await proxyPost(
      `${CRAWLER_URL}/crawl`,
      body,
      { id: `job-${Date.now()}`, url: body.url, status: 'queued', pagesFound: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    )
    return result
  })

  app.post('/api/index', { preHandler: authStub }, async (req) => {
    const body = req.body as Record<string, unknown>
    const result = await proxyPost(
      `${INDEXING_URL}/index`,
      body,
      { indexed: 0, failed: 0, jobId: `idx-${Date.now()}`, latencyMs: 0 }
    )
    return result
  })

  app.post('/api/seo', { preHandler: authStub }, async (req) => {
    const body = req.body as Record<string, unknown>
    const result = await proxyPost(
      `${INDEXING_URL}/seo`,
      body,
      { score: 70, issues: [], recommendations: [], latencyMs: 0 }
    )
    return result
  })

  app.get('/api/trends', async () => {
    return {
      trends: [
        { query: 'AI safety 2024', volume: 12400, change: +34 },
        { query: 'WebAssembly performance', volume: 8900, change: +12 },
        { query: 'quantum computing breakthrough', volume: 7300, change: +67 },
        { query: 'Rust vs Go', volume: 6100, change: -5 },
        { query: 'LLM fine-tuning guide', volume: 15200, change: +89 },
      ],
      generatedAt: new Date().toISOString(),
    }
  })

  app.get('/api/graph', async (req) => {
    const { query } = req.query as { query?: string }
    return {
      nodes: [
        { id: 'root', label: query ?? 'search', type: 'query' },
        { id: 'n1', label: 'Machine Learning', type: 'concept' },
        { id: 'n2', label: 'Neural Networks', type: 'concept' },
        { id: 'n3', label: 'Deep Learning', type: 'concept' },
      ],
      edges: [
        { source: 'root', target: 'n1', weight: 0.9 },
        { source: 'n1', target: 'n2', weight: 0.85 },
        { source: 'n2', target: 'n3', weight: 0.78 },
      ],
    }
  })

  // ── Start ─────────────────────────────────────────────────────────────────────
  const PORT = parseInt(process.env.PORT ?? '3001', 10)
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Gateway running on http://0.0.0.0:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
