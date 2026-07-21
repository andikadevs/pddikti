import { quoteSegment } from './encoding.ts'
import { errorBody, resolveStatus } from './response.ts'
import { randomUserAgent } from './user-agents.ts'
import { NoopCache } from './cache.ts'
import type { Cache } from './cache.ts'
import type { FetchLike, ImageResult, RequestIdentity, UpstreamOptions } from '../types.ts'

const EMPTY_IDENTITY: RequestIdentity = { clientIp: null, userAgent: null }

const CONNECTION_ERROR_PATTERN =
  /unable to connect|fetch failed|network|ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|connect/i

/** Network/connection failures across runtimes (Bun: Error, undici: TypeError + cause). */
function isConnectionError(err: unknown): boolean {
  if (err instanceof TypeError) return true
  if (err instanceof Error) {
    const cause = (err as { cause?: { code?: unknown } }).cause
    const causeCode = typeof cause?.code === 'string' ? cause.code : ''
    return CONNECTION_ERROR_PATTERN.test(err.message) || CONNECTION_ERROR_PATTERN.test(causeCode)
  }
  return false
}

/**
 * The single network egress point. Forwards GET requests to the upstream PDDikti
 * source with auth headers, a rotating User-Agent, and caller identity headers.
 */
export class UpstreamClient {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>
  private readonly timeoutMs: number
  private readonly fetchImpl: FetchLike
  private readonly cache: Cache
  private readonly cacheTtlS: number

  constructor(options: UpstreamOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.headers = options.headers
    this.timeoutMs = options.timeoutMs
    this.fetchImpl = options.fetchImpl ?? fetch
    this.cache = options.cache ?? new NoopCache()
    this.cacheTtlS = options.cacheTtlS ?? 0
  }

  /** GET an endpoint with optional query params; returns parsed JSON. */
  get(
    endpoint: string,
    params?: Record<string, string>,
    identity: RequestIdentity = EMPTY_IDENTITY,
  ): Promise<unknown> {
    return this.request(this.url(endpoint), params, identity)
  }

  /** GET `endpoint/{keyword}` with the keyword as an encoded path segment. */
  getWithKeyword(
    endpoint: string,
    keyword: string,
    identity: RequestIdentity = EMPTY_IDENTITY,
  ): Promise<unknown> {
    return this.request(`${this.url(endpoint)}/${quoteSegment(keyword)}`, undefined, identity)
  }

  /** GET `endpoint/{id}/{semester}` (semester in the path). */
  getWithIdAndSemester(
    endpoint: string,
    id: string,
    semester: string,
    identity: RequestIdentity = EMPTY_IDENTITY,
  ): Promise<unknown> {
    const url = `${this.url(endpoint)}/${quoteSegment(id)}/${quoteSegment(semester)}`
    return this.request(url, undefined, identity)
  }

  /** GET `endpoint/{id}?semester=...` (semester as a query param). */
  getWithIdAndParamSemester(
    endpoint: string,
    id: string,
    semester: string,
    identity: RequestIdentity = EMPTY_IDENTITY,
  ): Promise<unknown> {
    const url = `${this.url(endpoint)}/${quoteSegment(id)}`
    return this.request(url, { semester }, identity)
  }

  /** GET `endpoint/{id}` expecting image bytes; returns ImageResult or an error object. */
  getImage(
    endpoint: string,
    id: string,
    identity: RequestIdentity = EMPTY_IDENTITY,
  ): Promise<ImageResult | Record<string, unknown>> {
    const url = `${this.url(endpoint)}/${quoteSegment(id)}`
    return this.request(url, undefined, identity, true) as Promise<
      ImageResult | Record<string, unknown>
    >
  }

  private url(endpoint: string): string {
    return `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`
  }

  private buildHeaders(identity: RequestIdentity): Record<string, string> {
    const headers: Record<string, string> = { ...this.headers, 'User-Agent': randomUserAgent() }
    if (identity.clientIp) {
      headers['X-Forwarded-For'] = identity.clientIp
      headers['X-Real-IP'] = identity.clientIp
    }
    if (identity.userAgent) {
      headers['X-Original-User-Agent'] = identity.userAgent
    }
    return headers
  }

  private async request(
    url: string,
    params: Record<string, string> | undefined,
    identity: RequestIdentity,
    asImage = false,
  ): Promise<unknown> {
    if (this.baseUrl === '') {
      return errorBody(
        503,
        'Connection error',
        'Upstream is not configured. Set UPSTREAM_BASE_URL.',
      )
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const target = new URL(url)
      if (params) {
        for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value)
      }

      // Cache is keyed by URL only (data is public, identical for every caller).
      // Images are never cached. Identity headers are intentionally excluded.
      const cacheKey = `up:${target.toString()}`
      const cacheable = !asImage && this.cacheTtlS > 0
      if (cacheable) {
        const hit = await this.cache.get(cacheKey)
        if (hit !== undefined) return hit
      }

      const response = await this.fetchImpl(target, {
        method: 'GET',
        headers: this.buildHeaders(identity),
        signal: controller.signal,
      })
      const result = await this.handleResponse(response, asImage)

      // Only successful payloads are cached (error envelopes carry code >= 400).
      if (cacheable && resolveStatus(result) === 200) {
        await this.cache.set(cacheKey, result, this.cacheTtlS)
      }
      return result
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return errorBody(
          408,
          'Request timed out',
          `Upstream request timed out after ${this.timeoutMs}ms. Please try again later.`,
          { timeout_ms: this.timeoutMs },
        )
      }
      if (isConnectionError(err)) {
        return errorBody(
          503,
          'Connection error',
          'Unable to connect to the upstream service. Please try again later.',
        )
      }
      return errorBody(
        500,
        'Unexpected error',
        'An unexpected error occurred. Please try again later.',
      )
    } finally {
      clearTimeout(timer)
    }
  }

  private async handleResponse(response: Response, asImage: boolean): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? ''

    if (response.ok) {
      if (asImage && contentType.includes('image')) {
        return { kind: 'image', bytes: await response.arrayBuffer(), contentType } satisfies ImageResult
      }
      try {
        return await response.json()
      } catch {
        return errorBody(502, 'Invalid JSON response', 'The upstream returned malformed JSON.')
      }
    }

    let message: unknown
    try {
      message = await response.json()
    } catch {
      message = await response.text()
    }
    return errorBody(response.status, 'HTTP error occurred', message)
  }
}
