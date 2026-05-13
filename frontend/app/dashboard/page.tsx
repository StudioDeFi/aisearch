'use client'

import { useState, useEffect } from 'react'
import type { DashboardStats, ServiceHealth } from '@/../../packages/types/src'

const MOCK_STATS: DashboardStats = {
  queriesToday: 14832,
  pagesIndexed: 2_410_583,
  crawlRate: 312,
  avgLatencyMs: 87,
  recentSearches: [
    { query: 'next.js 14 app router', timestamp: new Date(Date.now() - 60000).toISOString(), results: 42, mode: 'hybrid' },
    { query: 'quantum entanglement explained', timestamp: new Date(Date.now() - 180000).toISOString(), results: 31, mode: 'semantic' },
    { query: 'rust async await tutorial', timestamp: new Date(Date.now() - 300000).toISOString(), results: 58, mode: 'standard' },
    { query: 'climate change 2024 report', timestamp: new Date(Date.now() - 420000).toISOString(), results: 24, mode: 'research' },
    { query: 'microservices patterns kubernetes', timestamp: new Date(Date.now() - 540000).toISOString(), results: 67, mode: 'hybrid' },
  ],
  services: [
    { service: 'Gateway', status: 'ok', latencyMs: 4, uptime: 99.98 },
    { service: 'Crawler', status: 'ok', latencyMs: 12, uptime: 99.91 },
    { service: 'Indexing', status: 'ok', latencyMs: 23, uptime: 99.87 },
    { service: 'AI Ranking', status: 'ok', latencyMs: 45, uptime: 99.95 },
    { service: 'Qdrant', status: 'ok', latencyMs: 7, uptime: 99.99 },
    { service: 'OpenSearch', status: 'degraded', latencyMs: 180, uptime: 98.2 },
    { service: 'Redis', status: 'ok', latencyMs: 1, uptime: 100 },
    { service: 'PostgreSQL', status: 'ok', latencyMs: 3, uptime: 99.99 },
  ],
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ServiceHealth['status'] }) {
  const cfg = {
    ok: 'bg-emerald-100 text-emerald-700',
    degraded: 'bg-amber-100 text-amber-700',
    down: 'bg-red-100 text-red-700',
  }
  return <span className={`badge ${cfg[status]}`}>{status}</span>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '_health', mode: 'standard' }),
        })
        if (res.ok) setLastUpdated(new Date())
      } catch { /* keep mock data */ }
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-slate-600 hover:text-brand-600 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="font-bold text-slate-800">AISEARCH ELITE</span>
            </a>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">Updated {lastUpdated.toLocaleTimeString()}</span>
            <a href="/chat" className="btn-secondary text-sm">
              AI Chat
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            label="Queries Today"
            value={stats.queriesToday.toLocaleString()}
            sub="+12% vs yesterday"
            color="bg-brand-100 text-brand-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
          <StatCard
            label="Pages Indexed"
            value={stats.pagesIndexed.toLocaleString()}
            sub="Across all crawlers"
            color="bg-emerald-100 text-emerald-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
          <StatCard
            label="Crawl Rate"
            value={`${stats.crawlRate} pg/s`}
            sub="Across all crawlers"
            color="bg-violet-100 text-violet-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
          />
          <StatCard
            label="Avg Latency"
            value={`${stats.avgLatencyMs}ms`}
            sub="P50 search response"
            color="bg-amber-100 text-amber-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Searches */}
          <div className="lg:col-span-2 card">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Recent Searches</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-3 font-medium text-slate-500">Query</th>
                    <th className="pb-3 font-medium text-slate-500">Mode</th>
                    <th className="pb-3 font-medium text-slate-500 text-right">Results</th>
                    <th className="pb-3 font-medium text-slate-500 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentSearches.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-medium text-slate-700 truncate max-w-xs">{s.query}</td>
                      <td className="py-3">
                        <span className={`badge text-xs ${
                          s.mode === 'hybrid' ? 'bg-brand-100 text-brand-700' :
                          s.mode === 'semantic' ? 'bg-violet-100 text-violet-700' :
                          s.mode === 'research' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{s.mode}</span>
                      </td>
                      <td className="py-3 text-right text-slate-600">{s.results}</td>
                      <td className="py-3 text-right text-slate-400 text-xs">
                        {Math.round((Date.now() - new Date(s.timestamp).getTime()) / 60000)}m ago
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Service Health */}
          <div className="card">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Service Health</h2>
            <div className="space-y-3">
              {stats.services.map((svc) => (
                <div key={svc.service} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      svc.status === 'ok' ? 'bg-emerald-400' :
                      svc.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    <span className="text-sm text-slate-700">{svc.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{svc.latencyMs}ms</span>
                    <StatusBadge status={svc.status} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Overall uptime: {(stats.services.reduce((a, s) => a + s.uptime, 0) / stats.services.length).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
