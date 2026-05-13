import Fastify from 'fastify'
import cors from '@fastify/cors'
import { AIRanker } from './ranker.js'
import { HybridScorer } from './hybrid.js'
import type { SearchRequest, ResearchRequest } from './types.js'

async function main() {
  const app = Fastify({ logger: { level: 'info' } })
  await app.register(cors, { origin: '*' })

  const ranker = new AIRanker()
  const hybrid = new HybridScorer()

  app.get('/health', async () => ({
    status: 'ok',
    service: 'ai-ranking',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }))

  app.post('/rank', async (req) => {
    const { query, mode = 'hybrid', page = 1, limit = 20 } = req.body as SearchRequest
    const start = Date.now()

    // Fetch candidate documents from upstream sources
    const candidates = await ranker.fetchCandidates(query, page, limit)

    // Score candidates based on mode
    const scored = mode === 'semantic'
      ? await ranker.semanticRank(query, candidates)
      : mode === 'hybrid'
      ? await hybrid.score(query, candidates)
      : candidates.sort((a, b) => b.score - a.score)

    return {
      results: scored.slice(0, limit),
      total: 1500,
      query,
      latencyMs: Date.now() - start,
      mode,
      page,
      hasMore: page * limit < 1500,
    }
  })

  app.post('/semantic', async (req) => {
    const { query, topK = 10 } = req.body as { query: string; topK?: number }
    const start = Date.now()
    const results = await ranker.semanticSearch(query, topK)
    return { results, total: results.length, query, latencyMs: Date.now() - start, mode: 'semantic', page: 1, hasMore: false }
  })

  app.post('/research', async (req) => {
    const { query, depth = 'deep', sources = 5 } = req.body as ResearchRequest
    const start = Date.now()
    const result = await ranker.research(query, depth ?? 'deep', sources ?? 5)
    return { ...result, latencyMs: Date.now() - start }
  })

  const PORT = parseInt(process.env.PORT ?? '3004', 10)
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`AI Ranking service running on http://0.0.0.0:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
