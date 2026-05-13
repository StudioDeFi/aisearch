export interface JobRecord {
  id: string
  url: string
  depth: number
  maxPages: number
  status: 'queued' | 'crawling' | 'done' | 'error'
  pagesFound: number
  createdAt: string
  updatedAt: string
}

export class CrawlQueue {
  private jobs = new Map<string, JobRecord>()

  add(url: string, depth: number, maxPages: number): JobRecord {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const job: JobRecord = {
      id, url, depth, maxPages, status: 'queued',
      pagesFound: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.jobs.set(id, job)
    console.log(`[Queue] Job ${id} added for ${url}`)
    return job
  }

  updateStatus(id: string, status: JobRecord['status'], pagesFound?: number) {
    const job = this.jobs.get(id)
    if (!job) return
    job.status = status
    if (pagesFound !== undefined) job.pagesFound = pagesFound
    job.updatedAt = new Date().toISOString()
  }

  getJob(id: string): JobRecord | undefined {
    return this.jobs.get(id)
  }

  nextPending(): JobRecord | undefined {
    for (const job of this.jobs.values()) {
      if (job.status === 'queued') return job
    }
    return undefined
  }

  listJobs(): JobRecord[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  size(): number {
    return this.jobs.size
  }
}
