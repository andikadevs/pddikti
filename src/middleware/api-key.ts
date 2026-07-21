import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { loadConfig } from '../config.ts'
import { constantTimeEqual, verifySession } from '../lib/session.ts'
import { creditHeaderValue } from './headers.ts'
import type { AppEnv } from '../types.ts'

/** Cookie name carrying the SPA's signed session token. */
export const SESSION_COOKIE = 'pddikti_session'

/** Paths that stay public even when auth is on (overview + docs). */
const ALLOWED_EXACT = new Set(['/api', '/api/'])
const ALLOWED_PREFIXES = ['/api/docs', '/api/openapi.json', '/api/redoc'] as const

function isAllowed(path: string): boolean {
  if (ALLOWED_EXACT.has(path)) return true
  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * Gate `/api/*` data endpoints behind an API key. A request is authorized when it
 * carries a valid `X-API-Key` header (external/programmatic clients) or a valid
 * `pddikti_session` cookie (the same-origin web SPA). Disabled when API_KEY is empty.
 */
export const apiKey = createMiddleware<AppEnv>(async (c, next) => {
  const config = loadConfig()
  const path = c.req.path

  if (config.API_KEY === '' || !path.startsWith('/api') || isAllowed(path)) {
    await next()
    return
  }

  const headerKey = c.req.header('x-api-key')
  const cookie = getCookie(c, SESSION_COOKIE)
  const nowS = Math.floor(Date.now() / 1000)
  const authorized =
    (headerKey !== undefined && constantTimeEqual(headerKey, config.API_KEY)) ||
    (cookie !== undefined && verifySession(cookie, config.API_KEY, nowS))

  if (authorized) {
    await next()
    return
  }

  const base = config.PUBLIC_BASE_URL
  const payload = {
    success: false,
    status: {
      http_code: 401,
      code: 'API_KEY_REQUIRED',
      message: 'A valid API key is required. Send it in the X-API-Key header.',
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
      message: 'Contact support to obtain an API key.',
      email: config.SUPPORT_EMAIL,
      url: config.SUPPORT_URL,
    },
  }

  c.header('X-Project-Credit', creditHeaderValue(config.CREDIT_LINE))
  return c.json(payload, 401)
})
