export type IndexRequest = {
  documents: Array<{
    url: string
    html: string
    metadata?: Record<string, string>
  }>
}
