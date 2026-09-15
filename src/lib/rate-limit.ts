/**
 * Fixed-window in-memory limiter. Adequate for a single-instance MVP; a multi-instance deployment
 * needs a shared store (documented in README).
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey)
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  bucket.count += 1
  return bucket.count <= limit
}

export function resetRateLimits() {
  buckets.clear()
}
