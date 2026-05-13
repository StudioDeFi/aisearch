import { CrawlQueue, type JobRecord } from './queue.js'

// ── Safe HTML helpers (linear scans to avoid ReDoS on adversarial HTML) ────────

/** Strip all HTML tags using a linear state-machine scan */
function stripAllTags(html: string): string {
  const out: string[] = []
  let inTag = false
  for (let i = 0; i < html.length; i++) {
    const ch = html[i]
    if (ch === '<') { inTag = true; out.push(' '); continue }
    if (ch === '>') { inTag = false; continue }
    if (!inTag) out.push(ch)
  }
  return out.join('')
}

/** Extract the <title> text using index-based search to avoid ReDoS */
function extractTitle(html: string): string | null {
  const lower = html.toLowerCase()
  const openIdx = lower.indexOf('<title')
  if (openIdx === -1) return null
  const gtIdx = html.indexOf('>', openIdx)
  if (gtIdx === -1) return null
  const closeIdx = lower.indexOf('</title>', gtIdx)
  if (closeIdx === -1) return null
  return html.slice(gtIdx + 1, closeIdx).trim().slice(0, 500) || null
}

/** Extract href values using a linear attribute parser to avoid ReDoS */
function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = []
  const seen = new Set<string>()
  const lower = html.toLowerCase()
  let pos = 0
  while (pos < lower.length) {
    const hrefIdx = lower.indexOf('href=', pos)
    if (hrefIdx === -1) break
    pos = hrefIdx + 5
    // skip whitespace
    while (pos < html.length && html[pos] === ' ') pos++
    const quote = html[pos]
    if (quote !== '"' && quote !== "'") continue
    pos++
    const end = html.indexOf(quote, pos)
    if (end === -1) break
    const href = html.slice(pos, end)
    pos = end + 1
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue
    try {
      const abs = new URL(href, baseUrl).href
      if (abs.startsWith('http') && !seen.has(abs)) {
        seen.add(abs)
        links.push(abs)
      }
    } catch { /* skip invalid URLs */ }
  }
  return links
}

// ──────────────────────────────────────────────────────────────────────────────

export interface CrawlPage {
  url: string
  title: string
  html: string
  text: string
  links: string[]
  depth: number
  crawledAt: string
}

export class CrawlerService {
  private queue: CrawlQueue
  private running = false

  constructor(queue: CrawlQueue) {
    this.queue = queue
  }

  async enqueue(url: string, depth: number, maxPages: number): Promise<JobRecord> {
    return this.queue.add(url, depth, maxPages)
  }

  startWorker() {
    if (this.running) return
    this.running = true
    console.log('Crawler worker started')
    setInterval(() => this.processNext(), 2000)
  }

  private async processNext() {
    const job = this.queue.nextPending()
    if (!job) return

    this.queue.updateStatus(job.id, 'crawling')
    console.log(`[Crawler] Processing job ${job.id}: ${job.url}`)

    try {
      const pages = await this.crawlSite(job.url, job.depth, job.maxPages)
      this.queue.updateStatus(job.id, 'done', pages.length)
      console.log(`[Crawler] Job ${job.id} done — ${pages.length} pages found`)

      // In production: forward pages to indexing service
      await this.forwardToIndexing(pages)
    } catch (err) {
      console.error(`[Crawler] Job ${job.id} failed:`, err)
      this.queue.updateStatus(job.id, 'error')
    }
  }

  private async crawlSite(startUrl: string, depth: number, maxPages: number): Promise<CrawlPage[]> {
    // Playwright-based crawler stub
    // In production this uses playwright chromium to render JS-heavy pages
    const pages: CrawlPage[] = []
    const visited = new Set<string>()
    const toVisit: Array<{ url: string; d: number }> = [{ url: startUrl, d: 0 }]

    while (toVisit.length > 0 && pages.length < maxPages) {
      const item = toVisit.shift()
      if (!item || visited.has(item.url)) continue
      visited.add(item.url)

      const page = await this.fetchPage(item.url, item.d)
      if (!page) continue

      pages.push(page)

      if (item.d < depth) {
        for (const link of page.links.slice(0, 10)) {
          if (!visited.has(link)) toVisit.push({ url: link, d: item.d + 1 })
        }
      }
    }

    return pages
  }

  private async fetchPage(url: string, depth: number): Promise<CrawlPage | null> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AISEARCHBot/1.0 (+https://aisearch.io/bot)' },
      })
      clearTimeout(timeout)
      if (!res.ok) return null

      const html = await res.text()
      const title = extractTitle(html) ?? url
      const text = stripAllTags(html).replace(/\s+/g, ' ').trim().slice(0, 50000)

      // Extract links using a linear scan to avoid ReDoS on adversarial HTML
      const links = extractLinks(html, url)

      return { url, title, html, text, links, depth, crawledAt: new Date().toISOString() }
    } catch {
      return null
    }
  }

  private async forwardToIndexing(pages: CrawlPage[]): Promise<void> {
    const INDEXING_URL = process.env.INDEXING_URL ?? 'http://localhost:3003'
    try {
      await fetch(`${INDEXING_URL}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: pages.map((p) => ({ url: p.url, html: p.html, metadata: { title: p.title, crawledAt: p.crawledAt } })),
        }),
      })
    } catch {
      console.warn('[Crawler] Could not forward to indexing service')
    }
  }
}
