import { VectorStore } from './vectorstore.js'
import { LexicalStore } from './lexical.js'

export interface RawDocument {
  url: string
  html: string
  metadata?: Record<string, string>
}

export interface ProcessedChunk {
  id: string
  url: string
  title: string
  text: string
  embeddings: number[]
  chunkIndex: number
  totalChunks: number
  metadata: Record<string, string>
}

export class IndexingPipeline {
  private vectorStore = new VectorStore()
  private lexicalStore = new LexicalStore()
  private totalIndexed = 0
  private totalFailed = 0

  async process(documents: RawDocument[]): Promise<{
    indexed: number; failed: number; jobId: string; latencyMs: number
  }> {
    const start = Date.now()
    let indexed = 0
    let failed = 0

    for (const doc of documents) {
      try {
        const processed = await this.processDocument(doc)
        await Promise.all([
          this.vectorStore.upsert(processed),
          this.lexicalStore.upsert(processed),
        ])
        indexed += processed.length
        this.totalIndexed += processed.length
      } catch (err) {
        // Avoid logging raw user-provided URL to prevent log injection
        console.error('[Pipeline] Failed to index document:', err)
        failed++
        this.totalFailed++
      }
    }

    return {
      indexed,
      failed,
      jobId: `idx-${Date.now()}`,
      latencyMs: Date.now() - start,
    }
  }

  private async processDocument(doc: RawDocument): Promise<ProcessedChunk[]> {
    // Step 1: Clean HTML → plain text
    const text = this.cleanHTML(doc.html)
    const title = doc.metadata?.title ?? this.extractTitle(doc.html) ?? doc.url

    // Step 2: Chunk text (500-token chunks with 100-token overlap)
    const chunks = this.chunkText(text, 500, 100)

    // Step 3: Embed each chunk
    const embeddings = await this.embedChunks(chunks)

    return chunks.map((chunk, i) => ({
      id: `${encodeURIComponent(doc.url)}-chunk-${i}`,
      url: doc.url,
      title,
      text: chunk,
      embeddings: embeddings[i],
      chunkIndex: i,
      totalChunks: chunks.length,
      metadata: doc.metadata ?? {},
    }))
  }

  private cleanHTML(html: string): string {
    // Use linear string processing to avoid ReDoS from user-supplied HTML.
    // Strip script/style blocks with a single-pass state machine, then strip tags.
    const MAX_TEXT_LENGTH = 50_000
    const stripped = this.stripTaggedSections(html, ['script', 'style', 'nav', 'footer'])
    return this.stripAllTags(stripped)
      .replace(/&[a-zA-Z]{1,8};|&#\d{1,6};|&#x[\da-fA-F]{1,6};/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_TEXT_LENGTH)
  }

  /** Remove all HTML tags with a linear scan to avoid ReDoS on user HTML */
  private stripAllTags(html: string): string {
    const out: string[] = []
    let inTag = false
    for (let i = 0; i < html.length; i++) {
      const ch = html[i]
      if (ch === '<') { inTag = true; out.push(' '); continue }
      if (ch === '>') { inTag = false; continue }
      if (!inTag) out.push(ch)
    }
    return out.join('')
  }

  /**
   * Remove entire HTML sections enclosed in the given block-level tags.
   * Uses a simple linear scan to avoid catastrophic backtracking on
   * adversarial input (ReDoS).
   */
  private stripTaggedSections(html: string, tags: string[]): string {
    let result = html
    for (const tag of tags) {
      const open = `<${tag}`
      const close = `</${tag}>`
      const parts: string[] = []
      let pos = 0
      // Cache the lowercase copy once per tag; refresh when result changes between tags.
      let lowerResult = result.toLowerCase()
      while (pos < lowerResult.length) {
        const start = lowerResult.indexOf(open, pos)
        if (start === -1) { parts.push(result.slice(pos)); break }
        parts.push(result.slice(pos, start))
        const end = lowerResult.indexOf(close, start + open.length)
        pos = end === -1 ? result.length : end + close.length
      }
      result = parts.join('')
    }
    return result
  }

  private extractTitle(html: string): string | null {
    // Linear search for the title tag to avoid ReDoS on user-supplied HTML
    const lower = html.toLowerCase()
    const openIdx = lower.indexOf('<title')
    if (openIdx === -1) return null
    const gtIdx = html.indexOf('>', openIdx)
    if (gtIdx === -1) return null
    const closeIdx = lower.indexOf('</title>', gtIdx)
    if (closeIdx === -1) return null
    return html.slice(gtIdx + 1, closeIdx).trim().slice(0, 500) || null
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const words = text.split(/\s+/)
    const chunks: string[] = []
    let i = 0
    while (i < words.length) {
      chunks.push(words.slice(i, i + chunkSize).join(' '))
      i += chunkSize - overlap
    }
    return chunks.filter((c) => c.length > 50)
  }

  private async embedChunks(chunks: string[]): Promise<number[][]> {
    // Placeholder embeddings (1536 dims = text-embedding-3-small output size).
    // In production: call OpenAI embeddings API and return real vectors.
    return chunks.map(() => Array.from({ length: 1536 }, () => Math.random() * 2 - 1))
  }

  analyzeSEO(url: string, content: string): Record<string, unknown> {
    const words = content.split(/\s+/).filter(Boolean)
    const sentences = content.split(/[.!?]+/).filter(Boolean)
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0

    const issues: Array<{ type: string; message: string }> = []
    if (words.length < 300) issues.push({ type: 'warning', message: 'Content is short (< 300 words)' })
    if (avgWordsPerSentence > 25) issues.push({ type: 'warning', message: 'Sentences are too long on average' })

    return {
      url,
      score: Math.min(100, Math.round(50 + words.length / 20 - issues.length * 5)),
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
      readabilityScore: Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * avgWordsPerSentence))),
      issues,
      recommendations: [
        words.length < 300 ? 'Add more substantive content' : null,
        'Ensure proper heading hierarchy (H1 → H2 → H3)',
        'Add structured data (JSON-LD) for rich snippets',
        'Optimize meta description (120-160 characters)',
      ].filter(Boolean),
      latencyMs: 12,
    }
  }

  stats() {
    return {
      totalIndexed: this.totalIndexed,
      totalFailed: this.totalFailed,
      vectorStore: this.vectorStore.stats(),
      lexicalStore: this.lexicalStore.stats(),
    }
  }
}
