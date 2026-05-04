import { NextResponse } from 'next/server'

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

type RateLimitResult = {
  success: boolean
  remaining: number
  resetAt: number
}

const buckets = new Map<string, { count: number; resetAt: number }>()

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return request.headers.get('x-real-ip') || 'unknown'
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return { success: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

export function rateLimitResponse(result: RateLimitResult, message = 'Забагато запитів. Спробуйте трохи пізніше.') {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))

  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    }
  )
}
