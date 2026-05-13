import type { ProcessedChunk } from './pipeline.js'

export interface LexicalSearchResult {
  id: string
  url: string
  title: string
  text: string
  bm25Score: number
}

interface InvertedIndex {
  [term: string]: Map<string, { chunk: ProcessedChunk; tf: number }>
}

export class LexicalStore {
  private index: InvertedIndex = {}
  private docLengths = new Map<string, number>()
  private totalDocs = 0
  private totalLength = 0
  private avgDocLength = 0

  // BM25 parameters
  private k1 = 1.5
  private b = 0.75

  async upsert(chunks: ProcessedChunk[]): Promise<void> {
    for (const chunk of chunks) {
      const tokens = this.tokenize(chunk.text)
      this.docLengths.set(chunk.id, tokens.length)
      this.totalDocs++
      this.totalLength += tokens.length
      this.avgDocLength = this.totalLength / this.totalDocs

      const tf = new Map<string, number>()
      for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1)

      for (const [term, count] of tf.entries()) {
        if (!this.index[term]) this.index[term] = new Map()
        this.index[term].set(chunk.id, { chunk, tf: count / tokens.length })
      }
    }
    console.log(`[LexicalStore] Indexed ${chunks.length} chunks (index terms: ${Object.keys(this.index).length})`)
  }

  async search(query: string, topK = 10): Promise<LexicalSearchResult[]> {
    const queryTerms = this.tokenize(query)
    const scores = new Map<string, number>()
    const chunkMap = new Map<string, ProcessedChunk>()

    for (const term of queryTerms) {
      const postings = this.index[term]
      if (!postings) continue

      const df = postings.size
      const idf = Math.log((this.totalDocs - df + 0.5) / (df + 0.5) + 1)

      for (const [docId, { chunk, tf }] of postings.entries()) {
        const docLen = this.docLengths.get(docId) ?? this.avgDocLength
        const normTF = (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength)))
        scores.set(docId, (scores.get(docId) ?? 0) + idf * normTF)
        chunkMap.set(docId, chunk)
      }
    }

    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([id, score]) => {
        const chunk = chunkMap.get(id)!
        return { id, url: chunk.url, title: chunk.title, text: chunk.text, bm25Score: score }
      })
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  }

  stats() {
    return { termCount: Object.keys(this.index).length, documentCount: this.totalDocs }
  }
}
