// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Context } from 'hono'
import { loadConfig } from '../config.ts'
import { ProxyResponse } from '../schemas/common.ts'
import { resolveStatus, withCredit } from './response.ts'
import type { AppEnv, ImageResult, ProxyStatus, RequestIdentity } from '../types.ts'

/** Pull caller identity out of the request context for upstream forwarding. */
export function identityOf(c: Context<AppEnv>): RequestIdentity {
  return { clientIp: c.get('clientIp'), userAgent: c.get('userAgent') }
}

/** Finalize a proxy JSON result: inject credit, derive HTTP status, send. */
export function sendProxy(c: Context<AppEnv>, data: unknown) {
  const config = loadConfig()
  const body = withCredit(data, config.CREDIT_LINE)
  return c.json(body, resolveStatus(data))
}

/** Error status for a non-success result, never 200 (a 200 result is coerced to 502). */
export function errorStatus(data: unknown): Exclude<ProxyStatus, 200> {
  const status = resolveStatus(data)
  return status === 200 ? 502 : status
}

/** True when an upstream result is a successful image fetch. */
export function isImage(data: unknown): data is ImageResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { kind?: unknown }).kind === 'image'
  )
}

/**
 * Standard OpenAPI responses for proxy endpoints.
 *
 * Every status this proxy can emit (see ProxyStatus / resolveStatus) is declared
 * so dynamic statuses typecheck. All bodies are the opaque ProxyResponse — error
 * statuses carry the normalized error envelope (documented per status); see
 * ErrorResponse in schemas/common.ts.
 */
const PROXY_STATUSES = [200, 400, 404, 408, 422, 500, 502, 503] as const satisfies ProxyStatus[]

const STATUS_DESCRIPTIONS: Record<ProxyStatus, string> = {
  200: 'Upstream data (shape varies by endpoint).',
  400: 'Bad request (error envelope).',
  404: 'Not found (error envelope).',
  408: 'Upstream timed out (error envelope).',
  422: 'Validation error.',
  500: 'Unexpected proxy error (error envelope).',
  502: 'Invalid upstream response (error envelope).',
  503: 'Upstream unavailable (error envelope).',
}

export const proxyResponses = Object.fromEntries(
  PROXY_STATUSES.map((status) => [
    status,
    {
      description: STATUS_DESCRIPTIONS[status],
      content: { 'application/json': { schema: ProxyResponse } },
    },
  ]),
) as Record<
  ProxyStatus,
  { description: string; content: { 'application/json': { schema: typeof ProxyResponse } } }
>
