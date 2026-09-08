import { NextRequest, NextResponse } from 'next/server'
import { clientIp, jsonError } from './http'
import { RATE_LIMIT_MAX_POSTS, RATE_LIMIT_WINDOW_MS } from './limits'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
    return
  }
  buckets.clear()
}

export function rateLimitPost(req: NextRequest): NextResponse | null {
  const now = Date.now()
  prune(now)
  const key = clientIp(req)
  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return null
  }
  existing.count += 1
  if (existing.count > RATE_LIMIT_MAX_POSTS) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    const res = jsonError('Rate limit exceeded. Try again shortly.', 429)
    res.headers.set('Retry-After', String(retryAfter))
    return res
  }
  return null
}
