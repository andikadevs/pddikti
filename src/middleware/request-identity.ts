import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types.ts'

/** Extract the originating client IP, preferring X-Forwarded-For's first hop. */
function extractClientIp(c: { req: { header: (name: string) => string | undefined } }): string | null {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return c.req.header('x-real-ip') ?? null
}

/** Capture caller identity into the context for upstream forwarding. */
export const requestIdentity = createMiddleware<AppEnv>(async (c, next) => {
  c.set('clientIp', extractClientIp(c))
  c.set('userAgent', c.req.header('user-agent') ?? null)
  await next()
})
