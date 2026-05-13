import Fastify from 'fastify'
import cors from '@fastify/cors'
import { CrawlerService } from './crawler.js'
import { CrawlQueue } from './queue.js'
import type { CrawlRequest } from '../../../packages/types/src/index.js'

const app = Fastify({ logger: { level: 'info' } })
await app.register(cors, { origin: '*' })

const queue = new CrawlQueue()
const crawler = new CrawlerService(queue)

app.get('/health', async () => ({
  status: 'ok',
  service: 'crawler',
  queueSize: queue.size(),
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}))

app.post('/crawl', async (req, reply) => {
  const body = req.body as CrawlRequest
  const { url, depth = 2, maxPages = 100 } = body
  if (!url) return reply.status(400).send({ error: 'url is required' })
  const job = await crawler.enqueue(url, depth, maxPages)
  return { job, message: 'Crawl job enqueued' }
})

app.get('/jobs/:id', async (req, reply) => {
  const { id } = req.params as { id: string }
  const job = queue.getJob(id)
  if (!job) return reply.status(404).send({ error: 'Job not found' })
  return job
})

app.get('/jobs', async () => {
  return { jobs: queue.listJobs(), total: queue.size() }
})

const PORT = parseInt(process.env.PORT ?? '3002', 10)
try {
  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`Crawler service running on http://0.0.0.0:${PORT}`)
  crawler.startWorker()
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
