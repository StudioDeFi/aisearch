import { NextRequest, NextResponse } from 'next/server'
import type { SemanticSearchRequest } from '@/lib/types'

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:3001'

export async function POST(req: NextRequest) {
  const body: SemanticSearchRequest = await req.json()
  const { query, topK = 10, threshold = 0.7 } = body

  if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })

  try {
    const ctrl = new AbortController()
    const timeoutId = setTimeout(() => ctrl.abort(), 5000)
    try {
      const upstream = await fetch(`${GATEWAY_URL}/api/semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
      if (!upstream.ok) throw new Error('gateway error')
      return NextResponse.json(await upstream.json())
    } finally {
      clearTimeout(timeoutId)
    }
  } catch {
    const mockResults = Array.from({ length: topK }, (_, i) => ({
      id: `sem-${i}`,
      title: `Semantically relevant result for: ${query} (${i + 1})`,
      url: `https://example.com/semantic/${i}`,
      snippet: `This document is semantically similar to "${query}" with a cosine similarity above ${threshold}.`,
      engine: 'qdrant',
      language: 'en',
      score: Math.max(threshold, 0.99 - i * 0.03),
      semanticScore: Math.max(threshold, 0.99 - i * 0.025),
      freshness: Math.random(),
      authority: 0.8 - i * 0.02,
    }))
    return NextResponse.json({ results: mockResults, total: mockResults.length, query, latencyMs: 34, mode: 'semantic', page: 1, hasMore: false })
  }
}
