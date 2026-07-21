import { loadConfig } from '../config.ts'
import { getCache } from './cache.ts'
import { getFreshClearance } from './cf-solver.ts'
import { resolveUpstreamOptions, saveRuntimeConfig } from './runtime-config.ts'
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
      refreshOnForbidden: config.SOLVER_ENABLED ? refreshClearance : undefined,
    })
  }
  return client
}

/**
 * On a 403, drive the auto-solver to harvest a fresh cf_clearance + User-Agent, persist
 * them (also resets this singleton), and return the merged headers for the retry. Returns
 * null on any failure so the request falls through to the normal 403 error envelope.
 */
async function refreshClearance(): Promise<Record<string, string> | null> {
  try {
    const { cfClearance, userAgent } = await getFreshClearance()
    saveRuntimeConfig({
      headers: { Cookie: `cf_clearance=${cfClearance}`, 'User-Agent': userAgent },
    })
    return resolveUpstreamOptions().headers
  } catch (err) {
    if (loadConfig().DEBUG) console.error('cf-solver: refresh failed:', err)
    return null
  }
}

/** Override the singleton. Test-only (inject a stub client / fetch). */
export function setUpstream(override: UpstreamClient | undefined): void {
  client = override
}
