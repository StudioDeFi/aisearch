export type SearchMode = 'standard' | 'semantic' | 'hybrid' | 'research';

export type UnifiedSearchDocument = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  engine: string;
  language: string;
  score: number;
  semanticScore: number;
  freshness: number;
  authority: number;
  embeddings?: number[];
  publishedAt?: string;
  imageUrl?: string;
  favicon?: string;
};

export type SearchRequest = {
  query: string;
  page?: number;
  limit?: number;
  mode?: SearchMode;
  filters?: {
    language?: string;
    dateRange?: { from: string; to: string };
    domain?: string;
  };
};

export type SearchResponse = {
  results: UnifiedSearchDocument[];
  total: number;
  query: string;
  latencyMs: number;
  mode: SearchMode;
  page: number;
  hasMore: boolean;
};

export type CrawlRequest = {
  url: string;
  depth?: number;
  maxPages?: number;
};

export type CrawlJob = {
  id: string;
  url: string;
  status: 'queued' | 'crawling' | 'done' | 'error';
  pagesFound: number;
  createdAt: string;
  updatedAt: string;
};

export type IndexRequest = {
  documents: Array<{
    url: string;
    html: string;
    metadata?: Record<string, string>;
  }>;
};

export type SemanticSearchRequest = {
  query: string;
  topK?: number;
  threshold?: number;
};

export type ResearchRequest = {
  query: string;
  depth?: 'shallow' | 'deep';
  sources?: number;
};

export type ResearchResponse = {
  summary: string;
  sources: UnifiedSearchDocument[];
  citations: string[];
  confidence: number;
  latencyMs: number;
};

export type ServiceHealth = {
  service: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs: number;
  uptime: number;
};

export type DashboardStats = {
  queriesToday: number;
  pagesIndexed: number;
  crawlRate: number;
  avgLatencyMs: number;
  recentSearches: Array<{ query: string; timestamp: string; results: number; mode: SearchMode }>;
  services: ServiceHealth[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: UnifiedSearchDocument[];
};
