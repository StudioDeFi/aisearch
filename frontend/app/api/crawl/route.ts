import { NextRequest, NextResponse } from 'next/server'
import type { CrawlRequest, CrawlJob } from '@/../../packages/types/src'

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:3001'

export async function POST(req: NextRequest) {
  const body: CrawlRequest = await req.json()
  const { url, depth = 2, maxPages = 100 } = body

  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 5000)
    const upstream = await fetch(`${GATEWAY_URL}/api/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    if (!upstream.ok) throw new Error('gateway error')
    return NextResponse.json(await upstream.json())
  } catch {
    const job: CrawlJob = {
      id: `job-${Date.now()}`,
      url,
      status: 'queued',
      pagesFound: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json({ job, depth, maxPages, message: 'Crawl job queued (mock)' })
  }
}
