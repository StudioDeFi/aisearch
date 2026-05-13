import type { ProcessedChunk } from './pipeline.js'

export interface VectorSearchResult {
  id: string
  url: string
  title: string
  text: string
  score: number
}

export class VectorStore {
  private vectors = new Map<string, { chunk: ProcessedChunk; norm: number }>()
  private uniqueUrls = new Set<string>()

  async upsert(chunks: ProcessedChunk[]): Promise<void> {
    for (const chunk of chunks) {
      const norm = this.l2Norm(chunk.embeddings)
      this.vectors.set(chunk.id, { chunk, norm })
      this.uniqueUrls.add(chunk.url)
    }
    console.log(`[VectorStore] Upserted ${chunks.length} vectors (total: ${this.vectors.size})`)
  }

  async search(queryEmbedding: number[], topK = 10, threshold = 0.0): Promise<VectorSearchResult[]> {
    const queryNorm = this.l2Norm(queryEmbedding)
    const results: Array<VectorSearchResult & { rawScore: number }> = []

    for (const { chunk, norm } of this.vectors.values()) {
      const score = this.cosineSimilarity(queryEmbedding, chunk.embeddings, queryNorm, norm)
      if (score >= threshold) {
        results.push({ id: chunk.id, url: chunk.url, title: chunk.title, text: chunk.text, score, rawScore: score })
      }
    }

    return results
      .sort((a, b) => b.rawScore - a.rawScore)
      .slice(0, topK)
      .map(({ rawScore: _, ...r }) => r)
  }

  async delete(url: string): Promise<number> {
    let deleted = 0
    for (const [id, { chunk }] of this.vectors.entries()) {
      if (chunk.url === url) { this.vectors.delete(id); deleted++ }
    }
    // Only remove URL from the set if no vectors for it remain
    const stillExists = [...this.vectors.values()].some(({ chunk }) => chunk.url === url)
    if (!stillExists) this.uniqueUrls.delete(url)
    return deleted
  }

  private cosineSimilarity(a: number[], b: number[], normA: number, normB: number): number {
    if (normA === 0 || normB === 0) return 0
    if (a.length !== b.length) return 0  // dimension mismatch — skip rather than produce NaN
    let dot = 0
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
    return dot / (normA * normB)
  }

  private l2Norm(vec: number[]): number {
    let sum = 0
    for (const v of vec) sum += v * v
    return Math.sqrt(sum)
  }

  stats() {
    return { vectorCount: this.vectors.size, documentCount: this.uniqueUrls.size }
  }
}
