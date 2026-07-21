import { loadConfig } from '../config.ts'
import { getCache } from './cache.ts'
import { resolveUpstreamOptions } from './runtime-config.ts'
import { UpstreamClient } from './upstream.ts'

let client: UpstreamClient | undefined

/**
 * Lazily built upstream client singleton. Connection settings come from
 * `resolveUpstreamOptions()` (env baseline + runtime `/config` overrides), so saving
 * new settings + `setUpstream(undefined)` makes the next call rebuild with them.
 */
export function getUpstream(): UpstreamClient {
  if (!client) {
    const config = loadConfig()
    client = new UpstreamClient({
      ...resolveUpstreamOptions(),
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
