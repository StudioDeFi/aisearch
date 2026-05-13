import Fastify from 'fastify'
import cors from '@fastify/cors'
import { IndexingPipeline } from './pipeline.js'
import type { IndexRequest } from './types.js'

async function main() {
  const app = Fastify({ logger: { level: 'info' } })
  await app.register(cors, { origin: '*' })

  const pipeline = new IndexingPipeline()

  app.get('/health', async () => ({
    status: 'ok',
    service: 'indexing',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }))

  app.post('/index', async (req, reply) => {
    const body = req.body as IndexRequest
    if (!body.documents || !Array.isArray(body.documents)) {
      return reply.status(400).send({ error: 'documents array is required' })
    }
    const result = await pipeline.process(body.documents)
    return result
  })

  app.post('/seo', async (req) => {
    const { url, content } = req.body as { url: string; content?: string }
    return pipeline.analyzeSEO(url, content ?? '')
  })

  app.get('/stats', async () => pipeline.stats())

  const PORT = parseInt(process.env.PORT ?? '3003', 10)
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Indexing service running on http://0.0.0.0:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
