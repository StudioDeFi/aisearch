export type CrawlRequest = {
  url: string
  depth?: number
  maxPages?: number
}

export type CrawlJob = {
  id: string
  url: string
  status: 'queued' | 'crawling' | 'done' | 'error'
  pagesFound: number
  createdAt: string
  updatedAt: string
}
