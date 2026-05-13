import { NextRequest, NextResponse } from 'next/server'
import type { SearchRequest, SearchResponse, UnifiedSearchDocument } from '@/../../packages/types/src'

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:3001'

function generateMockResults(query: string, mode: string, page: number, limit: number): SearchResponse {
  const engines = ['web', 'news', 'academic', 'reddit', 'stackoverflow']
  const domains = ['en.wikipedia.org', 'github.com', 'medium.com', 'dev.to', 'stackoverflow.com', 'arxiv.org', 'techcrunch.com']
  const now = Date.now()
  const results: UnifiedSearchDocument[] = Array.from({ length: limit }, (_, i) => {
    const idx = (page - 1) * limit + i
    return {
      id: `result-${idx}`,
      title: `${query} — ${['Comprehensive Guide', 'In-Depth Analysis', 'Best Practices', 'Tutorial', 'Overview'][idx % 5]} (${idx + 1})`,
      url: `https://${domains[idx % domains.length]}/article/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}-${idx}`,
      snippet: `This ${['article', 'guide', 'tutorial', 'paper', 'post'][idx % 5]} covers ${query} in detail. It explores key concepts, practical applications, and the latest developments in the field as of 2024.`,
      engine: engines[idx % engines.length],
      language: 'en',
      score: Math.max(0.4, 1 - idx * 0.04 + Math.random() * 0.05),
      semanticScore: mode === 'standard' ? 0 : Math.max(0.3, 0.95 - idx * 0.03 + Math.random() * 0.04),
      freshness: Math.random(),
      authority: Math.max(0.3, 0.9 - idx * 0.02 + Math.random() * 0.05),
      publishedAt: new Date(now - idx * 86400000 * Math.random() * 30).toISOString(),
    }
  })
  return {
    results,
    total: 1024,
    query,
    latencyMs: Math.round(40 + Math.random() * 120),
    mode: mode as SearchRequest['mode'] ?? 'hybrid',
    page,
    hasMore: page * limit < 1024,
  }
}

export async function POST(req: NextRequest) {
  const body: SearchRequest = await req.json()
  const { query, mode = 'hybrid', page = 1, limit = 20 } = body

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const upstream = await fetch(`${GATEWAY_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!upstream.ok) throw new Error(`Gateway error: ${upstream.status}`)
    const data = await upstream.json()
    return NextResponse.json(data)
  } catch {
    // Gateway unreachable — return mock data
    return NextResponse.json(generateMockResults(query, mode, page, limit))
  }
}
