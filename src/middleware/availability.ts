import { createMiddleware } from 'hono/factory'
import { loadConfig } from '../config.ts'
import { creditHeaderValue } from './headers.ts'
import type { AppEnv } from '../types.ts'

const RETRY_AFTER_SECONDS = 3600

/** Paths that stay reachable even when availability is off. */
const ALLOWED_EXACT = new Set(['/api', '/api/'])
const ALLOWED_PREFIXES = ['/api/docs', '/api/openapi.json', '/api/redoc'] as const

function isAllowed(path: string): boolean {
  if (ALLOWED_EXACT.has(path)) return true
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * Gate non-overview `/api/*` endpoints behind API_AVAILABILITY.
 * When disabled, returns a fixed 503 envelope (overview + docs stay open).
 */
export const availability = createMiddleware<AppEnv>(async (c, next) => {
  const config = loadConfig()
  const path = c.req.path

  if (config.API_AVAILABILITY || !path.startsWith('/api') || isAllowed(path)) {
    await next()
    return
  }

  const base = config.PUBLIC_BASE_URL
  const payload = {
    success: false,
    status: {
      http_code: 503,
      code: 'API_TEMPORARILY_UNAVAILABLE',
      message: 'This endpoint is temporarily unavailable due to traffic protection limits.',
    },
    credit: config.CREDIT_LINE,
    request: {
      method: c.req.method,
      path,
      timestamp: new Date().toISOString(),
    },
    documentation: {
      overview: `${base}/api/`,
      swagger: `${base}/api/docs`,
      redoc: `${base}/api/redoc`,
      openapi: `${base}/api/openapi.json`,
    },
    support: {
      message: 'If this persists, check the overview endpoint and contact support.',
      email: config.SUPPORT_EMAIL,
      url: config.SUPPORT_URL,
    },
    retry_after_seconds: RETRY_AFTER_SECONDS,
  }

  c.header('Retry-After', String(RETRY_AFTER_SECONDS))
  c.header('X-Project-Credit', creditHeaderValue(config.CREDIT_LINE))
  return c.json(payload, 503)
})
