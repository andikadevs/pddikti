// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Centralized shared types for the proxy.
 * Domain/value types live here; Zod-derived schema types live in schemas/.
 */

import type { Cache } from './lib/cache.ts'

/** Caller identity captured by request-identity middleware, forwarded upstream. */
export interface RequestIdentity {
  clientIp: string | null
  userAgent: string | null
}

/** Hono environment bindings shared across app, middleware, and handlers. */
export interface AppEnv {
  Variables: {
    clientIp: string | null
    userAgent: string | null
  }
}

/** Discrete set of HTTP statuses this proxy may emit (keeps OpenAPI/types finite). */
export type ProxyStatus = 200 | 400 | 404 | 408 | 422 | 500 | 502 | 503

/** Successful image fetch (e.g. university logo). */
export interface ImageResult {
  kind: 'image'
  bytes: ArrayBuffer
  contentType: string
}

/** Minimal fetch signature used by the client (global fetch is assignable). */
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

/** Construction options for the upstream client. */
export interface UpstreamOptions {
  baseUrl: string
  headers: Record<string, string>
  timeoutMs: number
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: FetchLike
  /** Optional response cache; defaults to a no-op (no caching). */
  cache?: Cache
  /** TTL (seconds) applied to cached responses. */
  cacheTtlS?: number
  /**
   * Called once when a request gets HTTP 403 (e.g. a Cloudflare challenge). Should
   * refresh credentials and return the fresh header map to retry with, or null to
   * give up. Retried at most once per request.
   */
  refreshOnForbidden?: () => Promise<Record<string, string> | null>
}
