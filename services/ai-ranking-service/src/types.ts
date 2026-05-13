export type SearchMode = 'standard' | 'semantic' | 'hybrid' | 'research'

export type UnifiedSearchDocument = {
  id: string
  title: string
  url: string
  snippet: string
  engine: string
  language: string
  score: number
  semanticScore: number
  freshness: number
  authority: number
  embeddings?: number[]
  publishedAt?: string
  imageUrl?: string
  favicon?: string
}

export type SearchRequest = {
  query: string
  page?: number
  limit?: number
  mode?: SearchMode
}

export type ResearchRequest = {
  query: string
  depth?: 'shallow' | 'deep'
  sources?: number
}

export type ResearchResponse = {
  summary: string
  sources: UnifiedSearchDocument[]
  citations: string[]
  confidence: number
  latencyMs: number
}
