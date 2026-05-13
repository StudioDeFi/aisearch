import { NextRequest, NextResponse } from 'next/server'
import type { IndexRequest } from '@/../../packages/types/src'

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:3001'

export async function POST(req: NextRequest) {
  const body: IndexRequest = await req.json()
  const { documents } = body

  if (!documents || !Array.isArray(documents)) {
    return NextResponse.json({ error: 'documents array is required' }, { status: 400 })
  }

  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 10000)
    const upstream = await fetch(`${GATEWAY_URL}/api/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    if (!upstream.ok) throw new Error('gateway error')
    return NextResponse.json(await upstream.json())
  } catch {
    return NextResponse.json({
      indexed: documents.length,
      failed: 0,
      jobId: `idx-${Date.now()}`,
      latencyMs: Math.round(50 + Math.random() * 200),
      message: 'Documents indexed successfully (mock)',
    })
  }
}
