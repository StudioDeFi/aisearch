import type { UnifiedSearchDocument } from '../../../packages/types/src/index.js'

export interface HybridScoringConfig {
  bm25Weight: number      // weight for lexical BM25 score
  semanticWeight: number  // weight for semantic/embedding score
  freshnessWeight: number // weight for freshness (recency)
  authorityWeight: number // weight for domain authority
}

// Weight rationale: semantic (0.45) dominates as embedding similarity provides
// the strongest relevance signal; lexical BM25 (0.30) adds keyword precision;
// authority (0.15) boosts trusted sources; freshness (0.10) mildly favors recency.
const DEFAULT_CONFIG: HybridScoringConfig = {
  bm25Weight: 0.30,
  semanticWeight: 0.45,
  freshnessWeight: 0.10,
  authorityWeight: 0.15,
}

export class HybridScorer {
  private config: HybridScoringConfig

  constructor(config: Partial<HybridScoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async score(query: string, docs: UnifiedSearchDocument[]): Promise<UnifiedSearchDocument[]> {
    // Step 1: BM25 lexical scores
    const bm25Scores = this.computeBM25(query, docs)

    // Step 2: Normalize BM25 to [0,1]
    const maxBM25 = Math.max(...bm25Scores, 1)
    const normBM25 = bm25Scores.map((s) => s / maxBM25)

    // Step 3: Compute hybrid score
    const scored = docs.map((doc, i) => {
      const lexical = normBM25[i]
      const semantic = doc.semanticScore
      const freshness = doc.freshness
      const authority = doc.authority

      const hybridScore =
        this.config.bm25Weight * lexical +
        this.config.semanticWeight * semantic +
        this.config.freshnessWeight * freshness +
        this.config.authorityWeight * authority

      return {
        ...doc,
        score: hybridScore,
        semanticScore: semantic,
      }
    })

    // Step 4: Sort by hybrid score descending
    return scored.sort((a, b) => b.score - a.score)
  }

  private computeBM25(query: string, docs: UnifiedSearchDocument[]): number[] {
    const k1 = 1.5
    const b = 0.75
    const queryTerms = this.tokenize(query)

    const docTokens = docs.map((doc) => this.tokenize(`${doc.title} ${doc.snippet}`))
    const avgDocLen = docTokens.reduce((acc, d) => acc + d.length, 0) / (docTokens.length || 1)

    return docTokens.map((tokens) => {
      let score = 0
      const docLen = tokens.length
      const tf = new Map<string, number>()
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)

      for (const term of queryTerms) {
        const termFreq = tf.get(term) ?? 0
        const df = docs.filter((_, i) => docTokens[i].includes(term)).length
        if (df === 0) continue

        const idf = Math.log((docs.length - df + 0.5) / (df + 0.5) + 1)
        const normTF = (termFreq * (k1 + 1)) / (termFreq + k1 * (1 - b + b * (docLen / avgDocLen)))
        score += idf * normTF
      }
      return score
    })
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  }

  updateWeights(weights: Partial<HybridScoringConfig>) {
    this.config = { ...this.config, ...weights }
  }

  getConfig(): HybridScoringConfig {
    return { ...this.config }
  }
}
