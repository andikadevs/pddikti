import { createMiddleware } from 'hono/factory'
import { loadConfig } from '../config.ts'
import type { AppEnv } from '../types.ts'

/** HTTP header values must be latin-1 safe; replace © with (C). */
export function creditHeaderValue(creditLine: string): string {
  return creditLine.replace(/©/g, '(C)')
}

/**
 * Add SEO/discovery headers to every response and a credit header to `/api/*`.
 * Security headers (X-Content-Type-Options, X-Frame-Options, etc.) are applied
 * separately via hono/secure-headers in app.ts.
 */
export const seoHeaders = createMiddleware<AppEnv>(async (c, next) => {
  await next()
  // The operator config page must never be indexed; everything else is discoverable.
  c.header('X-Robots-Tag', c.req.path.startsWith('/config') ? 'noindex, nofollow' : 'index, follow')
  if (c.req.path.startsWith('/api')) {
    const config = loadConfig()
    c.header('X-Project-Credit', creditHeaderValue(config.CREDIT_LINE))
  }
})
