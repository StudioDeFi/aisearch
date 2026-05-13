'use client'

import { useState, useCallback } from 'react'
import SearchBar from '@/components/SearchBar'
import SearchResults from '@/components/SearchResults'
import type { SearchMode, SearchResponse } from '@/../../packages/types/src'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<SearchMode>('hybrid')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async (q: string, m: SearchMode) => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setQuery(q)
    setMode(m)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, mode: m, page: 1, limit: 20 }),
      })
      if (!res.ok) throw new Error(`Search failed: ${res.status}`)
      const data: SearchResponse = await res.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-slate-900 to-slate-800">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center pt-20 pb-10 px-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            AISEARCH <span className="text-brand-400">ELITE</span>
          </h1>
        </div>
        <p className="text-slate-400 text-sm mb-10 text-center max-w-md">
          AI-powered universal search with semantic understanding, hybrid ranking, and research synthesis
        </p>

        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Mode pills */}
        <div className="flex gap-2 mt-5 flex-wrap justify-center">
          {(['standard', 'semantic', 'hybrid', 'research'] as SearchMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                mode === m
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Quick links */}
        <div className="flex gap-4 mt-6 text-sm">
          <a href="/chat" className="text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            AI Chat
          </a>
          <a href="/dashboard" className="text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
          </a>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}
        {results && (
          <SearchResults results={results} query={query} loading={loading} />
        )}
        {!results && !loading && (
          <div className="text-center mt-12 text-slate-500 text-sm">
            <p>Try searching for anything — web pages, documents, research papers</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['machine learning trends 2024', 'climate change solutions', 'TypeScript best practices', 'quantum computing basics'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s, mode)}
                  className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
