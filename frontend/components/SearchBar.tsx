'use client'

import { useState, useRef, FormEvent } from 'react'
import type { SearchMode } from '@/../../packages/types/src'

interface Props {
  onSearch: (query: string, mode: SearchMode) => void
  loading?: boolean
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<SearchMode>('hybrid')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim(), mode)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative flex items-center bg-white/10 backdrop-blur border border-white/20 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden focus-within:ring-2 focus-within:ring-brand-400 transition-all">
        {/* Mode selector */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as SearchMode)}
          className="bg-transparent text-slate-300 text-sm border-r border-white/20 pl-4 pr-3 py-4 focus:outline-none cursor-pointer"
        >
          <option value="standard" className="bg-slate-800">Standard</option>
          <option value="semantic" className="bg-slate-800">Semantic</option>
          <option value="hybrid" className="bg-slate-800">Hybrid</option>
          <option value="research" className="bg-slate-800">Research</option>
        </select>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anything with AI..."
          className="flex-1 bg-transparent text-white placeholder-slate-400 px-4 py-4 text-sm focus:outline-none"
          autoFocus
        />

        {/* Clear */}
        {query && (
          <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus() }}
            className="text-slate-400 hover:text-white px-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-5 py-4 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          Search
        </button>
      </div>
    </form>
  )
}
