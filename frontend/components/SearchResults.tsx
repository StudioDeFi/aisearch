'use client'

import type { SearchResponse, UnifiedSearchDocument } from '@/../../packages/types/src'

interface Props {
  results: SearchResponse
  query: string
  loading?: boolean
}

function ResultCard({ doc, index }: { doc: UnifiedSearchDocument; index: number }) {
  const domain = (() => { try { return new URL(doc.url).hostname } catch { return doc.url } })()

  return (
    <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* URL */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-emerald-400 truncate">{domain}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500 capitalize">{doc.engine}</span>
          </div>

          {/* Title */}
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-300 group-hover:text-brand-200 font-medium text-sm leading-snug block mb-1.5 transition-colors"
          >
            {doc.title}
          </a>

          {/* Snippet */}
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{doc.snippet}</p>

          {/* Scores */}
          <div className="flex items-center gap-3 mt-2">
            <ScorePill label="Relevance" value={doc.score} color="brand" />
            {doc.semanticScore > 0 && <ScorePill label="Semantic" value={doc.semanticScore} color="violet" />}
            <ScorePill label="Authority" value={doc.authority} color="emerald" />
          </div>
        </div>

        <span className="text-slate-600 text-xs font-mono flex-shrink-0">#{index + 1}</span>
      </div>
    </div>
  )
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100)
  const cls = color === 'brand' ? 'bg-brand-500/20 text-brand-300'
    : color === 'violet' ? 'bg-violet-500/20 text-violet-300'
    : 'bg-emerald-500/20 text-emerald-300'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
      {label} {pct}%
    </span>
  )
}

export default function SearchResults({ results, query, loading }: Props) {
  return (
    <div>
      {/* Meta */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm">
          <span className="text-white font-medium">{results.total.toLocaleString()}</span> results for{' '}
          <span className="text-brand-300">&quot;{query}&quot;</span>
          <span className="text-slate-500 ml-2">({results.latencyMs}ms · {results.mode})</span>
        </p>
        {loading && (
          <svg className="w-4 h-4 animate-spin text-brand-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.results.map((doc, i) => (
          <ResultCard key={doc.id} doc={doc} index={i} />
        ))}
      </div>

      {results.results.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No results found for &quot;{query}&quot;</p>
          <p className="text-sm mt-1">Try different keywords or switch search mode</p>
        </div>
      )}
    </div>
  )
}
