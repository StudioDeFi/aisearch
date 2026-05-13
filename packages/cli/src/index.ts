#!/usr/bin/env node
import { Command } from 'commander'
import { execSync, spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve the monorepo root relative to the compiled dist/ directory. */
function repoRoot(): string {
  // packages/cli/dist/index.js  →  ../../..  → repo root
  return path.resolve(__dirname, '..', '..', '..')
}

/** Base URL for the gateway service. */
const GATEWAY = process.env.GATEWAY_URL ?? 'http://localhost:3001'

/** Service health endpoints */
const SERVICES: Record<string, string> = {
  gateway: `${GATEWAY}/health`,
  crawler: `${process.env.CRAWLER_URL ?? 'http://localhost:3002'}/health`,
  indexing: `${process.env.INDEXING_URL ?? 'http://localhost:3003'}/health`,
  'ai-ranking': `${process.env.RANKING_URL ?? 'http://localhost:3004'}/health`,
}

async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── CLI definition ────────────────────────────────────────────────────────────

const program = new Command()

program
  .name('aisearch')
  .description('AISEARCH ELITE — command-line interface')
  .version('1.0.0')

// ── aisearch start ────────────────────────────────────────────────────────────
program
  .command('start')
  .description('Start all AISEARCH ELITE services via Docker Compose')
  .option('--build', 'rebuild images before starting', false)
  .action((opts: { build: boolean }) => {
    const root = repoRoot()
    const args = ['compose', 'up', '-d']
    if (opts.build) args.push('--build')
    console.log('🚀 Starting AISEARCH ELITE services…')
    const proc = spawn('docker', args, { cwd: root, stdio: 'inherit' })
    proc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ All services started. Frontend: http://localhost:3000')
      } else {
        console.error(`❌ docker compose exited with code ${code}`)
        process.exit(code ?? 1)
      }
    })
  })

// ── aisearch stop ─────────────────────────────────────────────────────────────
program
  .command('stop')
  .description('Stop all running AISEARCH ELITE services')
  .action(() => {
    const root = repoRoot()
    console.log('🛑 Stopping AISEARCH ELITE services…')
    const proc = spawn('docker', ['compose', 'down'], { cwd: root, stdio: 'inherit' })
    proc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ All services stopped.')
      } else {
        console.error(`❌ docker compose down exited with code ${code}`)
        process.exit(code ?? 1)
      }
    })
  })

// ── aisearch status ───────────────────────────────────────────────────────────
program
  .command('status')
  .description('Check health of all AISEARCH ELITE services')
  .action(async () => {
    console.log('🔍 Checking service health…\n')
    const results = await Promise.allSettled(
      Object.entries(SERVICES).map(async ([name, url]) => {
        const data = await fetchJson<{ status: string }>(url)
        return { name, status: data.status ?? 'ok', url }
      }),
    )
    let hasError = false
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const { name, status } = r.value
        console.log(`  ✅  ${name.padEnd(12)} ${status}`)
      } else {
        const idx = results.indexOf(r)
        const name = Object.keys(SERVICES)[idx]
        console.log(`  ❌  ${name.padEnd(12)} unreachable`)
        hasError = true
      }
    }
    console.log()
    if (hasError) {
      console.log('Some services are not running. Use `aisearch start` to launch them.')
    }
  })

// ── aisearch crawl <url> ──────────────────────────────────────────────────────
program
  .command('crawl <url>')
  .description('Submit a URL to the crawler service')
  .option('-d, --depth <n>', 'crawl depth', '2')
  .action(async (url: string, opts: { depth: string }) => {
    console.log(`🕷  Submitting crawl job for ${url} (depth=${opts.depth})…`)
    const result = await fetchJson<{ jobId: string; status: string }>(
      `${GATEWAY}/api/crawl`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, depth: Number(opts.depth) }),
      },
    )
    console.log(`✅ Crawl job queued — id: ${result.jobId}, status: ${result.status}`)
  })

// ── aisearch index <url> ──────────────────────────────────────────────────────
program
  .command('index <url>')
  .description('Submit a URL to the indexing pipeline')
  .action(async (url: string) => {
    console.log(`📑 Submitting index job for ${url}…`)
    const result = await fetchJson<{ success: boolean; chunks?: number }>(
      `${GATEWAY}/api/index`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      },
    )
    if (result.success) {
      console.log(`✅ Indexed${result.chunks != null ? ` — ${result.chunks} chunks stored` : ''}`)
    } else {
      console.error('❌ Indexing failed')
      process.exit(1)
    }
  })

// ── aisearch search <query> ───────────────────────────────────────────────────
program
  .command('search <query>')
  .description('Run a search and print results')
  .option(
    '-m, --mode <mode>',
    'search mode: standard | semantic | hybrid | research',
    'hybrid',
  )
  .option('-l, --limit <n>', 'maximum number of results', '10')
  .action(async (query: string, opts: { mode: string; limit: string }) => {
    const mode = opts.mode
    const limit = Number(opts.limit)
    const endpoint =
      mode === 'semantic'
        ? `${GATEWAY}/api/semantic`
        : mode === 'research'
          ? `${GATEWAY}/api/research`
          : `${GATEWAY}/api/search`

    console.log(`🔍 Searching [${mode}]: "${query}"\n`)

    const body: Record<string, unknown> = { query, limit }
    if (mode === 'hybrid') body.mode = 'hybrid'

    const result = await fetchJson<{
      results?: Array<{ title: string; url: string; snippet?: string; score?: number }>
      synthesis?: string
    }>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (result.synthesis) {
      console.log('📝 Research synthesis:\n')
      console.log(result.synthesis)
      console.log()
    }

    const items = result.results ?? []
    if (items.length === 0) {
      console.log('No results found.')
      return
    }
    items.forEach((r, i) => {
      console.log(`${String(i + 1).padStart(2)}. ${r.title}`)
      console.log(`    ${r.url}`)
      if (r.snippet) console.log(`    ${r.snippet}`)
      if (r.score != null) console.log(`    score: ${r.score.toFixed(4)}`)
      console.log()
    })
  })

// ── Run ───────────────────────────────────────────────────────────────────────
program.parseAsync(process.argv).catch((err: unknown) => {
  console.error('❌', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
