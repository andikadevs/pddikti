import { loadConfig } from '../config.ts'
import { getCache } from './cache.ts'
import { UpstreamClient } from './upstream.ts'

let client: UpstreamClient | undefined

/** Lazily built upstream client singleton, configured from env. */
export function getUpstream(): UpstreamClient {
  if (!client) {
    const config = loadConfig()
    client = new UpstreamClient({
      baseUrl: config.UPSTREAM_BASE_URL,
      headers: config.UPSTREAM_HEADERS,
      timeoutMs: config.UPSTREAM_TIMEOUT_MS,
      cache: getCache(),
      cacheTtlS: config.CACHE_ENABLED ? config.CACHE_TTL_S : 0,
    })
  }
  return client
}

/** Override the singleton. Test-only (inject a stub client / fetch). */
export function setUpstream(override: UpstreamClient | undefined): void {
  client = override
}
